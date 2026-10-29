import os, re, sys, json, time, uuid, subprocess, requests
from pathlib import Path
import anthropic

REPO = Path(os.environ["LUME_REPO"])
BRANCH = os.environ.get("LOOP_BRANCH", "loop/design-match")
LOOP_DIR = Path(__file__).resolve().parent
BRIEF = (LOOP_DIR / "MANAGER_BRIEF.md").read_text()
NOTES_PATH = LOOP_DIR / "NOTES.md"
HANDOVER_PATH = LOOP_DIR / "HANDOVER.md"
LOG_PATH = LOOP_DIR / "loop.log"
LOCK_PATH = LOOP_DIR / "loop.lock"
PAUSE_PATH = LOOP_DIR / "PAUSE"  # create this file to hold the loop, delete it to resume
TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]
MODEL = os.environ.get("MANAGER_MODEL", "claude-sonnet-5-5")
MAX_ROUNDS = int(os.environ.get("MAX_ROUNDS", "500"))
HANDOVER_EVERY = int(os.environ.get("HANDOVER_EVERY", "15"))  # Claude Code prompts per session
PUSH_EVERY = int(os.environ.get("PUSH_EVERY", "5"))  # rounds between pushes of the loop branch
CHECKPOINT_EVERY = int(os.environ.get("CHECKPOINT_EVERY", "15"))  # rounds between full test suite runs
ASK_TIMEOUT = int(os.environ.get("ASK_TIMEOUT_MIN", "30")) * 60  # wait this long for an answer, then move on
SUMMARY_HOURS = [int(h) for h in os.environ.get("SUMMARY_HOURS", "7,18").split(",")]  # local hours for the summary message
CLAUDE_TIMEOUT = 60 * 60  # 1 hour per Claude Code run
INIT_PROMPT = (
    "Analyze this repository and create CLAUDE.md in the repo root, the same as the /init command does. "
    "Cover: what the project is, the stack, how to run the app, the type check and the tests (including how to run tests for a single file), "
    "the folder structure, the main architecture, and the code style and naming conventions you can see. "
    "Then add a section called Loop rules with: work only on the loop/design-match branch and never push or merge; "
    "the design source of truth is the design/ folder and DESIGN_GAP_ANALYSIS.md; one surface or component per task; "
    "do not change onboarding behaviour or the backend; reuse shared components and design tokens; "
    "no dead code, debug logs or TODOs; run the type check and only the tests for changed files; "
    "end every task with a report in the format DONE, CHECKED, BLOCKED, NEXT. "
    "Keep it under 150 lines. Do not change any other files."
)
LIMIT_PATTERN = re.compile(r"usage limit|limit reached|rate limit", re.I)
JEV_KEY = os.environ.get("TYPESAFE_API_KEY")  # optional: without it the Jev checks are skipped
JEV_URL = "https://api.typesafe.ai/v1/systemone"
JEV_MODEL = os.environ.get("JEV_MODEL", "jev-latest")
JEV_THRESHOLD = float(os.environ.get("JEV_THRESHOLD", "0.8"))  # how sure Jev must be before a check counts
JEV_PROMPT_QUESTIONS = {
    "multiple_tasks": {"type": "noul", "instructions": "The prompt asks for more than one screen or component to be built or changed."},
    "vague": {"type": "noul", "instructions": "The prompt uses vague wording such as improve, polish, clean up or make better, instead of saying exactly what to change."},
}
JEV_REPORT_QUESTIONS = {
    "overclaims": {"type": "noul", "instructions": "The report says a screen has been verified or fully matches the design."},
    "failed_checks": {"type": "noul", "instructions": "The report says the type check or tests failed, or were not run."},
    "out_of_scope": {"type": "noul", "instructions": "The report says files outside the named task were changed, such as backend code or onboarding logic."},
    "unfinished": {"type": "noul", "instructions": "The report says the task is only partly done."},
}
JEV_REPORT_FLAGS = {
    "overclaims": "It claims a screen is verified. Rows must say built, not verified, because Isa verifies.",
    "failed_checks": "The type check or tests failed or were not run.",
    "out_of_scope": "Files outside the named task may have been changed.",
    "unfinished": "The task looks only partly done.",
}
JEV_DECISION_QUESTIONS = {
    "next_action": {
        "type": "choice",
        "instructions": "Given the notes and the latest report, what should the loop do next?",
        "criteria": {
            "run": "There is a clear, small UI task to build next that needs nothing from Isa.",
            "ask": "The next step needs something only Isa can do, or a real product or UX decision from him.",
            "stop": "Every design row is built, or only tasks that need Isa remain, or something dangerous happened.",
        },
    },
    "last_task_done": {"type": "noul", "instructions": "The latest report shows the task was completed and the type check passed."},
    "risk": {
        "type": "score",
        "instructions": "How risky is it to keep building without checking with Isa?",
        "criteria": ["Safe to continue", "Some risk, keep tasks small", "High risk, something may be broken or the loop may be going in circles"],
    },
}
LIMIT_RETRIES = 30  # how many times to wait out a usage limit before giving up on one task

client = anthropic.Anthropic()
API = f"https://api.telegram.org/bot{TOKEN}"

def log(msg):
    with open(LOG_PATH, "a") as f:
        f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")
    print(msg)

def tg_send(text):
    try:
        requests.post(f"{API}/sendMessage", json={"chat_id": CHAT_ID, "text": text[:4000]}, timeout=30)
    except Exception as e:
        log(f"Telegram send failed: {e}")

def tg_confirm(offset):
    # Tell Telegram these updates have been read, so they are not delivered a second time
    try:
        requests.get(f"{API}/getUpdates", params={"offset": offset, "timeout": 0}, timeout=30)
    except Exception:
        pass

def tg_wait_reply(max_seconds):
    # Skip anything already waiting, then poll for a new reply from Isa. Returns None on timeout.
    r = requests.get(f"{API}/getUpdates", params={"timeout": 0}, timeout=30).json()
    offset = (r["result"][-1]["update_id"] + 1) if r.get("result") else None
    deadline = time.time() + max_seconds
    while time.time() < deadline:
        params = {"timeout": 50}
        if offset:
            params["offset"] = offset
        try:
            r = requests.get(f"{API}/getUpdates", params=params, timeout=70).json()
        except Exception:
            time.sleep(10)
            continue
        for u in r.get("result", []):
            offset = u["update_id"] + 1
            m = u.get("message", {})
            if str(m.get("chat", {}).get("id")) == str(CHAT_ID) and m.get("text"):
                tg_confirm(offset)
                return m["text"]
    return None

def tg_collect_messages():
    # Picks up anything Isa sent since the last check, including answers that came after the wait timed out
    try:
        r = requests.get(f"{API}/getUpdates", params={"timeout": 0}, timeout=30).json()
    except Exception:
        return ""
    results = r.get("result", [])
    if not results:
        return ""
    texts = []
    for u in results:
        m = u.get("message", {})
        if str(m.get("chat", {}).get("id")) == str(CHAT_ID) and m.get("text"):
            texts.append(m["text"])
    tg_confirm(results[-1]["update_id"] + 1)
    return "\n".join(texts)

def acquire_lock():
    # Only one loop at a time, so the 1am auto-start does nothing if you already started it
    if LOCK_PATH.exists():
        try:
            pid = int(LOCK_PATH.read_text().strip())
            os.kill(pid, 0)  # raises if that process is gone
            return False
        except (ValueError, ProcessLookupError, PermissionError):
            pass  # stale lock from a crashed run
    LOCK_PATH.write_text(str(os.getpid()))
    return True

def release_lock():
    if LOCK_PATH.exists():
        LOCK_PATH.unlink()

def git(*args):
    return subprocess.run(["git", *args], cwd=REPO, capture_output=True, text=True)

def ignore_runtime_files():
    # Keep the loop's own log, lock and pause files out of git without touching the repo's .gitignore
    path = Path(git("rev-parse", "--git-path", "info/exclude").stdout.strip())
    if not path.is_absolute():
        path = REPO / path
    existing = path.read_text() if path.exists() else ""
    missing = [p for p in ("loop/loop.log", "loop/loop.lock", "loop/PAUSE", "loop/last_bad_reply.txt") if p not in existing.splitlines()]
    if missing:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "a") as f:
            f.write(("\n" if existing and not existing.endswith("\n") else "") + "\n".join(missing) + "\n")

def setup_branch():
    # Single workspace: the loop lives on its own branch so main is never touched
    current = git("rev-parse", "--abbrev-ref", "HEAD").stdout.strip()
    if current != BRANCH:
        # Untracked files (such as the loop folder on the first run) travel with the checkout, so only edits to tracked files block the switch
        if git("status", "--porcelain", "--untracked-files=no").stdout.strip():
            return False, f"Repo is on {current} with uncommitted changes. Commit or stash them, then the loop can start."
        exists = git("rev-parse", "--verify", BRANCH).returncode == 0
        r = git("checkout", BRANCH) if exists else git("checkout", "-b", BRANCH)
        if r.returncode != 0:
            return False, f"Could not switch to {BRANCH}: {r.stderr.strip()}"
        return True, f"Switched to {BRANCH}."
    # Already on the loop branch. A stop mid-round can leave half-finished edits, so save them as a recovery commit.
    if git("status", "--porcelain").stdout.strip():
        git("add", "-A")
        git("commit", "-m", "loop recovery: edits left from an interrupted round")
        return True, f"On {BRANCH}. Saved leftover edits from an interrupted round as a recovery commit."
    return True, f"On {BRANCH}."

def startup_check():
    # Catch a broken setup now, with a Telegram message, instead of failing silently overnight
    problems = []
    if not (REPO / "design").is_dir():
        problems.append("The design folder is missing. Export the design from Claude Design into design/ in the repo and commit it.")
    try:
        r = subprocess.run(["claude", "--version"], capture_output=True, text=True, timeout=60)
        if r.returncode != 0:
            problems.append("Claude Code did not run. Check that claude works in Terminal.")
    except Exception:
        problems.append("Claude Code was not found. Check that claude works in Terminal and the PATH in the launchd file.")
    if not git("remote").stdout.strip():
        problems.append("The repo has no git remote, so pushes to GitHub would fail.")
    return problems

def commit_round(label):
    # One commit per round so every round can be reviewed or reverted on its own
    if git("status", "--porcelain").stdout.strip():
        git("add", "-A")
        git("commit", "-m", f"loop {label}")

def push_branch():
    # Only ever pushes the loop branch, never main
    r = git("push", "-u", "origin", BRANCH)
    if r.returncode != 0:
        log(f"Push failed: {r.stderr.strip()}")
        tg_send(f"Push of {BRANCH} failed, the loop continues locally: {r.stderr.strip()[:300]}")
        return False
    return True

def limit_wait_seconds(text):
    # Some limit messages end with a reset time as a unix timestamp. If not, check again in 20 minutes.
    m = re.search(r"\|(\d{10})", text)
    if m:
        return max(60, min(int(m.group(1)) - int(time.time()) + 60, 6 * 3600))
    return 20 * 60

class Session:
    # One continuous Claude Code conversation, resumed by session id
    def __init__(self):
        self.id = str(uuid.uuid4())
        self.prompts = 0
        self.started = False

    def run(self, prompt):
        for attempt in range(LIMIT_RETRIES):
            cmd = ["claude", "-p", prompt, "--dangerously-skip-permissions"]
            cmd += ["--resume", self.id] if self.started else ["--session-id", self.id]
            result = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, timeout=CLAUDE_TIMEOUT)
            text = (result.stdout + ("\n" + result.stderr if result.returncode else "")).strip()
            if LIMIT_PATTERN.search(text) and (result.returncode != 0 or len(text) < 400):
                seconds = limit_wait_seconds(text)
                log(f"Usage limit hit, sleeping {seconds // 60} minutes")
                if attempt == 0:
                    tg_send(f"Claude Code usage limit reached. Pausing about {seconds // 60} minutes, then retrying the same task.")
                time.sleep(seconds)
                continue
            self.started = True
            self.prompts += 1
            return text
        return "BLOCKED: Claude Code usage limit did not reset after many retries."

def handover(session):
    # Ask the old session for a summary, save it, then return a fresh session seeded with it
    ask = (
        "Write a handover summary for a fresh session that continues this work. Include: what is built so far "
        "and which DESIGN_GAP_ANALYSIS.md rows are now built; the surface or component in progress, if any; "
        "file paths that matter; decisions made and why; gotchas or problems spotted but not fixed. "
        "Plain text, under 400 words. Do not change any files."
    )
    summary = session.run(ask)
    HANDOVER_PATH.write_text(summary)
    commit_round("handover summary")
    push_branch()
    new = Session()
    seed = (
        "You are continuing work on the Lume UI match from a previous session that was ended to keep context clean. "
        "Here is its handover summary:\n\n" + summary +
        "\n\nDo not change any files yet. Reply with one line confirming you have read this."
    )
    new.run(seed)
    new.prompts = 0  # the seed message does not count towards the next handover
    return new

def blocked_text(report):
    m = re.search(r"^\s*BLOCKED:\s*(.*)$", report or "", re.I | re.M)
    if not m:
        return ""
    t = m.group(1).strip().lower()
    if not t or t.startswith(("none", "nothing", "n/a")):
        return ""
    return t[:80]

def check_stuck(report, state):
    # Same blocker twice in a row means the task is stuck, so park it instead of burning rounds
    t = blocked_text(report)
    if not t:
        state["text"], state["streak"] = "", 0
        return None
    if t == state["text"]:
        state["streak"] += 1
    else:
        state["text"], state["streak"] = t, 1
    if state["streak"] >= 2:
        state["text"], state["streak"] = "", 0
        return (
            "The same blocker came back twice in a row. Record that task under Blocked on Isa in the notes, "
            "do not retry it, and pick the next surface that does not depend on it."
        )
    return None

def notes_section(name):
    text = NOTES_PATH.read_text()
    start = text.find(f"## {name}")
    if start == -1:
        return "(none)"
    end = text.find("\n## ", start + 3)
    body = text[start:end] if end != -1 else text[start:]
    parts = body.split("\n", 1)
    return (parts[1].strip() if len(parts) > 1 else "") or "(none)"

def maybe_send_summary(stats):
    # One summary message at each of the SUMMARY_HOURS, using the Mac's local time
    now = time.localtime()
    key = (now.tm_yday, now.tm_hour)
    if now.tm_hour not in SUMMARY_HOURS or stats["last_key"] == key:
        return
    stats["last_key"] = key
    tg_send(
        f"Lume loop summary. Rounds since the last summary: {stats['rounds']}.\n\n"
        f"Done so far:\n{notes_section('Done')[-1200:]}\n\n"
        f"Waiting on you:\n{notes_section('Blocked on Isa')[:1200]}"
    )
    stats["rounds"] = 0

def add_note(note, text):
    return f"{note} {text}" if note else text

def jev(state, questions):
    # Fast, calibrated yes/no checks from Jev (TypeSafe). Returns None if Jev is off or fails, so the loop never depends on it.
    if not JEV_KEY:
        return None
    try:
        r = requests.post(
            JEV_URL,
            headers={"Authorization": f"Bearer {JEV_KEY}"},
            json={"model": JEV_MODEL, "state": state, "questions": questions},
            timeout=30,
        )
        r.raise_for_status()
        return r.json()["answers"]
    except Exception as e:
        log(f"Jev check failed, continuing without it: {e}")
        return None

def prompt_problems(prompt):
    # Hard rules are checked in code. Jev handles the judgement calls.
    problems = []
    steps = len(re.findall(r"^\s*\d+[.)]\s", prompt, re.M))
    if steps > 5:
        problems.append(f"It has {steps} numbered steps and the maximum is 5.")
    if "design/" not in prompt:
        problems.append("It does not name the matching design/ file.")
    if "loop/design-match" not in prompt:
        problems.append("It does not say to work only on the loop/design-match branch.")
    if "DONE" not in prompt or "NEXT" not in prompt:
        problems.append("It does not end with the DONE, CHECKED, BLOCKED, NEXT report.")
    answers = jev(prompt, JEV_PROMPT_QUESTIONS)
    if answers:
        if answers.get("multiple_tasks", {}).get("noul", 0) >= JEV_THRESHOLD:
            problems.append("It asks for more than one screen or component. Keep it to one.")
        if answers.get("vague", {}).get("noul", 0) >= JEV_THRESHOLD:
            problems.append("It uses vague wording. Say exactly what to change.")
    return problems

def report_flags(report):
    answers = jev(report[-6000:], JEV_REPORT_QUESTIONS)
    if not answers:
        return []
    return [text for name, text in JEV_REPORT_FLAGS.items() if answers.get(name, {}).get("noul", 0) >= JEV_THRESHOLD]

def jev_signals(report, isa_reply):
    # Jev reads the notes and the latest report and gives calibrated signals for the manager to weigh
    state = {
        "notes": NOTES_PATH.read_text()[-15000:],
        "latest_report": (report or "(none yet)")[-6000:],
        "isa_reply": isa_reply or "(none)",
    }
    return jev(state, JEV_DECISION_QUESTIONS)

def format_signals(a):
    lines = []
    na = a.get("next_action")
    if na:
        probs = ", ".join(f"{k} {v:.0%}" for k, v in sorted(na["probabilities"].items(), key=lambda kv: -kv[1]))
        lines.append(f"Next action: {probs} (confidence {na['confidence']:.2f})")
    done = a.get("last_task_done")
    if done:
        lines.append(f"Last task completed cleanly: {done['noul']:.0%} likely")
    risk = a.get("risk")
    if risk:
        lines.append(f"Risk of continuing without Isa: {risk['score']:.1f} on a 0 to 2 scale, 2 meaning high (confidence {risk['confidence']:.2f})")
    return "\n".join(lines)

def reconsider(plan, signals, report, isa_reply, note):
    # If Jev is strongly sure of a different action, ask the manager once to look again. The manager keeps the final say.
    if not plan or not signals:
        return plan
    na = signals.get("next_action")
    if not na:
        return plan
    action = plan.get("action")
    jev_action = na["choice"]
    conf = na["probabilities"].get(jev_action, 0)
    if jev_action == action or conf < JEV_THRESHOLD:
        return plan
    log(f"Jev disagrees: manager chose {action}, Jev chose {jev_action} at {conf:.2f}")
    extra = (
        f"Jev, a second opinion model, disagrees with your choice of {action}. It put {conf:.0%} on {jev_action}. "
        "Look again. Keep your choice only if you can see a concrete reason in the notes or report that Jev cannot, and say why in the notes."
    )
    second = ask_manager_with_retry(report, isa_reply, add_note(note, extra), signals)
    return second or plan

def ask_manager(report, isa_reply=None, note=None, signals=None):
    notes = NOTES_PATH.read_text()
    content = f"NOTES:\n{notes}\n\nLATEST CLAUDE CODE REPORT:\n{report or '(none yet, first round)'}"
    if HANDOVER_PATH.exists():
        content += f"\n\nLATEST HANDOVER SUMMARY:\n{HANDOVER_PATH.read_text()}"
    if note:
        content += f"\n\nLOOP NOTE:\n{note}"
    if isa_reply:
        content += f"\n\nISA REPLIED ON TELEGRAM:\n{isa_reply}"
    if signals:
        content += f"\n\nJEV SIGNALS (a calibrated second opinion, advisory only):\n{format_signals(signals)}"
    resp = client.messages.create(
        model=MODEL, max_tokens=16000, system=BRIEF,
        messages=[{"role": "user", "content": content}],
    )
    if getattr(resp, "stop_reason", "") == "max_tokens":
        raise ValueError("The manager reply was cut off because it was too long")
    # Newer models can return thinking blocks first, so join only the text blocks
    text = "".join(b.text for b in resp.content if getattr(b, "type", "") == "text").strip()
    try:
        # raw_decode reads the first complete JSON object and ignores anything after it
        obj, _ = json.JSONDecoder(strict=False).raw_decode(text[text.find("{"):])
        return obj
    except Exception:
        (LOOP_DIR / "last_bad_reply.txt").write_text(text)  # saved so the failure can be inspected
        raise

LAST_ERROR = ""

def ask_manager_with_retry(report, isa_reply, note, signals=None):
    global LAST_ERROR
    # One bad API response should not end an overnight run
    for attempt in range(1, 4):
        try:
            extra = note
            if attempt > 1:
                extra = add_note(note, "Your last reply was cut off or was not valid JSON. Keep the notes under 600 words by merging repeats and dropping finished items, keep the prompt short, and reply with valid JSON only.")
            return ask_manager(report, isa_reply, extra, signals)
        except Exception as e:
            LAST_ERROR = str(e)
            log(f"Manager error (attempt {attempt}): {e}")
            time.sleep(60 * attempt)
    return None

def main():
    ignore_runtime_files()
    if "--dry-run" in sys.argv:
        ok, msg = setup_branch()
        problems = startup_check()
        check = "Startup check passed." if not problems else "Startup problems: " + " ".join(problems)
        tg_send(f"Lume loop dry run: Telegram is working. Git check: {msg} {check}")
        return
    if not acquire_lock():
        print("Another loop is already running. Exiting.")
        return
    try:
        run_loop()
    finally:
        release_lock()

def run_loop():
    ok, msg = setup_branch()
    if not ok:
        tg_send(f"Lume loop not started: {msg}")
        return
    problems = startup_check()
    if problems:
        tg_send("Lume loop not started. Setup problems:\n" + "\n".join(problems))
        return
    tg_send(f"Lume loop started. {msg}")
    session = Session()
    if not (REPO / "CLAUDE.md").exists():
        tg_send("No CLAUDE.md yet. Asking Claude Code to create one from the repo, so every session starts with the project rules.")
        session.run(INIT_PROMPT)
        session.prompts = 0  # this setup prompt does not count towards the next handover
        commit_round("init CLAUDE.md")
    report, isa_reply, note = None, None, None
    stats = {"rounds": 0, "last_key": None}
    stuck_state = {"text": "", "streak": 0}
    rewrites = 0  # how many times in a row a prompt was sent back for a rewrite
    manager_fails = 0  # how many rounds in a row the manager failed all 3 attempts
    for round_no in range(1, MAX_ROUNDS + 1):
        while PAUSE_PATH.exists():  # create loop/PAUSE to hold the loop, delete it to resume
            time.sleep(60)
        maybe_send_summary(stats)
        late = tg_collect_messages()  # late answers, or any instruction Isa sent while the loop was working
        if late:
            isa_reply = (isa_reply + "\n\n" if isa_reply else "") + "Isa sent this on Telegram while the loop was working:\n" + late
        if round_no % CHECKPOINT_EVERY == 0:
            note = add_note(note, "This round is a checkpoint. Make the next task one thing only: run the full type check and the full app test suite, change no files, and report any failures.")
        if len(NOTES_PATH.read_text()) > 9000:
            note = add_note(note, "The notes file is too long. Rewrite it in under 600 words: merge repeated items into one line each and delete finished work.")
        signals = jev_signals(report, isa_reply)
        plan = ask_manager_with_retry(report, isa_reply, note, signals)
        plan = reconsider(plan, signals, report, isa_reply, note)
        if plan is None:
            manager_fails += 1
            if manager_fails >= 4:
                tg_send(f"Manager failed 4 rounds in a row, so the loop is stopping. Last error: {LAST_ERROR[:300]}")
                push_branch()
                return
            tg_send(f"Manager failed 3 times in a row. Last error: {LAST_ERROR[:300]}\nWaiting 15 minutes, then trying again ({manager_fails} of 4).")
            time.sleep(900)
            continue
        manager_fails = 0
        isa_reply, note = None, None
        NOTES_PATH.write_text(plan.get("notes") or NOTES_PATH.read_text())
        action = plan.get("action")
        log(f"Round {round_no}: {action}")
        if action == "stop":
            commit_round(f"round {round_no} stop")
            push_branch()
            tg_send(f"Loop stopped: {plan.get('reason', '')}")
            return
        if action == "run":
            problems = prompt_problems(plan.get("prompt", ""))
            if problems and rewrites < 2:  # after 2 rejections it runs anyway, so a strict check can never freeze the loop
                rewrites += 1
                note = add_note(note, "Your last prompt was rejected before it ran: " + " ".join(problems) + " Rewrite it and fix every point.")
                log(f"Prompt rejected: {problems}")
                tg_send("Prompt rejected by the strictness check. Asking the manager to rewrite it.")
                continue
            rewrites = 0
        if action == "ask":
            tg_send(f"Question from the loop (I will wait {ASK_TIMEOUT // 60} minutes, then carry on with other work):\n\n{plan.get('question', '')}")
            isa_reply = tg_wait_reply(ASK_TIMEOUT)
            if isa_reply is None:
                note = add_note(note, (
                    "Isa did not answer your last question in time. Record that task under Blocked on Isa in the notes, "
                    "do not ask the same question again, and pick the next surface that does not depend on the answer. "
                    "Only use action ask again if every remaining task needs Isa."
                ))
                tg_send("No answer yet. Parking that task and moving on to other work. Reply any time and I will pass it on.")
            report = None
            continue
        try:
            report = session.run(plan["prompt"])
        except subprocess.TimeoutExpired:
            report = "BLOCKED: Claude Code run timed out after 1 hour."
        commit_round(f"round {round_no}")
        log(f"Report: {report[-1500:]}")
        tg_send(f"Round {round_no} done.\n\n{report[-1200:]}")
        stats["rounds"] += 1
        flags = report_flags(report)
        if flags:
            note = add_note(note, "An automatic check flagged the last report: " + " ".join(flags) + " Deal with this before moving on.")
            tg_send("Check flagged the last report: " + " ".join(flags))
        stuck = check_stuck(report, stuck_state)
        if stuck:
            note = add_note(note, stuck)
            tg_send("The same blocker came back twice. Parking that task and moving on.")
        if round_no % PUSH_EVERY == 0:
            push_branch()
        if session.prompts >= HANDOVER_EVERY:
            tg_send(f"{HANDOVER_EVERY} prompts in this session. Writing a handover summary and starting a fresh session.")
            try:
                session = handover(session)
                note = add_note(note, "A handover just happened. Claude Code now knows only the handover summary. Name files fully in the next prompt.")
                tg_send("Fresh session started with the handover summary.")
            except Exception as e:
                tg_send(f"Handover failed, the loop is stopping. It will try again at the next auto-start: {e}")
                return
    push_branch()
    tg_send(f"Reached the {MAX_ROUNDS} round limit, pausing. It will continue at the next auto-start.")

if __name__ == "__main__":
    main()

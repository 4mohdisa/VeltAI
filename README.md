# How to use these prompts

Two prompts, in order. Both written for Claude Code (or Kimi K2 with similar agentic capability).

## 1. Run `setup.md` ONCE

This is the bootstrap. It will:
- Read every markdown doc in your `./veltai` folder
- Move docs into `./docs/`
- Initialise an Expo SDK 54 project at root
- Configure iOS-only
- Install the right dependencies
- Implement the theme tokens from `Theme & Design Tokens.md`
- Create the component library folder structure
- Scaffold every screen as a placeholder
- Wire up tab navigation and onboarding stack
- Verify with `tsc` and `expo prebuild`
- Create `TASKS.md` with all subsequent phases

**Time:** ~20–40 minutes depending on the agent.

**Output you should see at the end:** "Phase 0 complete. TASKS.md created. Ready for Phase 1."

**Before you start the build prompt:**
1. Open Xcode simulator and run `npx expo start --ios` to visually confirm placeholders render
2. Skim `TASKS.md` and tweak if any task wording feels off
3. Commit any tweaks

## 2. Run `build.md` REPEATEDLY (overnight)

This is the loop. Every time you run it, the agent:
- Reads `TASKS.md`
- Finds the first unchecked phase
- Implements every task in that phase
- Runs `tsc` and Metro start as quality gates
- Commits
- Appends a session log entry
- Stops

**Time per phase:** 30 mins to 3 hours depending on phase complexity and agent speed.

**Phases run in this order:**
- Phase 1: Primitives & Forms (~1h)
- Phase 2: Display & Navigation (~1h)
- Phase 3: Animation Components (~1h)
- Phase 4: Tab Shell + Dashboard B1-B4 (~2h)
- Phase 5: Profile Tab E1-E12 (~2h)
- Phase 6: Gym Tab D1-D6 (~1.5h)
- Phase 7: Food Tab Manual flow (~1.5h)
- Phase 8: Food Tab AI flows (~2h)
- Phase 9: Onboarding A1-A19 (~3h — biggest phase)
- Phase 10: Modals & Overlays (~1h)
- Phase 11: Polish (~1h)

**Overnight setup:** kick off `build.md`, let it run one phase, agent stops automatically. You review in the morning. If happy, kick off the next session with the same prompt.

If you want it to chain multiple phases, modify the "Stop" instruction at the end of build.md to "continue to the next phase" — but I'd recommend stopping between phases so you can review before going further. Agents make subtle mistakes that compound.

## Tips

- Run `git log --oneline` between sessions to see progress
- The agent updates `TASKS.md` with `[x]` after each task. Open it after each session to see what's done.
- If a task is marked `[?]` it means the agent got stuck. Read the session log to see why, then unstick it manually or in your next prompt.
- The "Session log" at the bottom of `TASKS.md` becomes your project history. Don't delete it.
- If the agent goes off the rails (adds the wrong dependency, picks the wrong colour), `git reset --hard HEAD~1` to roll back to the last commit and tweak the prompt.

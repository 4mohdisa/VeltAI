#!/bin/zsh
# Starts the Phase 4 loop (Apple side features, then full testing for about a week). Same wrapper as the other phases.
export LOOP_PHASE=phase4
export ROWS_FILE=PHASE4_ROWS.md
export DAILY_TOKEN_CAP=${DAILY_TOKEN_CAP:-5000000}
export ASK_LIMIT=0
export MAX_ROUNDS=${MAX_ROUNDS:-2000}
# Load test keys from backend/.env (git ignored) so Claude Code and the tests can see them
LUME_ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/backend/.env"
if [ -f "$LUME_ENV_FILE" ]; then
  for k in E2E_EMAIL E2E_PASSWORD GEMINI_API_KEY; do
    line=$(grep -E "^(export )?$k=" "$LUME_ENV_FILE" | tail -1)
    v=${line#*=}; v=${v#\"}; v=${v%\"}; v=${v#\'}; v=${v%\'}
    [ -n "$v" ] && export "$k=$v"
  done
  export LUME_TEST_GEMINI_API_KEY="${LUME_TEST_GEMINI_API_KEY:-$GEMINI_API_KEY}"
fi
exec /bin/zsh "$(dirname "$0")/start-loop.sh"

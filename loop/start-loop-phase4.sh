#!/bin/zsh
# Starts the Phase 4 loop (Apple side features, then full testing for about a week). Same wrapper as the other phases.
export LOOP_PHASE=phase4
export ROWS_FILE=PHASE4_ROWS.md
export DAILY_TOKEN_CAP=${DAILY_TOKEN_CAP:-5000000}
export ASK_LIMIT=0
export MAX_ROUNDS=${MAX_ROUNDS:-2000}
exec /bin/zsh "$(dirname "$0")/start-loop.sh"

#!/bin/zsh
# Starts the Phase 3 loop (polish, real dummy data, performance, quality). Same wrapper as the other phases.
export LOOP_PHASE=phase3
export ROWS_FILE=PHASE3_ROWS.md
export DAILY_TOKEN_CAP=${DAILY_TOKEN_CAP:-5000000}
exec /bin/zsh "$(dirname "$0")/start-loop.sh"

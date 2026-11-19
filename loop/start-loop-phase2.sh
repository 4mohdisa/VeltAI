#!/bin/zsh
# Starts the Phase 2 loop (backend wiring and simulator testing). Same wrapper as the design loop, different phase.
export LOOP_PHASE=phase2
export DAILY_TOKEN_CAP=${DAILY_TOKEN_CAP:-5000000}
exec /bin/zsh "$(dirname "$0")/start-loop.sh"

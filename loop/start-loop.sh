#!/bin/zsh
# Starts the Lume loop and keeps it running. Used by the 1am LaunchAgent and the Desktop start file.
# A /stop only lasts until the next start. loop/PAUSE stays until /resume. Keys come from ~/.zshrc, so none are stored here.
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
source ~/.zshrc
source ~/lume-loop-venv/bin/activate
cd "$LUME_REPO" || exit 1
# If a loop is already running, do nothing
if pgrep -f "python3 loop/loop.py" > /dev/null; then
  exit 0
fi
# A new start clears an earlier /stop, so the loop comes back every night. PAUSE stays until /resume.
rm -f loop/STOP
# Keep the Mac and display awake while this script runs
caffeinate -dimsu -w $$ &
while [ ! -f loop/STOP ]; do
  caffeinate -i python3 loop/loop.py
  [ -f loop/STOP ] && break
  sleep 300
done

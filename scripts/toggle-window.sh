#!/bin/bash
# Toggle GameShelf Chromium window visibility
# Bind this to a hotkey via xbindkeys or your desktop environment
# Example xbindkeys config line:
#   "~/GameShelf/scripts/toggle-window.sh"
#     Control+F12

WINDOW_CLASS="chromium"
WINDOW_TITLE="GameShelf"

# Find the window ID
WID=$(wmctrl -l | grep -i "$WINDOW_TITLE" | head -1 | awk '{print $1}')

if [ -z "$WID" ]; then
    echo "GameShelf window not found"
    exit 1
fi

# Check if window is currently visible/focused
ACTIVE=$(xdotool getactivewindow 2>/dev/null)
TARGET=$(printf "%d" "$WID" 2>/dev/null)

if [ "$ACTIVE" = "$TARGET" ]; then
    # Window is focused — minimize it
    xdotool windowminimize "$WID"
else
    # Window is hidden/unfocused — bring it up
    wmctrl -i -a "$WID"
fi

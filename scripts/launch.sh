#!/bin/bash
# GameShelf launcher for Raspberry Pi
# Starts the .NET backend and opens Chromium in app mode

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/../src/GameShelf"
PORT=5000
URL="http://localhost:$PORT"

echo "Starting GameShelf on $URL..."

# Start the .NET app in the background
cd "$PROJECT_DIR"
dotnet run --urls "$URL" &
DOTNET_PID=$!

# Wait for server to be ready
echo "Waiting for server..."
for i in $(seq 1 30); do
    if curl -s "$URL" > /dev/null 2>&1; then
        echo "Server ready!"
        break
    fi
    sleep 1
done

# Open Chromium in app mode (kiosk-like, no address bar)
if command -v chromium-browser &> /dev/null; then
    chromium-browser --app="$URL" --start-maximized &
elif command -v chromium &> /dev/null; then
    chromium --app="$URL" --start-maximized &
else
    echo "Chromium not found. Open $URL manually."
fi

# Wait for .NET process
wait $DOTNET_PID

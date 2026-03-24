#!/bin/bash
# Install GameShelf as a systemd service on Raspberry Pi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/../src/GameShelf"
SERVICE_NAME="gameshelf"
USER=$(whoami)

# Publish the app first
echo "Publishing GameShelf..."
cd "$PROJECT_DIR"
dotnet publish -c Release -o "$SCRIPT_DIR/../publish"

PUBLISH_DIR="$(cd "$SCRIPT_DIR/../publish" && pwd)"

# Create systemd service file
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=GameShelf - Virtual Floppy Shelf for 86Box
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PUBLISH_DIR
ExecStart=$PUBLISH_DIR/GameShelf
Restart=on-failure
RestartSec=5
Environment=ASPNETCORE_URLS=http://0.0.0.0:5000
Environment=DOTNET_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

echo "GameShelf service installed and started!"
echo "Access at http://localhost:5000"
echo ""
echo "Commands:"
echo "  sudo systemctl status $SERVICE_NAME"
echo "  sudo systemctl restart $SERVICE_NAME"
echo "  sudo systemctl stop $SERVICE_NAME"
echo "  journalctl -u $SERVICE_NAME -f"

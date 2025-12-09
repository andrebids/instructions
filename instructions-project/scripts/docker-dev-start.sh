#!/bin/bash
set -e

echo "🚀 Starting Instructions Project in Development Mode..."
echo "=================================================="

# Function to handle shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down gracefully..."
    kill $CLIENT_PID 2>/dev/null || true
    kill $SERVER_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Check if dependencies need to be installed
echo "📦 Checking dependencies..."

if [ ! -d "/app/node_modules" ] || [ -z "$(ls -A /app/node_modules 2>/dev/null)" ]; then
    echo "  → Installing root dependencies..."
    npm install || true
else
    echo "  ✓ Root dependencies OK"
fi

if [ ! -d "/app/client/node_modules" ] || [ -z "$(ls -A /app/client/node_modules 2>/dev/null)" ]; then
    echo "  → Installing client dependencies..."
    cd /app/client && npm install
    cd /app
else
    echo "  ✓ Client dependencies directory exists"
    # Verify critical dependency exists
    if [ ! -d "/app/client/node_modules/i18next-browser-languagedetector" ]; then
        echo "  → Missing i18next-browser-languagedetector, reinstalling..."
        cd /app/client && npm install i18next-browser-languagedetector
        cd /app
    else
        echo "  ✓ Client dependencies OK"
    fi
fi

# Ensure musl binaries are installed (critical for Alpine Linux)
if [ ! -d "/app/client/node_modules/@rollup/rollup-linux-x64-musl" ]; then
    echo "  → Installing Rollup musl binary for Alpine Linux..."
    cd /app/client && npm install @rollup/rollup-linux-x64-musl --save-optional || true
    cd /app
fi

if [ ! -d "/app/client/node_modules/lightningcss-linux-x64-musl" ]; then
    echo "  → Installing LightningCSS musl binary for Alpine Linux..."
    cd /app/client && npm install lightningcss-linux-x64-musl --save-optional || true
    cd /app
fi

if [ ! -d "/app/client/node_modules/@tailwindcss/oxide-linux-x64-musl" ]; then
    echo "  → Installing TailwindCSS Oxide musl binary for Alpine Linux..."
    cd /app/client && npm install @tailwindcss/oxide-linux-x64-musl --save-optional || true
    cd /app
fi

if [ ! -d "/app/server/node_modules" ] || [ -z "$(ls -A /app/server/node_modules 2>/dev/null)" ]; then
    echo "  → Installing server dependencies..."
    cd /app/server && npm install
    cd /app
else
    echo "  ✓ Server dependencies OK"
fi

# Ensure uploads directory exists
mkdir -p /app/server/public/uploads
echo "  ✓ Uploads directory ready"

# Mount SMB share from TrueNAS (if credentials provided)
SMB_SHARE="//192.168.2.22/Olimpo/.dev/web/thecore"
MOUNT_POINT="/app/server/public/uploads"
SMB_USER="${SMB_USER:-guest}"
SMB_PASS="${SMB_PASS:-}"

if [ -n "$SMB_PASS" ] || [ "$SMB_USER" != "guest" ]; then
    echo ""
    echo "📁 Mounting SMB share from TrueNAS..."
    echo "   Share: $SMB_SHARE"
    echo "   Mount point: $MOUNT_POINT"
    
    # Unmount if already mounted
    umount "$MOUNT_POINT" 2>/dev/null || true
    
    # Create credentials file if password provided
    if [ -n "$SMB_PASS" ]; then
        CREDS_FILE="/tmp/smb_creds"
        echo "username=$SMB_USER" > "$CREDS_FILE"
        echo "password=$SMB_PASS" >> "$CREDS_FILE"
        chmod 600 "$CREDS_FILE"
        MOUNT_OPTS="credentials=$CREDS_FILE,uid=1000,gid=1000,iocharset=utf8,file_mode=0777,dir_mode=0777"
    else
        MOUNT_OPTS="guest,uid=1000,gid=1000,iocharset=utf8,file_mode=0777,dir_mode=0777"
    fi
    
    # Mount the SMB share
    if mount -t cifs "$SMB_SHARE" "$MOUNT_POINT" -o "$MOUNT_OPTS"; then
        echo "  ✅ SMB share mounted successfully"
        # Verify products directory exists
        if [ -d "$MOUNT_POINT/products" ]; then
            echo "  ✅ Products directory found"
            ls -la "$MOUNT_POINT/products" | head -5
        else
            echo "  ⚠️  Products directory not found in mount point"
        fi
    else
        echo "  ⚠️  Failed to mount SMB share, continuing without it..."
        echo "  💡 Tip: Set SMB_USER and SMB_PASS environment variables if authentication is required"
    fi
else
    echo ""
    echo "📁 SMB mount skipped (no credentials provided)"
    echo "   💡 To mount TrueNAS share, set SMB_USER and SMB_PASS in docker-compose.yml or .env"
fi

echo ""
echo "✅ Dependencies ready!"
echo "=================================================="
echo ""

# Start client dev server in background
echo "🎨 Starting Vite dev server on port 3003..."
cd /app/client
npm run dev -- --host 0.0.0.0 --port 3003 > /tmp/vite.log 2>&1 &
CLIENT_PID=$!
echo "  → Vite PID: $CLIENT_PID"

# Give client a moment to start
sleep 5

# Check if Vite is still running
if ! kill -0 $CLIENT_PID 2>/dev/null; then
    echo "❌ Vite failed to start! Check logs:"
    cat /tmp/vite.log
    exit 1
fi
echo "  ✓ Vite started successfully"

# Start server in foreground (but in background for now to show both)
echo ""
echo "⚙️  Starting Express server on port 5000..."
cd /app/server
npm run dev > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "  → Server PID: $SERVER_PID"

sleep 3

# Check if server is still running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Server failed to start! Check logs:"
    cat /tmp/server.log
    exit 1
fi
echo "  ✓ Server started successfully"

echo ""
echo "=================================================="
echo "✨ Development environment is ready!"
echo "=================================================="
echo "   Frontend: http://localhost:3003"
echo "   Backend:  http://localhost:5001"
echo ""
echo "📋 Logs:"
echo "   Vite:   tail -f /tmp/vite.log"
echo "   Server: tail -f /tmp/server.log"
echo "=================================================="
echo ""

# Tail both logs
tail -f /tmp/vite.log /tmp/server.log &

# Wait for both processes
wait $CLIENT_PID $SERVER_PID

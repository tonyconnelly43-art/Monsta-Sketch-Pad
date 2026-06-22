#!/bin/bash
set -euo pipefail

# Only run in Claude Code remote environments (claude.ai/code)
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

echo "Installing root dependencies..."
npm install

echo "Installing client dependencies..."
cd client && npm install && cd ..

echo "Installing server dependencies..."
cd server && npm install && cd ..

echo "Starting dev servers..."
# Start Express backend on port 3001
nohup bash -c 'cd "$CLAUDE_PROJECT_DIR/server" && node server.js' > /tmp/monsta-server.log 2>&1 &

# Start Vite frontend on port 5173 (host 0.0.0.0 so it's accessible)
nohup bash -c 'cd "$CLAUDE_PROJECT_DIR/client" && npx vite --host 0.0.0.0' > /tmp/monsta-client.log 2>&1 &

echo "Monsta Sketch Pad is starting up!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"

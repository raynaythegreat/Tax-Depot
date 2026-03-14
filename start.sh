#!/bin/bash
cd "$(dirname "$0")"

echo "========================================"
echo "       TAX DEPOT"
echo "========================================"
echo ""
echo "Starting server..."

npx next start > /tmp/taxdepot.log 2>&1 &
SERVER_PID=$!

echo "Waiting for server (5 seconds)..."
sleep 5

echo ""
echo "Opening browser at http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

sensible-browser http://localhost:3000 2>/dev/null &

wait $SERVER_PID

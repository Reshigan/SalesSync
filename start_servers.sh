#!/bin/bash

export PATH=/usr/local/bin:$PATH

echo "Starting Backend Server..."
cd /workspace/project/SalesSync/backend-api
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

sleep 3

echo "Starting Frontend Server..."
cd /workspace/project/SalesSync/frontend-vite
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

sleep 5

echo ""
echo "=== Server Status ==="
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "=== Backend Logs ==="
tail -10 /tmp/backend.log
echo ""
echo "=== Frontend Logs ==="
tail -10 /tmp/frontend.log

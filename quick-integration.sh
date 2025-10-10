#!/bin/bash

echo "🚀 Quick SalesSync Integration Test"

# Kill existing processes
pkill -f "ts-node.*server" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
pkill -f "next" 2>/dev/null

# Start backend
cd backend
echo "Starting backend..."
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start frontend  
cd frontend
echo "Starting frontend..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for services
echo "Waiting for services to start..."
sleep 10

# Test backend
echo "Testing backend..."
curl -s http://localhost:12001/api/users > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend is running"
else
    echo "❌ Backend failed"
fi

# Test frontend
echo "Testing frontend..."
curl -s http://localhost:12000 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend failed"
fi

echo "🎉 Integration test complete!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Backend: http://localhost:12001"
echo "Frontend: http://localhost:12000"
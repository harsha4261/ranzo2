#!/bin/bash

# Function to display usage
usage() {
    echo "Usage: ./run.sh [backend|frontend|cloudflare|all]"
    exit 1
}

# Check if an argument is provided
if [ $# -eq 0 ]; then
    usage
fi

COMMAND=$1

case $COMMAND in
    backend)
        echo "Starting backend..."
        cd backend && uv run uvicorn main:app --reload --port 8000
        ;;
    frontend)
        echo "Starting frontend..."
        cd Frontend && npm start
        ;;
    cloudflare)
        echo "Starting Cloudflare tunnel..."
        cloudflared tunnel --url http://localhost:8000
        ;;
    all)
        echo "Starting all services..."
        
        # Run in background
        (cd backend && uv run uvicorn main:app --reload --port 8000) &
        BACKEND_PID=$!
        
        (cd Frontend && npm start) &
        FRONTEND_PID=$!
        
        (cloudflared tunnel --url http://localhost:8000) &
        CLOUDFLARE_PID=$!

        # Handle ctrl+c gracefully
        trap "kill $BACKEND_PID $FRONTEND_PID $CLOUDFLARE_PID; exit" INT TERM

        # Wait for all background processes
        wait $BACKEND_PID $FRONTEND_PID $CLOUDFLARE_PID
        ;;
    *)
        usage
        ;;
esac

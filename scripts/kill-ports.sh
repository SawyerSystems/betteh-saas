#!/bin/bash

echo "🔄 Safely cleaning up development ports..."

# More gentle process cleanup
echo "Stopping development processes gracefully..."

# First, try graceful shutdown
pkill -TERM -f "vite|tsx.*server" 2>/dev/null

# Wait for graceful shutdown
sleep 3

# Only force kill if still running
echo "Checking for remaining processes..."
REMAINING=$(pgrep -f "vite|tsx.*server" 2>/dev/null | wc -l)

if [ "$REMAINING" -gt 0 ]; then
    echo "Force stopping remaining processes..."
    pkill -KILL -f "vite|tsx.*server" 2>/dev/null
    sleep 2
fi

# Gently free up ports
echo "Freeing up ports 6001, 6173..."
for port in 6001 6173; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "Freeing port $port (PID: $PID)"
        kill -TERM $PID 2>/dev/null
        sleep 1
        # Only force kill if still there
        if kill -0 $PID 2>/dev/null; then
            kill -KILL $PID 2>/dev/null
        fi
    fi
done

# Verify ports are free
echo "Checking port status..."
PORTS_IN_USE=$(netstat -tlnp 2>/dev/null | grep -E ":6001|:6173" | wc -l)

if [ "$PORTS_IN_USE" -eq 0 ]; then
    echo "✅ All development ports are now free"
else
    echo "⚠️  Some ports may still be in use:"
    netstat -tlnp 2>/dev/null | grep -E ":6001|:6173"
fi

echo "🎉 Port cleanup complete!"

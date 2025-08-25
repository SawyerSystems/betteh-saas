#!/bin/bash

echo "🔍 System Resource Check for Codespace"
echo "======================================"

# Check memory usage
echo "💾 Memory Usage:"
free -h

echo ""
echo "🔄 CPU Usage:"
top -bn1 | grep "load average" | awk '{print $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12}'

echo ""
echo "🌐 Port Usage:"
echo "Checking ports 5001 and 5173..."
netstat -tlnp 2>/dev/null | grep -E ":5001|:5173" || echo "No processes on target ports"

echo ""
echo "⚡ Node.js/Development Processes:"
ps aux | grep -E "node|tsx|vite|npm" | grep -v grep || echo "No Node.js processes running"

echo ""
echo "📊 Disk Usage:"
df -h | head -2

echo ""
echo "🏃‍♂️ Running Processes (by memory):"
ps aux --sort=-%mem | head -10

echo ""
echo "✅ Resource check complete!"

#!/bin/bash
cd /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai

# Kill all processes
pkill -9 -f "vite|nodemon|node.*server" 2>/dev/null
sleep 3

# Clear caches
rm -rf node_modules/.vite dist .vite

# Start services
npm run dev

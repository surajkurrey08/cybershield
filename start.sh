#!/bin/bash
echo "🛡️  Starting CyberShield v2..."
echo ""
echo "1. Starting Backend..."
cd backend && npm install --silent && node utils/seedData.js 2>/dev/null; npm run dev &
echo "   Backend starting on http://localhost:5000"
echo ""
sleep 3
echo "2. Starting Frontend..."
cd ../frontend && npm install --silent && npm start &
echo "   Frontend starting on http://localhost:3000"
echo ""
echo "✅ Open http://localhost:3000 in your browser"
echo "   Login: admin / Admin@1234"

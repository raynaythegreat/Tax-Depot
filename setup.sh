#!/bin/bash

echo "==================================="
echo "Tax Depot - Setup Script"
echo "==================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated"
echo ""

# Push schema to database
echo "📊 Creating SQLite database..."
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Failed to create database"
    exit 1
fi

echo ""
echo "==================================="
echo "✅ Setup Complete!"
echo "==================================="
echo ""
echo "To start the development server:"
echo "  cd $(pwd)"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""

#!/bin/bash
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Installing dependencies..."
npm install

echo "Checking environment..."
npm run check-env
if [ $? -ne 0 ]; then
    echo "Environment check failed"
    exit 1
fi

echo "Starting Pathotricks Application..."
npm start 
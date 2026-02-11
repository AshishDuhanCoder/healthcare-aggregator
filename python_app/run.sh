#!/bin/bash
# HealthAgg - Python Flask Application Runner
# Usage: ./run.sh

echo "========================================="
echo "  HealthAgg - AI Healthcare Aggregator"
echo "  Python Flask Application"
echo "========================================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required. Install from https://python.org"
    exit 1
fi

# Create venv if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate
source venv/bin/activate

# Install deps
echo "Installing dependencies..."
pip install -r requirements.txt --quiet

# Copy .env if needed
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "Created .env from .env.example - edit it to add your keys."
fi

echo ""
echo "Starting server at http://localhost:5000"
echo "Press Ctrl+C to stop."
echo ""

python3 app.py

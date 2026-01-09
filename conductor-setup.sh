#!/bin/bash

# Conductor workspace setup script
# This script runs when a new workspace is created

MASTER_ENV="/Users/anishgillella/Desktop/Stuff/Projects/uplane/.env"

# Copy .env to backend if master exists
if [ -f "$MASTER_ENV" ]; then
    echo "Copying environment variables from master .env..."

    # Copy to backend
    if [ -d "backend" ]; then
        cp "$MASTER_ENV" "backend/.env"
        echo "✓ Copied .env to backend/"
    fi

    # Create frontend .env with API URL
    if [ -d "frontend" ]; then
        echo "VITE_API_URL=http://localhost:3000/api" > "frontend/.env"
        echo "✓ Created frontend/.env"
    fi
else
    echo "⚠ Master .env not found at $MASTER_ENV"
    echo "  Please copy your environment variables manually."
fi

echo "Setup complete!"

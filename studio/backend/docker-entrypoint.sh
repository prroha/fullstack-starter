#!/bin/sh
set -e

echo "Starting Xitolaunch Backend..."

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Run database seed (idempotent - won't duplicate data)
echo "Running database seed..."
npx prisma db seed || echo "Seed skipped or already applied"

# Start the application
echo "Starting server on port 3003..."
exec node dist/index.js

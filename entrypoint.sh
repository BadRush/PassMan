#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma db push --accept-data-loss

echo "Starting PassMan server..."
exec node server.js

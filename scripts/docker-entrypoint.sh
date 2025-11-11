#!/bin/sh
set -e

echo "Starting docker entrypoint script..."

# Database connection parameters
DB_HOST="${PGHOST:-postgres}"
DB_PORT="${PGPORT:-5432}"
DB_USER="${PGUSER:-postgres}"
DB_NAME="${PGDATABASE:-college_advisor}"

# Wait for database with better retry logic
MAX_RETRIES=30
RETRY_INTERVAL=2
RETRY_COUNT=0

echo "Waiting for PostgreSQL to become available at ${DB_HOST}:${DB_PORT}..."

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Checking database connection (attempt $RETRY_COUNT/$MAX_RETRIES)..."
  
  # Try to connect to the database
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    echo "✓ Database is ready!"
    break
  fi
  
  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "✗ Failed to connect to database after $MAX_RETRIES attempts"
    echo "Connection details: ${DB_HOST}:${DB_PORT} (user: ${DB_USER}, database: ${DB_NAME})"
    exit 1
  fi
  
  echo "Database not ready yet, waiting ${RETRY_INTERVAL} seconds..."
  sleep $RETRY_INTERVAL
done

echo "Running database migrations..."
npm run db:push

echo "Starting application..."
exec node dist/index.js

#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required for startup" >&2
  exit 1
fi

wait_for_db() {
  echo "Waiting for database to become available..."
  i=0
  until [ $i -ge 60 ]; do
    if psql "${DATABASE_URL}" -c 'SELECT 1' >/dev/null 2>&1; then
      echo "Database connection established."
      return 0
    fi
    i=$((i + 1))
    sleep 2
  done
  echo "Timed out waiting for database (${DATABASE_URL})." >&2
  exit 1
}

create_database_if_missing() {
  if [ -n "${POSTGRES_DB:-}" ] && [ -n "${POSTGRES_USER:-}" ] && [ -n "${POSTGRES_PASSWORD:-}" ]; then
    base_conn="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${PGHOST:-postgres}:${PGPORT:-5432}/postgres"
    echo "Ensuring database \"${POSTGRES_DB}\" exists..."
    if ! psql "${base_conn}" -Atqc "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'" >/dev/null 2>&1; then
      if psql "${base_conn}" -c "CREATE DATABASE \"${POSTGRES_DB}\"" >/dev/null 2>&1; then
        echo "Created database \"${POSTGRES_DB}\"."
      else
        echo "Warning: unable to create database \"${POSTGRES_DB}\" (likely due to permissions). Continuing..." >&2
      fi
    else
      echo "Database \"${POSTGRES_DB}\" already exists."
    fi
  fi
}

apply_sql_migrations() {
  if [ ! -d "./migrations" ]; then
    echo "No migrations directory found; skipping schema sync."
    return
  fi

  for file in ./migrations/*.sql; do
    [ -f "$file" ] || continue
    echo "Applying migration ${file}..."
    if ! psql "${DATABASE_URL}" -f "$file" >/dev/null 2>&1; then
      echo "Warning: migration ${file} failed to apply; continuing startup." >&2
    fi
  done
}

wait_for_db
create_database_if_missing
apply_sql_migrations

echo "Starting application on port ${WEB_PORT:-6000}..."
exec node dist/index.js


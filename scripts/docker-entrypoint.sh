#!/bin/sh
set -eu

echo "Starting docker entrypoint script..."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required for startup" >&2
  exit 1
fi

DB_HOST="${PGHOST:-postgres}"
DB_PORT="${POSTGRES_INTERNAL_PORT:-${PGPORT:-5432}}"
DB_USER="${POSTGRES_USER:-}"
DB_PASSWORD="${POSTGRES_PASSWORD:-}"
DB_NAME="${POSTGRES_DB:-}"

psql_with_credentials() {
  PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -p "${DB_PORT}" "$@"
}

wait_for_db() {
  echo "Waiting for database server to become available..."
  retries=0
  while [ $retries -lt 90 ]; do
    if [ -n "${DB_USER}" ]; then
      if psql_with_credentials -d postgres -c 'SELECT 1' >/dev/null 2>&1; then
        echo "Database server connection established."
        return 0
      fi
    else
      if psql "${DATABASE_URL}" -c 'SELECT 1' >/dev/null 2>&1; then
        echo "Database connection established."
        return 0
      fi
    fi
    retries=$((retries + 1))
    sleep 2
  done
  echo "Timed out waiting for database server." >&2
  exit 1
}

create_database_if_missing() {
  if [ -n "${DB_NAME}" ] && [ -n "${DB_USER}" ]; then
    echo "Ensuring database \"${DB_NAME}\" exists..."
    if ! psql_with_credentials -d postgres -Atqc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" >/dev/null 2>&1; then
      if psql_with_credentials -d postgres -c "CREATE DATABASE \"${DB_NAME}\"" >/dev/null 2>&1; then
        echo "Created database \"${DB_NAME}\"."
      else
        echo "Warning: unable to create database \"${DB_NAME}\" (likely due to permissions). Continuing..." >&2
      fi
    else
      echo "Database \"${DB_NAME}\" already exists."
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

echo "Starting application on port ${WEB_PORT:-5551}..."
exec node dist/index.js

#!/usr/bin/env bash
set -euo pipefail

# Configuration derived from repo conventions
if [[ -n "${COMPOSE_ARGS:-}" ]]; then
  # shellcheck disable=SC2206 # intentional word splitting to build array
  COMPOSE_ARGS=(${COMPOSE_ARGS})
else
  COMPOSE_ARGS=(-f docker-compose.yml)
fi
DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-postgres}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-migrations}"
EXPORT_PATH="${EXPORT_PATH:-./backups}"
EXPORT_FILE="${EXPORT_FILE:-${EXPORT_PATH}/db-backup-$(date +%Y%m%d%H%M%S).sql}"

# Ensure backup directory exists
mkdir -p "${EXPORT_PATH}"

# Debug output for compose args
echo "Using docker compose arguments:"
for arg in "${COMPOSE_ARGS[@]}"; do
  printf '  [%q]\n' "${arg}"
done

# Helper to run docker compose commands
dc() {
  docker compose "${COMPOSE_ARGS[@]}" "$@"
}

# Wait until database container is ready
echo "Waiting for database container ${DB_CONTAINER_NAME}..."
dc exec "${DB_CONTAINER_NAME}" bash -c 'until pg_isready -q; do sleep 1; done'

POSTGRES_DB="${POSTGRES_DB:-college_advisor}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"

echo "Checking for database ${POSTGRES_DB}..."
DB_EXISTS="$(dc exec -T "${DB_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'")"

if [[ -z "${DB_EXISTS}" ]]; then
  echo "Database ${POSTGRES_DB} not found. Creating schema from migrations."
  # create the database
  dc exec -T "${DB_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d postgres -c "CREATE DATABASE \"${POSTGRES_DB}\";"
# run migrations against the new database
  for file in "${MIGRATIONS_DIR}"/*.sql; do
    echo "Applying migration ${file}..."
    dc exec -T "${DB_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" < "${file}"
  done
  echo "Schema initialized."
else
  echo "Database ${POSTGRES_DB} exists. Exporting data before migrations."
  dc exec -T "${DB_CONTAINER_NAME}" pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --format=plain --no-owner --no-privileges --clean --if-exists > "${EXPORT_FILE}"
  echo "Backup written to ${EXPORT_FILE}"

  echo "Running migrations..."
  for file in "${MIGRATIONS_DIR}"/*.sql; do
    echo "Applying migration ${file}..."
    dc exec -T "${DB_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" < "${file}"
  done

  echo "Re-importing data (if transformations needed, adjust here)..."
  dc exec -T "${DB_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" < "${EXPORT_FILE}"

  echo "Post-import cleanup hook (customize as needed)."
fi

echo "Agent mode completed successfully."


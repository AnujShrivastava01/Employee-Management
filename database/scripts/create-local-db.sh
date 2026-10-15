#!/usr/bin/env bash
# Creates the application role and the `ems` / `ems_test` databases on a locally installed PostgreSQL.
# Idempotent: safe to run repeatedly. Schema creation is NOT done here — Flyway applies the
# migrations in backend/src/main/resources/db/migration automatically when the backend starts.
#
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres PGPASSWORD=... ./database/scripts/create-local-db.sh
set -euo pipefail

DB_NAME="${POSTGRES_DB:-ems}"
DB_USER="${POSTGRES_USER:-ems}"
DB_PASSWORD="${POSTGRES_PASSWORD:-ems_password}"
export PGHOST="${PGHOST:-localhost}" PGPORT="${PGPORT:-5432}" PGUSER="${PGUSER:-postgres}"

psql -v ON_ERROR_STOP=1 -d postgres <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE "${DB_USER}" LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE "${DB_NAME}" OWNER "${DB_USER}"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
SELECT 'CREATE DATABASE "${DB_NAME}_test" OWNER "${DB_USER}"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}_test')\gexec
SQL

echo "Databases '${DB_NAME}' and '${DB_NAME}_test' are ready for role '${DB_USER}'."

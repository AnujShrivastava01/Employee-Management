#!/bin/sh
# Runs once, when the PostgreSQL data volume is first initialised (docker-entrypoint-initdb.d).
# Creates a second database that the backend integration tests use, so they never touch real data.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
    CREATE DATABASE "${POSTGRES_DB}_test" OWNER "$POSTGRES_USER";
SQL

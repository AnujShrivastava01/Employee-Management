-- Runs once, when the PostgreSQL data volume is first initialised (docker-entrypoint-initdb.d).
-- Creates the database that the backend integration tests use, so they never touch real data.
-- Plain SQL on purpose: unlike a shell script it is not affected by Windows (CRLF) line endings.
CREATE DATABASE ems_test;

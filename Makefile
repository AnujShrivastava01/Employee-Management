# Convenience targets. Everything here is also documented as plain commands in README.md.
SHELL := /bin/bash
ENV_FILE ?= .env
# Export the variables from .env (if present) into the recipe's environment.
LOAD_ENV = set -a; [ -f $(ENV_FILE) ] && . ./$(ENV_FILE); set +a

.DEFAULT_GOAL := help
.PHONY: help up down logs db-up db-down backend frontend test test-backend test-frontend e2e

help: ## Show this help
	@grep -E '^[a-z0-9-]+:.*##' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-15s %s\n", $$1, $$2}'

up: ## Build and start the whole stack with Docker Compose (http://localhost:3000)
	docker compose up --build -d

down: ## Stop the Docker Compose stack (data volume is kept)
	docker compose down

logs: ## Follow the Docker Compose logs
	docker compose logs -f

db-up: ## Start only PostgreSQL in Docker (for local backend development)
	docker compose up -d db

db-down: ## Stop PostgreSQL
	docker compose stop db

backend: ## Run the Spring Boot API locally on :8080 (reads .env)
	$(LOAD_ENV); cd backend && mvn spring-boot:run

frontend: ## Run the Next.js dev server on :3000 (needs the backend on :8080)
	cd frontend && npm install && npm run dev

test-backend: ## Backend unit + integration tests (needs PostgreSQL with the ems_test database)
	cd backend && mvn verify

test-frontend: ## Frontend unit tests, lint, type check and production build
	cd frontend && npm test && npm run lint && npm run typecheck && npm run build

test: test-backend test-frontend ## Everything except the browser tests

e2e: ## Playwright smoke tests against the RUNNING stack (see README)
	cd frontend && npx playwright test e2e/employee-management.spec.ts

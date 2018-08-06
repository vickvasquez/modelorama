# default settings
run := unit

help: Makefile ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

ci: ## Run tests and report coverage results! :wink:
	@npm run test:coverage:$(run)
	@npm run test:report -- -r html

dev: ## Lift dev environment for this service
	@npm run watch

prune: ## Remove schema files and migrations
	@((rm db/schema* > /dev/null 2>&1) && echo "Schema deleted") || echo "Schema already deleted"
	@((rm db/migrations/*.js > /dev/null 2>&1) && echo "Migrations deleted") || echo "Migrations already deleted"
	@((rm schema/generated/*.* > /dev/null 2>&1) && echo "Definitions deleted") || echo "Definitions already deleted"

build: ## Generate schema definitions
	@npm run schema

migrate: ## Execute pending migrations
	@bin/db migrate --up

rollback: ## Rollback executed migrations
	@bin/db migrate --down

migration: ## Autogenerate new migration files
	@bin/db migrate --make
	@bin/db migrate --up
	@bin/db migrate --apply

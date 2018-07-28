# default settings
run := unit

help: Makefile ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

ci: ## Run tests and report coverage results! :wink:
	@npm run test:coverage:$(run)
	@npm run test:report -- -r html

prune: ## Remove schema files and migrations
	@((rm db/schema* > /dev/null 2>&1) && echo "Schema deleted") || echo "Schema already deleted"
	@((rm db/migrations/*.js > /dev/null 2>&1) && echo "Migrations deleted") || echo "Migrations already deleted"

migrate: ## Execute pending migrations
	@bin/db migrate --up

rollback: ## Rollback executed migrations
	@bin/db migrate --down

migration: ## Autogenerate new migration files
	@bin/db migrate --make
	@bin/db migrate --up
	@bin/db migrate --apply

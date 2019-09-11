NODE=node

TSC=./node_modules/.bin/tsc

COMPILED_ASSETS=$(wildcard assets/**/*.json)

MOCHA=$(NODE) ./node_modules/.bin/mocha

compile: ## Transpile from typescript to javascript
	$(TSC)

build: ## Generate a `dist` folder with the catalog
	$(NODE)

gentest: ## Builds a "expected.json" catalog for testing
	WRITE_TEST_CATALOG_RESULT=1 $(MOCHA)

test: ## Run all the tests!
	$(MOCHA)

.PHONY: compile build gentest test help
.DEFAULT_GOAL := help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-8s\033[0m %s\n", $$1, $$2}'

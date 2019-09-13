MAKE=make

NODE=node

TSC=./node_modules/.bin/tsc

MOCHA=$(NODE) ./node_modules/.bin/mocha

compile: ## Transpile from typescript to javascript
	$(TSC) -p tsconfig.json

watch: ## Compile and keep watching
	$(TSC) -p tsconfig.json --watch

catalog: ## Generate a `dist` folder with the catalog
	$(NODE) ./build/index.js

gentest: ## Builds a "expected.json" catalog for testing
	WRITE_TEST_CATALOG_RESULT=1 $(MOCHA)

checkassets: ## Fails on any warning when building
	DEBUG_ASSET_PROCESSING=1 $(MAKE) catalog

test: ## Run all the tests!
	$(MOCHA)
	@rm -rf ./tmp

.PHONY: compile build gentest test help
.DEFAULT_GOAL := help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-12s\033[0m %s\n", $$1, $$2}'

NODE=node

TSC=./node_modules/.bin/tsc

COMPILED_ASSETS=$(wildcard assets/**/*.json)

MOCHA=$(NODE) ./node_modules/.bin/mocha

build:
	$(TSC)

manifest:
	$(NODE) src/compileAllDescriptions.js

test:
	$(MOCHA) test/

.PHONY: manifest test

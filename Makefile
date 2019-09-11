NODE=node

COMPILED_ASSETS=$(wildcard assets/**/*.json)

MOCHA=$(NODE) ./node_modules/.bin/mocha

manifest:
	$(NODE) src/compileAllDescriptions.js

test:
	$(MOCHA) test/

.PHONY: manifest test

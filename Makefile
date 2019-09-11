NODE=node

TSC=./node_modules/.bin/tsc

COMPILED_ASSETS=$(wildcard assets/**/*.json)

MOCHA=$(NODE) ./node_modules/.bin/mocha

compile:
	$(TSC)

build:
	$(NODE)

test:
	$(MOCHA)

.PHONY: manifest test

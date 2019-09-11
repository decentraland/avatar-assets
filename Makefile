NODE=node

COMPILED_ASSETS=$(wildcard assets/**/*.json)

manifest:
	$(NODE) src/compileAllDescriptions.js

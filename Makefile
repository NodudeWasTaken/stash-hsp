# Define the source directory
SRC_DIR = ./src
SRC_INDEX = $(SRC_DIR)/index.ts

# Targets
start:
	bun run $(SRC_INDEX)

bundle:
	bun build $(SRC_INDEX) --minify --sourcemap --target bun --outdir ./build
	cp -r serve ./build

dev:
	DEBUG=express:* bun --watch run $(SRC_INDEX)

PRETTIER_CMD = npx prettier $(SRC_DIR)
prettier:
	$(PRETTIER_CMD) --write
	
format: prettier

prettier-check:
	$(PRETTIER_CMD) --check

tsc-check:
	npx tsc

check: tsc-check prettier-check


generate-types:
	npx graphql-codegen

.PHONY: start bundle compile dev prettier prettier-check generate-types

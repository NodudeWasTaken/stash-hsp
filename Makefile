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

sql:
	bunx drizzle-kit generate

PRETTIER_CMD = bunx prettier $(SRC_DIR)
prettier:
	$(PRETTIER_CMD) --write

prettier-check:
	$(PRETTIER_CMD) --check

tsc-check:
	bunx tsc

check: tsc-check prettier-check

generate-types:
	bunx graphql-codegen

.PHONY: start bundle compile dev prettier prettier-check generate-types

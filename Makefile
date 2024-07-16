# Define the source directory
SRC_DIR = ./src

# Targets
start:
	bun run $(SRC_DIR)/index.ts

bundle:
	bun build $(SRC_DIR)/index.ts --minify --sourcemap --target bun --outdir ./build

compile:
	bun build $(SRC_DIR)/index.ts --compile --minify --sourcemap --target bun --outfile stashhsp

dev:
	DEBUG=express:* bun --watch run $(SRC_DIR)/index.ts

prettier:
	npx prettier $(SRC_DIR) --write

prettier-check:
	npx prettier $(SRC_DIR) --check

generate-types:
	npx graphql-codegen

.PHONY: start bundle compile dev prettier prettier-check generate-types

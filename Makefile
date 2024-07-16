# Define the source directory
SRC_DIR = ./src
SRC_INDEX = $(SRC_DIR)/index.ts

# Targets
start:
	bun run $(SRC_INDEX)

bundle:
	bun build $(SRC_INDEX) --minify --sourcemap --target bun --outdir ./build

compile:
	bun build $(SRC_INDEX) --compile --minify --sourcemap --target=bun-linux-x64-baseline --outfile stashhsp

dev:
	DEBUG=express:* bun --watch run $(SRC_INDEX)

prettier:
	npx prettier $(SRC_DIR) --write

prettier-check:
	npx prettier $(SRC_DIR) --check

generate-types:
	npx graphql-codegen

.PHONY: start bundle compile dev prettier prettier-check generate-types

// prettier.config.js, .prettierrc.js, prettier.config.mjs, or .prettierrc.mjs

/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
	trailingComma: "es5",
	useTabs: true,
	semi: false,
	singleQuote: false,
	bracketSpacing: true,
	plugins: ["prettier-plugin-organize-imports"],
};

export default config;
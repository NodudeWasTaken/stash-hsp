import fs from 'fs';

{
	const buffer = fs.readFileSync("src/public/apple-touch-icon.png")
	const b64 = buffer.toString('base64');

	fs.writeFileSync("src/public/apple-touch-icon.ts", `export const appleTouchIconBase64 = \`${b64}\``)
}

{
	const buffer = fs.readFileSync("src/public/favicon.ico")
	const b64 = buffer.toString('base64');

	fs.writeFileSync("src/public/favicon.ts", `export const faviconBase64 = \`${b64}\``)
}
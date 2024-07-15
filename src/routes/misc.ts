import { Express, Request, Response } from "express"
import { client } from "../core/client"
import { Query } from "../gql/graphql"
import { appleTouchIconBase64 } from "../public/apple-touch-icon"
import { faviconBase64 } from "../public/favicon"
import { CONFIG_QUERY } from "../queries/ConfigurationQuery"
import { checkForErrors } from "../utils/utilities"

const healthcheckHandler = async (req: Request, res: Response) => {
	try {
		const queryResult = await client.query<Query>({
			query: CONFIG_QUERY,
		})
		checkForErrors(queryResult.errors)
		res.json({ message: "OK" })
	} catch (error) {
		res.status(500).json(error)
	}
}

const decodeB64 = (b64: string) => Buffer.from(b64, "base64")
const faviconHandler = async (req: Request, res: Response) => {
	const img = decodeB64(faviconBase64)
	res.writeHead(200, {
		"Content-Type": "image/x-icon",
		"Content-Length": img.length,
	})
	res.end(img)
}
const appleiconHandler = async (req: Request, res: Response) => {
	const img = decodeB64(appleTouchIconBase64)
	res.writeHead(200, {
		"Content-Type": "image/png",
		"Content-Length": img.length,
	})
	res.end(img)
}

export const healthcheckPath = "/healthcheck"
export const faviconPath = "/favicon.ico"
export const appletouchiconPath = "/apple-touch-icon.png"
export function miscRoutes(app: Express) {
	app.get("/healthcheck", healthcheckHandler)
	app.get("/favicon.ico", faviconHandler)
	app.get("/apple-touch-icon.png", appleiconHandler)
}

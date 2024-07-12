import { Express, Response } from "express"
import { HspRequest } from "../core/authmiddleware"
import { client } from "../core/client"
import { CONFIG_QUERY, CONFIG_QUERY_TYPE } from "../queries/ConfigurationQuery"

const healthcheckHandler = async (req: HspRequest, res: Response) => {
	try {
		await client.query<CONFIG_QUERY_TYPE>({
			query: CONFIG_QUERY,
		})
		res.json({ message: "OK" })
	} catch (error) {
		res.status(500).json(error)
	}
}

const faviconHandler = async (req: HspRequest, res: Response) => {
	// TODO: .
	res.status(500).json({ message: "Not implemented yet" })
}
const appleiconHandler = async (req: HspRequest, res: Response) => {
	// TODO: .
	res.status(500).json({ message: "Not implemented yet" })
}

export function miscRoutes(app: Express) {
	app.get("/healthcheck", healthcheckHandler)
	app.get("/favicon.ico", faviconHandler)
	app.get("/apple-touch-icon.png", appleiconHandler)
}

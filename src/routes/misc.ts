import { Express, Request, Response } from "express"
import { client } from "../core/client"
import { Query } from "../gql/graphql"
import { CONFIG_QUERY } from "../queries/ConfigurationQuery"

const healthcheckHandler = async (req: Request, res: Response) => {
	try {
		await client.query<Query>({
			query: CONFIG_QUERY,
		})
		res.json({ message: "OK" })
	} catch (error) {
		res.status(500).json(error)
	}
}

const faviconHandler = async (req: Request, res: Response) => {
	// TODO: .
	res.status(500).json({ message: "Not implemented yet" })
}
const appleiconHandler = async (req: Request, res: Response) => {
	// TODO: .
	res.status(500).json({ message: "Not implemented yet" })
}

export function miscRoutes(app: Express) {
	app.get("/healthcheck", healthcheckHandler)
	app.get("/favicon.ico", faviconHandler)
	app.get("/apple-touch-icon.png", appleiconHandler)
}

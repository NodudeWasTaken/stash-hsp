import express, { Express, Request, Response } from "express"
import path from "path"
import { client } from "../core/client"
import { Query } from "../gql/graphql"
import { CONFIG_QUERY } from "../queries/ConfigurationQuery"
import { checkForErrors } from "../utils/utilities"

const healthcheckHandler = async (req: Request, res: Response) => {
	try {
		const queryResult = await client.query<Query>({
			query: CONFIG_QUERY,
		})
		checkForErrors(queryResult.errors)
		res.json({ message: "OK" })
	} catch (err) {
		console.error(err)
		res.status(500).send({ error: (err as Error).message })
	}
}

export const healthcheckPath = "/healthcheck"
export const faviconPath = "/favicon.ico"
export const appletouchiconPath = "/apple-touch-icon.png"
export function miscRoutes(app: Express) {
	app.get("/healthcheck", healthcheckHandler)
	app.use(express.static(path.join(__dirname, "serve/public")))
}

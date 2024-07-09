import { Express, Response } from "express"
import { HspRequest } from "../authmiddleware"

var THEEND = 1
const indexHandler = async (req: HspRequest, res: Response) => {
	THEEND += 1 / 3
	res.json({ message: "the end" + " is never the end".repeat(THEEND) })
}

export function indexRoutes(app: Express) {
	app.get("/", indexHandler)
}

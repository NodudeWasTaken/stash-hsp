import { Express, Request, Response } from "express"

var THEEND = 1
const indexHandler = async (req: Request, res: Response) => {
	THEEND += 1 / 3
	res.json({ message: "the end" + " is never the end".repeat(THEEND) })
}

export function indexRoutes(app: Express) {
	app.get("/", indexHandler)
}

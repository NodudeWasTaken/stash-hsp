import { Express, Response } from "express"
import { HspRequest } from "../authmiddleware"

const hspHspHandler = async (req: HspRequest, res: Response) => {
	// TODO: .
	res.status(404)
}

export const hspPath = "/heresphere/hsp"
export function hspFileRoutes(app: Express) {
	app.post(`${hspPath}/:sceneId`, hspHspHandler)
}

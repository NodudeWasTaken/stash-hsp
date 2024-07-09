import { Express, Response } from "express"
import { HspRequest } from "../authmiddleware"
import { HeresphereVideoEvent } from "../heresphere_structs"

function isHeresphereEventReq(data: any): data is HeresphereVideoEvent {
	return (
		typeof data === "object" && data !== null && typeof data.id === "string"
		// TODO: Add any other property checks
	)
}

const hspEventHandler = async (req: HspRequest, res: Response) => {
	if (isHeresphereEventReq(req.body)) {
		const eventReq: HeresphereVideoEvent = req.body
		// TODO: See SCENE_UPDATE_QUERY
		res.json({ message: "OK" })
		return
	}

	res.status(400).json({ message: "unrecognized data structure" })
}

export const eventPath = "/heresphere/event"
export function hspEventRoutes(app: Express) {
	app.post(`${eventPath}/:sceneId`, hspEventHandler)
}

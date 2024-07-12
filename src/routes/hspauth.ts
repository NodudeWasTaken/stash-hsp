import { Express, Request, Response } from "express"
import {
	HeresphereAuthResp,
	HeresphereBadLogin,
	HeresphereBanner,
	HeresphereGuest,
	HeresphereIndex,
} from "../structs/heresphere_structs"
import { getBaseURL } from "../utils/utilities"

const hspAuthHandler = async (req: Request, res: Response) => {
	// TODO: Check auth and possible return HeresphereAuthResp
	if (!req.heresphereAuthData) {
		const baseurl = getBaseURL(req)
		const banner: HeresphereBanner = {
			image: `${baseurl}/apple-touch-icon.png`,
			link: baseurl,
		}

		const idx: HeresphereIndex = {
			access: HeresphereBadLogin,
			banner: banner,
			library: [],
		}

		res.json(idx)
		return
	}

	const auth: HeresphereAuthResp = {
		"auth-token": "",
		access: HeresphereGuest,
	}

	// TODO: Set HeresphereAuthHeader if success

	res.json(auth)
}

export const authPath = "/heresphere/auth"
export function hspAuthRoutes(app: Express) {
	app.post(`${authPath}`, hspAuthHandler)
}

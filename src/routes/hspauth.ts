import { Express, Response } from "express"
import { HspRequest } from "../authmiddleware"
import {
	HeresphereAuthResp,
	HeresphereBadLogin,
	HeresphereBanner,
	HeresphereGuest,
	HeresphereIndex,
} from "../heresphere_structs"
import { getBaseURL } from "../utilities"

const hspAuthHandler = async (req: HspRequest, res: Response) => {
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

	res.json(auth)
}

export const authPath = "/heresphere/auth"
export function hspAuthRoutes(app: Express) {
	app.post(`${authPath}`, hspAuthHandler)
}

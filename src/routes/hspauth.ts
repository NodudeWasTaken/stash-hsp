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

		// TODO: We should only return this on index, not other endpoints
		res.json(idx)
		return
	}

	var auth: HeresphereAuthResp = {
		"auth-token": "",
		access: HeresphereGuest,
	}

	/*await tryForAuth(req)
		.then((sessionval) => {
			console.log("Response contains session cookie session", sessionval)

			auth = {
				"auth-token": sessionval,
				access: HeresphereMember,
			}
			// TODO: Fetch stash ui config using that
		})
		.catch((error) => {
			console.error(error)
		})*/

	res.json(auth)
}

export const authPath = "/heresphere/auth"
export function hspAuthRoutes(app: Express) {
	app.post(`${authPath}`, hspAuthHandler)
}

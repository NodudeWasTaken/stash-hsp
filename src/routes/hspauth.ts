import { Express, Request, Response } from "express"
import { print } from "graphql"
import fetch from "node-fetch"
import { _ADD_AUTH, tryForAuth } from "../core/authmiddleware"
import { _SET_APIKEY, ENABLE_EXPERIMENTAL_AUTH, STASH_URL } from "../core/vars"
import { CONFIG_QUERY } from "../queries/ConfigurationQuery"
import {
	HeresphereAuthResp,
	HeresphereBadLogin,
	HeresphereBanner,
	HeresphereGuest,
	HeresphereIndex,
	HeresphereMember,
} from "../structs/heresphere_structs"
import { getBaseURL } from "../utils/utilities"

const hspAuthHandler = async (req: Request, res: Response) => {
	try {
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

		let auth: HeresphereAuthResp = {
			"auth-token": "",
			access: HeresphereGuest,
		}

		if (ENABLE_EXPERIMENTAL_AUTH) {
			const result = await tryForAuth(req)
				.then((sessionval) => {
					console.log("Response contains session cookie session", sessionval)
					return fetch(`${STASH_URL}/graphql`, {
						method: "post",
						headers: {
							Accept: "application/json",
							"Content-Type": "application/json",
							Cookie: `session=${sessionval}`,
						},
						body: JSON.stringify({
							operationName: "Configuration",
							query: print(CONFIG_QUERY),
							variables: {},
						}),
					})
				})
				.catch((error) => {
					console.error(error)
				})

			if (result) {
				const configData = await result.json()

				if (!configData.data.configuration.general.apiKey) {
					throw new Error("Empty apiKey")
				}

				await _SET_APIKEY(configData.data.configuration.general.apiKey)
					.then(() => {
						auth = {
							"auth-token": _ADD_AUTH(),
							access: HeresphereMember,
						}
					})
					.catch((e) => {
						console.error(e)
					})
			}
		}

		res.json(auth)
	} catch (err) {
		console.error(err)
		res.status(500).send({ error: (err as Error).message })
	}
}

export const authPath = "/heresphere/auth"
export function hspAuthRoutes(app: Express) {
	app.post(`${authPath}`, hspAuthHandler)
}

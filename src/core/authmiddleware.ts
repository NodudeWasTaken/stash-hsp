import { NextFunction, Request, Response } from "express"
import NodeCache from "node-cache"
import { randomBytes } from "node:crypto"
import { indexPath } from "../routes"
import { authPath } from "../routes/hspauth"
import { hspIndexPath } from "../routes/hspindex"
import {
	appletouchiconPath,
	faviconPath,
	healthcheckPath,
} from "../routes/misc"
import {
	HeresphereAuthHeader,
	HeresphereAuthReq,
	HeresphereBanner,
	HeresphereGuest,
	HeresphereIndex,
	HeresphereJsonVersion,
} from "../structs/heresphere_structs"
import { getBaseURL } from "../utils/utilities"
import { fetcher } from "./client"
import { INITIAL_FETCH, NEEDS_AUTH, STASH_URL } from "./vars"

// Create a new instance of NodeCache with 5 hour TTL
const login_cache = new NodeCache({ stdTTL: 60 * 60 * 5 })

declare global {
	namespace Express {
		interface Request {
			heresphereAuthData?: HeresphereAuthReq
		}
	}
}

function isHeresphereAuthReq(data: any): data is HeresphereAuthReq {
	console.log("isHeresphereAuthReq:", data)
	return (
		typeof data === "object" &&
		data !== null &&
		typeof data.username === "string" &&
		typeof data.password === "string"
	)
}

function needsAuth(req: Request): boolean {
	let authEnabled: boolean = false // TODO: Config

	if (!authEnabled && !NEEDS_AUTH) {
		return false
	}

	const authHeader = req.headers[HeresphereAuthHeader.toLowerCase()]
	const validAuth =
		authHeader && typeof authHeader === "string" && login_cache.get(authHeader)
	return !validAuth
}

export function _ADD_AUTH() {
	const sessionval = randomBytes(128).toString("hex")
	login_cache.set(sessionval, true)
	return sessionval
}

const session_regex = new RegExp("session=([^;]*)")
export async function tryForAuth(req: Request) {
	let formData = new URLSearchParams()
	formData.append("username", req.heresphereAuthData?.username || "")
	formData.append("password", req.heresphereAuthData?.password || "")
	formData.append("returnURL", "/")

	const response = await fetcher(`${STASH_URL}/login`, {
		method: "POST",
		headers: {
			Accept: "text/html",
			"Content-Type": "application/x-www-form-urlencoded",
		},
		redirect: "manual",
		body: formData,
	})

	if (!response.ok && response.status != 302) {
		throw new Error(`failed to contact: ${response.status}`)
	}

	const setCookieHeader = response.headers.get("Set-Cookie".toLowerCase())
	if (setCookieHeader) {
		// Check if the 'Set-Cookie' header contains the 'session=' cookie
		let match = setCookieHeader.match(session_regex)

		if (match && match[1]) {
			const seskey = match[1]
			login_cache.set(seskey, true)
			return seskey
		} else {
			throw new Error(`Response does not contain session cookie`)
		}
	} else {
		throw new Error(`No Set-Cookie header found in the response`)
	}
}

export function heresphereAuthMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
) {
	res.header("HereSphere-JSON-Version", `${HeresphereJsonVersion}`)

	console.log("Remote IP (req.clientIp):", req.clientIp)

	if (isHeresphereAuthReq(req.body)) {
		req.heresphereAuthData = req.body
	}

	const publicPaths = [
		authPath,
		healthcheckPath,
		faviconPath,
		appletouchiconPath,
		indexPath,
	]
	if (
		!req.heresphereAuthData &&
		needsAuth(req) &&
		publicPaths.includes(req.path)
	) {
		console.log("BLOCKED:", req.path)
		res.status(401)

		if (req.path == hspIndexPath) {
			const baseurl = getBaseURL(req)
			const banner: HeresphereBanner = {
				image: `${baseurl}/apple-touch-icon.png`,
				link: baseurl,
			}

			const idx: HeresphereIndex = {
				access: HeresphereGuest,
				banner: banner,
				library: [],
			}

			res.json(idx)
		} else {
			res.json({ message: "Unauthorized!" })
		}

		return
	}
	if (!INITIAL_FETCH && !publicPaths.includes(req.path)) {
		res.json({ message: "Waiting for auth..." })
		return
	}

	next()
}

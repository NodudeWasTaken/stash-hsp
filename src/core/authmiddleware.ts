import { NextFunction, Request, Response } from "express"
import { authPath } from "../routes/hspauth"
import {
	HeresphereAuthHeader,
	HeresphereAuthReq,
	HeresphereJsonVersion,
} from "../structs/heresphere_structs"

declare module "express-serve-static-core" {
	interface Request {
		heresphereAuthData?: HeresphereAuthReq
	}
}

function isHeresphereAuthReq(data: any): data is HeresphereAuthReq {
	return (
		typeof data === "object" &&
		data !== null &&
		typeof data.username === "string" &&
		typeof data.password === "string"
		// TODO: Add any other property checks
	)
}

function needsAuth(req: Request) {
	var authEnabled: boolean = false // TODO: .

	if (!authEnabled) {
		return false
	}

	const authHeader = req.headers[HeresphereAuthHeader.toLowerCase()]
	if (authHeader) {
		// TODO: Check cache for store some key
	}

	return true
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

	if (
		!req.heresphereAuthData &&
		needsAuth(req) &&
		req.path != authPath &&
		req.path != "/"
	) {
		res.status(401).json({ message: "Unauthorized" })
		return
	}

	next()
}

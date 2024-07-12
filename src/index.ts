import { loadDevMessages, loadErrorMessages } from "@apollo/client/dev"
import compression from "compression"
import express, { Express } from "express"
import requestIp from "request-ip"
import { heresphereAuthMiddleware } from "./core/authmiddleware"
import { initClient } from "./core/client"
import {
	DEBUG_MODE,
	getVrTag,
	VAR_CACHE_DIR,
	VAR_PORT,
	VAR_SCREENSHOT_DIR,
} from "./core/vars"
import { indexRoutes } from "./routes"
import { debugRoutes } from "./routes/debug"
import { hspEventRoutes } from "./routes/hspevent"
import { hspFileRoutes } from "./routes/hspfile"
import { hspIndexRoutes } from "./routes/hspindex"
import { genScanDB, hspScanRoutes } from "./routes/hspscan"
import { hspSceneRoutes } from "./routes/hspscene"
import { hspScreenshotRoutes } from "./routes/hspscreenshot"
import { miscRoutes } from "./routes/misc"
import { ensureDirectoryExists } from "./utils/utilities"

const app: Express = express()
app.set("trust proxy", true)
app.use(requestIp.mw())
app.use(heresphereAuthMiddleware)
app.use(express.json()) // BUG: json() removes ip address fields, place it later
app.use(
	express.urlencoded({
		extended: true,
	})
)
app.use(compression())

// TODO: Log errors

indexRoutes(app)
debugRoutes(app)
miscRoutes(app)
hspScanRoutes(app)
hspScreenshotRoutes(app)
hspSceneRoutes(app)
hspIndexRoutes(app)
hspEventRoutes(app)
hspFileRoutes(app)

// TODO: Frontend UI???

if (DEBUG_MODE) {
	console.debug("Debug mode enabled")
	loadDevMessages()
	loadErrorMessages()
}

const server = app.listen(Number(VAR_PORT), "0.0.0.0", async () => {
	ensureDirectoryExists(VAR_SCREENSHOT_DIR)
	ensureDirectoryExists(VAR_CACHE_DIR)
	initClient()
	try {
		await getVrTag()
	} catch (error) {
		console.error("failed to contact stash:", error)
		server.close((err) => {
			console.log("server closed")
			process.exit(err ? 1 : 0)
		})
	}

	console.log(`Example app listening at http://0.0.0.0:${VAR_PORT}`)
	console.log(`Generating scan.json in 10 seconds`)

	setTimeout(() => {
		genScanDB(true)
	}, 10000)
})

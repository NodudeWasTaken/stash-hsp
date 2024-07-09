import { loadDevMessages, loadErrorMessages } from "@apollo/client/dev"
import compression from "compression"
import express, { Express } from "express"
import { heresphereAuthMiddleware } from "./authmiddleware"
import { initClient } from "./client"
import { indexRoutes } from "./routes"
import { debugRoutes } from "./routes/debug"
import { hspEventRoutes } from "./routes/hspevent"
import { hspFileRoutes } from "./routes/hspfile"
import { hspIndexRoutes } from "./routes/hspindex"
import { genScanDB, hspScanRoutes } from "./routes/hspscan"
import { hspSceneRoutes } from "./routes/hspscene"
import { hspScreenshotRoutes } from "./routes/hspscreenshot"
import { miscRoutes } from "./routes/misc"
import { ensureDirectoryExists } from "./utilities"
import {
	DEBUG_MODE,
	getVrTag,
	VAR_CACHE_DIR,
	VAR_SCREENSHOT_DIR,
} from "./vars"

const app: Express = express()
const port: number = Number(process.env.PORT) || 3000
app.use(express.json())
app.use(
	express.urlencoded({
		extended: true,
	})
)
app.use(compression())
app.use(heresphereAuthMiddleware)

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

const server = app.listen(port, "0.0.0.0", async () => {
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

	console.log(`Example app listening at http://0.0.0.0:${port}`)
	console.log(`Generating scan.json in 10 seconds`)

	setTimeout(() => {
		genScanDB(true)
	}, 10000)
})

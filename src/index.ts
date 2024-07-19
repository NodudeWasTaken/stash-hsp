import { loadDevMessages, loadErrorMessages } from "@apollo/client/dev"
import compression from "compression"
import express, { Express } from "express"
import requestIp from "request-ip"
import { heresphereAuthMiddleware } from "./core/authmiddleware"
import { initClient } from "./core/client"
import { appendLog } from "./core/logger"
import { DEBUG_MODE, tryAuth, VAR_PORT } from "./core/vars"
import { indexRoutes } from "./routes"
import { debugRoutes } from "./routes/debug"
import { hspAuthRoutes } from "./routes/hspauth"
import { hspEventRoutes } from "./routes/hspevent"
import { hspFileRoutes } from "./routes/hspfile"
import { hspIndexRoutes } from "./routes/hspindex"
import { hspScanRoutes } from "./routes/hspscan"
import { hspSceneRoutes } from "./routes/hspscene"
import { hspScreenshotRoutes } from "./routes/hspscreenshot"
import { miscRoutes } from "./routes/misc"

const app: Express = express()
app.set("trust proxy", true)
app.set("json escape", false)
app.use(requestIp.mw())
app.use(express.json()) // BUG: json() removes ip address fields, place it later
app.use(
	express.urlencoded({
		extended: true,
	})
)
app.use(compression())
app.use(heresphereAuthMiddleware)

// TODO: Log errors
// TODO: Check errors on queries

indexRoutes(app)
debugRoutes(app)
miscRoutes(app)
hspScanRoutes(app)
hspScreenshotRoutes(app)
hspSceneRoutes(app)
hspIndexRoutes(app)
hspEventRoutes(app)
hspFileRoutes(app)
hspAuthRoutes(app)

// TODO: Frontend UI???

if (DEBUG_MODE) {
	console.debug("Debug mode enabled")
	loadDevMessages()
	loadErrorMessages()
}

const server = app.listen(Number(VAR_PORT), "0.0.0.0", async () => {
	appendLog("debug", "Initialized")
	initClient()
	// TODO: Retry this, maybe setTimeout?
	tryAuth().catch((error) => {
		console.error("Unknown network error:", error)
		server.close((err) => {
			console.log("server closed")
			process.exit(err ? 1 : 0)
		})
	})

	console.log(`Example app listening at http://0.0.0.0:${VAR_PORT}`)
})

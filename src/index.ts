import { 
	HeresphereJsonVersion, 
} from './heresphere_structs';
import express, { Express, Request, Response } from "express";
import { ensureDirectoryExists } from './utilities';
import compression from 'compression';
import { getVrTag, SERVICE_IP, VAR_CACHE_DIR, VAR_SCREENSHOT_DIR } from "./vars";
import { client } from "./client";
import { genScanDB, hspScanRoutes } from "./routes/hspscan";
import { hspScreenshotRoutes } from './routes/hspscreenshot';
import { hspSceneRoutes } from './routes/hspscene';
import { hspIndexRoutes } from './routes/hspindex';
import { hspEventRoutes } from './routes/hspevent';
import { debugRoutes } from './routes/debug';
import { miscRoutes } from './routes/misc';
import { indexRoutes } from './routes';

const app: Express = express();
const port: number = Number(process.env.PORT) || 3000;
app.use(express.json());
app.use(
	express.urlencoded({
		extended: true,
	})
);
app.use(compression());
app.use(function(req, res, next) {
	res.header("HereSphere-JSON-Version", `${HeresphereJsonVersion}`);
	// TODO: We could auth here, but what about context passing
	// 			HeresphereAuthReq check needsMediaSources
	next()
});

// TODO: Log errors

indexRoutes(app);
hspScanRoutes(app);
hspScreenshotRoutes(app);
hspSceneRoutes(app);
hspIndexRoutes(app);
hspEventRoutes(app);
debugRoutes(app);
miscRoutes(app);

app.listen(port, SERVICE_IP, () => {
	ensureDirectoryExists(VAR_SCREENSHOT_DIR);
	ensureDirectoryExists(VAR_CACHE_DIR);
	getVrTag(client);

	console.log(`Example app listening at http://${SERVICE_IP}:${port}`);
	console.log(`Generating scan.json in 10 seconds`);

	setTimeout(() => { genScanDB(true) }, 10000);
});
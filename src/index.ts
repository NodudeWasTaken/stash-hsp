import { ApolloClient, InMemoryCache  } from '@apollo/client';
import { FIND_SAVED_FILTERS_QUERY, FIND_SCENES_QUERY, CONFIG_QUERY, FIND_SCENES_SLIM_QUERY, FIND_SCENE_QUERY, FIND_SCENE_SLIM_QUERY } from "./queries/query"
import { CriterionFixer } from './criterion_fix';
import { 
	HeresphereBanner, 
	HeresphereIndex, 
	HeresphereIndexEntry, 
	HeresphereJsonVersion, 
	HeresphereLensLinear, 
	HeresphereMember, 
	HeresphereProjectionPerspective, 
	HeresphereScanIndex, 
	HeresphereStereoMono, 
	HeresphereVideoEntry,
	HeresphereVideoEntryShort,
	HeresphereVideoMedia,
	HeresphereVideoMediaSource,
	HeresphereVideoScript,
	HeresphereVideoSubtitle,
	HeresphereVideoTag
} from './heresphere_structs';
import express, { Express, Request, Response } from "express";
import { FindProjectionTags } from './projection';
import { checkUrl, ensureDirectoryExists, fetchAndResizeImage, fileExists, getBasename, getFileAge, getFileAgeDays } from './misc';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import { isPropertyAccessExpression } from 'typescript';
import pLimit from 'p-limit';


const app: Express = express();
const port: number = Number(process.env.PORT) || 3000;
app.use(express.json());
app.use(
	express.urlencoded({
		extended: true,
	})
);
app.use(function(req, res, next) {
	res.header("HereSphere-JSON-Version", `${HeresphereJsonVersion}`);
	// TODO: We could auth here, but what about context passing
	next()
});

const maxRes = 480

const SERVICE_IP = process.env.SERVICE_IP || "127.0.0.1"
const STASH_URL = process.env.STASH_URL || "http://127.0.0.1:9999"
const VAR_SCREENSHOT_DIR = process.env.SCREENSHOTS_DIR || "./screenshots"
const VAR_CACHE_DIR = process.env.CACHE_DIR || "./cache"
const VAR_SCALELIMIT = process.env.SCALE_PROCESS_LIMIT || "8"
const VAR_RLIMIT = process.env.REQUEST_PROCESS_LIMIT || "50"
const VAR_SCANCACHE_AGE = process.env.SCANCACHE_AGE || 24*60*60*1000
const slimit = pLimit(Number(VAR_SCALELIMIT));
const rlimit = pLimit(Number(VAR_RLIMIT));
const client = new ApolloClient({
	uri: `${STASH_URL}/graphql`,
	cache: new InMemoryCache(),
});

function getBaseURL(req: Request) {
	return `${req.protocol}://${req.get('host')}`;
}

app.get("/debug/findfilters", async (req: Request, res: Response) => {
	const result = await client.query({
		query: FIND_SAVED_FILTERS_QUERY,
		variables: {
		  mode: "SCENES",
		},
	})

	res.json(result)
});

app.get("/debug/finddefscenes", async (req: Request, res: Response) => {
	try {
		const uiconfig = await client.query({
			query: CONFIG_QUERY,
		});

		const defaultfilter = uiconfig.data.configuration.ui.defaultFilters.scenes;

		var find_filter = defaultfilter.find_filter;
		var object_filter = defaultfilter.object_filter;
		object_filter = CriterionFixer(object_filter)

		const findscenes = await client.query({
			query: FIND_SCENES_QUERY,
			variables: {
				filter: find_filter, // find_filter
				scene_filter: object_filter // object_filter
			},
		});

		res.json(findscenes);
	} catch (error) {
		console.error(error)
		res.json(error);
	}
});

app.get("/debug/findscene/:sceneId", async (req: Request, res: Response) => {
	try {
		const sceneId = req.params.sceneId

		const sceneData = await client.query({
			query: FIND_SCENE_QUERY,
			variables: {
				id: sceneId,
			}
		});
		
		res.json(sceneData.data.findScene);
	} catch (error) {
		console.error(error)
		res.json(error);
	}
});

const hspIndex = async (req: Request, res: Response) => {
	try {
		const baseurl = getBaseURL(req);
		const banner: HeresphereBanner = {
			image: `${baseurl}/apple-touch-icon.png`,
			link: baseurl,
		};

		const library: HeresphereIndex = {
			access: HeresphereMember,
			banner: banner,
			library: [],
		}

		var allfilters = []

		{
			const uiconfig = await client.query({
				query: CONFIG_QUERY,
			});

			const defaultfilter = uiconfig.data.configuration.ui.defaultFilters.scenes;

			var find_filter = defaultfilter.find_filter;
			var object_filter = defaultfilter.object_filter;
			object_filter = CriterionFixer(object_filter);
			
			find_filter = { ...find_filter } // Read-only fix
			find_filter.page = 0
			find_filter.per_page = -1
	
			if (process.env.DEBUG) {
				console.debug(find_filter);
				console.debug("Default");
			}
			allfilters.push({
				name: "Default",
				find_filter: find_filter,
				object_filter: object_filter,
			})
		}

		{
			const filtersq = await client.query({
				query: FIND_SAVED_FILTERS_QUERY,
				variables: {
					mode: "SCENES",
				}
			});
			for (let defaultfilter of filtersq.data.findSavedFilters) {
				var find_filter = defaultfilter.find_filter;
				var object_filter = defaultfilter.object_filter;
				object_filter = CriterionFixer(object_filter);

				find_filter = { ...find_filter } // Read-only fix
				find_filter.page = 0
				find_filter.per_page = -1
		
				if (process.env.DEBUG) {
					console.debug(find_filter);
					console.debug(defaultfilter.name);
				}

				allfilters.push({
					name: defaultfilter.name,
					find_filter: find_filter,
					object_filter: object_filter,
				})
			}
		}

		{
			const fetchPromises: Promise<void>[] = [];

			for (let filt of allfilters) {
				console.debug(filt);

				// Push each query promise into the array without awaiting them
				fetchPromises.push(
					client.query({
						query: FIND_SCENES_SLIM_QUERY,
						variables: {
							filter: filt.find_filter,
							scene_filter: filt.object_filter
						},
					}).then((findscenes) => {
						const entry: HeresphereIndexEntry = {
							name: filt.name,
							list: findscenes.data.findScenes.scenes.map((scene: any) => `${baseurl}/heresphere/video/${scene.id}`)
						};
						library.library.push(entry);
					}).catch((error) => {
						console.error(`Error fetching scenes for filter ${filt.name}:`, error);
					})
				);
			}

			// Wait for all promises to resolve
			await Promise.all(fetchPromises);

			library.library.sort((a, b) => {
				if (a.name < b.name) {
					return -1;
				}
				if (a.name > b.name) {
					return 1;
				}
				return 0;
			});
		}
		
		res.json(library);
	} catch (error) {
		console.error(error)
		res.json(error);
	}
};
app.get("/heresphere", hspIndex);
app.post("/heresphere", hspIndex);

function formatDate(dateString: string): string {
	// Parse the date string into a Date object
	const date = new Date(dateString);
  
	// Extract the year, month, and day
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
	const day = String(date.getDate()).padStart(2, '0');
  
	// Format the date as "year-month-day"
	return `${year}-${month}-${day}`;
}

const fetchHeresphereVideoEntry = async(sceneId: string, baseUrl: string): Promise<HeresphereVideoEntry> => {
	const sceneQuery = await client.query({
		query: FIND_SCENE_QUERY,
		variables: {
			id: sceneId,
		}
	});

	const sceneData = sceneQuery.data.findScene;
	//console.debug(sceneData)
	var processed: HeresphereVideoEntry = {
		access: HeresphereMember,
		title: sceneData.title,
		description: sceneData.details,
		thumbnailImage: `${baseUrl}/heresphere/video/${sceneData.id}/screenshot`, // TODO: Add apikey
		thumbnailVideo: `${STASH_URL}/scene/${sceneData.id}/preview`,
		dateAdded: formatDate(sceneData.created_at),
		favorites: 0,
		isFavorite: false,
		projection: HeresphereProjectionPerspective,
		stereo: HeresphereStereoMono,
		isEyeSwapped: false,
		fov: 180,
		lens: HeresphereLensLinear,
		cameraIPD: 6.5,
		eventServer: `${baseUrl}/heresphere/${sceneData.id}/event`,
		scripts: [],
		subtitles: [],
		tags: [],
		media: [],
		writeFavorite: false,
		writeRating: false,
		writeTags: false,
		writeHSP: false,
	}
	if (!processed.title && sceneData.files.length > 0) {
		processed.title = getBasename(sceneData.files[0].path)
	}

	{
		processed.scripts = []
		try {
			await checkUrl(sceneData.paths.funscript);
			var funscript: HeresphereVideoScript = {
				name: "Default",
				url: sceneData.paths.funscript // TODO: Might not exist
			}
			processed.scripts.push(funscript);
		} catch (error) {
			// console.debug(error)
		}
	}
	{
		processed.subtitles = []
		try {
			const CAPTION_URL = `${sceneData.paths.caption}?lang=00&type=srt`
			await checkUrl(CAPTION_URL);
			var subs: HeresphereVideoSubtitle = {
				name: "Default",
				language: "00",
				url: CAPTION_URL
			}
			processed.subtitles.push(subs);
		} catch (error) {
			// console.debug(error)
		}
	}

	processed.tags = [];
	for (let tag of sceneData.tags) {
		const hsptag: HeresphereVideoTag = {
			name: `Tag:${tag.name}`
		}
		processed.tags.push(hsptag)
	}

	// TODO: HeresphereAuthReq
	if (sceneData.files.length > 0) {
		processed.media = [];
		var source: HeresphereVideoMediaSource = {
			resolution: sceneData.files[0].height,
			height: sceneData.files[0].height,
			width: sceneData.files[0].width,
			size: sceneData.files[0].size,
			url: sceneData.paths.stream,
		}
		var entry: HeresphereVideoMedia = {
			name: "Direct stream",
			sources: [source]
		}
		processed.media.push(entry);
		processed.duration = sceneData.files[0].duration * 1000;
	}
	if (sceneData.date) {
		processed.dateReleased = formatDate(sceneData.date);
	}
	if (sceneData.rating100) {
		processed.rating = sceneData.rating100/20;
	}
	if (processed.isFavorite) {
		processed.favorites++;
	}

	// TODO: hspArray
	processed.hspArray = undefined;

	FindProjectionTags(sceneData, processed)

	return processed
}
const sceneFetch = async (req: Request, res: Response) => {
	try {
		const sceneId = req.params.sceneId;
		res.json(await fetchHeresphereVideoEntry(sceneId, getBaseURL(req)));
	} catch (error) {
		console.error(error);
		res.json(error);
	}
};
app.get("/heresphere/video/:sceneId", sceneFetch);
app.post("/heresphere/video/:sceneId", sceneFetch);

// Stash is too slow for this
// TODO: Consider saving as scan.json and simply loading
//			also consider cache time
//			or add a way to refresh
const SCANDB = `./${VAR_CACHE_DIR}/scan.json`
const SCANDB_STR = "REPLACE_ME_XXX_FUCKER_DONT_FIND_SECRET_STRING"
app.post("/heresphere/scan", async (req: Request, res: Response) => {
	if (await fileExists(SCANDB)) {
		var scandb = fs.readFileSync(SCANDB).toString().replaceAll(SCANDB_STR,getBaseURL(req));
		res.contentType("application/json");
		res.send(scandb);
		return
	}
	res.status(404)
});

const fetchHeresphereVideoEntrySlim = async(sceneId: string, baseUrl: string): Promise<HeresphereVideoEntryShort> => {
	const sceneQuery = await client.query({
		query: FIND_SCENE_SLIM_QUERY,
		variables: {
			id: sceneId,
		}
	});

	const sceneData = sceneQuery.data.findScene;
	//console.debug(sceneData)
	var processed: HeresphereVideoEntryShort = {
		link: `${SCANDB_STR}/heresphere/video/${sceneData.id}`,
		title: sceneData.title,
		dateAdded: formatDate(sceneData.created_at),
		favorites: 0,
		comments: 0,
		isFavorite: false,
		tags: []
	}
	if (!processed.title && sceneData.files.length > 0) {
		processed.title = getBasename(sceneData.files[0].path)
	}

	processed.tags = [];
	for (let tag of sceneData.tags) {
		const hsptag: HeresphereVideoTag = {
			name: `Tag:${tag.name}`
		}
		processed.tags.push(hsptag)
	}

	if (sceneData.files.length > 0) {
		processed.duration = sceneData.files[0].duration * 1000;
	}
	if (sceneData.date) {
		processed.dateReleased = formatDate(sceneData.date);
	}
	if (sceneData.rating100) {
		processed.rating = sceneData.rating100/20;
	}
	if (processed.isFavorite) {
		processed.favorites++;
	}

	return processed
}
async function genScanDB(first: boolean) {
	if (!await fileExists(SCANDB) || getFileAge(SCANDB) >= Number(VAR_SCANCACHE_AGE)-1 || !first) {
		console.debug("hsp scan");
		var scenes: HeresphereVideoEntryShort[] = [];
		
		const findscenes = await client.query({
			query: FIND_SCENES_SLIM_QUERY,
			variables: {
				filter: {
					page: 0,
					per_page: -1,
				}
			}
		});
		const videodata = findscenes.data.findScenes.scenes;

		// Fetch video data
		const outof = videodata.length;
		var inof = 0;
		const scenePromises: Promise<void>[] = videodata.map((scene: any) => 
			rlimit(() => 
				fetchHeresphereVideoEntrySlim(scene.id, SCANDB_STR)
					.then(hspscene => {
						inof++;
						console.debug("hsp:",scene.id,"prog:",inof,"/",outof);
						scenes.push(hspscene);
					})
					.catch(error => console.error(error))
			)
		);

		// Downscale images
		const screenshotPromises: Promise<void>[] = videodata.map((scene: any) => 
			slimit(() => fetchAndResizeImage(
				`${STASH_URL}/scene/${scene.id}/screenshot`, 
				`${VAR_SCREENSHOT_DIR}/${scene.id}.jpg`,
				maxRes
			))
		)

		// Wait for all promises to resolve
		await Promise.all(scenePromises);
		// Wait for all the screenshots to be done
		await Promise.all(screenshotPromises);

		const scanidx: HeresphereScanIndex = {
			scanData: scenes
		}
		console.debug("write hsp scan");
		await writeFile(SCANDB, JSON.stringify( scanidx ));
	} else {
		console.debug("skipping hsp scan");
	}
	
	if (first) {
		setInterval(() => { genScanDB(false) }, Number(VAR_SCANCACHE_AGE))
	}
}

app.get("/heresphere/video/:sceneId/screenshot", async (req: Request, res: Response) => {
	const sceneId = Number(req.params.sceneId)

	await slimit(() => fetchAndResizeImage(
		`${STASH_URL}/scene/${sceneId}/screenshot`, 
		`${VAR_SCREENSHOT_DIR}/${sceneId}.jpg`,
		maxRes
	))

	// Read the image file
	const imagePath = `${VAR_SCREENSHOT_DIR}/${sceneId}.jpg`;
	// TODO: Error if not exists
	const image = fs.readFileSync(imagePath);

	// Set content type to image/jpeg or image/png based on your image
	res.contentType('image/jpeg'); // Adjust content type based on your image type

	// Return the image as a response
	res.send(image);
});
app.get("/heresphere/video/:sceneId/event", async (req: Request, res: Response) => {
	res.json({message: "event"})
});

app.get("/", async (req: Request, res: Response) => {
	res.json({message: "the end is never the end"})
});

// TODO: Health endpoint

app.listen(port, SERVICE_IP, () => {
	// TODO: Set VR_TAG from vars with stash ui config
	ensureDirectoryExists(VAR_SCREENSHOT_DIR);
	ensureDirectoryExists(VAR_CACHE_DIR);

	console.log(`Example app listening at http://${SERVICE_IP}:${port}`);
	console.log(`Generating scan.json in 10 seconds`);

	setTimeout(() => { genScanDB(true) }, 10000);
});
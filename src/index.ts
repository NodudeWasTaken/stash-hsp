import { ApolloClient, InMemoryCache  } from '@apollo/client';
import { FIND_SAVED_FILTERS_QUERY, FIND_SCENES_QUERY, CONFIG_QUERY, FIND_SCENES_SLIM_QUERY, FIND_SCENE_QUERY } from "./queries/query"
import { CriterionFixer } from './criterion_fix';
import { HeresphereBanner, HeresphereIndex, HeresphereIndexEntry, HeresphereLensLinear, HeresphereMember, HeresphereProjectionPerspective, HeresphereStereoMono, HeresphereVideoEntry } from './heresphere_structs';
import express, { Express, Request, Response } from "express";

const app: Express = express();
const port = process.env.PORT || 3001;
app.use(express.json());
app.use(
	express.urlencoded({
		extended: true,
	})
);

const STASH_URL = "http://192.168.1.200:9990"
const client = new ApolloClient({
	uri: `${STASH_URL}/graphql`,
	cache: new InMemoryCache(),
});

function getbaseurl(req: Request) {
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

app.get("/heresphere", async (req: Request, res: Response) => {
	try {
		const baseurl = getbaseurl(req);
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
				console.log(find_filter);
				console.log("Default");
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
					console.log(find_filter);
					console.log(defaultfilter.name);
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
				console.log(filt);

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
							list: findscenes.data.findScenes.scenes.map((scene: any) => `${baseurl}/heresphere/${scene.id}`)
						};
						library.library.push(entry);
					}).catch((error) => {
						console.error(`Error fetching scenes for filter ${filt.name}:`, error);
					})
				);
			}

			// Wait for all promises to resolve
			await Promise.all(fetchPromises);
		}
		
		{
			const fetchPromises: Promise<void>[] = [];

			// TODO: Generate thumbnails
			// maybe https://github.com/lovell/sharp

			await Promise.all(fetchPromises);
		}

		res.json(library);
	} catch (error) {
		console.error(error)
		res.json(error);
	}
});

app.get("/heresphere/:sceneId", async (req: Request, res: Response) => {
	try {
		const sceneId = req.params.sceneId

		const sceneData = await client.query({
			query: FIND_SCENE_QUERY,
			variables: {
				id: sceneId,
			}
		});

		// TODO: Fill HeresphereVideoEntry
		const baseurl = getbaseurl(req)
		var processed: HeresphereVideoEntry = {
			access: HeresphereMember,
			title: sceneData.data.title, // or filename
			description: sceneData.data.details,
			thumbnailImage: `${baseurl}/heresphere/${sceneId}/screenshot`,
			thumbnailVideo: `${STASH_URL}/scene/${sceneId}/preview`,
			dateAdded: "2006-01-02",
			duration: 0,
			rating: 0,
			favorites: 0,
			isFavorite: false,
			projection: HeresphereProjectionPerspective,
			stereo: HeresphereStereoMono,
			isEyeSwapped: false,
			fov: 180,
			lens: HeresphereLensLinear,
			cameraIPD: 6.5,
			eventServer: `${baseurl}/heresphere/${sceneId}/event`,
			scripts: [],
			subtitles: [],
			tags: [],
			media: [],
			writeFavorite: false,
			writeRating: false,
			writeTags: false,
			writeHSP: false,
		}
		// TODO: HeresphereAuthReq

		console.log(processed)

		res.json(sceneData.data.findScene);
	} catch (error) {
		console.error(error)
		res.json(error);
	}
});

app.get("/", async (req: Request, res: Response) => {
	res.json({message: "Hello!"})
});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});
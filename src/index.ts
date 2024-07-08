import { ApolloClient, InMemoryCache  } from '@apollo/client';
import { FIND_SAVED_FILTERS_QUERY, FIND_SCENES_QUERY, CONFIG_QUERY } from "./queries/query"
import { CriterionFixer } from './criterion_fix';
import { HeresphereBanner, HeresphereIndex, HeresphereIndexEntry, HeresphereMember } from './heresphere_structs';
import express, { Express, Request, Response } from "express";

const app: Express = express();
const port = process.env.PORT || 3001;
app.use(express.json());
app.use(
	express.urlencoded({
		extended: true,
	})
);

const client = new ApolloClient({
	uri: 'http://192.168.1.200:9990/graphql',
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
			for (let filt of allfilters) {
				console.log(filt);
				const findscenes = await client.query({
					query: FIND_SCENES_QUERY,
					variables: {
						filter: filt.find_filter, // find_filter
						scene_filter: filt.object_filter // object_filter
					},
				});
	
				const entry: HeresphereIndexEntry = {
					name: filt.name,
					list: []
				}
				for (let scene of findscenes.data.findScenes.scenes) {
					entry.list.push(`${baseurl}/heresphere/${scene.id}`)
				}
				library.library.push(entry)	
			}
		}

		res.json(library);
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
import express, { Express, Request, Response } from "express";
import { getBaseURL } from "../utilities";
import { HeresphereBanner, HeresphereIndex, HeresphereIndexEntry, HeresphereMember } from "../heresphere_structs";
import { client } from "../client";
import { CONFIG_QUERY, FIND_SAVED_FILTERS_QUERY, FIND_SCENES_SLIM_QUERY } from "../queries/query";
import { CriterionFixer } from "../criterion_fix";
import { HspRequest } from "../authmiddleware";

const hspIndexHandler = async (req: HspRequest, res: Response) => {
	try {
		const baseurl = getBaseURL(req);
		const banner: HeresphereBanner = {
			image: `${baseurl}/apple-touch-icon.png`, // TODO: .
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
				const aname = a.name.toLowerCase()
				const bname = b.name.toLowerCase()

				if (aname < bname) {
					return -1;
				}
				if (aname > bname) {
					return 1;
				}
				return 0;
			});
		}
		
		res.json(library);
	} catch (error) {
		console.error(error)
		res.status(500).json(error);
	}
};

export function hspIndexRoutes(app: Express) {
	app.get("/heresphere", hspIndexHandler);
	app.post("/heresphere", hspIndexHandler);
}
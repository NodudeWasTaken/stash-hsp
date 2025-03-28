import { Express, Request, Response } from "express"
import { client } from "../core/client"
import {
	DEBUG_MODE,
	VAR_GET_FILTERS,
	VAR_GET_RECOMMENDED,
	VAR_GROUPS,
	VAR_UICFG,
} from "../core/vars"
import {
	FindFilterType,
	Query,
	SavedFilter,
	SceneFilterType,
	SortDirectionEnum,
} from "../gql/graphql"
import { FIND_GROUPS_VARS } from "../queries/FindGroupsQuery"
import { FIND_GROUPS_SLIM_QUERY } from "../queries/FindGroupsSlimQuery"
import {
	FIND_SAVED_FILTERS_QUERY,
	FIND_SAVED_FILTERS_VARS,
} from "../queries/FindSavedFiltersQuery"
import { FIND_SCENES_VARS } from "../queries/FindScenesQuery"
import { FIND_SCENES_SLIM_QUERY } from "../queries/FindScenesSlimQuery"
import {
	HeresphereBanner,
	HeresphereIndex,
	HeresphereIndexEntry,
	HeresphereMember,
} from "../structs/heresphere_structs"
import { CriterionFixer } from "../utils/criterion_fix"
import { generateRecommendedFilter } from "../utils/find_fav"
import { checkForErrors, getBaseURL } from "../utils/utilities"
import { groupPath } from "./hspgroup"
import { videoPath } from "./hspscene"

const hspIndexHandler = async (req: Request, res: Response) => {
	try {
		const baseurl = getBaseURL(req)
		const banner: HeresphereBanner = {
			image: `${baseurl}/apple-touch-icon.png`,
			link: baseurl,
		}

		const library: HeresphereIndex = {
			access: HeresphereMember,
			banner: banner,
			library: [],
		}

		let allfilters: SavedFilter[] = []

		if (VAR_GET_FILTERS) {
			const queryResult = await client.query<Query>({
				query: FIND_SAVED_FILTERS_QUERY,
				variables: {
					mode: "SCENES",
				} as FIND_SAVED_FILTERS_VARS,
			})
			checkForErrors(queryResult.errors)

			const defaultfilter: SavedFilter = {
				...VAR_UICFG.ui.defaultFilters.scenes,
			}
			defaultfilter.name = "Default"

			let myfilters = [defaultfilter, ...queryResult.data.findSavedFilters]

			// TODO BUG: Cached too long
			for (let afilter of myfilters) {
				const object_filter: SceneFilterType = CriterionFixer(
					afilter.object_filter
				)
				const find_filter: FindFilterType = { ...afilter.find_filter } // Read-only fix
				find_filter.per_page = -1

				if (DEBUG_MODE) {
					//console.debug(find_filter)
					console.debug(afilter.name)
				}

				allfilters.push({
					name: afilter.name,
					find_filter: find_filter,
					object_filter: object_filter,
				} as SavedFilter)
			}
		} else {
			allfilters.push({
				name: "No rules",
				find_filter: {
					direction: SortDirectionEnum.Desc,
					per_page: -1,
					sort: "created_at",
				},
			} as SavedFilter)
		}

		if (VAR_GET_RECOMMENDED) {
			try {
				allfilters.push(await generateRecommendedFilter())
			} catch (error) {
				console.error("Couldn't find recommended", error)
			}
		}

		if (VAR_GROUPS) {
			const entry: HeresphereIndexEntry = {
				name: `Groups`,
				list: [],
			}

			client
				.query<Query>({
					query: FIND_GROUPS_SLIM_QUERY,
					variables: {
						filter: { per_page: -1 } as FindFilterType,
					} as FIND_GROUPS_VARS,
				})
				.then((groups) => {
					groups.data.findGroups.groups
						.filter((g) => g.scene_count > 0)
						.forEach((group) => {
							entry.list.push(`${baseurl}${groupPath}/${group.id}`)
						})
				})

			library.library.push(entry)
		}

		{
			const fetchPromises: Promise<void>[] = []
			for (let filt of allfilters) {
				//console.debug(filt)

				// Push each query promise into the array without awaiting them
				fetchPromises.push(
					client
						.query<Query>({
							query: FIND_SCENES_SLIM_QUERY,
							variables: {
								filter: filt.find_filter,
								scene_filter: filt.object_filter,
							} as FIND_SCENES_VARS,
						})
						.then((findscenes) => {
							const entry: HeresphereIndexEntry = {
								name: filt.name,
								list: findscenes.data.findScenes.scenes.map(
									(scene) => `${baseurl}${videoPath}/${scene.id}`
								),
							}
							library.library.push(entry)
						})
						.catch((error) => {
							console.error(
								`Error fetching scenes for filter ${filt.name}:`,
								error
							)
						})
				)
			}

			// Wait for all promises to resolve
			await Promise.all(fetchPromises)

			library.library.sort((a, b) => {
				const aname = a.name.toLowerCase()
				const bname = b.name.toLowerCase()

				if (aname < bname) {
					return -1
				}
				if (aname > bname) {
					return 1
				}
				return 0
			})
		}

		res.json(library)
	} catch (err) {
		console.error(err)
		res.status(500).send({ error: (err as Error).message })
	}
}

export const hspIndexPath = "/heresphere"
export function hspIndexRoutes(app: Express) {
	app.get(hspIndexPath, hspIndexHandler)
	app.post(hspIndexPath, hspIndexHandler)
}

import { Express, Request, Response } from "express"
import { client } from "../core/client"
import { Query } from "../gql/graphql"
import { CONFIG_QUERY } from "../queries/ConfigurationQuery"
import { FIND_SAVED_FILTERS_QUERY } from "../queries/FindSavedFiltersQuery"
import { FIND_SCENE_QUERY } from "../queries/FindSceneQuery"
import { FIND_SCENES_QUERY } from "../queries/FindScenesQuery"
import { CriterionFixer } from "../utils/criterion_fix"

const debugFindFiltersHandler = async (req: Request, res: Response) => {
	const result = await client.query<Query>({
		query: FIND_SAVED_FILTERS_QUERY,
		variables: {
			mode: "SCENES",
		},
	})

	res.json(result)
}

const debugFindDefScenesHandler = async (req: Request, res: Response) => {
	try {
		const uiconfig = await client.query<Query>({
			query: CONFIG_QUERY,
		})

		const defaultfilter = uiconfig.data.configuration.ui.defaultFilters.scenes

		var find_filter = defaultfilter.find_filter
		var object_filter = defaultfilter.object_filter
		object_filter = CriterionFixer(object_filter)

		const findscenes = await client.query<Query>({
			query: FIND_SCENES_QUERY,
			variables: {
				filter: find_filter, // find_filter
				scene_filter: object_filter, // object_filter
			},
		})

		res.json(findscenes)
	} catch (error) {
		console.error(error)
		res.status(500).json(error)
	}
}

const debugFindSceneHandler = async (req: Request, res: Response) => {
	try {
		const { sceneId } = req.params

		const sceneData = await client.query<Query>({
			query: FIND_SCENE_QUERY,
			variables: {
				id: sceneId,
			},
		})

		res.json(sceneData.data.findScene)
	} catch (error) {
		console.error(error)
		res.status(500).json(error)
	}
}

export function debugRoutes(app: Express) {
	app.get("/debug/findfilters", debugFindFiltersHandler)
	app.get("/debug/finddefscenes", debugFindDefScenesHandler)
	app.get("/debug/findscene/:sceneId", debugFindSceneHandler)
}

import express, { Express, Response } from "express"
import { client } from "../client"
import {
	CONFIG_QUERY,
	FIND_SAVED_FILTERS_QUERY,
	FIND_SCENE_QUERY,
	FIND_SCENES_QUERY,
} from "../queries/query"
import { CriterionFixer } from "../criterion_fix"
import { HspRequest } from "../authmiddleware"

const debugFindFiltersHandler = async (req: HspRequest, res: Response) => {
	const result = await client.query({
		query: FIND_SAVED_FILTERS_QUERY,
		variables: {
			mode: "SCENES",
		},
	})

	res.json(result)
}

const debugFindDefScenesHandler = async (req: HspRequest, res: Response) => {
	try {
		const uiconfig = await client.query({
			query: CONFIG_QUERY,
		})

		const defaultfilter = uiconfig.data.configuration.ui.defaultFilters.scenes

		var find_filter = defaultfilter.find_filter
		var object_filter = defaultfilter.object_filter
		object_filter = CriterionFixer(object_filter)

		const findscenes = await client.query({
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

const debugFindSceneHandler = async (req: HspRequest, res: Response) => {
	try {
		const sceneId = req.params.sceneId

		const sceneData = await client.query({
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

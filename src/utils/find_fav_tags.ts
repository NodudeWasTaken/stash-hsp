import { fetcher } from "../core/client"
import {
	STASH_URL,
	VAR_FAV_LIMITTAGS,
	VAR_FAV_MINRATING,
	VAR_FAV_MINSCENES,
} from "../core/vars"
import {
	CriterionModifier,
	FilterMode,
	FindFilterType,
	SavedFilter,
	SceneFilterType,
} from "../gql/graphql"
import { randomizeList } from "./utilities"

const tagsQuerySQL = `
SELECT 
    tags.id,
    AVG(scenes.rating) AS average_rating,
    COUNT(scenes.id) AS num_scenes
FROM 
    tags
JOIN 
    scenes_tags ON tags.id = scenes_tags.tag_id
JOIN 
    scenes ON scenes_tags.scene_id = scenes.id
WHERE 
    scenes.rating IS NOT NULL
GROUP BY 
    tags.id
HAVING 
    AVG(scenes.rating) > ? AND COUNT(scenes.id) >= ?
ORDER BY 
    average_rating DESC;
`.replaceAll("\n", " ")

const performersQuerySQL = `
SELECT 
    performers.id,
    AVG(scenes.rating) AS average_rating,
    COUNT(scenes.id) AS num_scenes
FROM 
    performers
JOIN 
    performers_scenes ON performers.id = performers_scenes.performer_id
JOIN 
    scenes ON performers_scenes.scene_id = scenes.id
WHERE 
    scenes.rating IS NOT NULL
GROUP BY 
    performers.id
HAVING 
    AVG(scenes.rating) > ? AND COUNT(scenes.id) >= ?
ORDER BY 
    average_rating DESC;
`.replaceAll("\n", " ")

const studiosQuerySQL = `
SELECT 
    studios.id,
    AVG(scenes.rating) AS average_rating,
    COUNT(scenes.id) AS num_scenes
FROM 
    studios
JOIN 
    scenes ON studios.id = scenes.studio_id
WHERE 
    scenes.rating IS NOT NULL
GROUP BY 
    studios.id
HAVING 
    AVG(scenes.rating) > ? AND COUNT(scenes.id) >= ?
ORDER BY 
    average_rating DESC;
`.replaceAll("\n", " ")

const queryGQL = `
mutation {
  querySQL(
    sql: "$SQL", 
    args: $VARS
  ) {
    rows
  }
}`

export async function findFavAux(
	SQL: string = "",
	minScenes: number = 5,
	avgRatingThreshold: number = 0
): Promise<[number[]] | undefined> {
	try {
		// TODO BUG: I tried using ApolloClient and couldn't make it work
		const response = await fetcher(`${STASH_URL}/graphql`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query: queryGQL
					.replace("$VARS", JSON.stringify([avgRatingThreshold, minScenes]))
					.replace("$SQL", tagsQuerySQL),
				variables: null,
			}),
		})

		const data = await response.json()
		return data.data.querySQL.rows
	} catch (error) {
		console.error(error)
	}

	return undefined
}

export async function findFavTags(
	minScenes: number = 5,
	avgRatingThreshold: number = 0
): Promise<[number[]] | undefined> {
	return findFavAux(tagsQuerySQL, minScenes, avgRatingThreshold)
}

export async function findFavPerformers(
	minScenes: number = 5,
	avgRatingThreshold: number = 0
): Promise<[number[]] | undefined> {
	return findFavAux(performersQuerySQL, minScenes, avgRatingThreshold)
}

export async function findFavStudios(
	minScenes: number = 5,
	avgRatingThreshold: number = 0
): Promise<[number[]] | undefined> {
	return findFavAux(studiosQuerySQL, minScenes, avgRatingThreshold)
}

export async function generateRecommendedFilter() {
	const find_filter: FindFilterType = {
		per_page: -1,
		sort: "random_65770034",
	}

	const MINSCENES = Number(VAR_FAV_MINSCENES)
	const MINRATING = Number(VAR_FAV_MINRATING)
	const NUMLIM = Number(VAR_FAV_LIMITTAGS)
	const numToAdd = Math.floor(NUMLIM * 0.2)

	var tagsToFind: string[]
	{
		let favTags = await findFavTags(MINSCENES, MINRATING)
		if (!favTags) {
			throw new Error("Cant find favorite tags")
		}

		let req: string[] = favTags.map((i) => (i[0] || 0).toString())

		tagsToFind = req.slice(0, NUMLIM)
		tagsToFind.push(...randomizeList(req).slice(0, numToAdd))
	}

	var performersToFind: string[]
	{
		let favPerf = await findFavPerformers(MINSCENES, MINRATING)
		if (!favPerf) {
			throw new Error("Cant find favorite performers")
		}

		let req: string[] = favPerf.map((i) => (i[0] || 0).toString())

		performersToFind = req.slice(0, NUMLIM)
		performersToFind.push(...randomizeList(req).slice(0, numToAdd))
	}

	var studiosToFind: string[]
	{
		let favStudios = await findFavStudios(MINSCENES, MINRATING)
		if (!favStudios) {
			throw new Error("Cant find favorite tags")
		}

		let req: string[] = favStudios.map((i) => (i[0] || 0).toString())

		studiosToFind = req.slice(0, NUMLIM)
		studiosToFind.push(...randomizeList(req).slice(0, numToAdd))
	}

	const object_filter: SceneFilterType = {
		tags: {
			modifier: CriterionModifier.Includes,
			value: tagsToFind,
		},
		OR: {
			performers: {
				modifier: CriterionModifier.Includes,
				value: performersToFind,
			},
			OR: {
				studios: {
					modifier: CriterionModifier.Includes,
					value: studiosToFind,
				},
			},
		},
	}

	const recommendedFilter: SavedFilter = {
		name: "Recommended",
		find_filter: find_filter,
		object_filter: object_filter,
		filter: "",
		id: "",
		mode: FilterMode.Scenes,
	}

	return recommendedFilter
}

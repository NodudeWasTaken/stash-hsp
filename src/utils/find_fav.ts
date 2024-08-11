import { gql } from "@apollo/client/core"
import { client } from "../core/client"
import {
	VAR_FAV_LIMITTAGS,
	VAR_FAV_MINRATING,
	VAR_FAV_MINSCENES,
	VAR_FAVBOOST,
} from "../core/vars"
import {
	CriterionModifier,
	FilterMode,
	FindFilterType,
	Mutation,
	MutationQuerySqlArgs,
	SavedFilter,
	SceneFilterType,
} from "../gql/graphql"
import { fixSqlReturn, randomizeList, randomUInt } from "./utilities"

function niceifySql(str: string): string {
	return str.replaceAll("\n", " ").replace(/^\s+|\s+$|(\s)+/g, "$1")
}

const tagsQuerySQL = niceifySql(`
SELECT 
    tags.id,
    tags.name,
    AVG(CASE when tags.favorite = 1 then scenes.rating + ${VAR_FAVBOOST} else scenes.rating end) AS average_rating,
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
`)

const performersQuerySQL = niceifySql(`
SELECT 
    performers.id,
    performers.name,
    AVG(CASE when performers.favorite = 1 then scenes.rating + ${VAR_FAVBOOST} else scenes.rating end) AS average_rating,
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
`)

const studiosQuerySQL = niceifySql(`
SELECT 
    studios.id,
    studios.name,
    AVG(CASE when studios.favorite = 1 then scenes.rating + ${VAR_FAVBOOST} else scenes.rating end) AS average_rating,
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
`)

const QUERY_SQL = gql`
	mutation QuerySQL($sql: String!, $args: [Any]) {
		querySQL(sql: $sql, args: $args) {
			columns
			rows
		}
	}
`

type FavoritesList = {
	id: number
	name: string
	average_rating: 100
	num_scenes: number
}[]
export async function findFavAux(
	SQL: string = "",
	minScenes: number = 5,
	avgRatingThreshold: number = 0
): Promise<FavoritesList | undefined> {
	try {
		// Note: We use SQL because doing this in graphql is VERY slow
		// using GQL /debug/findfav"  0,01s user 0,00s system 0% cpu 4,349 total
		// using SQL /debug/findfav"  0,01s user 0,00s system 2% cpu 0,238 total
		const mutationResult = await client.mutate<Mutation>({
			mutation: QUERY_SQL,
			variables: {
				sql: SQL.replace("?", avgRatingThreshold.toString()).replace(
					"?",
					minScenes.toString()
				),
				// TODO BUG: Cant get args to work
			} as MutationQuerySqlArgs,
		})

		return fixSqlReturn(mutationResult.data?.querySQL!) as FavoritesList
	} catch (error) {
		console.error(error)
	}

	return undefined
}

export async function findFavTags(
	minScenes: number = 5,
	avgRatingThreshold: number = 0
): Promise<FavoritesList | undefined> {
	return findFavAux(tagsQuerySQL, minScenes, avgRatingThreshold)
}

export async function findFavPerformers(
	minScenes: number = 5,
	avgRatingThreshold: number = 0
): Promise<FavoritesList | undefined> {
	return findFavAux(performersQuerySQL, minScenes, avgRatingThreshold)
}

export async function findFavStudios(
	minScenes: number = 5,
	avgRatingThreshold: number = 0
): Promise<FavoritesList | undefined> {
	return findFavAux(studiosQuerySQL, minScenes, avgRatingThreshold)
}

export async function generateRecommendedFilter() {
	const find_filter: FindFilterType = {
		per_page: -1,
		sort: `random_${randomUInt()}`,
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

		let req: string[] = favTags.map((obj) => obj.id.toString())

		tagsToFind = req.slice(0, NUMLIM)
		tagsToFind.push(...randomizeList(req.slice(NUMLIM)).slice(0, numToAdd))
	}

	var performersToFind: string[]
	{
		let favPerf = await findFavPerformers(MINSCENES, MINRATING)
		if (!favPerf) {
			throw new Error("Cant find favorite performers")
		}

		let req: string[] = favPerf.map((obj) => obj.id.toString())

		performersToFind = req.slice(0, NUMLIM)
		performersToFind.push(
			...randomizeList(req.slice(NUMLIM)).slice(0, numToAdd)
		)
	}

	var studiosToFind: string[]
	{
		let favStudios = await findFavStudios(MINSCENES, MINRATING)
		if (!favStudios) {
			throw new Error("Cant find favorite tags")
		}

		let req: string[] = favStudios.map((obj) => obj.id.toString())

		studiosToFind = req.slice(0, NUMLIM)
		studiosToFind.push(...randomizeList(req.slice(NUMLIM)).slice(0, numToAdd))
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

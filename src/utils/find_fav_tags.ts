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

const querySQL = `
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

const queryGQL = `
mutation {
  querySQL(
    sql: "${querySQL}", 
    args: $VARS
  ) {
    rows
  }
}`

export async function findFavTags(
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
				query: queryGQL.replace(
					"$VARS",
					JSON.stringify([avgRatingThreshold, minScenes])
				),
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

export async function generateRecommendedFilter() {
	const find_filter: FindFilterType = {
		per_page: -1,
		sort: "random_65770034",
	}

	const favTags = await findFavTags(
		Number(VAR_FAV_MINSCENES),
		Number(VAR_FAV_MINRATING)
	)
	if (!favTags) {
		throw new Error("Cant find favorite tags")
	}

	const itemsToFind: string[] = favTags // @ts-ignore
		.map((i) => i[0].toString())
		.slice(0, Number(VAR_FAV_LIMITTAGS))

	const object_filter: SceneFilterType = {
		tags: {
			modifier: CriterionModifier.Includes,
			value: itemsToFind,
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

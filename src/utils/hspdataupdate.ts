import { client } from "../core/client"
import { SceneUpdateInput, Tag } from "../gql/graphql"
import { FIND_TAGS_QUERY, SCENE_UPDATE_MUTATION } from "../queries/query"
import { writeHSPFile } from "../routes/hspfile"
import { HeresphereAuthReq } from "../structs/heresphere_structs"

export const hspDataUpdate = async (
	sceneId: string,
	authreq: HeresphereAuthReq
) => {
	var input: SceneUpdateInput = {
		id: sceneId,
	}

	if (authreq.rating) {
		// TODO: Set null on remove
		input.rating100 = authreq.rating * 20
	}
	if (authreq.isFavorite) {
		// TODO: VAR_FAVORITE_TAG
		console.debug("dataUpdate: isFavorite")
	}
	if (authreq.tags) {
		// For straight tags
		{
			// Find tags from heresphere in stash
			const tagsToFind = authreq.tags
				.filter((tag) => tag.name.startsWith("Tag:"))
				.map((tag) => tag.name.slice("Tag:".length))

			// If any were found
			if (tagsToFind) {
				// Filter creation
				const orFilter = tagsToFind.reduceRight((acc: any, tag: any) => {
					const nameFilter = { value: tag, modifier: "EQUALS" }
					return acc ? { name: nameFilter, OR: acc } : { name: nameFilter }
				}, null)

				// Query
				const {
					data: {
						findTags: { tags: tagData },
					},
				} = (await client.query({
					query: FIND_TAGS_QUERY,
					variables: {
						filter: {
							per_page: -1,
						},
						tag_filter: orFilter,
					},
				})) as { data: { findTags: { tags: Tag[] } } }

				// All found tags are set as the new tags
				console.log(
					"tagUpdate",
					tagData.map((t) => t.id)
				)
				input.tag_ids = tagData.map((t) => t.id)
			}
		}
		// TODO: Performers and other vars
		// PlayCount, OCounter etc.
	}
	if (authreq.hspBase64) {
		await writeHSPFile(sceneId, authreq.hspBase64)
	}

	if (Object.keys(input).length > 1) {
		console.debug("dataUpdate:", input)
		await client.mutate({
			mutation: SCENE_UPDATE_MUTATION,
			variables: {
				input: input,
			},
		})
	}
}

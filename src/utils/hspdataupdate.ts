import { client } from "../core/client"
import { VAR_FAVORITE_TAG } from "../core/vars"
import { Maybe, Mutation, Query, Scene, SceneUpdateInput } from "../gql/graphql"
import { FIND_TAGS_QUERY } from "../queries/FindTagsQuery"
import { SCENE_UPDATE_MUTATION } from "../queries/SceneUpdateMutation"
import { writeHSPFile } from "../routes/hspfile"
import {
	HeresphereAuthReq,
	HeresphereVideoEntry,
	HeresphereVideoEntryShort,
	HeresphereVideoTag,
} from "../structs/heresphere_structs"
import { getBasename } from "./utilities"

export const hspDataUpdate = async (
	sceneId: string,
	authreq: HeresphereAuthReq
): Promise<Maybe<Scene> | undefined> => {
	var input: SceneUpdateInput = {
		id: sceneId,
	}

	if (authreq.rating) {
		// TODO: Set null on remove
		input.rating100 = authreq.rating * 20
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
				const queryResult = await client.query<Query>({
					query: FIND_TAGS_QUERY,
					variables: {
						filter: {
							per_page: -1,
						},
						tag_filter: orFilter,
					},
				})
				var tagData = queryResult.data.findTags.tags

				if (authreq.isFavorite && VAR_FAVORITE_TAG) {
					// TODO: .
				}

				// All found tags are set as the new tags
				console.log(
					"tagUpdate",
					tagData.map((t) => t.id)
				)
				input.tag_ids = tagData.map((t) => t.id)
			}
		}
		// TODO: Performers and other vars (see fillTags)
		// PlayCount, OCounter etc.
		// Markers
	} else if (authreq.isFavorite && VAR_FAVORITE_TAG) {
		// TODO: .
		console.debug("dataUpdate: isFavorite")
	}

	if (authreq.hspBase64) {
		await writeHSPFile(sceneId, authreq.hspBase64)
	}

	if (Object.keys(input).length > 1) {
		console.debug("dataUpdate:", input)
		const queryResult = await client.mutate<Mutation>({
			mutation: SCENE_UPDATE_MUTATION,
			variables: {
				input: input,
			},
		})

		return queryResult.data?.sceneUpdate
	}
}

export function fillTags(
	scene: Scene,
	processed: HeresphereVideoEntry | HeresphereVideoEntryShort
) {
	processed.tags = []
	for (let tag of scene.tags) {
		processed.tags.push({
			name: `Tag:${tag.name}`,
		} as HeresphereVideoTag)
	}

	processed.tags.push({
		name: `Interactive:${scene.interactive}`,
	} as HeresphereVideoTag)

	if (scene.interactive_speed) {
		processed.tags.push({
			name: `Funspeed:${scene.interactive_speed}`,
		} as HeresphereVideoTag)
	}

	if (scene.scene_markers) {
		for (let tag of scene.scene_markers) {
			const tagName = tag.primary_tag.name

			processed.tags.push({
				name: `Marker:${tagName}`,
				start: tag.seconds * 1000,
				end: (tag.seconds + 60) * 1000,
			} as HeresphereVideoTag)
		}
	}

	if (scene.galleries) {
		for (let gallery of scene.galleries) {
			const galleryName =
				gallery.title?.length === 0
					? getBasename(gallery.folder?.path || "")
					: gallery.title

			processed.tags.push({
				name: `Gallery:${galleryName}`,
			} as HeresphereVideoTag)
		}
	}

	if (scene.studio) {
		processed.tags.push({
			name: `Studio:${scene.studio.name}`,
		} as HeresphereVideoTag)
	}

	if (scene.groups) {
		for (let group of scene.groups) {
			processed.tags.push({
				name: `Group:${group.group.name}`,
			} as HeresphereVideoTag)
		}
	}

	if (scene.performers) {
		var hasFavoritedPerformer: boolean = false
		for (let perf of scene.performers) {
			processed.tags.push({
				name: `Performer:${perf.name}`,
			} as HeresphereVideoTag)
			hasFavoritedPerformer = hasFavoritedPerformer || perf.favorite
		}
		processed.tags.push({
			name: `HasFavoritedPerformer:${hasFavoritedPerformer}`,
		} as HeresphereVideoTag)
	}

	processed.tags.push({
		name: `OCount:${scene.o_counter}`,
	} as HeresphereVideoTag)
	processed.tags.push({
		name: `Orgasmed:${scene.o_counter || 0 > 0}`,
	} as HeresphereVideoTag)

	processed.tags.push({
		name: `PlayCount:${scene.play_count}`,
	} as HeresphereVideoTag)
	processed.tags.push({
		name: `Watched:${scene.play_count || 0 > 0}`,
	} as HeresphereVideoTag)

	processed.tags.push({
		name: `Rating:${scene.rating100}`,
	} as HeresphereVideoTag)
	processed.tags.push({
		name: `Rated:${scene.rating100 !== null}`,
	} as HeresphereVideoTag)
	processed.tags.push({
		name: `Organized:${scene.organized}`,
	} as HeresphereVideoTag)
	processed.tags.push({
		name: `Director:${scene.director}`,
	} as HeresphereVideoTag)
}

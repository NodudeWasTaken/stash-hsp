import { client } from "../core/client"
import { VAR_FAVTAG, VAR_MULTITRACK_MARKERS } from "../core/vars"
import {
	Mutation,
	Query,
	Scene,
	SceneMarker,
	SceneUpdateInput,
} from "../gql/graphql"
import { FIND_SCENE_QUERY } from "../queries/FindSceneQuery"
import { FIND_TAGS_QUERY } from "../queries/FindTagsQuery"
import { SCENE_UPDATE_MUTATION } from "../queries/SceneUpdateMutation"
import { writeHSPFile } from "../routes/hspfile"
import {
	HeresphereAuthReq,
	HeresphereVideoEntry,
	HeresphereVideoEntryShort,
	HeresphereVideoTag,
} from "../structs/heresphere_structs"
import { checkForErrors, getBasename } from "./utilities"

// Function to add or remove a favorite tag from input.tag_ids

/* TODO ERROR when isFavorite == false:
Cache data may be lost when replacing the tags field of a Scene object.

This could cause additional (usually avoidable) network requests to fetch data that were otherwise cached.

To address this problem (which is not a bug in Apollo Client), define a custom merge function for the Scene.tags field, so InMemoryCache can safely merge these objects:

For more information about these options, please refer to the documentation:

  * Ensuring entity objects have IDs: https://go.apollo.dev/c/generating-unique-identifiers
  * Defining custom merge functions: https://go.apollo.dev/c/merging-non-normalized-objects
*/
function manageFavoriteTag(
	input: SceneUpdateInput,
	authreq: HeresphereAuthReq
) {
	if (!VAR_FAVTAG) {
		throw new Error("VAR_FAVTAG is undefined")
	}

	// Find the index of VAR_FAVTAG.id in input.tag_ids
	const favTagIndex: number = input.tag_ids?.indexOf(VAR_FAVTAG.id) || -1

	if (authreq.isFavorite) {
		// Add favorite tag if not already present
		if (favTagIndex === -1) {
			input.tag_ids?.push(VAR_FAVTAG.id)
		}
	} else {
		// Remove favorite tag if present
		if (favTagIndex !== -1) {
			input.tag_ids?.splice(favTagIndex, 1)
		}
	}
}

export const hspDataUpdate = async (
	sceneId: string,
	authreq: HeresphereAuthReq
): Promise<Scene | undefined> => {
	// Initialize the input object with the sceneId
	let input: SceneUpdateInput = {
		id: sceneId,
	}

	// Handle rating update
	if (authreq.rating) {
		input.rating100 = authreq.rating * 20
	}

	// Handle tag updates
	if (authreq.tags) {
		// For straight tags
		{
			// Find tags from heresphere in stash
			const tagsToFind = authreq.tags
				.filter((tag) => tag.name.startsWith("Tag:"))
				.map((tag) => tag.name.slice("Tag:".length))

			// If any were found
			if (tagsToFind) {
				// Construct the filter for the tags
				const orFilter = tagsToFind.reduceRight((acc: any, tag: any) => {
					const nameFilter = { value: tag, modifier: "EQUALS" }
					return acc ? { name: nameFilter, OR: acc } : { name: nameFilter }
				}, null)

				// Query to find tags in stash
				const queryResult = await client.query<Query>({
					query: FIND_TAGS_QUERY,
					variables: {
						filter: {
							per_page: -1,
						},
						tag_filter: orFilter,
					},
				})
				checkForErrors(queryResult.errors)

				// Set the tag_ids in the input
				input.tag_ids = queryResult.data.findTags.tags.map((t) => t.id)

				// Add or remove favorite tag if applicable
				manageFavoriteTag(input, authreq)
			}
		}

		// TODO: Performers and other vars (see fillTags)
		// PlayCount, OCounter etc.
		// Markers
	} else if (authreq.isFavorite !== undefined && VAR_FAVTAG !== undefined) {
		// Query to find the scene if tags are not provided but favorite flag is set
		const queryResult = await client.query<Query>({
			query: FIND_SCENE_QUERY,
			variables: {
				id: sceneId,
			},
		})
		checkForErrors(queryResult.errors)

		// Throw error if scene is not found
		if (!queryResult.data.findScene) {
			throw new Error("scene not found")
		}

		// Set the tag_ids in the input
		input.tag_ids = queryResult.data.findScene.tags.map((t) => t.id)

		// Add or remove favorite tag if applicable
		manageFavoriteTag(input, authreq)
	}

	// Handle HSP base64 data update
	if (authreq.hsp) {
		await writeHSPFile(sceneId, authreq.hsp)
	}

	// Update the scene if there are changes in the input
	if (Object.keys(input).length > 1) {
		console.debug("dataUpdate:", input)
		const mutationResult = await client.mutate<Mutation>({
			mutation: SCENE_UPDATE_MUTATION,
			variables: {
				input: input,
			},
		})
		checkForErrors(mutationResult.errors)

		return mutationResult.data?.sceneUpdate ?? undefined
	}

	return undefined
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
		let trackMapping: { [key: string]: number } = {}
		let currentTrack = -1000
		let nextMarker: SceneMarker | undefined

		// We sort by seconds to find the order
		// We add - to get reversed
		for (let mark of scene.scene_markers.toSorted((m) => -m.seconds)) {
			let tagName = mark.title

			if (tagName.length == 0) {
				tagName = mark.primary_tag.name
			} else {
				tagName = `${tagName} - ${mark.primary_tag.name}`
			}

			let trackNumber = currentTrack
			if (VAR_MULTITRACK_MARKERS) {
				// Assign a track number based on the primary tag name
				if (!(mark.primary_tag.name in trackMapping)) {
					trackMapping[mark.primary_tag.name] = currentTrack++
				}

				trackNumber = trackMapping[mark.primary_tag.name] || 0
			}

			let marker: HeresphereVideoTag = {
				name: `Marker:${tagName}`,
				start: mark.seconds * 1000,
				track: trackNumber,
			}
			if (nextMarker) {
				marker.end = nextMarker.seconds * 1000
			}
			processed.tags.push(marker)

			nextMarker = mark
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
		let hasFavoritedPerformer: boolean = false
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

	if (scene.director) {
		processed.tags.push({
			name: `Director:${scene.director}`,
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
}

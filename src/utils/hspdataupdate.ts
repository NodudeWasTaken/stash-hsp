import { DocumentNode } from "@apollo/client/core"
import { client } from "../core/client"
import { VAR_FAVTAG, VAR_MULTITRACK_MARKERS } from "../core/vars"
import {
	CriterionModifier,
	Mutation,
	Query,
	Scene,
	SceneMarker,
	SceneUpdateInput,
} from "../gql/graphql"
import { FIND_PERFORMERS_SLIM_QUERY } from "../queries/FindPerformersSlimQuery"
import {
	FIND_SCENEMARKERS_QUERY,
	FIND_SCENEMARKERS_VARS,
} from "../queries/FindSceneMarkersQuery"
import { FIND_SCENE_QUERY, FIND_SCENE_VARS } from "../queries/FindSceneQuery"
import { FIND_STUDIOS_SLIM_QUERY } from "../queries/FindStudiosSlimQuery"
import { FIND_TAGS_VARS } from "../queries/FindTagsQuery"
import { FIND_TAGS_SLIM_QUERY } from "../queries/FindTagsSlimQuery"
import {
	SCENE_MARKER_CREATE_MUTATION,
	SCENE_MARKER_CREATE_VARS,
} from "../queries/SceneMarkerCreateMutation"
import {
	SCENE_MARKER_DESTROY_MUTATION,
	SCENE_MARKER_DESTROY_VARS,
} from "../queries/SceneMarkerDestroyMutation"
import {
	SCENE_UPDATE_MUTATION,
	SCENE_UPDATE_VARS,
} from "../queries/SceneUpdateMutation"
import { writeHSPFile } from "../routes/hspfile"
import {
	HeresphereAuthReq,
	HeresphereVideoEntry,
	HeresphereVideoEntryShort,
	HeresphereVideoTag,
} from "../structs/heresphere_structs"
import { findBitrateLabel, findBitrateLevel } from "./bitrate_selector"
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

// Restrict myself from making mistakes
type FilterType =
	| "Tag"
	| "Performer"
	| "Studio"
	| "Director"
	| "PlayCount"
	| "OCount"
	| "Rating"
	| "Organized"
	| "Marker"

async function findIds(
	authreq: HeresphereAuthReq,
	filterType: FilterType,
	FIND_QUERY: DocumentNode
): Promise<Query | undefined> {
	if (!authreq.tags) {
		throw new Error("tags undefined")
	}

	// Find tags or performers from heresphere in stash
	const _fType = `${filterType}:`
	const itemsToFind = authreq.tags
		.filter((tag) => tag.name.startsWith(_fType))
		.map((tag) => tag.name.slice(_fType.length))

	// If any were found
	if (itemsToFind.length) {
		// Construct the filter for the tags or performers
		const orFilter = itemsToFind.reduceRight((acc: any, item: any) => {
			const nameFilter = { value: item, modifier: "EQUALS" }
			return acc ? { name: nameFilter, OR: acc } : { name: nameFilter }
		}, null)

		// Query to find tags or performers in stash
		const queryResult = await client.query<Query>({
			query: FIND_QUERY,
			variables: {
				filter: {
					per_page: -1,
				},
				[`${filterType.toLowerCase()}_filter`]: orFilter,
			},
		})
		checkForErrors(queryResult.errors)

		// Set the _ids in the input
		return queryResult.data
	}

	return undefined
}

function extractTags(
	tags: HeresphereVideoTag[],
	filterType: FilterType
): HeresphereVideoTag[] | undefined {
	const _fType = `${filterType}:`
	return tags
		.filter((tag) => tag.name.startsWith(_fType))
		.map(
			(tag) =>
				({
					...tag,
					name: tag.name.slice(_fType.length),
				}) as HeresphereVideoTag
		)
}

function extractTagName(
	tags: HeresphereVideoTag[],
	filterType: FilterType
): string | undefined {
	return extractTags(tags, filterType)
		?.map((t) => t.name)
		.pop()
}

function markerName(mark: SceneMarker) {
	// TODO: I dont know that heresphere allows duplicate names
	/*let tagName = mark.title

	if (tagName.length == 0) {
		tagName = mark.primary_tag.name
	} else {
		tagName = `${tagName} - ${mark.primary_tag.name}`
	}*/

	return mark.primary_tag.name
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
			const queryData = await findIds(authreq, "Tag", FIND_TAGS_SLIM_QUERY)
			if (queryData) {
				input.tag_ids = queryData.findTags.tags.map((t) => t.id)

				// Add or remove favorite tag if applicable
				manageFavoriteTag(input, authreq)
			}
		}

		{
			// Find performers from heresphere in stash
			const queryData = await findIds(
				authreq,
				"Performer",
				FIND_PERFORMERS_SLIM_QUERY
			)
			if (queryData) {
				input.performer_ids = queryData.findPerformers.performers.map(
					(t) => t.id
				)
			}
		}

		{
			// Find studios from heresphere in stash
			const queryData = await findIds(
				authreq,
				"Studio",
				FIND_STUDIOS_SLIM_QUERY
			)
			if (queryData && queryData.findStudios.studios[0]) {
				input.studio_id = queryData.findStudios.studios[0].id
			}
		}

		{
			// Find groups from heresphere in stash
			// TODO: Scene index???
			/*const queryData = await findIds(authreq, "Group", FIND_GROUPS_SLIM_QUERY)
			if (queryData) {
				input.groups = queryData.findPerformers.performers.map((t) => t.id)
			}*/
		}

		{
			const director = extractTagName(authreq.tags, "Director")
			if (director) {
				input.director = director
			}
		}

		{
			const playCount = extractTagName(authreq.tags, "PlayCount")
			if (playCount) {
				input.play_count = Number(playCount)
			}
		}

		{
			const oCount = extractTagName(authreq.tags, "OCount")
			if (oCount) {
				input.o_counter = Number(oCount)
			}
		}

		{
			const rating = extractTagName(authreq.tags, "Rating")
			if (rating) {
				input.rating100 = Number(rating)
			}
		}

		{
			const organized = extractTagName(authreq.tags, "Organized")
			if (organized) {
				input.organized = Boolean(organized)
			}
		}

		{
			const reqmarkers = extractTags(authreq.tags, "Marker")
			if (reqmarkers) {
				const queryResult = await client.query<Query>({
					query: FIND_SCENEMARKERS_QUERY,
					variables: {
						filter: {
							per_page: -1,
						},
						scene_marker_filter: {
							scene_filter: {
								id: {
									value: Number(sceneId),
									modifier: CriterionModifier.Equals,
								},
							},
						},
					} as FIND_SCENEMARKERS_VARS,
				})
				checkForErrors(queryResult.errors)

				const allmarkers = queryResult.data.findSceneMarkers.scene_markers
				let toremove = [...allmarkers]

				for (let marker of reqmarkers) {
					if (!marker.start) {
						console.error(`Marker without time ${JSON.stringify(marker)}!`)
						continue
					}

					const match = allmarkers.filter(
						(t) =>
							markerName(t) == marker.name &&
							marker.start &&
							Math.round(marker.start / 1000) == Math.round(t.seconds)
					)

					// Note unused
					{
						const _matches = match.map((_m) => _m.id)
						toremove = toremove.filter((m) => !_matches.includes(m.id))
					}

					// If not exists in DB, create
					if (!match[0]) {
						console.log(`Create marker: ${JSON.stringify(marker)}`)

						const queryResult = await client.query<Query>({
							query: FIND_TAGS_SLIM_QUERY,
							variables: {
								filter: {
									per_page: -1,
								},
								tag_filter: {
									name: {
										value: marker.name,
										modifier: CriterionModifier.Equals,
									},
								},
							} as FIND_TAGS_VARS,
						})
						checkForErrors(queryResult.errors)

						let tag = queryResult.data.findTags.tags[0]
						if (!tag) {
							console.error(`No tag found for ${JSON.stringify(marker)}!`)
							continue
						}

						const mutationResult = await client.mutate<Mutation>({
							mutation: SCENE_MARKER_CREATE_MUTATION,
							variables: {
								scene_id: sceneId,
								seconds: Math.round(marker.start / 1000),
								primary_tag_id: tag.id,
							} as SCENE_MARKER_CREATE_VARS,
						})
						checkForErrors(mutationResult.errors)
					} else {
						console.debug(`Keep marker: ${JSON.stringify(marker)}`)
					}
				}

				// If not exists in req, delete
				for (let marker of toremove) {
					console.log(`Remove marker: ${JSON.stringify(marker)}`)

					const mutationResult = await client.mutate<Mutation>({
						mutation: SCENE_MARKER_DESTROY_MUTATION,
						variables: {
							id: marker.id,
						} as SCENE_MARKER_DESTROY_VARS,
					})
					checkForErrors(mutationResult.errors)
				}
			}
		}
	} else if (authreq.isFavorite !== undefined && VAR_FAVTAG !== undefined) {
		// Query to find the scene if tags are not provided but favorite flag is set
		const queryResult = await client.query<Query>({
			query: FIND_SCENE_QUERY,
			variables: {
				id: sceneId,
			} as FIND_SCENE_VARS,
		})
		checkForErrors(queryResult.errors)
		const sceneData = queryResult.data.findScene

		// Throw error if scene is not found
		if (!sceneData) {
			throw new Error("scene not found")
		}

		// Set the tag_ids in the input
		input.tag_ids = sceneData.tags.map((t) => t.id)

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
			} as SCENE_UPDATE_VARS,
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

	if (scene.files[0]) {
		const q = findBitrateLevel(
			scene.files[0].height,
			scene.files[0].bit_rate / 1000.0,
			scene.files[0].frame_rate
		)
		const label: string = findBitrateLabel(q)!
		processed.tags.push({
			name: `Bitrate:${label}`,
		} as HeresphereVideoTag)
	}

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
			let tagName = markerName(mark)

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

import { Express, Response } from "express"
import { HspRequest } from "../authmiddleware"
import { client, StashApiKeyParameter } from "../client"
import {
	HeresphereAuthReq,
	HeresphereLensLinear,
	HeresphereMember,
	HeresphereProjectionPerspective,
	HeresphereStereoMono,
	HeresphereVideoEntry,
	HeresphereVideoEntryShort,
	HeresphereVideoMedia,
	HeresphereVideoMediaSource,
	HeresphereVideoScript,
	HeresphereVideoSubtitle,
	HeresphereVideoTag,
} from "../heresphere_structs"
import { FindProjectionTags } from "../projection"
import { FIND_SCENE_QUERY, SCENE_UPDATE_MUTATION } from "../queries/query"
import { buildUrl, formatDate, getBasename, getBaseURL } from "../utilities"
import { STASH_APIKEY } from "../vars"
import { eventPath } from "./hspevent"
import { screenshotPath } from "./hspscreenshot"

export function fillTags(
	scene: any,
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
			const tagName =
				tag.title.length === 0
					? tag.primary_tag.Name
					: `${tag.title} - ${tag.primary_tag.Name}`

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
				gallery.title.length === 0
					? getBasename(gallery.folder.path)
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
		name: `Orgasmed:${scene.o_counter > 0}`,
	} as HeresphereVideoTag)

	processed.tags.push({
		name: `PlayCount:${scene.play_count}`,
	} as HeresphereVideoTag)
	processed.tags.push({
		name: `Watched:${scene.play_count > 0}`,
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

const dataUpdate = async (sceneId: string, authreq: HeresphereAuthReq) => {
	var input: {
		id: string
		rating100?: number
	} = {
		id: sceneId,
	}

	if (authreq.rating) {
		// TODO: Set null on remove
		input.rating100 = authreq.rating * 20
	}
	if (authreq.isFavorite) {
		// TODO: VAR_FAVORITE_TAG
	}
	if (authreq.tags) {
		for (let tag of authreq.tags) {
			console.debug("tag:", tag)
		}
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

const fetchHeresphereVideoEntry = async (
	sceneId: string,
	baseUrl: string,
	authreq?: HeresphereAuthReq
): Promise<HeresphereVideoEntry> => {
	if (authreq) {
		await dataUpdate(sceneId, authreq)
	}

	const sceneQuery = await client.query({
		query: FIND_SCENE_QUERY,
		variables: {
			id: sceneId,
		},
	})

	const sceneData = sceneQuery.data.findScene
	//console.debug(sceneData)
	var processed: HeresphereVideoEntry = {
		access: HeresphereMember,
		title: sceneData.title,
		description: sceneData.details,
		thumbnailImage: `${baseUrl}${screenshotPath}/${sceneData.id}`,
		thumbnailVideo: buildUrl(sceneData.paths.preview, {
			[StashApiKeyParameter]: STASH_APIKEY,
		}),
		dateAdded: formatDate(sceneData.created_at),
		favorites: 0,
		isFavorite: false, // TODO: .
		projection: HeresphereProjectionPerspective,
		stereo: HeresphereStereoMono,
		isEyeSwapped: false,
		fov: 180,
		lens: HeresphereLensLinear,
		cameraIPD: 6.5,
		eventServer: `${baseUrl}${eventPath}/${sceneData.id}`,
		scripts: [],
		subtitles: [],
		tags: [],
		media: [],
		writeFavorite: true, // TODO: Config
		writeRating: true,
		writeTags: true,
		writeHSP: false,
	}
	if (!processed.title && sceneData.files.length > 0) {
		processed.title = getBasename(sceneData.files[0].path)
	}

	if (sceneData.interactive) {
		processed.scripts = []

		const SCRIPT_URL = buildUrl(sceneData.paths.funscript, {
			[StashApiKeyParameter]: STASH_APIKEY,
		})

		var funscript: HeresphereVideoScript = {
			name: "Default",
			url: SCRIPT_URL,
		}
		processed.scripts.push(funscript)
	}
	if (sceneData.captions) {
		processed.subtitles = []

		for (let caption of sceneData.captions) {
			const CAPTION_URL = buildUrl(sceneData.paths.caption, {
				lang: caption.language_code,
				type: caption.caption_type,
				[StashApiKeyParameter]: STASH_APIKEY,
			})

			var subs: HeresphereVideoSubtitle = {
				name: caption.caption_type,
				language: caption.language_code,
				url: CAPTION_URL,
			}

			processed.subtitles.push(subs)
		}
	}

	fillTags(sceneData, processed)

	if ((!authreq || authreq.needsMediaSource) && sceneData.files.length > 0) {
		processed.media = []
		var source: HeresphereVideoMediaSource = {
			resolution: sceneData.files[0].height,
			height: sceneData.files[0].height,
			width: sceneData.files[0].width,
			size: sceneData.files[0].size,
			url: sceneData.paths.stream,
		}
		var entry: HeresphereVideoMedia = {
			name: "Direct stream",
			sources: [source],
		}
		processed.media.push(entry)
		processed.duration = sceneData.files[0].duration * 1000
		// TODO: HLS and DASH transcoding
	}
	if (sceneData.date) {
		processed.dateReleased = formatDate(sceneData.date)
	}
	if (sceneData.rating100) {
		processed.rating = sceneData.rating100 / 20
	}
	if (processed.isFavorite) {
		processed.favorites++
	}

	// TODO: hspArray
	processed.hspArray = undefined

	FindProjectionTags(sceneData, processed)

	return processed
}

const sceneFetchHandler = async (req: HspRequest, res: Response) => {
	try {
		const sceneId = req.params.sceneId
		res.json(
			await fetchHeresphereVideoEntry(
				sceneId,
				getBaseURL(req),
				req.heresphereAuthData
			)
		)
	} catch (error) {
		console.error(error)
		res.status(500).json(error)
	}
}

export const videoPath = "/heresphere/video"
export function hspSceneRoutes(app: Express) {
	app.get(`${videoPath}/:sceneId`, sceneFetchHandler)
	app.post(`${videoPath}/:sceneId`, sceneFetchHandler)
}

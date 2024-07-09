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
import { STASH_APIKEY, STASH_URL } from "../vars"
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

	// TODO: More tags
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
		// TODO: .
	}
	if (authreq.tags) {
		// TODO: .
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
		thumbnailImage: `${baseUrl}${screenshotPath}/${sceneData.id}`, // TODO: Add apikey
		thumbnailVideo: buildUrl(`${STASH_URL}/scene/${sceneData.id}/preview`, {
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

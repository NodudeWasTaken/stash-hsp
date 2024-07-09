import express, { Express, Request, Response } from "express"
import { client } from "../client"
import {
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
import { FIND_SCENE_QUERY } from "../queries/query"
import { checkUrl, formatDate, getBasename, getBaseURL } from "../utilities"
import { STASH_URL } from "../vars"
import { HspRequest } from "../authmiddleware"

export function fillTags(
	scene: any,
	processed: HeresphereVideoEntry | HeresphereVideoEntryShort
) {
	processed.tags = []
	for (let tag of scene.tags) {
		const hsptag: HeresphereVideoTag = {
			name: `Tag:${tag.name}`,
		}
		processed.tags.push(hsptag)
	}
	// TODO: More tags
}

const fetchHeresphereVideoEntry = async (
	sceneId: string,
	baseUrl: string
): Promise<HeresphereVideoEntry> => {
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
		thumbnailImage: `${baseUrl}/heresphere/video/${sceneData.id}/screenshot`, // TODO: Add apikey
		thumbnailVideo: `${STASH_URL}/scene/${sceneData.id}/preview`,
		dateAdded: formatDate(sceneData.created_at),
		favorites: 0,
		isFavorite: false, // TODO: .
		projection: HeresphereProjectionPerspective,
		stereo: HeresphereStereoMono,
		isEyeSwapped: false,
		fov: 180,
		lens: HeresphereLensLinear,
		cameraIPD: 6.5,
		eventServer: `${baseUrl}/heresphere/${sceneData.id}/event`,
		scripts: [],
		subtitles: [],
		tags: [],
		media: [],
		writeFavorite: false, // TODO: Config
		writeRating: false,
		writeTags: false,
		writeHSP: false,
	}
	if (!processed.title && sceneData.files.length > 0) {
		processed.title = getBasename(sceneData.files[0].path)
	}

	{
		processed.scripts = []
		try {
			await checkUrl(sceneData.paths.funscript)
			var funscript: HeresphereVideoScript = {
				name: "Default",
				url: sceneData.paths.funscript, // TODO: Might not exist
			}
			processed.scripts.push(funscript)
		} catch (error) {
			// console.debug(error)
		}
	}
	{
		processed.subtitles = []
		try {
			const CAPTION_URL = `${sceneData.paths.caption}?lang=00&type=srt`
			await checkUrl(CAPTION_URL)
			var subs: HeresphereVideoSubtitle = {
				name: "Default",
				language: "00",
				url: CAPTION_URL,
			}
			processed.subtitles.push(subs)
		} catch (error) {
			// console.debug(error)
		}
	}

	fillTags(sceneData, processed)

	// TODO: HeresphereAuthReq check needsMediaSources
	if (sceneData.files.length > 0) {
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
		res.json(await fetchHeresphereVideoEntry(sceneId, getBaseURL(req)))
	} catch (error) {
		console.error(error)
		res.status(500).json(error)
	}
}

export function hspSceneRoutes(app: Express) {
	app.get("/heresphere/video/:sceneId", sceneFetchHandler)
	app.post("/heresphere/video/:sceneId", sceneFetchHandler)
}

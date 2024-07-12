import { Express, Request, Response } from "express"
import { client, StashApiKeyParameter } from "../core/client"
import { STASH_APIKEY, VAR_FAVTAG, VAR_UICFG } from "../core/vars"
import { Query, Scene } from "../gql/graphql"
import { FIND_SCENE_QUERY } from "../queries/FindSceneQuery"
import {
	HeresphereAuthReq,
	HeresphereHSPEntry,
	HeresphereLensLinear,
	HeresphereMember,
	HeresphereProjectionPerspective,
	HeresphereStereoMono,
	HeresphereVideoEntry,
	HeresphereVideoMedia,
	HeresphereVideoMediaSource,
	HeresphereVideoScript,
	HeresphereVideoSubtitle,
} from "../structs/heresphere_structs"
import {
	getResolutionsLessThanOrEqualTo,
	ResolutionEnum,
	reverseMapping,
} from "../structs/stash_structs"
import { fillTags, hspDataUpdate } from "../utils/hspdataupdate"
import { FindProjectionTags } from "../utils/projection"
import {
	buildUrl,
	formatDate,
	getBasename,
	getBaseURL,
} from "../utils/utilities"
import { eventPath } from "./hspevent"
import { hasHSPFile, hspPath } from "./hspfile"
import { screenshotPath } from "./hspscreenshot"

const fetchHeresphereVideoEntry = async (
	sceneId: string,
	baseUrl: string,
	authreq?: HeresphereAuthReq
): Promise<HeresphereVideoEntry> => {
	var sceneData: Scene | undefined

	if (authreq) {
		sceneData = await hspDataUpdate(sceneId, authreq)
	}

	if (!sceneData) {
		const queryResult = await client.query<Query>({
			query: FIND_SCENE_QUERY,
			variables: {
				id: sceneId,
			},
		})
		sceneData = queryResult.data.findScene || undefined
	}

	if (!sceneData) {
		throw new Error("scene not found")
	}

	//console.debug(sceneData)
	var processed: HeresphereVideoEntry = {
		access: HeresphereMember,
		title: sceneData.title || "",
		description: sceneData.details || "",
		thumbnailImage: `${baseUrl}${screenshotPath}/${sceneData.id}`,
		thumbnailVideo: buildUrl(sceneData.paths.preview || "", {
			[StashApiKeyParameter]: STASH_APIKEY,
		}),
		dateAdded: formatDate(sceneData.created_at),
		favorites: 0,
		isFavorite:
			VAR_FAVTAG !== undefined &&
			sceneData.tags.map((t) => t.id).includes(VAR_FAVTAG.id),
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
		writeFavorite: true,
		writeRating: true,
		writeTags: true,
		writeHSP: true,
	}
	if (!processed.title && sceneData.files.length > 0) {
		processed.title = getBasename(sceneData.files[0].path)
	}

	if (sceneData.interactive) {
		processed.scripts = []

		const SCRIPT_URL = buildUrl(sceneData.paths.funscript || "", {
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
			const CAPTION_URL = buildUrl(sceneData.paths.caption || "", {
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
		const maxResHeight = sceneData.files[0].height
		const maxResWidth = sceneData.files[0].width
		{
			const source: HeresphereVideoMediaSource = {
				resolution: maxResHeight,
				height: maxResHeight,
				width: maxResWidth,
				size: sceneData.files[0].size,
				url: sceneData.paths.stream || "",
			}
			const entry: HeresphereVideoMedia = {
				name: "Direct stream",
				sources: [source],
			}
			processed.media.push(entry)
			processed.duration = sceneData.files[0].duration * 1000
		}

		{
			const HLSentry: HeresphereVideoMedia = {
				name: "HLS",
				sources: [],
			}

			const DASHentry: HeresphereVideoMedia = {
				name: "DASH",
				sources: [],
			}

			const HLSurl = new URL(sceneData.paths.stream || "")
			HLSurl.pathname = `${HLSurl.pathname}.m3u8`

			const DASHurl = new URL(sceneData.paths.stream || "")
			DASHurl.pathname = `${DASHurl.pathname}.mpd`

			for (const res of getResolutionsLessThanOrEqualTo(
				maxResHeight,
				reverseMapping[
					VAR_UICFG.general.maxStreamingTranscodeSize || ResolutionEnum.ORIGINAL
				]
			).toReversed()) {
				HLSurl.searchParams.set("resolution", res)
				DASHurl.searchParams.set("resolution", res)

				const resVal = reverseMapping[res]
				const widthVal = (maxResWidth / maxResHeight) * resVal

				const HLSsource: HeresphereVideoMediaSource = {
					resolution: resVal,
					height: resVal,
					width: widthVal,
					size: 0,
					url: HLSurl.toString(),
				}

				const DASHsource: HeresphereVideoMediaSource = {
					resolution: resVal,
					height: resVal,
					width: widthVal,
					size: 0,
					url: DASHurl.toString(),
				}

				HLSentry.sources.push(HLSsource)
				DASHentry.sources.push(DASHsource)
			}

			processed.media.push(HLSentry)
			processed.media.push(DASHentry)
		}
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

	processed.hspArray = []
	if (
		sceneData.files.length > 0 &&
		(await hasHSPFile(sceneData.files[0].path))
	) {
		processed.hspArray.push({
			url: `${baseUrl}${hspPath}/${sceneData.id}`,
		} as HeresphereHSPEntry)
	}

	FindProjectionTags(sceneData, processed)

	return processed
}

const sceneFetchHandler = async (req: Request, res: Response) => {
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

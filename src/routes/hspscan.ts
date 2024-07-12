import { Express, Response } from "express"
import fs from "fs"
import { writeFile } from "fs/promises"
import cron from "node-cron"
import { HspRequest } from "../core/authmiddleware"
import { client } from "../core/client"
import {
	maxRes,
	rlimit,
	slimit,
	STASH_URL,
	VAR_CACHE_DIR,
	VAR_SCANCACHE_CRON,
	VAR_SCREENSHOT_DIR,
} from "../core/vars"
import { Query } from "../gql/graphql"
import { FIND_SCENE_SLIM_QUERY } from "../queries/FindSceneSlimQuery"
import { FIND_SCENES_SLIM_QUERY } from "../queries/FindScenesSlimQuery"
import {
	HeresphereScanIndex,
	HeresphereVideoEntryShort,
} from "../structs/heresphere_structs"
import { fillTags } from "../utils/hspdataupdate"
import {
	fetchAndResizeImage,
	fileExists,
	formatDate,
	getBasename,
	getBaseURL,
} from "../utils/utilities"
import { videoPath } from "./hspscene"

// Stash is too slow to do this live
// TODO: Add a way to refresh
const SCANDB = `${VAR_CACHE_DIR}/scan.json`
const SCANDB_STR = "REPLACE_ME_XXX_FUCKER_DONT_FIND_SECRET_STRING"

const hspscanfetchHandler = async (req: HspRequest, res: Response) => {
	if (await fileExists(SCANDB)) {
		var scandb = fs
			.readFileSync(SCANDB)
			.toString()
			.replaceAll(SCANDB_STR, getBaseURL(req))
		res.contentType("application/json")
		res.send(scandb)
		return
	}
	res.status(404)
}

const fetchHeresphereVideoEntrySlim = async (
	sceneId: string,
	baseUrl: string
): Promise<HeresphereVideoEntryShort> => {
	const queryResult = await client.query<Query>({
		query: FIND_SCENE_SLIM_QUERY,
		variables: {
			id: sceneId,
		},
	})

	const sceneData = queryResult.data.findScene

	if (!sceneData) {
		throw new Error("scene not found")
	}

	//console.debug(sceneData)
	var processed: HeresphereVideoEntryShort = {
		link: `${baseUrl}${videoPath}/${sceneData.id}`,
		title: sceneData.title || "",
		dateAdded: formatDate(sceneData.created_at),
		favorites: 0,
		comments: 0,
		isFavorite: false, // TODO: .
		tags: [],
	}
	if (!processed.title && sceneData.files.length > 0) {
		processed.title = getBasename(sceneData.files[0].path)
	}

	fillTags(sceneData, processed)

	if (sceneData.files.length > 0) {
		processed.duration = sceneData.files[0].duration * 1000
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

	return processed
}
export async function genScanDB(first: boolean) {
	if (!(await fileExists(SCANDB)) || !first) {
		console.debug("hsp scan")
		var scenes: HeresphereVideoEntryShort[] = []

		const queryResult = await client.query<Query>({
			query: FIND_SCENES_SLIM_QUERY,
			variables: {
				filter: {
					page: 0,
					per_page: -1,
				},
			},
		})
		const videodata = queryResult.data.findScenes.scenes

		// Fetch video data
		const outof = videodata.length
		var inof = 0
		const scenePromises: Promise<void[]> = Promise.all(
			videodata.map((scene: any) =>
				rlimit(() =>
					fetchHeresphereVideoEntrySlim(scene.id, SCANDB_STR)
						.then((hspscene) => {
							inof++
							console.debug("hsp scan:", scene.id, "prog:", inof, "/", outof)
							scenes.push(hspscene)
						})
						.catch((error) => console.error("fetch stash scene error:", error))
				)
			)
		)

		// Downscale images
		const screenshotPromises: Promise<void[]> = Promise.all(
			videodata.map((scene: any) =>
				slimit(() =>
					fetchAndResizeImage(
						`${STASH_URL}/scene/${scene.id}/screenshot`,
						`${VAR_SCREENSHOT_DIR}/${scene.id}.jpg`,
						maxRes
					).catch((error) =>
						console.error("generating screenshot error:", error)
					)
				)
			)
		)

		await scenePromises
		const scanidx: HeresphereScanIndex = {
			scanData: scenes,
		}
		await writeFile(SCANDB, JSON.stringify(scanidx))
		console.debug("wrote hsp scan")

		await screenshotPromises
		console.debug("wrote screenshots")
	} else {
		console.debug("skipping hsp scan")
	}

	if (first) {
		cron.schedule(VAR_SCANCACHE_CRON, () => {
			genScanDB(false)
		})
	}
}

export function hspScanRoutes(app: Express) {
	app.post("/heresphere/scan", hspscanfetchHandler)
}

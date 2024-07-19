import { Express, Request, Response } from "express"
import { writeFile } from "fs/promises"
import cron from "node-cron"
import { client } from "../core/client"
import {
	rlimit,
	SCANDB,
	SCREENSHOT_MAXRES,
	slimit,
	STASH_URL,
	VAR_CACHE_DIR,
	VAR_FAVTAG,
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
	checkForErrors,
	ensureDirectoryExists,
	fetchAndResizeImage,
	fileExists,
	formatDate,
	getBasename,
	getBaseURL,
	readJsonFile,
} from "../utils/utilities"
import { videoPath } from "./hspscene"

// Stash is too slow to do this live
// TODO: Add a way to refresh
const hspscanfetchHandler = async (req: Request, res: Response) => {
	try {
		if (await fileExists(SCANDB)) {
			const baseUrl = getBaseURL(req)

			let scandb: HeresphereScanIndex = await readJsonFile(SCANDB)
			scandb.scanData = scandb.scanData.map((scene) => ({
				...scene,
				link: `${baseUrl}${scene.link}`,
			}))

			res.contentType("application/json")
			res.send(scandb)
			return
		}
		res.status(404)
	} catch (err) {
		console.error(err)
		res.status(500).send({ error: (err as Error).message })
	}
}

const fetchHeresphereVideoEntrySlim = async (
	sceneId: string
): Promise<HeresphereVideoEntryShort> => {
	const queryResult = await client.query<Query>({
		query: FIND_SCENE_SLIM_QUERY,
		variables: {
			id: sceneId,
		},
	})
	checkForErrors(queryResult.errors)

	const sceneData = queryResult.data.findScene

	if (!sceneData) {
		throw new Error("scene not found")
	}

	//console.debug(sceneData)
	var processed: HeresphereVideoEntryShort = {
		link: `${videoPath}/${sceneData.id}`,
		title: sceneData.title || "",
		dateAdded: formatDate(sceneData.created_at),
		favorites: 0,
		comments: 0,
		isFavorite:
			VAR_FAVTAG !== undefined &&
			sceneData.tags.map((t) => t.id).includes(VAR_FAVTAG.id),
		tags: [],
	}
	if (!processed.title && sceneData.files[0]) {
		processed.title = getBasename(sceneData.files[0].path)
	}

	fillTags(sceneData, processed)

	if (sceneData.files[0]) {
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
		ensureDirectoryExists(VAR_CACHE_DIR)
		ensureDirectoryExists(VAR_SCREENSHOT_DIR)

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
		checkForErrors(queryResult.errors)
		const videodata = queryResult.data.findScenes.scenes

		// Fetch video data
		const outof = videodata.length
		var inof = 0
		const scenePromises: Promise<void[]> = Promise.all(
			videodata.map((scene: any) =>
				rlimit(() =>
					fetchHeresphereVideoEntrySlim(scene.id)
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
						SCREENSHOT_MAXRES
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

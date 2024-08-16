import { eq } from "drizzle-orm"
import { Express, Request, Response } from "express"
import cron from "node-cron"
import sharp from "sharp"
import { client } from "../core/client"
import {
	db,
	SCREENSHOT_MAXRES,
	slimit,
	STASH_URL,
	VAR_FAVTAG,
	VAR_SCANCACHE_CRON,
} from "../core/vars"
import { images, scans } from "../db/schema"
import { Query, Scene } from "../gql/graphql"
import { FIND_SCENES_QUERY, FIND_SCENES_VARS } from "../queries/FindScenesQuery"
import {
	HeresphereScanIndex,
	HeresphereVideoEntryShort,
} from "../structs/heresphere_structs"
import { fillTags } from "../utils/hspdataupdate"
import {
	checkForErrors,
	fetchAndResizeImage,
	formatDate,
	getBasename,
	getBaseURL,
} from "../utils/utilities"
import { videoPath } from "./hspscene"

// Stash is too slow to do this live
// TODO: Add a way to refresh
const hspscanfetchHandler = async (req: Request, res: Response) => {
	try {
		const entries = await db.select().from(scans)

		if (entries[0]) {
			const baseUrl = getBaseURL(req)

			let scandb: HeresphereScanIndex = JSON.parse(entries[0].data as string)
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

const fetchHeresphereVideoEntry = async (
	sceneData: Scene
): Promise<HeresphereVideoEntryShort> => {
	if (!sceneData) {
		throw new Error("scene not found")
	}

	//console.debug(sceneData)
	let processed: HeresphereVideoEntryShort = {
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
	const scanexists = await db.select().from(scans).get()

	if (!scanexists || !first) {
		console.debug("writing hsp scan...")
		let scenes: HeresphereVideoEntryShort[] = []

		const queryResult = await client.query<Query>({
			query: FIND_SCENES_QUERY,
			variables: {
				filter: {
					per_page: -1,
				},
			} as FIND_SCENES_VARS,
		})
		checkForErrors(queryResult.errors)
		const videodata = queryResult.data.findScenes.scenes

		// Fetch video data
		const outof = videodata.length
		let inof = 0
		const scenePromises: Promise<void[]> = Promise.all(
			videodata.map((scene: Scene) =>
				fetchHeresphereVideoEntry(scene)
					.then((hspscene) => {
						inof++
						console.debug("hsp scan:", scene.id, "prog:", inof, "/", outof)
						scenes.push(hspscene)
					})
					.catch((error) => console.error("fetch stash scene error:", error))
			)
		)

		// Downscale images
		const screenshotPromises: Promise<any[]> = Promise.all(
			videodata
				.filter(
					(scene) =>
						!db
							.select()
							.from(images)
							.where(eq(images.id, Number(scene.id)))
							.get()
				)
				.map((scene) =>
					slimit(() =>
						fetchAndResizeImage(
							`${STASH_URL}/scene/${scene.id}/screenshot`,
							SCREENSHOT_MAXRES
						)
							.catch((error) =>
								console.error("generating screenshot error:", error)
							)
							.then((img) =>
								(img as sharp.Sharp)
									.toFormat("jpeg", { quality: 80 } as sharp.JpegOptions)
									.toBuffer()
									.then((buffer) =>
										db
											.insert(images)
											.values({ id: Number(scene.id), data: buffer })
									)
							)
					)
				)
		)

		await scenePromises
		const scanidx: HeresphereScanIndex = {
			scanData: scenes,
		}
		await db.insert(scans).values({ id: 0, data: JSON.stringify(scanidx) })

		console.debug("wrote hsp scan")

		console.debug("writing screenshots...")
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

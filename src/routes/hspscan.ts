import express, { Express, Request, Response } from "express";
import { maxRes, rlimit, slimit, STASH_URL, VAR_CACHE_DIR, VAR_SCANCACHE_AGE, VAR_SCANCACHE_CRON, VAR_SCREENSHOT_DIR } from "../vars";
import { fetchAndResizeImage, fileExists, formatDate, getBasename, getBaseURL, getFileAge } from "../utilities";
import fs from 'fs';
import { writeFile } from 'fs/promises';
import { client } from "../client";
import { HeresphereScanIndex, HeresphereVideoEntryShort } from "../heresphere_structs";
import { FIND_SCENE_SLIM_QUERY, FIND_SCENES_SLIM_QUERY } from "../queries/query";
import { fillTags } from "./hspscene";
import cron from 'node-cron';
import { HspRequest } from "../authmiddleware";

// Stash is too slow to do this live
// TODO: Add a way to refresh
const SCANDB = `./${VAR_CACHE_DIR}/scan.json`
const SCANDB_STR = "REPLACE_ME_XXX_FUCKER_DONT_FIND_SECRET_STRING"

const hspscanfetchHandler = async (req: HspRequest, res: Response) => {
	if (await fileExists(SCANDB)) {
		var scandb = fs.readFileSync(SCANDB).toString().replaceAll(SCANDB_STR,getBaseURL(req));
		res.contentType("application/json");
		res.send(scandb);
		return
	}
	res.status(404)
}


const fetchHeresphereVideoEntrySlim = async(sceneId: string, baseUrl: string): Promise<HeresphereVideoEntryShort> => {
	const sceneQuery = await client.query({
		query: FIND_SCENE_SLIM_QUERY,
		variables: {
			id: sceneId,
		}
	});

	const sceneData = sceneQuery.data.findScene;
	//console.debug(sceneData)
	var processed: HeresphereVideoEntryShort = {
		link: `${SCANDB_STR}/heresphere/video/${sceneData.id}`,
		title: sceneData.title,
		dateAdded: formatDate(sceneData.created_at),
		favorites: 0,
		comments: 0,
		isFavorite: false, // TODO: .
		tags: []
	}
	if (!processed.title && sceneData.files.length > 0) {
		processed.title = getBasename(sceneData.files[0].path)
	}

	fillTags(sceneData, processed);

	if (sceneData.files.length > 0) {
		processed.duration = sceneData.files[0].duration * 1000;
	}
	if (sceneData.date) {
		processed.dateReleased = formatDate(sceneData.date);
	}
	if (sceneData.rating100) {
		processed.rating = sceneData.rating100/20;
	}
	if (processed.isFavorite) {
		processed.favorites++;
	}

	return processed
}
export async function genScanDB(first: boolean) {
	if (!await fileExists(SCANDB) || getFileAge(SCANDB) >= Number(VAR_SCANCACHE_AGE)-1 || !first) {
		console.debug("hsp scan");
		var scenes: HeresphereVideoEntryShort[] = [];
		
		const findscenes = await client.query({
			query: FIND_SCENES_SLIM_QUERY,
			variables: {
				filter: {
					page: 0,
					per_page: -1,
				}
			}
		});
		const videodata = findscenes.data.findScenes.scenes;

		// Fetch video data
		const outof = videodata.length;
		var inof = 0;
		const scenePromises: Promise<void>[] = videodata.map((scene: any) => 
			rlimit(() => 
				fetchHeresphereVideoEntrySlim(scene.id, SCANDB_STR)
					.then(hspscene => {
						inof++;
						console.debug("hsp:",scene.id,"prog:",inof,"/",outof);
						scenes.push(hspscene);
					})
					.catch(error => console.error(error))
			)
		);

		// Downscale images
		// TODO: Catch error?
		const screenshotPromises: Promise<void>[] = videodata.map((scene: any) => 
			slimit(() => fetchAndResizeImage(
				`${STASH_URL}/scene/${scene.id}/screenshot`, 
				`${VAR_SCREENSHOT_DIR}/${scene.id}.jpg`,
				maxRes
			))
		)

		// Wait for all promises to resolve
		await Promise.all([...scenePromises, ...screenshotPromises]);

		const scanidx: HeresphereScanIndex = {
			scanData: scenes
		}
		await writeFile(SCANDB, JSON.stringify( scanidx ));
		console.debug("wrote hsp scan");
	} else {
		console.debug("skipping hsp scan");
	}
	
	if (first) {
		cron.schedule(VAR_SCANCACHE_CRON, () => {
			genScanDB(false)
		});
	}
}

export function hspScanRoutes(app: Express) {
	app.post("/heresphere/scan", hspscanfetchHandler);
}

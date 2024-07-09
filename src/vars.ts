import pLimit from "p-limit"
import { CONFIG_QUERY } from "./queries/query"

export var VR_TAG = "Virtual Reality"

export const maxRes = 480

export const SERVICE_IP = process.env.SERVICE_IP || "127.0.0.1"
export const STASH_URL = process.env.STASH_URL || "http://127.0.0.1:9999"
export const VAR_SCREENSHOT_DIR = process.env.SCREENSHOTS_DIR || "./screenshots"
export const VAR_CACHE_DIR = process.env.CACHE_DIR || "./cache"
export const VAR_SCALELIMIT = process.env.SCALE_PROCESS_LIMIT || "8"
export const VAR_RLIMIT = process.env.REQUEST_PROCESS_LIMIT || "50"
// m h dom mon dow
export const VAR_SCANCACHE_CRON = process.env.SCANCACHE_CRON || '0 6 * * *'
export const VAR_SCANCACHE_AGE = 24*60*60*1000
export const slimit = pLimit(Number(VAR_SCALELIMIT));
export const rlimit = pLimit(Number(VAR_RLIMIT));

export async function getVrTag(client: any) {
	const uiconfig = await client.query({
		query: CONFIG_QUERY,
	});

	VR_TAG = uiconfig.data.configuration.ui.vrTag;
}

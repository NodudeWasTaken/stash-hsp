import { Express, Request, Response } from "express"
import { client, fetcher } from "../core/client"
import { STASH_URL } from "../core/vars"
import { Query, Scene } from "../gql/graphql"
import { FIND_GROUP_QUERY, FIND_GROUP_VARS } from "../queries/FindGroupQuery"
import {
	HeresphereProjectionPerspective,
	HeresphereStereoMono,
	HeresphereVideoEntry,
	HeresphereVideoScript,
} from "../structs/heresphere_structs"
import { getBaseURL } from "../utils/utilities"

const fetchSecondaryPlaylist = async (sceneId: string): Promise<string[]> => {
	const url = `${STASH_URL}/scene/${sceneId}/stream.m3u8`
	const response = await fetcher(url)
	const text = await response.text()
	// Extract just the segment lines (assuming they're .ts files)
	return text
		.split("\n")
		.filter((line) => line.trim().endsWith(".ts"))
		.map((line) => `${STASH_URL}${line.trim()}`) // Prepend base URL if needed
}

const hlsFetchHandler = async (req: Request, res: Response) => {
	try {
		// TODO: With the amount of times i do this it should be generalized
		const { groupId } = req.params
		if (!groupId) {
			throw new Error("missing groupId")
		}

		var data = await client
			.query<Query>({
				query: FIND_GROUP_QUERY,
				variables: {
					id: groupId,
				} as FIND_GROUP_VARS,
			})
			.catch((e) => {
				console.error("Full error:", JSON.stringify(e, null, 2))
				console.error("Network error:", e.networkError?.response)
				console.error("GraphQL errors:", e.graphQLErrors)
			})

		if (!data) {
			throw new Error("invalid response from stash")
		}

		let response = `#EXTM3U\n#EXT-X-VERSION:6\n#EXT-X-PLAYLIST-TYPE:VOD\n#PLAYLIST:${data.data.findGroup?.name}\n`

		const sortedScenes = data.data.findGroup!.scenes.toSorted(
			(a, b) => a.groups[0]?.scene_index! - b.groups[0]?.scene_index!
		)

		for (const [index, element] of sortedScenes.entries()) {
			if (index > 0) {
				response += "#EXT-X-DISCONTINUITY\n"
			}

			// Fetch the secondary playlist segments
			const segments = await fetchSecondaryPlaylist(element.id)

			// Add each segment from the secondary playlist
			for (const segment of segments) {
				// You might need to adjust duration based on actual segment info
				response += `#EXTINF:${element.files[0]!.duration / segments.length || 2},${element.title || "Unnamed Scene"}\n`
				response += `${segment}\n`
			}
		}

		response += "#EXT-X-ENDLIST\n"
		res.contentType("application/x-mpegURL")
		res.send(response)
	} catch (err) {
		console.error(err)
		res.status(500).send({ error: (err as Error).message })
	}
}
interface Action {
	at: number // milliseconds
	pos: number
}

interface Bookmark {
	// Add properties if bookmarks have specific fields, otherwise keep empty
}

interface Chapter {
	// Add properties if chapters have specific fields, otherwise keep empty
}

interface Metadata {
	bookmarks: Bookmark[]
	chapters: Chapter[]
	creator: string
	description: string
	duration: number
	license: string
	notes: string
	performers: string[]
	script_url: string
	tags: string[]
	title: string
	type: string
	video_url: string
}

interface Funscript {
	actions: Action[]
	inverted: boolean
	metadata: Metadata
	range: number
	version: string
}

// Main function to process the group's funscripts
async function generateGroupFunscript(scenes: Scene[]): Promise<Funscript> {
	// Sort scenes by scene_index
	const sortedScenes = scenes.toSorted(
		(a, b) => a.groups[0]?.scene_index! - b.groups[0]?.scene_index!
	)

	const combinedActions: Action[] = []
	let cumulativeTimeMs = 0

	// Process each scene in order
	for (const scene of sortedScenes) {
		const sceneDurationMs = scene.files[0]!.duration * 1000 // Convert to milliseconds

		// If scene has a funscript, fetch and process it
		if (scene.paths.funscript) {
			try {
				const response = await fetcher(scene.paths.funscript)
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`)
				}

				const funscriptData: Funscript = await response.json()

				// Shift each action's timestamp by the cumulative time
				const shiftedActions = funscriptData.actions
					.filter((a) => a.at < sceneDurationMs)
					.map((action) => ({
						at: action.at + cumulativeTimeMs,
						pos: action.pos,
					}))

				combinedActions.push(...shiftedActions)
			} catch (error) {
				console.error(
					`Failed to fetch funscript for scene at index ${scene.groups[0]?.scene_index}:`,
					error
				)
			}
		}

		// Add this scene's duration to the cumulative time
		cumulativeTimeMs += sceneDurationMs
	}

	// Sort actions by timestamp to ensure chronological order
	combinedActions.sort((a, b) => a.at - b.at)

	return {
		actions: combinedActions,
		inverted: false,
		range: 100,
		version: "1.0",
		metadata: {
			description: "stash-hsp group gen",
			bookmarks: [],
			chapters: [],
			creator: "",
			duration: 0,
			license: "",
			notes: "",
			performers: [],
			script_url: "",
			tags: [],
			title: "",
			type: "",
			video_url: "",
		},
	}
}

const funscriptFetchHandler = async (req: Request, res: Response) => {
	try {
		// TODO: With the amount of times i do this it should be generalized
		const { groupId } = req.params
		if (!groupId) {
			throw new Error("missing groupId")
		}

		var data = await client
			.query<Query>({
				query: FIND_GROUP_QUERY,
				variables: {
					id: groupId,
				} as FIND_GROUP_VARS,
			})
			.catch((e) => {
				console.error("Full error:", JSON.stringify(e, null, 2))
				console.error("Network error:", e.networkError?.response)
				console.error("GraphQL errors:", e.graphQLErrors)
			})

		if (!data) {
			throw new Error("invalid response from stash")
		}

		const funscript = await generateGroupFunscript(data.data.findGroup!.scenes)

		res.json(funscript)
	} catch (err) {
		console.error(err)
		res.status(500).send({ error: (err as Error).message })
	}
}

const groupFetchHandler = async (req: Request, res: Response) => {
	try {
		// TODO: With the amount of times i do this it should be generalized
		const { groupId } = req.params
		if (!groupId) {
			throw new Error("missing groupId")
		}

		var data = await client
			.query<Query>({
				query: FIND_GROUP_QUERY,
				variables: {
					id: groupId,
				} as FIND_GROUP_VARS,
			})
			.catch((e) => {
				console.error("Full error:", JSON.stringify(e, null, 2))
				console.error("Network error:", e.networkError?.response)
				console.error("GraphQL errors:", e.graphQLErrors)
			})

		if (!data) {
			throw new Error("invalid response from stash")
		}

		const rdata = data.data.findGroup!
		var response: HeresphereVideoEntry = {
			access: 0,
			title: rdata.name,
			description: "",
			duration: data.data.findGroup?.duration! * 1000,
			thumbnailImage: rdata.front_image_path!,
			favorites: 0,
			isFavorite: false,
			projection: HeresphereProjectionPerspective,
			stereo: HeresphereStereoMono,
			isEyeSwapped: false,
			lens: "Linear",
			cameraIPD: 0,
			writeFavorite: false,
			writeRating: false, // TODO: Writes
			writeTags: false,
			writeHSP: false,
			media: [
				{
					name: "Full",
					sources: [
						{
							resolution: 0,
							height: 0,
							width: 0,
							size: 0,
							url: `${getBaseURL(req)}${groupPath}/${groupId}/master.m3u8`,
						},
					],
				},
			],
		}

		if (rdata.scenes.map((a) => a.interactive).reduce((a, b) => a || b)) {
			response.scripts = []

			const SCRIPT_URL = `${getBaseURL(req)}${groupPath}/${groupId}/funscript`

			let funscript: HeresphereVideoScript = {
				name: "Default",
				url: SCRIPT_URL,
			}
			response.scripts.push(funscript)
		}

		res.json(response)
	} catch (err) {
		console.error(err)
		res.status(500).send({ error: (err as Error).message })
	}
}

export const groupPath = "/heresphere/group"
export function hspGroupRoutes(app: Express) {
	app.get(`${groupPath}/:groupId`, groupFetchHandler)
	app.post(`${groupPath}/:groupId`, groupFetchHandler)
	app.get(`${groupPath}/:groupId/master.m3u8`, hlsFetchHandler)
	app.get(`${groupPath}/:groupId/funscript`, funscriptFetchHandler)
}

import { Express, Request, Response } from "express"
import NodeCache from "node-cache"
import { client } from "../core/client"
import { VAR_UICFG } from "../core/vars"
import { Mutation, Query, Scene } from "../gql/graphql"
import { FIND_SCENE_QUERY, FIND_SCENE_VARS } from "../queries/FindSceneQuery"
import {
	SCENE_ADD_PLAY_MUTATION,
	SCENE_ADD_PLAY_VARS,
} from "../queries/SceneAddPlayMutation"
import {
	SCENE_SAVE_ACTIVITY_MUTATION,
	SCENE_SAVE_ACTIVITY_VARS,
} from "../queries/SceneSaveActivityMutation"
import {
	HeresphereEventPlay,
	HeresphereVideoEvent,
} from "../structs/heresphere_structs"
import { checkForErrors } from "../utils/utilities"

// Create a new instance of NodeCache with 5 hour TTL
// TODO: Replace with DB
const video_event_cache = new NodeCache({ stdTTL: 60 * 60 * 5 })

async function updatePlayCount(
	scene: Scene,
	event: HeresphereVideoEvent
): Promise<boolean> {
	const minPlay: number = Number(VAR_UICFG.ui.minimumPlayPercent) / 100
	const newTime = event.time / 1000

	if (scene.files[0] && newTime / scene.files[0].duration > minPlay) {
		const mutationResult = await client.mutate<Mutation>({
			mutation: SCENE_ADD_PLAY_MUTATION,
			variables: {
				id: scene.id,
			} as SCENE_ADD_PLAY_VARS,
		})
		checkForErrors(mutationResult.errors)

		return !mutationResult.errors
	}

	return false
}

const hspEventHandler = async (req: Request, res: Response) => {
	try {
		// TODO: With the amount of times i do this it should be generalized
		const { sceneId } = req.params
		if (!sceneId) {
			throw new Error("missing sceneId")
		}

		const queryResult = await client.query<Query>({
			query: FIND_SCENE_QUERY,
			variables: {
				id: sceneId,
			} as FIND_SCENE_VARS,
		})
		checkForErrors(queryResult.errors)
		const sceneData = queryResult.data.findScene || undefined

		if (!sceneData) {
			throw new Error("scene not found")
		}

		const eventReq: HeresphereVideoEvent = req.body

		console.debug("Event called:", eventReq)

		const newTime = eventReq.time / 1000
		let newDuration = 0

		if (
			sceneData.resume_time &&
			newTime > sceneData.resume_time &&
			eventReq.event != HeresphereEventPlay
		) {
			newDuration += newTime - sceneData.resume_time
		}

		const remoteIP = req.clientIp
		if (!remoteIP) {
			throw new Error("ip not found")
		}

		// If previously updated playcount, dont update again
		const previousID = video_event_cache.get(remoteIP)
		if (previousID != sceneId) {
			// Video switch, remove old entry
			video_event_cache.del(remoteIP)
			if (await updatePlayCount(sceneData, eventReq)) {
				// Dont update playcount again
				video_event_cache.set(remoteIP, sceneId)
			}
		}

		const mutationResult = await client.mutate<Mutation>({
			mutation: SCENE_SAVE_ACTIVITY_MUTATION,
			variables: {
				id: sceneId,
				resume_time: newTime,
				playDuration: newDuration,
			} as SCENE_SAVE_ACTIVITY_VARS,
		})
		checkForErrors(mutationResult.errors)

		res.json({ message: "OK" })
	} catch (err) {
		console.error(err)
		res.status(500).send({ error: (err as Error).message })
	}
}

export const eventPath = "/heresphere/event"
export function hspEventRoutes(app: Express) {
	app.post(`${eventPath}/:sceneId`, hspEventHandler)
}

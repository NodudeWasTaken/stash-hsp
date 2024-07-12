import { Express, Request, Response } from "express"
import NodeCache from "node-cache"
import { client } from "../core/client"
import { VAR_UICFG } from "../core/vars"
import { Mutation, Query, Scene } from "../gql/graphql"
import { FIND_SCENE_QUERY } from "../queries/FindSceneQuery"
import { SCENE_ADD_PLAY_MUTATION } from "../queries/SceneAddPlayMutation"
import { SCENE_SAVE_ACTIVITY_MUTATION } from "../queries/SceneSaveActivityMutation"
import {
	HeresphereEventPlay,
	HeresphereVideoEvent,
} from "../structs/heresphere_structs"

// Create a new instance of NodeCache with 2 hour TTL
const cache = new NodeCache({ stdTTL: 60 * 60 * 2 })

async function updatePlayCount(
	scene: Scene,
	event: HeresphereVideoEvent
): Promise<boolean> {
	const minPlay: number = Number(VAR_UICFG.ui.minimumPlayPercent) / 100
	const newTime = event.time / 1000

	if (scene.files.length > 0 && newTime / scene.files[0].duration > minPlay) {
		const mutationResult = await client.mutate<Mutation>({
			mutation: SCENE_ADD_PLAY_MUTATION,
			variables: {
				id: scene.id,
			},
		})

		return !mutationResult.errors
	}

	return false
}

const hspEventHandler = async (req: Request, res: Response) => {
	try {
		const sceneId = req.params.sceneId
		const queryResult = await client.query<Query>({
			query: FIND_SCENE_QUERY,
			variables: {
				id: sceneId,
			},
		})
		const sceneData = queryResult.data.findScene || undefined

		if (!sceneData) {
			throw new Error("scene not found")
		}

		const eventReq: HeresphereVideoEvent = req.body

		console.debug("Event called:", eventReq)

		const newTime = eventReq.time / 1000
		var newDuration = 0

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

		const previousID = cache.get(remoteIP)
		if (previousID != sceneId) {
			if (await updatePlayCount(sceneData, eventReq)) {
				cache.set(remoteIP, sceneId)
			}
		}

		const mutationResult = await client.mutate<Mutation>({
			mutation: SCENE_SAVE_ACTIVITY_MUTATION,
			variables: {
				id: sceneId,
				resume_time: newTime,
				playDuration: newDuration,
			},
		})
		// TODO: Check error

		res.json({ message: "OK" })
	} catch (error) {
		console.error(error)
		res.status(500).json(error)
	}
}

export const eventPath = "/heresphere/event"
export function hspEventRoutes(app: Express) {
	app.post(`${eventPath}/:sceneId`, hspEventHandler)
}

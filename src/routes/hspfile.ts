import { Express, Request, Response } from "express"
import fs from "fs"
import { writeFile } from "fs/promises"
import path from "path"
import { client } from "../core/client"
import { VAR_LOCALHSP } from "../core/vars"
import { Query, Scene } from "../gql/graphql"
import { FIND_SCENE_VARS } from "../queries/FindSceneQuery"
import { FIND_SCENE_SLIM_QUERY } from "../queries/FindSceneSlimQuery"
import {
	checkForErrors,
	decodeB64,
	fileExists,
	getBasename,
} from "../utils/utilities"

// TODO: Fetch from timestamp.trade?

const hspHspHandler = async (req: Request, res: Response) => {
	try {
		const { sceneId } = req.params
		if (!sceneId) {
			throw new Error("missing sceneId")
		}

		const queryResult = await client.query<Query>({
			query: FIND_SCENE_SLIM_QUERY,
			variables: { id: sceneId } as FIND_SCENE_VARS,
		})
		checkForErrors(queryResult.errors)
		const sceneData = queryResult.data.findScene

		if (!sceneData) {
			throw new Error("scene not found")
		}

		const hspPath = getHSPFile(sceneData)
		console.log("read hsp file:", hspPath)

		// TODO: Test this
		if (await fileExists(hspPath)) {
			res.setHeader(
				"Content-Disposition",
				`attachment; filename=${getBasename(hspPath)}`
			)
			fs.createReadStream(hspPath).pipe(res)
		} else {
			throw new Error(`Hsp file not found at ${hspPath}`)
		}
	} catch (err) {
		console.error(err)
		res.status(500).send({ error: (err as Error).message })
	}
}

export async function writeHSPFile(sceneId: string, dataB64: string) {
	try {
		const data = decodeB64(dataB64)
		const queryResult = await client.query<Query>({
			query: FIND_SCENE_SLIM_QUERY,
			variables: { id: sceneId } as FIND_SCENE_VARS,
		})
		checkForErrors(queryResult.errors)
		const sceneData = queryResult.data.findScene

		if (!sceneData) {
			throw new Error("scene not found")
		}

		const hspPath = getHSPFile(sceneData)
		console.log("write hsp file:", hspPath)

		await writeFile(hspPath, data)
	} catch (error) {
		console.error(error)
	}
}

export function getHSPFile(scene: Scene): string {
	if (!scene.files[0]) {
		throw new Error("no files for scene")
	}

	const pth = path.parse(scene.files[0].path)
	const PATH_DIR = VAR_LOCALHSP || pth.dir
	const PATH_NAME = VAR_LOCALHSP ? scene.id : pth.name

	return `${PATH_DIR}/${PATH_NAME}.hsp`
}
export async function hasHSPFile(scene: Scene) {
	return await fileExists(getHSPFile(scene))
}

export const hspPath = "/heresphere/hsp"
export function hspFileRoutes(app: Express) {
	app.get(`${hspPath}/:sceneId`, hspHspHandler)
}

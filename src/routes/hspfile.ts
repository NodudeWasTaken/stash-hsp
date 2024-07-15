import { Express, Request, Response } from "express"
import fs from "fs"
import { writeFile } from "fs/promises"
import path from "path"
import { client } from "../core/client"
import { VAR_LOCALHSP } from "../core/vars"
import { Query, Scene } from "../gql/graphql"
import { FIND_SCENE_SLIM_QUERY } from "../queries/FindSceneSlimQuery"
import { checkForErrors, fileExists } from "../utils/utilities"

// TODO: Can we do this
// If we run from docker we cant necessarily access said file

// But if we want to be compatible with stashplugins we need to do it like this
// Stash doesnt have an arbitrary read endpoint

const hspHspHandler = async (req: Request, res: Response) => {
	try {
		const { sceneId } = req.params

		const queryResult = await client.query<Query>({
			query: FIND_SCENE_SLIM_QUERY,
			variables: { id: sceneId },
		})
		checkForErrors(queryResult.errors)
		const sceneData = queryResult.data.findScene

		if (!sceneData) {
			throw new Error("scene not found")
		}

		if (sceneData.files.length === 0) {
			throw new Error("scene has no files")
		}

		const hspPath = getHSPFile(sceneData)

		if (await fileExists(hspPath)) {
			res.contentType("application/octet-stream")
			fs.createReadStream(hspPath).pipe(res)
		} else {
			throw new Error(`Hsp file not found at ${hspPath}`)
		}
	} catch (error) {
		console.error(error)
		return res.status(500).json(error)
	}
}

const decodeB64 = (b64: string) => Buffer.from(b64, "base64")
export async function writeHSPFile(sceneId: string, dataB64: string) {
	try {
		const data = decodeB64(dataB64)
		const queryResult = await client.query<Query>({
			query: FIND_SCENE_SLIM_QUERY,
			variables: { id: sceneId },
		})
		checkForErrors(queryResult.errors)
		const sceneData = queryResult.data.findScene

		if (!sceneData) {
			throw new Error("scene not found")
		}

		if (sceneData.files.length === 0) {
			throw new Error("scene has no files")
		}

		const hspPath = getHSPFile(sceneData)
		console.log("write hsp file:", hspPath)

		await writeFile(hspPath, data)
	} catch (error) {
		console.error(error)
	}
}

export function getHSPFile(scene: Scene): string {
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

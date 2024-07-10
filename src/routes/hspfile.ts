import { Express, Response } from "express"
import fs from "fs"
import path from "path"
import { HspRequest } from "../authmiddleware"
import { client } from "../client"
import { FIND_SCENE_SLIM_QUERY } from "../queries/query"
import { fileExists } from "../utilities"

// TODO: Can we do this
// If we run from docker we cant necessarily access said file

// But if we want to be compatible with stashplugins we need to do it like this
// Stash doesnt have an arbitrary read endpoint

const hspHspHandler = async (req: HspRequest, res: Response) => {
	try {
		const sceneId = req.params.sceneId

		const sceneQuery = await client.query({
			query: FIND_SCENE_SLIM_QUERY,
			variables: {
				id: sceneId,
			},
		})

		const sceneData = sceneQuery.data.findScene
		if (sceneData.files.length > 0) {
			const hspPath = getHSPFile(sceneData.files[0].path)

			if (await fileExists(hspPath)) {
				res.contentType("application/octet-stream")

				// Create a read stream and pipe it to the response
				const readStream = fs.createReadStream(hspPath)
				readStream.pipe(res)
			} else {
				throw new Error(`Hsp file not found at ${hspPath}`)
			}
		}
	} catch (error) {
		console.error(error)
		res.status(500).json(error)
	}
}

export function getHSPFile(file: string): string {
	const pth = path.parse(file)
	return `${pth.dir}/${pth.name}.hsp`
}

export async function hasHSPFile(file: string) {
	return await fileExists(getHSPFile(file))
}

export const hspPath = "/heresphere/hsp"
export function hspFileRoutes(app: Express) {
	app.get(`${hspPath}/:sceneId`, hspHspHandler)
}

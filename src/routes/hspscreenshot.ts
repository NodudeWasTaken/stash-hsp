import { Express, Request, Response } from "express"
import { dbimgtype, genImage, getImgQuery, getImgTransaction } from "./hspscan"

const hspScreenshotHandler = async (req: Request, res: Response) => {
	try {
		// TODO: With the amount of times i do this it should be generalized
		const { _sceneId } = req.params
		if (!_sceneId) {
			throw new Error("missing sceneId")
		}
		const sceneId = Number(_sceneId)

		// TODO: If not exist return "Not generated yet"

		// Downscale images
		const imgQuery = getImgQuery()
		const imgTransaction = getImgTransaction()

		if (!imgQuery.get(sceneId)) {
			await genImage(sceneId)
		}

		const file = getImgQuery().get(sceneId) as dbimgtype
		if (file) {
			// Set content type to image/jpeg or image/png based on your image
			res.contentType("image/jpeg") // Adjust content type based on your image type

			// Create a read stream and pipe it to the response
			res.send(Buffer.from(file.data))
		} else {
			throw new Error(`Image not found at ${sceneId}`)
		}
	} catch (err) {
		console.error(err)
		res.status(500).send({ error: (err as Error).message })
	}
}

export const screenshotPath = "/heresphere/screenshot"
export function hspScreenshotRoutes(app: Express) {
	app.get(`${screenshotPath}/:_sceneId`, hspScreenshotHandler)
}

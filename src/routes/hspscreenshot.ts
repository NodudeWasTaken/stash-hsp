import { Express, Request, Response } from "express"
import fs from "fs"
import {
	SCREENSHOT_MAXRES,
	slimit,
	STASH_URL,
	VAR_SCREENSHOT_DIR,
} from "../core/vars"
import { fetchAndResizeImage, fileExists } from "../utils/utilities"

const hspScreenshotHandler = async (req: Request, res: Response) => {
	try {
		// TODO: With the amount of times i do this it should be generalized
		const { sceneId } = req.params
		if (!sceneId) {
			throw new Error("missing sceneId")
		}

		const imagePath = `${VAR_SCREENSHOT_DIR}/${sceneId}.jpg`

		await slimit(() =>
			fetchAndResizeImage(
				`${STASH_URL}/scene/${sceneId}/screenshot`,
				imagePath,
				SCREENSHOT_MAXRES
			)
		)

		if (await fileExists(imagePath)) {
			// Set content type to image/jpeg or image/png based on your image
			res.contentType("image/jpeg") // Adjust content type based on your image type

			// Create a read stream and pipe it to the response
			fs.createReadStream(imagePath).pipe(res)
		} else {
			throw new Error(`Image not found at ${imagePath}`)
		}
	} catch (err) {
		console.error(err)
		res.status(500).send({ error: (err as Error).message })
	}
}

export const screenshotPath = "/heresphere/screenshot"
export function hspScreenshotRoutes(app: Express) {
	app.get(`${screenshotPath}/:sceneId`, hspScreenshotHandler)
}

import { Express, Response } from "express"
import fs from "fs"
import { HspRequest } from "../authmiddleware"
import { fetchAndResizeImage, fileExists } from "../utilities"
import { maxRes, slimit, STASH_URL, VAR_SCREENSHOT_DIR } from "../vars"

const hspScreenshotHandler = async (req: HspRequest, res: Response) => {
	try {
		const sceneId = Number(req.params.sceneId)

		const imagePath = `${VAR_SCREENSHOT_DIR}/${sceneId}.jpg`

		await slimit(() =>
			fetchAndResizeImage(
				`${STASH_URL}/scene/${sceneId}/screenshot`,
				imagePath,
				maxRes
			)
		)

		if (await fileExists(imagePath)) {
			// Set content type to image/jpeg or image/png based on your image
			res.contentType("image/jpeg") // Adjust content type based on your image type

			// Create a read stream and pipe it to the response
			const readStream = fs.createReadStream(imagePath)
			readStream.pipe(res)
		} else {
			throw new Error(`Image not found at ${imagePath}`)
		}
	} catch (error) {
		console.error(error)
		res.status(500).json(error)
	}
}

export const screenshotPath = "/heresphere/screenshot"
export function hspScreenshotRoutes(app: Express) {
	app.get(`${screenshotPath}/:sceneId`, hspScreenshotHandler)
}

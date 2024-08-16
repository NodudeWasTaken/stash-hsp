import { eq } from "drizzle-orm"
import { Express, Request, Response } from "express"
import { db } from "../core/vars"
import { images } from "../db/schema"

const hspScreenshotHandler = async (req: Request, res: Response) => {
	try {
		// TODO: With the amount of times i do this it should be generalized
		const { sceneId } = req.params
		if (!sceneId) {
			throw new Error("missing sceneId")
		}

		// TODO: If not exist return "Not generated yet"

		const file = await db
			.select()
			.from(images)
			.where(eq(images.id, Number(sceneId)))
			.get()
		if (file) {
			// Set content type to image/jpeg or image/png based on your image
			res.contentType("image/jpeg") // Adjust content type based on your image type

			// Create a read stream and pipe it to the response
			res.send(Buffer.from(file.data as string))
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
	app.get(`${screenshotPath}/:sceneId`, hspScreenshotHandler)
}

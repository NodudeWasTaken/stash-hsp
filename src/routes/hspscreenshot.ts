import express, { Express, Request, Response } from "express";
import { maxRes, slimit, STASH_URL, VAR_SCREENSHOT_DIR } from "../vars";
import { fetchAndResizeImage } from "../utilities";
import fs from 'fs';
import { HspRequest } from "../authmiddleware";

const hspScreenshotHandler = async (req: HspRequest, res: Response) => {
	try {
		const sceneId = Number(req.params.sceneId)

		const imagePath = `${VAR_SCREENSHOT_DIR}/${sceneId}.jpg`;

		await slimit(() => fetchAndResizeImage(
			`${STASH_URL}/scene/${sceneId}/screenshot`, 
			imagePath,
			maxRes
		))

		if (fs.existsSync(imagePath)) {
			// Read the image file
			const image = fs.readFileSync(imagePath);

			// Set content type to image/jpeg or image/png based on your image
			res.contentType('image/jpeg'); // Adjust content type based on your image type

			// Return the image as a response
			res.send(image);
		} else {
			throw new Error(`Image not found at ${imagePath}`);
		}
	} catch (error) {
		console.error(error)
		res.status(500).json(error)
	}
};

export function hspScreenshotRoutes(app: Express) {
	app.get("/heresphere/video/:sceneId/screenshot", hspScreenshotHandler);
}

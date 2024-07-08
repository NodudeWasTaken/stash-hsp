import path from 'path';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { writeFile, access, mkdir } from 'fs/promises';
import { constants } from 'fs';
import { dirname } from 'path';
import fs from 'fs';
import axios from 'axios';

export var VR_TAG = "Virtual Reality"

export function getBasename(filePath: string): string {
	return path.basename(filePath);
}

export function ensureDirectoryExists(directoryPath: string): void {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
    }
}

export async function checkUrl(url: string) {
	const response = await axios.get(url);
	if (response.status !== 200) {
		throw Error(`URL ${url} returned status ${response.status}.`);
	}
	if (response.data.length === 0) {
		throw Error(`URL ${url} was empty.`);
	}
}

export async function fetchAndResizeImage(imageUrl: string, outputPath: string, maxDimension: number) {
    try {
		// Check if the output file already exists
		try {
			await access(outputPath, constants.F_OK);
			//console.log(`File ${outputPath} already exists. Skipping download and resize.`);
			return;
		} catch {
			// File does not exist, proceed with downloading and resizing
		}

        // Fetch the image
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image from ${imageUrl}`);
        }

        // Read the image data as a buffer
        const imageBuffer = await response.buffer();

        // Use sharp to resize the image
        const image = sharp(imageBuffer);
        const metadata = await image.metadata();

        // Determine new dimensions while maintaining the aspect ratio
        const aspectRatio = metadata.width! / metadata.height!;
        let width, height;
        if (metadata.width! > metadata.height!) {
            width = maxDimension;
            height = Math.round(maxDimension / aspectRatio);
        } else {
            height = maxDimension;
            width = Math.round(maxDimension * aspectRatio);
        }

        // Resize the image
        const resizedImageBuffer = await image.resize(width, height).toBuffer();

        // Save the resized image to the specified output path
        await writeFile(outputPath, resizedImageBuffer);
        console.log(`Image saved to ${outputPath}`);
    } catch (error) {
        console.error('Error processing the image:', error);
    }
}

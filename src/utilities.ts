import fs, { constants } from "fs"
import { access } from "fs/promises"
import path from "path"
import sharp from "sharp"
import { HspRequest } from "./authmiddleware"
import { axiosInstance as axios } from "./client"

export function getBasename(filePath: string): string {
	return path.basename(filePath)
}

export function getBaseURL(req: HspRequest) {
	return `${req.protocol}://${req.get("host")}`
}

export function ensureDirectoryExists(directoryPath: string): void {
	if (!fs.existsSync(directoryPath)) {
		fs.mkdirSync(directoryPath, { recursive: true })
	}
}

export function buildUrl(
	baseUrl: string,
	params: Record<string, string>
): string {
	const url = new URL(baseUrl)
	const searchParams = new URLSearchParams()

	// Iterate over each key-value pair in params and append to searchParams
	Object.keys(params).forEach((key) => {
		searchParams.append(key, params[key])
	})

	// Append the serialized query parameters to the URL's search
	url.search = searchParams.toString()

	return url.toString()
}

export function formatDate(dateString: string): string {
	// Parse the date string into a Date object
	const date = new Date(dateString)

	// Extract the year, month, and day
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0") // Months are zero-based
	const day = String(date.getDate()).padStart(2, "0")

	// Format the date as "year-month-day"
	return `${year}-${month}-${day}`
}

// Function to get the age of a file in milliseconds
export function getFileAge(filePath: string): number {
	const stats = fs.statSync(filePath)
	const currentTime = new Date().getTime()
	const fileTime = stats.mtime.getTime()
	return currentTime - fileTime
}
export function getFileAgeDays(filePath: string): number {
	return getFileAge(filePath) / (1000 * 60 * 60 * 24)
}

export async function checkUrl(url: string) {
	const response = await axios.get(url)
	if (response.status !== 200) {
		throw Error(`URL ${url} returned status ${response.status}.`)
	}
	if (response.data.length === 0) {
		throw Error(`URL ${url} was empty.`)
	}
}

export async function fileExists(path: string) {
	try {
		await access(path, constants.F_OK)
		return true
	} catch {
		// File does not exist
		return false
	}
}

export async function fetchAndResizeImage(
	imageUrl: string,
	outputPath: string,
	maxDimension: number
) {
	// Check if the output file already exists
	if (await fileExists(outputPath)) {
		//console.log(`File ${outputPath} already exists. Skipping download and resize.`);
		return
	}

	// Fetch the image
	const response = await axios.get(imageUrl, { responseType: "arraybuffer" })
	if (response.status !== 200) {
		throw new Error(`Failed to fetch image from ${imageUrl}`)
	}

	// Use sharp to resize the image
	const image = sharp(response.data)
	const metadata = await image.metadata()

	// Determine new dimensions while maintaining the aspect ratio
	const aspectRatio = metadata.width! / metadata.height!
	let width, height
	if (metadata.width! > metadata.height!) {
		width = maxDimension
		height = Math.round(maxDimension / aspectRatio)
	} else {
		height = maxDimension
		width = Math.round(maxDimension * aspectRatio)
	}

	// Resize the image and save
	await image.resize(width, height).toFile(outputPath)

	console.log(`Image saved to ${outputPath}`)
}

import { Request } from "express"
import fs, { constants } from "fs"
import { access, readFile } from "fs/promises"
import { GraphQLError } from "graphql/error"
import path from "path"
import sharp from "sharp"
import { fetcher } from "../core/client"
import { SqlQueryResult } from "../gql/graphql"

export const decodeB64 = (b64: string) => Buffer.from(b64, "base64")
// TODO: add graphql.error for apolloerror
export const checkForErrors = (errors?: readonly GraphQLError[]): void => {
	if (errors && errors.length > 0) {
		throw new Error(`GraphQL Errors:${errors}`)
	}
}

export const randomUInt = () => {
	return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER + 0)
}

export function getBasename(filePath: string): string {
	return path.basename(filePath)
}

export function replaceExt(filePath: string, ext: string): string {
	return path.basename(filePath, path.extname(filePath)) + ext
}

export function getBaseURL(req: Request) {
	return `${req.protocol}://${req.get("host")}`
}

export function ensureDirectoryExists(directoryPath: string): void {
	if (!fs.existsSync(directoryPath)) {
		fs.mkdirSync(directoryPath, { recursive: true })
	}
}

export function buildUrl(baseUrl: string, params: Record<string, string>): URL {
	const url = new URL(baseUrl)

	// Iterate over each key-value pair in params and append to searchParams
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.append(key, value)
	}

	return url
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

export function randomizeList<T>(unshuffled: T[]): T[] {
	return unshuffled
		.map((value) => ({ value, sort: Math.random() }))
		.sort((a, b) => a.sort - b.sort)
		.map(({ value }) => value)
}

export async function readJsonFile(path: string) {
	const file = await readFile(path, "utf8")
	return JSON.parse(file)
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
	maxDimension: number
): Promise<sharp.Sharp> {
	// Fetch the image
	const response = await fetcher(imageUrl)
	if (!response.ok) {
		throw new Error(
			`Failed to fetch image from ${imageUrl}: ${response.status}`
		)
	}

	// Read the image data as a buffer
	const imageBuffer = await response.buffer()

	// Use sharp to resize the image
	const image = sharp(imageBuffer)
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
	return image.resize(width, height)
}

type SqlDict = { [key: string]: any }
export function fixSqlReturn(queryResult: SqlQueryResult): SqlDict[] {
	// Convert rows to array of objects
	return queryResult.rows.map((row: any) => {
		return queryResult.columns.reduce((acc: any, column: any, index: any) => {
			acc[column] = row[index]
			return acc
		}, {} as SqlDict)
	})
}

import { ApolloError } from "@apollo/client/core"
import { ServerError } from "@apollo/client/link/utils/index.js"
import pLimit from "p-limit"
import { ConfigResult, Query, Tag } from "../gql/graphql"
import { CONFIG_QUERY } from "../queries/ConfigurationQuery"
import { FIND_TAGS_QUERY } from "../queries/FindTagsQuery"
import { genScanDB } from "../routes/hspscan"
import { checkForErrors } from "../utils/utilities"
import { client } from "./client"

// User vars
export const DEBUG_MODE = process.env["DEBUG"]
export const VAR_PORT = process.env["PORT"] || 3000
export const STASH_URL = process.env["STASH_URL"] || "http://127.0.0.1:9999"
export var STASH_APIKEY = process.env["STASH_APIKEY"] || ""
export const VAR_LOGS_DIR = process.env["LOGS_DIR"] || "./logs"
export const VAR_SCREENSHOT_DIR =
	process.env["SCREENSHOTS_DIR"] || "./screenshots"
export const VAR_CACHE_DIR = process.env["CACHE_DIR"] || "./cache"
const VAR_FAVORITE_TAG = process.env["FAVORITE_TAG"] || "Favorites"
export const VAR_SCALELIMIT = process.env["SCALE_PROCESS_LIMIT"] || "8"
export const VAR_RLIMIT = process.env["REQUEST_PROCESS_LIMIT"] || "20"
// m h dom mon dow
export const VAR_SCANCACHE_CRON = process.env["SCANCACHE_CRON"] || "0 6 * * *"
export const VAR_LOCALHSP = process.env["LOCALHSP"] || false
export const VAR_MULTITRACK_MARKERS = process.env["MULTITRACK_MARKERS"] || false

// System vars
export var VAR_UICFG: ConfigResult
export var VAR_FAVTAG: Tag | undefined

export var NEEDS_AUTH: boolean // We should require user-auth (no APIKEY supplied)
export var INITIAL_FETCH: boolean // We have fetched initial data like apikey, tags, etc.

export const SCREENSHOT_MAXRES = 480

export const slimit = pLimit(Number(VAR_SCALELIMIT))
export const rlimit = pLimit(Number(VAR_RLIMIT))

export const ENABLE_EXPERIMENTAL_AUTH = DEBUG_MODE || false
export const SCANDB = `${VAR_CACHE_DIR}/scan.json`

// Type guard to check if the network error is a ServerError
function isServerError(error: any): error is ServerError {
	return error && typeof error.statusCode === "number"
}

export async function _SET_APIKEY(apikey: any) {
	STASH_APIKEY = apikey

	// Run getVrTag as validator, then run the setter
	return getVrTag().then(() => tryAuth())
}

export async function tryAuth() {
	try {
		await getVrTag()
		INITIAL_FETCH = true

		console.log(`Generating scan.json in 10 seconds`)

		setTimeout(() => {
			genScanDB(true)
		}, 10000)
	} catch (error) {
		NEEDS_AUTH = true
		console.error("failed to contact stash:", error)
		if (error instanceof ApolloError && isServerError(error.networkError)) {
			const networkError = error.networkError as ServerError
			if (networkError.statusCode === 401) {
				console.warn("Stash needs auth")
				INITIAL_FETCH = false
				if (!ENABLE_EXPERIMENTAL_AUTH) {
					throw error // TODO: Temporary until auth works
				}
				return
			}
		}

		throw error
	}
}

export async function getVrTag() {
	try {
		const queryResult = await client.query<Query>({
			query: CONFIG_QUERY,
		})
		checkForErrors(queryResult.errors)

		VAR_UICFG = queryResult.data.configuration

		if (VAR_FAVORITE_TAG) {
			const qResult = await client.query<Query>({
				query: FIND_TAGS_QUERY,
				variables: {
					filter: {
						per_page: -1,
					},
					tag_filter: {
						name: {
							value: VAR_FAVORITE_TAG,
							modifier: "EQUALS",
						},
					},
				},
			})
			checkForErrors(qResult.errors)
			var tagData = qResult.data.findTags.tags

			if (tagData.length > 0) {
				VAR_FAVTAG = tagData[0]
			}
		}
	} catch (error) {
		if (error instanceof ApolloError) {
			if (error.networkError) {
				if ((<ServerError>error.networkError).result) {
					// This is an HTTP status code error
					console.error("HTTP error:", (<ServerError>error.networkError).result)
				} else {
					// This is a connection error
					console.error("Network error:", error.networkError.message)
				}
			} else if (error.graphQLErrors.length > 0) {
				// This is a GraphQL error
				console.error("GraphQL error:", error.graphQLErrors)
			} else {
				// Some other type of error
				console.error("Unexpected error:", error)
			}
		} else {
			// Some other type of error (e.g., TypeScript error)
			console.error("Non-Apollo error:", error)
		}
		throw error
	}
}

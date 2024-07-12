import { ApolloError } from "@apollo/client/core"
import { ServerError } from "@apollo/client/link/utils/index.js"
import pLimit from "p-limit"
import { ConfigResult, Query, Tag } from "../gql/graphql"
import { CONFIG_QUERY } from "../queries/ConfigurationQuery"
import { FIND_TAGS_QUERY } from "../queries/FindTagsQuery"
import { client } from "./client"

export var VAR_UICFG: ConfigResult
export var VAR_FAVTAG: Tag | undefined

export const maxRes = 480

export const DEBUG_MODE = process.env.DEBUG
export const VAR_PORT = process.env.PORT || 3000
export const STASH_URL = process.env.STASH_URL || "http://127.0.0.1:9999"
export const STASH_APIKEY = process.env.STASH_APIKEY || "" // TODO: .
export const VAR_SCREENSHOT_DIR = process.env.SCREENSHOTS_DIR || "./screenshots"
export const VAR_CACHE_DIR = process.env.CACHE_DIR || "./cache"
export const VAR_FAVORITE_TAG = process.env.FAVORITE_TAG || "Favorites"
export const VAR_SCALELIMIT = process.env.SCALE_PROCESS_LIMIT || "8"
export const VAR_RLIMIT = process.env.REQUEST_PROCESS_LIMIT || "20"
// m h dom mon dow
export const VAR_SCANCACHE_CRON = process.env.SCANCACHE_CRON || "0 6 * * *"
export const slimit = pLimit(Number(VAR_SCALELIMIT))
export const rlimit = pLimit(Number(VAR_RLIMIT))

export async function getVrTag() {
	try {
		const queryResult = await client.query<Query>({
			query: CONFIG_QUERY,
		})

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

import {
	ApolloClient,
	ApolloLink,
	HttpLink,
	InMemoryCache,
	NormalizedCacheObject,
} from "@apollo/client/core"
import fetch from "node-fetch"
import { STASH_APIKEY, STASH_URL } from "./vars"

export const StashApiKeyHeader = "ApiKey"
export const StashApiKeyParameter = "apikey"

export var client: ApolloClient<NormalizedCacheObject>

export async function fetcher(url: any, options?: any) {
	const update = { ...options }
	update.headers = {
		...update.headers,
		[StashApiKeyHeader]: STASH_APIKEY,
	}
	return fetch(url, update)
}

export function initClient() {
	const httpLink = new HttpLink({
		uri: `${STASH_URL}/graphql`,
		fetch: fetch as any,
	})

	// Add headers to each request
	const authMiddleware = new ApolloLink((operation, forward) => {
		// Modify the operation context with a new header
		operation.setContext({
			headers: {
				[StashApiKeyHeader]: STASH_APIKEY,
				// Add other headers as needed
			},
		})

		return forward(operation)
	})

	client = new ApolloClient({
		link: authMiddleware.concat(httpLink),
		cache: new InMemoryCache(),
	})
}

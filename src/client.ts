import {
	ApolloClient,
	ApolloLink,
	HttpLink,
	InMemoryCache,
	NormalizedCacheObject,
} from "@apollo/client"
import axios, { AxiosInstance } from "axios"
import fetch from "cross-fetch" // For making fetch compatible with Node.js
import { STASH_APIKEY, STASH_URL } from "./vars"

export const StashApiKeyHeader = "ApiKey"
export const StashApiKeyParameter = "apikey"

export var client: ApolloClient<NormalizedCacheObject>
export var axiosInstance: AxiosInstance

export function initClient() {
	const httpLink = new HttpLink({
		uri: `${STASH_URL}/graphql`,
		fetch, // Use cross-fetch for Node.js compatibility
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
	axiosInstance = axios.create({
		headers: {
			[StashApiKeyHeader]: STASH_APIKEY,
		},
	})
}

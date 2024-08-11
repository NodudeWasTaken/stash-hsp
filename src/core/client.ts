import {
	ApolloClient,
	DefaultOptions,
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

// See: https://www.apollographql.com/docs/react/data/queries/#supported-fetch-policies
const customOptions: DefaultOptions = {
	watchQuery: {
		fetchPolicy: "no-cache",
		errorPolicy: "ignore",
	},
	query: {
		fetchPolicy: "no-cache",
		errorPolicy: "all",
	},
	mutate: {
		errorPolicy: "all",
	},
}
export function initClient() {
	const httpLink = new HttpLink({
		uri: `${STASH_URL}/graphql`,
		fetch: fetcher as any,
	})

	client = new ApolloClient({
		link: httpLink,
		cache: new InMemoryCache(),
		defaultOptions: customOptions,
	})
}

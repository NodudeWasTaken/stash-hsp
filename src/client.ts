import { ApolloClient, InMemoryCache } from "@apollo/client"
import { STASH_URL } from "./vars"

export const client = new ApolloClient({
	uri: `${STASH_URL}/graphql`,
	cache: new InMemoryCache(),
})

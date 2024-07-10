import { client } from "../core/client"
import { SCENE_UPDATE_MUTATION } from "../queries/query"
import { writeHSPFile } from "../routes/hspfile"
import { HeresphereAuthReq } from "./heresphere_structs"

export const hspDataUpdate = async (
	sceneId: string,
	authreq: HeresphereAuthReq
) => {
	var input: {
		id: string
		rating100?: number
	} = {
		id: sceneId,
	}

	if (authreq.rating) {
		// TODO: Set null on remove
		input.rating100 = authreq.rating * 20
	}
	if (authreq.isFavorite) {
		// TODO: VAR_FAVORITE_TAG
		console.debug("dataUpdate: isFavorite")
	}
	if (authreq.tags) {
		for (let tag of authreq.tags) {
			console.debug("tag:", tag)
		}
		console.debug("dataUpdate: tags")
	}
	if (authreq.hspBase64) {
		await writeHSPFile(sceneId, authreq.hspBase64)
	}

	if (Object.keys(input).length > 1) {
		console.debug("dataUpdate:", input)
		await client.mutate({
			mutation: SCENE_UPDATE_MUTATION,
			variables: {
				input: input,
			},
		})
	}
}

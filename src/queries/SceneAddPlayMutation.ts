import { gql } from '@apollo/client/core';

export const SCENE_ADD_PLAY_MUTATION = gql`
mutation SceneAddPlay($id: ID!, $times: [Timestamp!]) {
	sceneAddPlay(id: $id, times: $times) {
	  count
	  history
	  __typename
	}
  }`
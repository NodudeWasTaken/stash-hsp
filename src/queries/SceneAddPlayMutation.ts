import { gql } from '@apollo/client/core';
import { Scalars } from '../gql/graphql';

export interface SCENE_ADD_PLAY_VARS { 
	id: Scalars["ID"]["input"], 
	times: Scalars["Timestamp"]["input"], 
}
export const SCENE_ADD_PLAY_MUTATION = gql`
mutation SceneAddPlay($id: ID!, $times: [Timestamp!]) {
	sceneAddPlay(id: $id, times: $times) {
	  count
	  history
	  __typename
	}
  }`
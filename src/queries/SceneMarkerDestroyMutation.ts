import { gql } from '@apollo/client/core';
import { Scalars } from '../gql/graphql';

export interface SCENE_MARKER_DESTROY_VARS { 
	id: Scalars["ID"]["input"], 
}
export const SCENE_MARKER_DESTROY_MUTATION = gql`
mutation SceneMarkerDestroy($id: ID!) {
	sceneMarkerDestroy(id: $id)
  }`
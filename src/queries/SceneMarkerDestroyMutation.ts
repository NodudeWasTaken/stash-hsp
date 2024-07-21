import { gql } from '@apollo/client/core';

export const SCENE_MARKER_DESTROY_MUTATION = gql`
mutation SceneMarkerDestroy($id: ID!) {
	sceneMarkerDestroy(id: $id)
  }`
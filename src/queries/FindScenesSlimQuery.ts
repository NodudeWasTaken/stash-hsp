import { gql } from '@apollo/client/core';
import { FindScenesResultType, SavedFilter } from '../gql/graphql';

export const FIND_SCENES_SLIM_QUERY = gql`
query FindScenes($filter: FindFilterType, $scene_filter: SceneFilterType, $scene_ids: [Int!]) {
    findScenes(filter: $filter, scene_filter: $scene_filter, scene_ids: $scene_ids) {
      count
      filesize
      duration
      scenes {
        ...ReallySlimSceneData
        __typename
      }
      __typename
    }
  }
  
  fragment ReallySlimSceneData on Scene {
    id
  }`
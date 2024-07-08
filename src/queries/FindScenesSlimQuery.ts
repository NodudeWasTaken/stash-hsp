import { gql } from '@apollo/client';

const query = gql`
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
  
  export { query }
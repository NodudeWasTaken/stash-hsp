import { gql } from '@apollo/client/core';
import { FindFilterType, Scalars, SceneFilterType } from '../gql/graphql';

export interface FIND_SCENES_VARS { 
	filter: FindFilterType, 
	scene_filter: SceneFilterType,
	scene_ids: Scalars["Int"]["input"][],
}
export const FIND_SCENES_QUERY = gql`
query FindScenes($filter: FindFilterType, $scene_filter: SceneFilterType, $scene_ids: [Int!]) {
    findScenes(filter: $filter, scene_filter: $scene_filter, scene_ids: $scene_ids) {
      count
      filesize
      duration
      scenes {
        ...SlimSceneData
        __typename
      }
      __typename
    }
  }
  
  fragment VideoFileData on VideoFile {
    id
    path
    size
    mod_time
    duration
    video_codec
    audio_codec
    width
    height
    frame_rate
    bit_rate
    fingerprints {
      type
      value
      __typename
    }
    __typename
  }`
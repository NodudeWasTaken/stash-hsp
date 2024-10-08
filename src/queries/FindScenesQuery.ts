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
  
  fragment SlimSceneData on Scene {
    id
    title
    code
    details
    director
    urls
    date
    rating100
    o_counter
    organized
    interactive
    interactive_speed
	created_at
	updated_at
	resume_time
	last_played_at
	play_duration
	play_count
    files {
      ...VideoFileData
      __typename
    }
    paths {
      screenshot
      preview
      stream
      webp
      vtt
      sprite
      funscript
      interactive_heatmap
      caption
      __typename
    }
    scene_markers {
      id
      title
      seconds
      primary_tag {
        id
        name
        __typename
      }
      __typename
    }
    galleries {
      id
      files {
        path
        __typename
      }
      folder {
        path
        __typename
      }
      title
      __typename
    }
    studio {
      id
      name
      image_path
      __typename
    }
    groups {
      group {
        id
        name
        front_image_path
        __typename
      }
      scene_index
      __typename
    }
    tags {
      id
      name
      __typename
    }
    performers {
      id
      name
      disambiguation
      gender
      favorite
      image_path
      __typename
    }
    stash_ids {
      endpoint
      stash_id
      __typename
    }
    __typename
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
import { gql } from '@apollo/client/core';

export const FIND_SCENE_SLIM_QUERY = gql`
query FindScene($id: ID!, $checksum: String) {
	findScene(id: $id, checksum: $checksum) {
	  ...SceneDataSlim
	  __typename
	}
  }
  
  fragment SceneDataSlim on Scene {
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
	play_history
	o_history
	files {
	  ...VideoFileData
	  __typename
	}
	tags {
	  ...SlimTagData
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
  }
`
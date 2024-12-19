import { gql } from '@apollo/client/core';
import { Scalars } from '../gql/graphql';

export interface FIND_SCENE_VARS { 
	id: Scalars["ID"]["input"], 
	checksum: String 
}
export const FIND_SCENE_QUERY = gql`
query FindScene($id: ID!, $checksum: String) {
	findScene(id: $id, checksum: $checksum) {
	  ...SceneData
	  __typename
	}
  }
  
  fragment SceneData on Scene {
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
	captions {
	  language_code
	  caption_type
	  __typename
	}
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
	  ...SceneMarkerData
	  __typename
	}
	galleries {
	  ...SlimGalleryData
	  __typename
	}
	studio {
	  ...SlimStudioData
	  __typename
	}
	groups {
	  group {
		...GroupData
		__typename
	  }
	  scene_index
	  __typename
	}
	tags {
	  ...SlimTagData
	  __typename
	}
	performers {
	  ...PerformerData
	  __typename
	}
	stash_ids {
	  endpoint
	  stash_id
	  __typename
	}
	sceneStreams {
	  url
	  mime_type
	  label
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
  
  fragment SceneMarkerData on SceneMarker {
	id
	title
	seconds
	stream
	preview
	screenshot
	scene {
	  id
	  __typename
	}
	primary_tag {
	  id
	  name
	  __typename
	}
	tags {
	  id
	  name
	  __typename
	}
	__typename
  }
  
  fragment SlimGalleryData on Gallery {
	id
	title
	code
	date
	urls
	details
	photographer
	rating100
	organized
	files {
	  ...GalleryFileData
	  __typename
	}
	folder {
	  ...FolderData
	  __typename
	}
	image_count
	cover {
	  id
	  files {
		...ImageFileData
		__typename
	  }
	  paths {
		thumbnail
		__typename
	  }
	  __typename
	}
	chapters {
	  id
	  title
	  image_index
	  __typename
	}
	studio {
	  id
	  name
	  image_path
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
	  gender
	  favorite
	  image_path
	  __typename
	}
	scenes {
	  ...SlimSceneData
	  __typename
	}
	__typename
  }
  
  fragment GalleryFileData on GalleryFile {
	id
	path
	size
	mod_time
	fingerprints {
	  type
	  value
	  __typename
	}
	__typename
  }
  
  fragment FolderData on Folder {
	id
	path
	__typename
  }
  
  fragment ImageFileData on ImageFile {
	id
	path
	size
	mod_time
	width
	height
	fingerprints {
	  type
	  value
	  __typename
	}
	__typename
  }

  fragment SlimStudioData on Studio {
	id
	name
	image_path
	stash_ids {
	  endpoint
	  stash_id
	  __typename
	}
	parent_studio {
	  id
	  __typename
	}
	details
	rating100
	aliases
	tags {
	  id
	  name
	  __typename
	}
	__typename
  }
  
  fragment GroupData on Group {
	id
	name
	aliases
	duration
	date
	rating100
	director
	studio {
	  ...SlimStudioData
	  __typename
	}
	tags {
	  ...SlimTagData
	  __typename
	}
	synopsis
	urls
	front_image_path
	back_image_path
	scene_count
	scenes {
	  id
	  title
	  __typename
	}
	__typename
  }
`
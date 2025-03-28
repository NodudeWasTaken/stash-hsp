import { gql } from '@apollo/client/core';

// TODO: .
export const SHARED_FRAGMENTS = gql`
  fragment SlimTagData on Tag {
	id
	name
	aliases
	image_path
	parent_count
	child_count
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

  fragment PerformerData on Performer {
	id
	name
	disambiguation
	urls
	gender
	birthdate
	ethnicity
	country
	eye_color
	height_cm
	measurements
	fake_tits
	penis_length
	circumcised
	career_length
	tattoos
	piercings
	alias_list
	favorite
	ignore_auto_tag
	image_path
	scene_count
	image_count
	gallery_count
	group_count
	performer_count
	o_counter
	tags {
	  ...SlimTagData
	  __typename
	}
	stash_ids {
	  stash_id
	  endpoint
	  __typename
	}
	rating100
	details
	death_date
	hair_color
	weight
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
	  interactive
	  paths {
		funscript
		__typename
	  }
      files {
        ...VideoFileData
        __typename
      }
	  groups {
		scene_index
		__typename
	  }
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
`
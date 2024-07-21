import { gql } from '@apollo/client/core';

export const FIND_STUDIOS_QUERY = gql`
query FindStudios($filter: FindFilterType, $studio_filter: StudioFilterType) {
	findStudios(filter: $filter, studio_filter: $studio_filter) {
	  count
	  studios {
		...StudioData
		__typename
	  }
	  __typename
	}
  }
  
  fragment StudioData on Studio {
	id
	name
	url
	parent_studio {
	  id
	  name
	  url
	  image_path
	  __typename
	}
	child_studios {
	  id
	  name
	  image_path
	  __typename
	}
	ignore_auto_tag
	image_path
	scene_count
	scene_count_all: scene_count(depth: -1)
	image_count
	image_count_all: image_count(depth: -1)
	gallery_count
	gallery_count_all: gallery_count(depth: -1)
	performer_count
	performer_count_all: performer_count(depth: -1)
	group_count
	group_count_all: group_count(depth: -1)
	stash_ids {
	  stash_id
	  endpoint
	  __typename
	}
	details
	rating100
	favorite
	aliases
	tags {
	  ...SlimTagData
	  __typename
	}
	__typename
  }
  
  fragment SlimTagData on Tag {
	id
	name
	aliases
	image_path
	parent_count
	child_count
	__typename
  }`
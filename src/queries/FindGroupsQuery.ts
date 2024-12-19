import { gql } from '@apollo/client/core';

export const FIND_GROUPS_QUERY = gql`
query FindGroups($filter: FindFilterType, $group_filter: GroupFilterType) {
	findGroups(filter: $filter, group_filter: $group_filter) {
	  count
	  groups {
		...GroupData
		__typename
	  }
	  __typename
	}
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
  
  fragment SlimTagData on Tag {
	id
	name
	aliases
	image_path
	parent_count
	child_count
	__typename
  }`
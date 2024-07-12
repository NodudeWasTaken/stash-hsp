import { gql } from '@apollo/client/core';
import { Maybe, Tag } from '../gql/graphql';

export const FIND_TAG_QUERY = gql`
query FindTag($id: ID!) {
	findTag(id: $id) {
	  ...TagData
	  __typename
	}
  }
  
  fragment TagData on Tag {
	id
	name
	description
	aliases
	ignore_auto_tag
	favorite
	image_path
	scene_count
	scene_count_all: scene_count(depth: -1)
	scene_marker_count
	scene_marker_count_all: scene_marker_count(depth: -1)
	image_count
	image_count_all: image_count(depth: -1)
	gallery_count
	gallery_count_all: gallery_count(depth: -1)
	performer_count
	performer_count_all: performer_count(depth: -1)
	studio_count
	studio_count_all: studio_count(depth: -1)
	group_count
	group_count_all: group_count(depth: -1)
	parents {
	  ...SlimTagData
	  __typename
	}
	children {
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
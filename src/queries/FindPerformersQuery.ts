import { gql } from '@apollo/client/core';

export const FIND_PERFORMERS_QUERY = gql`
query FindPerformers($filter: FindFilterType, $performer_filter: PerformerFilterType, $performer_ids: [Int!]) {
	findPerformers(
	  filter: $filter
	  performer_filter: $performer_filter
	  performer_ids: $performer_ids
	) {
	  count
	  performers {
		...PerformerData
		__typename
	  }
	  __typename
	}
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
  
  fragment SlimTagData on Tag {
	id
	name
	aliases
	image_path
	parent_count
	child_count
	__typename
  }`
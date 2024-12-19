import { gql } from '@apollo/client/core';

export const FIND_TAGS_SLIM_QUERY = gql`
query FindTags($filter: FindFilterType, $tag_filter: TagFilterType) {
	findTags(filter: $filter, tag_filter: $tag_filter) {
	  count
	  tags {
		...SlimTagData
		__typename
	  }
	  __typename
	}
  }
  
  fragment SlimTagData on Tag {
	id
  }`
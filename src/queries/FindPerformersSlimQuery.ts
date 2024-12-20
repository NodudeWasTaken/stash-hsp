import { gql } from '@apollo/client/core';

export const FIND_PERFORMERS_SLIM_QUERY = gql`
query FindPerformers($filter: FindFilterType, $performer_filter: PerformerFilterType, $performer_ids: [Int!]) {
	findPerformers(
	  filter: $filter
	  performer_filter: $performer_filter
	  performer_ids: $performer_ids
	) {
	  count
	  performers {
		...SlimPerformerData
		__typename
	  }
	  __typename
	}
  }
  
  fragment SlimPerformerData on Performer {
	id
  }`
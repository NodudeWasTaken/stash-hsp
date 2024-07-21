import { gql } from '@apollo/client/core';

export const FIND_STUDIOS_SLIM_QUERY = gql`
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
  }`
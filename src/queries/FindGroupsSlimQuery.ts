import { gql } from '@apollo/client/core';

export const FIND_GROUPS_SLIM_QUERY = gql`
query FindGroups($filter: FindFilterType, $group_filter: GroupFilterType) {
	findGroups(filter: $filter, group_filter: $group_filter) {
	  count
	  groups {
		...SlimGroupData
		__typename
	  }
	  __typename
	}
  }
  
  fragment SlimGroupData on Group {
	id
  }`
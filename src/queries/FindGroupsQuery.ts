import { gql } from '@apollo/client/core';
import { FindFilterType, GroupFilterType, Scalars } from '../gql/graphql';

export interface FIND_GROUPS_VARS { 
	group_filter: GroupFilterType
	filter: FindFilterType
	ids: Scalars["ID"]["input"][]
}
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
`
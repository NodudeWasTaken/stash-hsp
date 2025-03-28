import { gql } from '@apollo/client/core';
import { FindFilterType, GroupFilterType, Scalars } from '../gql/graphql';

export interface FIND_GROUP_VARS { 
	id: Scalars["ID"]["input"]
}
export const FIND_GROUP_QUERY = gql`
query FindGroup($id: ID!) {
	findGroup(id: $id) {
		...GroupData
		__typename
	}
  }
`
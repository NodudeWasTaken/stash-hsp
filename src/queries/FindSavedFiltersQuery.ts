import { gql } from '@apollo/client/core';
import { FilterMode } from '../gql/graphql';

export interface FIND_SAVED_FILTERS_VARS { 
	mode: FilterMode
}
export const FIND_SAVED_FILTERS_QUERY = gql`
query FindSavedFilters($mode: FilterMode) {
    findSavedFilters(mode: $mode) {
      ...SavedFilterData
      __typename
    }
  }
  
  fragment SavedFilterData on SavedFilter {
    id
    mode
    name
    find_filter {
      q
      page
      per_page
      sort
      direction
      __typename
    }
    object_filter
    ui_options
    __typename
  }`
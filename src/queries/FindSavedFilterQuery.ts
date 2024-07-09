import { gql } from '@apollo/client/core';

const query = gql`
query FindSavedFilter($id: ID!) {
  findSavedFilter(id: $id) {
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
}
`

export { query }
import { gql } from '@apollo/client/core';
import { FindFilterType, SceneMarkerFilterType } from '../gql/graphql';

export interface FIND_SCENEMARKERS_VARS { 
	filter: FindFilterType, 
	scene_marker_filter: SceneMarkerFilterType 
}
export const FIND_SCENEMARKERS_QUERY = gql`
query FindSceneMarkers($filter: FindFilterType, $scene_marker_filter: SceneMarkerFilterType) {
	findSceneMarkers(filter: $filter, scene_marker_filter: $scene_marker_filter) {
	  count
	  scene_markers {
		...SceneMarkerData
		__typename
	  }
	  __typename
	}
  }
  
  fragment SceneMarkerData on SceneMarker {
	id
	title
	seconds
	stream
	preview
	screenshot
	scene {
	  id
	  __typename
	}
	primary_tag {
	  id
	  name
	  __typename
	}
	tags {
	  id
	  name
	  __typename
	}
	__typename
  }`
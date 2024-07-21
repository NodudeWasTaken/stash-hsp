import { gql } from '@apollo/client/core';

export const SCENE_MARKER_CREATE_MUTATION = gql`
mutation SceneMarkerCreate($title: String!, $seconds: Float!, $scene_id: ID!, $primary_tag_id: ID!, $tag_ids: [ID!] = []) {
	sceneMarkerCreate(
	  input: {title: $title, seconds: $seconds, scene_id: $scene_id, primary_tag_id: $primary_tag_id, tag_ids: $tag_ids}
	) {
	  ...SceneMarkerData
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
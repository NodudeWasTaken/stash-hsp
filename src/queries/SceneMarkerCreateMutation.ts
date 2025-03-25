import { gql } from '@apollo/client/core';
import { Scalars } from '../gql/graphql';

export interface SCENE_MARKER_CREATE_VARS { 
	title: string, 
	seconds: Scalars["Float"]["input"], 
	end_seconds: Scalars["Float"]["input"], 
	scene_id: Scalars["ID"]["input"], 
	primary_tag_id: Scalars["ID"]["input"], 
	tag_ids: Scalars["ID"]["input"][], 
}
export const SCENE_MARKER_CREATE_MUTATION = gql`
mutation SceneMarkerCreate($title: String!, $seconds: Float!, $end_seconds: Float!, $scene_id: ID!, $primary_tag_id: ID!, $tag_ids: [ID!] = []) {
	sceneMarkerCreate(
	  input: {title: $title, seconds: $seconds, end_seconds: $end_seconds, scene_id: $scene_id, primary_tag_id: $primary_tag_id, tag_ids: $tag_ids}
	) {
	  ...SceneMarkerData
	  __typename
	}
  }
  
  fragment SceneMarkerData on SceneMarker {
	id
	title
	seconds
	end_seconds
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
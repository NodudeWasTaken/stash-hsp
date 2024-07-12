import { gql } from '@apollo/client/core';

export const SCENE_SAVE_ACTIVITY_MUTATION = gql`
mutation SceneSaveActivity($id: ID!, $resume_time: Float, $playDuration: Float) {
	sceneSaveActivity(
	  id: $id
	  resume_time: $resume_time
	  playDuration: $playDuration
	)
  }`
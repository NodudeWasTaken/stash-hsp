import { gql } from '@apollo/client/core';
import { Scalars } from '../gql/graphql';

export interface SCENE_SAVE_ACTIVITY_VARS { 
	id: Scalars["ID"]["input"], 
	resume_time: Scalars["Float"]["input"], 
	playDuration: Scalars["Float"]["input"], 
}
export const SCENE_SAVE_ACTIVITY_MUTATION = gql`
mutation SceneSaveActivity($id: ID!, $resume_time: Float, $playDuration: Float) {
	sceneSaveActivity(
	  id: $id
	  resume_time: $resume_time
	  playDuration: $playDuration
	)
  }`
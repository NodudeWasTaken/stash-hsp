import type { CodegenConfig } from '@graphql-codegen/cli'
import * as dotenv from 'dotenv'
 
// Load environment variables from .env file
dotenv.config()

// Get the SCHEMA URL from environment variables
const schemaUrl = process.env.STASH_SCHEMA || 'https://localhost:9999/graphql'

const config: CodegenConfig = {
   schema: schemaUrl,
   generates: {
      './src/gql/': {
        preset: 'client',
      }
   }
}
export default config

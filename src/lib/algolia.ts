import { algoliasearch } from 'algoliasearch'

export const algoliaAdmin = algoliasearch(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_KEY!,
)

export const PRODUCTS_INDEX = 'products'

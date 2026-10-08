import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    // API-Key-Auth für Agents/CI (Authorization: "users API-Key <key>").
    // Spalten kommen mit der Migration 20261008_000000_add_users_api_key.
    useAPIKey: true,
    cookies: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  fields: [],
}

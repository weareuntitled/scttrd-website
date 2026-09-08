import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Shows } from './collections/Shows'
import { Pages } from './collections/Pages'
import { Links } from './collections/Links'
import { LinkHub } from './globals/LinkHub'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Pages, Shows, Links],
  globals: [LinkHub],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // push läuft nur ausserhalb von Production (db-postgres connect.js) —
    // live greifen prodMigrations, damit neue Felder/Collections ankommen.
    push: process.env.PAYLOAD_PUSH !== 'false',
    prodMigrations: migrations,
  }),
  sharp,
})

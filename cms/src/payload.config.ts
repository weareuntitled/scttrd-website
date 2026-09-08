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
// NOTE: prodMigrations bewusst NICHT verdrahtet (2026-09-08): Boot-Migration
// hing den CMS-Container auf (nie healthy, keine Logs remote einsehbar).
// Schema-Updates laufen explizit als CI-Schritt (payload migrate, sichtbar + Timeout).

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
    push: process.env.PAYLOAD_PUSH !== 'false',
  }),
  sharp,
})

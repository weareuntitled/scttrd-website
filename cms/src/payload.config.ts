import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
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
import { RiderRequests } from './collections/RiderRequests'
import { Releases } from './collections/Releases'
import { LinkHub } from './globals/LinkHub'
// NOTE: prodMigrations bewusst NICHT verdrahtet (2026-09-08): Boot-Migration
// hing den CMS-Container auf (nie healthy, keine Logs remote einsehbar).
// Schema-Updates laufen explizit als CI-Schritt (payload migrate, sichtbar + Timeout).

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// SMTP für Passwort-Zurücksetzen-Mails. Gleiche Variablen wie die Website;
// SMTP_USERNAME zusätzlich, weil das Wiki (Docmost) diesen Namen erwartet.
// Ohne SMTP_HOST bleibt Payloads Standard: Mails landen nur im Log.
const smtpUser = process.env.SMTP_USER || process.env.SMTP_USERNAME
const smtpPort = Number(process.env.SMTP_PORT) || 587
const email = process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.MAIL_FROM_ADDRESS || smtpUser || 'info@scttrd.de',
        defaultFromName: process.env.MAIL_FROM_NAME || 'SCTTRD CMS',
        // SMTP downtime must not take the CMS admin offline during boot.
        skipVerify: true,
        transportOptions: {
        host: process.env.SMTP_HOST,
        port: smtpPort,
        secure: smtpPort === 465,
        ...(smtpUser && process.env.SMTP_PASSWORD
          ? { auth: { user: smtpUser, pass: process.env.SMTP_PASSWORD } }
          : {}),
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      },
    })
  : undefined

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Pages, Shows, Links, Releases, RiderRequests],
  globals: [LinkHub],
  editor: lexicalEditor(),
  ...(email ? { email } : {}),
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

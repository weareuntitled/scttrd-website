import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ponytail: Webpack muss Payload selbst transpilieren, sonst findet
  // es 'payload/shared' Subpfad-Exports nicht (Vercel-Cache-Issue).
  transpilePackages: [
    'payload',
    '@payloadcms/db-sqlite',
    '@payloadcms/next',
    '@payloadcms/richtext-lexical',
    '@payloadcms/shared',
  ],
  serverExternalPackages: ['@libsql/client', 'pino', 'pino-pretty'],
}

export default withPayload(nextConfig)

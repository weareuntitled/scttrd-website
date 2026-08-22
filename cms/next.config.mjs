import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    'payload',
    '@payloadcms/db-postgres',
    '@payloadcms/db-sqlite',
    '@payloadcms/next',
    '@payloadcms/richtext-lexical',
    '@payloadcms/storage-vercel-blob',
    '@payloadcms/drizzle',
  ],
  experimental: {
    reactCompiler: false,
  },
}

export default withPayload(nextConfig)

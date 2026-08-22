import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@libsql/client', 'pino', 'pino-pretty'],
}

export default withPayload(nextConfig)

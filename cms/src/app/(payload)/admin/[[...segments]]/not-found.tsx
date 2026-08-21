import config from '@payload-config'
import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'
export const generateMetadata = (args: any) => generatePageMetadata({ config, importMap, ...args })
export default (args: any) => NotFoundPage({ config, importMap, ...args })

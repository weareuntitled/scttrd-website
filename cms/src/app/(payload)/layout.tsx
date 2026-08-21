import config from '@payload-config'
import '@payloadcms/next/css'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'
import { importMap } from './admin/importMap.js'
const serverFunction = async (args: any) => { 'use server'; return handleServerFunctions({ ...args, config, importMap }) }
export default async function Layout({ children }: { children: React.ReactNode }) { return RootLayout({ config, importMap, serverFunction, children }) }

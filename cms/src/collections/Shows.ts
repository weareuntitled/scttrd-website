import type { CollectionConfig } from 'payload'
export const Shows: CollectionConfig = {
  slug: 'shows',
  admin: { useAsTitle: 'venue', defaultColumns: ['venue', 'city', 'date', 'status'] },
  access: { read: () => true },
  hooks: { afterChange: [async () => { if (process.env.VERCEL_DEPLOY_HOOK_URL) fetch(process.env.VERCEL_DEPLOY_HOOK_URL, { method: 'POST' }).catch(()=>{}) }] },
  fields: [
    { name: 'venue', type: 'text', required: true },
    { name: 'city', type: 'text', required: true },
    { name: 'date', type: 'text', required: true, admin: { description: 'DD.MM.YYYY' } },
    { name: 'status', type: 'select', required: true, defaultValue: 'upcoming', options: [{ label: 'Upcoming', value: 'upcoming' }, { label: 'Past', value: 'past' }] },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'imageAlt', type: 'text' },
    { name: 'link', type: 'text' },
    { name: 'order', type: 'number', required: true, defaultValue: 10 },
  ],
}

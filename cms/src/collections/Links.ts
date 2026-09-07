import type { CollectionConfig } from 'payload'

export const Links: CollectionConfig = {
  slug: 'links',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['label', 'platform', 'url', 'order'],
    group: 'Seiten',
    description: 'Links im Menü/Footer (Instagram, Spotify, SoundCloud …)',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: { description: 'Anzeigename, z. B. Instagram' },
    },
    {
      name: 'platform',
      type: 'select',
      defaultValue: 'other',
      options: [
        { label: 'Instagram', value: 'instagram' },
        { label: 'TikTok', value: 'tiktok' },
        { label: 'Spotify', value: 'spotify' },
        { label: 'SoundCloud', value: 'soundcloud' },
        { label: 'YouTube', value: 'youtube' },
        { label: 'Andere', value: 'other' },
      ],
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: { description: 'https://…' },
    },
    {
      name: 'target',
      type: 'select',
      defaultValue: '_blank',
      options: [
        { label: 'Neuer Tab', value: '_blank' },
        { label: 'Gleicher Tab', value: '_self' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 10,
    },
  ],
}
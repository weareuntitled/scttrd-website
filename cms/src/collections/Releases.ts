import type { CollectionConfig } from 'payload'

const slugify = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

export const Releases: CollectionConfig = {
  slug: 'releases',
  labels: { singular: 'Release', plural: 'Releases' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'releaseDate', 'status', 'bannerEnabled'],
    group: 'Seiten',
    description: 'Ein Eintrag steuert Landingpage, Linkhub und das optionale Homepage-Banner.',
    preview: (doc) => `${process.env.WEBSITE_URL || 'https://scttrd.de'}/releases/${doc.slug}/`,
  },
  access: {
    read: ({ req }) => req.user ? true : { status: { equals: 'published' } },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeValidate: [({ data }) => {
      if (data?.title && !data.slug) data.slug = slugify(data.title)
      return data
    }],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Wird beim ersten Speichern automatisch aus dem Titel erzeugt.' },
    },
    {
      name: 'releaseDate',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } },
    },
    { name: 'cover', type: 'upload', relationTo: 'media', required: true },
    { name: 'description', type: 'textarea' },
    {
      type: 'collapsible',
      label: 'Streaming und Pre-Save',
      fields: [
        { name: 'preSaveUrl', type: 'text', label: 'Pre-Save URL' },
        { name: 'spotifyUrl', type: 'text', label: 'Spotify URL' },
        { name: 'soundcloudUrl', type: 'text', label: 'SoundCloud URL' },
        { name: 'youtubeUrl', type: 'text', label: 'YouTube URL' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Homepage-Banner',
      fields: [
        { name: 'bannerEnabled', type: 'checkbox', label: 'Banner anzeigen', defaultValue: true },
        {
          name: 'bannerDurationDays',
          type: 'number',
          label: 'Laufzeit nach Release (Tage)',
          defaultValue: 28,
          min: 1,
          admin: { description: 'Vor dem Release ist das Banner sofort sichtbar, danach standardmäßig 28 Tage.' },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'published',
      options: [
        { label: 'Entwurf', value: 'draft' },
        { label: 'Veröffentlicht', value: 'published' },
      ],
    },
  ],
}

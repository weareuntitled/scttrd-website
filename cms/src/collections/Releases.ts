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
    { name: 'title', type: 'text', required: true, label: 'Track-Titel' },
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
      label: 'Release-Datum',
      required: true,
      admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Cover',
      admin: { description: 'Das Cover für Release-Seite, Linkhub und Banner.' },
    },
    { name: 'description', type: 'textarea', label: 'Beschreibung' },
    {
      name: 'spotifyUrl',
      type: 'text',
      label: 'Spotify-Link (vorläufig möglich)',
      admin: { description: 'Nur diesen einen Link eintragen. Die endgültige Spotify-URL kann später ersetzt werden.' },
      validate: (value: string | null | undefined) => {
        if (!value) return true
        try {
          new URL(value)
          return true
        } catch {
          return 'Bitte eine gültige URL eintragen.'
        }
      },
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
      defaultValue: 'draft',
      options: [
        { label: 'Entwurf', value: 'draft' },
        { label: 'Veröffentlicht', value: 'published' },
      ],
    },
  ],
}

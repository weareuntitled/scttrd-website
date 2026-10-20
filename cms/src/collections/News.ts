import type { CollectionConfig } from 'payload'

const slugify = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'News / Recap', plural: 'News & Live-Recaps' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', 'status'],
    group: 'Seiten',
    description: 'Recherchebasierte News und Live-Recaps. Veröffentlichung nur mit eigenständigem Inhalt, Quellen und Bildrechten.',
    preview: (doc) => `${process.env.WEBSITE_URL || 'https://scttrd.de'}/news/${doc.slug}/`,
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
    { name: 'title', type: 'text', required: true, label: 'Titel' },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { description: 'Wird beim ersten Speichern automatisch aus dem Titel erzeugt.' } },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'live-recap',
      options: [
        { label: 'Live-Recap', value: 'live-recap' },
        { label: 'News', value: 'news' },
      ],
    },
    { name: 'excerpt', type: 'textarea', required: true, label: 'Teaser / SEO-Beschreibung', maxLength: 180 },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      label: 'Artikeltext',
      minLength: 1200,
      admin: { description: 'Mindestens 1.200 Zeichen. Nur recherchierte Fakten und gelieferte persönliche Eindrücke; keine Setlist oder Details erfinden.' },
    },
    { name: 'setlist', type: 'textarea', label: 'Setlist (optional)', admin: { description: 'Ein Song pro Zeile. Nur eintragen, wenn die Setlist geliefert oder belegt wurde.' } },
    { name: 'publishedAt', type: 'date', required: true, label: 'Veröffentlicht am', admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
    { name: 'cover', type: 'upload', relationTo: 'media', required: true, label: 'Titelbild' },
    {
      name: 'photos',
      type: 'array',
      label: 'Fotogalerie',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'Foto' },
        { name: 'alt', type: 'text', required: true, label: 'Alternativtext' },
        { name: 'credit', type: 'text', label: 'Fotocredit' },
      ],
    },
    { name: 'relatedShow', type: 'relationship', relationTo: 'shows', label: 'Zugehörige Show' },
    { name: 'eventUrl', type: 'text', label: 'Veranstaltungsseite' },
    { name: 'recordingUrl', type: 'text', label: 'Recording / Mediathek' },
    {
      name: 'researchSources',
      type: 'array',
      label: 'Recherchequellen (intern)',
      admin: { description: 'Beleglinks für Faktenprüfung; werden im Artikel nicht öffentlich ausgegeben.' },
      fields: [{ name: 'url', type: 'text', required: true, label: 'URL' }],
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

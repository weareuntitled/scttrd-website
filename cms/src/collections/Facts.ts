import type { CollectionConfig } from 'payload'

// Fakten-Seite: eine schlanke, flache Struktur, damit der Agent sie als
// JSON schreiben kann (siehe cms/content/facts/facts.json).
export const Facts: CollectionConfig = {
  slug: 'facts',
  labels: { singular: 'Fakten', plural: 'Fakten' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'updatedAt'],
    group: 'Seiten',
    description: 'Belegbare Bandfakten und offizielle Links fuer /facts/ (KI- und Pressereferenz).',
    preview: (doc) => `${process.env.WEBSITE_URL || 'https://scttrd.de'}/facts/`,
  },
  access: {
    read: ({ req }) => req.user ? true : { status: { equals: 'published' } },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Interner Titel' },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, defaultValue: 'facts', label: 'Slug' },
    { name: 'description', type: 'textarea', required: true, maxLength: 320, label: 'Beschreibung (Meta und Einstieg)' },
    { name: 'intro', type: 'textarea', label: 'Zweiter Absatz' },
    {
      name: 'facts',
      type: 'array',
      label: 'Auf einen Blick',
      fields: [
        { name: 'label', type: 'text', required: true, label: 'Begriff' },
        { name: 'value', type: 'text', required: true, label: 'Wert' },
      ],
    },
    {
      name: 'members',
      type: 'array',
      label: 'Besetzung',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'text', required: true },
      ],
    },
    {
      name: 'profiles',
      type: 'array',
      label: 'Offizielle Profile',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Abschnitte',
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'body', type: 'textarea', label: 'Text (Absaetze durch Leerzeile trennen)' },
        {
          name: 'links',
          type: 'array',
          label: 'Links im Text',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'url', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'researchSources',
      type: 'array',
      label: 'Recherchequellen (intern)',
      admin: { description: 'Beleglinks fuer die Faktenpruefung; werden im Artikel nicht ausgegeben.' },
      fields: [{ name: 'url', type: 'text', required: true }],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Entwurf', value: 'draft' },
        { label: 'Veroeffentlicht', value: 'published' },
      ],
    },
  ],
}

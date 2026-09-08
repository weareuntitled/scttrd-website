import type { CollectionConfig } from 'payload'

export const Shows: CollectionConfig = {
  slug: 'shows',
  admin: {
    useAsTitle: 'venue',
    defaultColumns: ['venue', 'city', 'date', 'status'],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'venue',
      type: 'text',
      required: true,
    },
    {
      name: 'city',
      type: 'text',
      required: true,
    },
    {
      name: 'date',
      type: 'text',
      required: true,
      admin: {
        description: 'Format: DD.MM.YYYY',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'upcoming',
      options: [
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Past', value: 'past' },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'imageAlt',
      type: 'text',
    },
    {
      name: 'link',
      type: 'text',
    },
    {
      name: 'linkKind',
      type: 'select',
      admin: { description: 'Ticket = echter Ticketshop · Webseite = Venue-/Eventseite (kein Ticketverkauf) · Video = Recording' },
      options: [
        { label: 'Ticketshop', value: 'ticket' },
        { label: 'Webseite (Location/Event)', value: 'website' },
        { label: 'Video', value: 'video' },
      ],
    },
    {
      name: 'lineup',
      type: 'array',
      admin: {
        description: 'Acts des gemeinsamen Line-ups mit offiziellen Artist-Links und Quelle',
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'url', type: 'text', admin: { description: 'Offizielle Artist- oder Social-URL' } },
        { name: 'sourceUrl', type: 'text', admin: { description: 'Beleg, z. B. Festival-Line-up' } },
      ],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
      admin: {
        position: 'sidebar',
        description: 'Zuordnung: auf welcher Seite erscheint die Show (z. B. Home)',
      },
    },
  ],
}

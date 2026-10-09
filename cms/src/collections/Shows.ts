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
      name: 'description',
      type: 'textarea',
      label: 'Beschreibung',
      admin: {
        description: '2–4 Sätze für Show-Seite, Meta-Description und Event-Schema. Nur belegbare Fakten (Venue, Stadt, Datum, Format, Ticketinfo).',
      },
    },
    {
      name: 'address',
      type: 'text',
      label: 'Adresse',
      admin: {
        description: 'Straße + Hausnummer der Venue, z. B. „Maxstraße 1, 86150 Augsburg“.',
      },
    },
    {
      name: 'doorsTime',
      type: 'text',
      label: 'Einlass',
      admin: {
        description: 'Format: HH:MM, z. B. „19:00“. Leer lassen, wenn unbekannt.',
      },
    },
    {
      name: 'startTime',
      type: 'text',
      label: 'Beginn',
      admin: {
        description: 'Format: HH:MM, z. B. „20:00“. Leer lassen, wenn unbekannt.',
      },
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

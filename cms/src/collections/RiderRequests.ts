import type { CollectionConfig } from 'payload'

// Wer hat den Technical Rider angefordert? Wird von der Website
// (POST /api/rider-request) befüllt und zusätzlich per Mail gemeldet.
export const RiderRequests: CollectionConfig = {
  slug: 'rider-requests',
  labels: { singular: 'Rider-Anfrage', plural: 'Rider-Anfragen' },
  admin: {
    useAsTitle: 'venue',
    defaultColumns: ['venue', 'name', 'email', 'file', 'createdAt'],
    group: 'Anfragen',
    description: 'Wer hat Rider-PDF und Hospitality Rider angefordert (Name, Venue, E-Mail, Zeitpunkt).',
  },
  access: {
    // Anlegen darf die Website ohne Login; lesen/ändern nur eingeloggte User.
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'venue', type: 'text', required: true, admin: { description: 'Venue / Veranstaltung' } },
    { name: 'email', type: 'email', required: true },
    {
      name: 'file',
      type: 'select',
      defaultValue: 'rider',
      options: [{ label: 'Technical Rider PDF + Hospitality Rider', value: 'rider' }],
    },
    { name: 'source', type: 'text', defaultValue: 'styleguide', admin: { readOnly: true } },
    { name: 'userAgent', type: 'text', admin: { readOnly: true } },
    { name: 'ip', type: 'text', admin: { readOnly: true } },
  ],
}

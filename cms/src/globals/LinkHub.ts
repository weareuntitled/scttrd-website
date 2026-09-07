import type { GlobalConfig } from 'payload'

export const LinkHub: GlobalConfig = {
  slug: 'link-hub',
  label: 'Link Hub',
  admin: {
    group: 'Seiten',
    description: 'Profil, SEO und Anzeigeeinstellungen fuer die ArtisTree-/Linktree-Seite.',
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'preview',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/LinkHubPreview#LinkHubPreview',
        },
      },
    },
    {
      name: 'profile',
      type: 'group',
      label: 'Profil',
      fields: [
        { name: 'handle', type: 'text', required: true, defaultValue: '@scttrd_ofc' },
        { name: 'title', type: 'text', required: true, defaultValue: 'SCTTRD Official Music' },
        { name: 'description', type: 'textarea', required: true, defaultValue: 'Brutal, aber schoen. Live zwischen Post-Punk, Techno und Trance.' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'appearance',
      type: 'group',
      label: 'Darstellung',
      fields: [
        {
          name: 'theme',
          type: 'select',
          defaultValue: 'red',
          options: [
            { label: 'Rot', value: 'red' },
            { label: 'Schwarz', value: 'black' },
            { label: 'Weiss', value: 'white' },
          ],
        },
        { name: 'showUpcoming', type: 'checkbox', defaultValue: true, label: 'Upcoming Shows anzeigen' },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      fields: [
        { name: 'title', type: 'text', admin: { description: 'Browser-Titel und OpenGraph-Titel' } },
        { name: 'description', type: 'textarea', admin: { description: 'Meta- und OpenGraph-Beschreibung' } },
      ],
    },
    {
      name: 'featuredRelease',
      type: 'group',
      label: 'Neuester Track',
      admin: {
        description: 'Nur die Spotify-Track-URL eintragen. Titel, Cover und Kuenstler werden automatisch geladen.',
      },
      fields: [
        {
          name: 'spotify',
          type: 'text',
          label: 'Spotify Track URL',
          admin: {
            placeholder: 'https://open.spotify.com/track/…',
          },
        },
      ],
    },
    {
      name: 'bookingEmail',
      type: 'email',
      label: 'Booking E-Mail',
      defaultValue: 'info@scttrd.de',
    },
  ],
}

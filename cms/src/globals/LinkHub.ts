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
      label: 'Neuester Track / Release',
      admin: {
        description: 'Wird oben auf der Links-Seite als groesste Kachel angezeigt.',
      },
      fields: [
        { name: 'title', type: 'text', label: 'Titel', required: true },
        { name: 'type', type: 'text', label: 'Typ', admin: { description: 'z. B. Single, EP, Album' } },
        { name: 'cover', type: 'upload', relationTo: 'media', label: 'Cover' },
        { name: 'spotify', type: 'text', label: 'Spotify URL' },
        { name: 'soundcloud', type: 'text', label: 'SoundCloud URL' },
        { name: 'youtube', type: 'text', label: 'YouTube URL' },
        { name: 'applemusic', type: 'text', label: 'Apple Music URL' },
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

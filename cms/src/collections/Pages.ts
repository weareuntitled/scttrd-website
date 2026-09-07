import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'section', 'status'],
    group: 'Seiten',
    description: 'Home & About: alle Texte und Bilder einer Seite',
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
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'section',
      type: 'select',
      required: true,
      defaultValue: 'home',
      options: [
        { label: 'Home', value: 'home' },
        { label: 'About', value: 'about' },
        { label: 'Sonstiges', value: 'other' },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Texte',
          fields: [
            {
              name: 'headline',
              type: 'text',
              admin: { description: 'Überschrift der Seite (z. B. SCTTRD)' },
            },
            {
              name: 'subtitle',
              type: 'text',
              admin: { description: 'Untertitel (z. B. LIVE Techno mit Vocals)' },
            },
            {
              name: 'bio_de',
              type: 'richText',
              admin: { description: 'Bio deutsch (Home)' },
            },
            {
              name: 'bio_en',
              type: 'richText',
              admin: { description: 'Bio englisch (Home/About)' },
            },
            {
              name: 'subheading',
              type: 'text',
              admin: { description: 'Subheading (About)' },
            },
            {
              name: 'text',
              type: 'text',
              admin: { description: 'Claim/Slogan (z. B. Punk, aber schön)' },
            },
            {
              name: 'email',
              type: 'text',
              admin: { description: 'Kontakt-E-Mail (Footer/Nav)' },
            },
            {
              name: 'ctaHeadline',
              type: 'text',
              admin: { description: 'CTA-Überschrift (z. B. Want to book us?)' },
            },
            {
              name: 'ctaButton',
              type: 'text',
              admin: { description: 'CTA-Button-Text' },
            },
            {
              name: 'ctaButtonEmailSubject',
              type: 'text',
              admin: { description: 'Betreff der Booking-Mail' },
            },
          ],
        },
        {
          label: 'Bilder',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Hero-Bild der Seite' },
            },
            {
              name: 'imageAlt',
              type: 'text',
            },
            {
              name: 'gallery',
              type: 'array',
              admin: { description: 'Galerie (About-Bilder etc.)' },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'alt',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'published',
      options: [
        { label: 'Entwurf', value: 'draft' },
        { label: 'Veröffentlicht', value: 'published' },
      ],
    },
  ],
}
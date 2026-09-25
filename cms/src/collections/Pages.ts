import type { CollectionConfig } from 'payload'

const slugify = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Seite', plural: 'Seiten' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'section', 'status'],
    group: 'Seiten',
    description: 'Texte und Bilder für Home und About pflegen.',
    preview: (doc) => `${process.env.WEBSITE_URL || 'https://scttrd.de'}/${doc.slug === 'home' ? '' : `${doc.slug}/`}`,
  },
  access: {
    read: () => true,
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
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Interner Seitenname',
      admin: { description: 'Nur zur Orientierung im CMS, z. B. Home oder About.' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Wird beim ersten Speichern automatisch aus dem Seitennamen erzeugt.',
      },
    },
    {
      name: 'section',
      type: 'select',
      required: true,
      defaultValue: 'home',
      label: 'Seitenbereich',
      admin: {
        position: 'sidebar',
        description: 'Bestimmt, welche Inhaltsfelder angezeigt werden.',
      },
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
              label: 'Hauptüberschrift',
              admin: {
                description: 'Überschrift der Home-Seite, z. B. SCTTRD.',
                condition: (_, siblingData) => siblingData?.section === 'home',
              },
            },
            {
              name: 'subtitle',
              type: 'text',
              label: 'Untertitel',
              admin: {
                description: 'Kurzer Zusatz unter der Home-Überschrift.',
                condition: (_, siblingData) => siblingData?.section === 'home',
              },
            },
            {
              name: 'bio_de',
              type: 'richText',
              label: 'Bio Deutsch',
              admin: {
                description: 'Deutsche Bio für Home.',
                condition: (_, siblingData) => siblingData?.section === 'home',
              },
            },
            {
              name: 'bio_en',
              type: 'richText',
              label: 'Bio Englisch',
              admin: {
                description: 'Englische Bio für About.',
                condition: (_, siblingData) => siblingData?.section === 'about',
              },
            },
            {
              name: 'subheading',
              type: 'text',
              label: 'Unterüberschrift',
              admin: {
                description: 'Unterüberschrift für About.',
                condition: (_, siblingData) => siblingData?.section === 'about',
              },
            },
            {
              name: 'text',
              type: 'textarea',
              label: 'Claim / Slogan',
              admin: {
                description: 'Kurzer Claim, z. B. „Brutal, aber schön.“',
                condition: (_, siblingData) => siblingData?.section === 'about',
              },
            },
            {
              name: 'email',
              type: 'text',
              label: 'Kontakt-E-Mail',
              admin: {
                description: 'Kontaktadresse für Footer und Navigation.',
                condition: (_, siblingData) => siblingData?.section === 'home',
              },
            },
            {
              name: 'ctaHeadline',
              type: 'text',
              label: 'CTA-Überschrift',
              admin: {
                description: 'Überschrift des Booking-Bereichs auf Home.',
                condition: (_, siblingData) => siblingData?.section === 'home',
              },
            },
            {
              name: 'ctaButton',
              type: 'text',
              label: 'CTA-Button-Text',
              admin: {
                description: 'Beschriftung des Booking-Buttons.',
                condition: (_, siblingData) => siblingData?.section === 'home',
              },
            },
            {
              name: 'ctaButtonEmailSubject',
              type: 'text',
              label: 'Booking-Mail-Betreff',
              admin: {
                description: 'Betreff der Mail, die über den CTA geöffnet wird.',
                condition: (_, siblingData) => siblingData?.section === 'home',
              },
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
              label: 'Hero-Bild',
              admin: {
                description: 'Hauptbild der About-Seite.',
                condition: (_, siblingData) => siblingData?.section === 'about',
              },
            },
            {
              name: 'imageAlt',
              type: 'text',
              label: 'Bildbeschreibung (Alt-Text)',
              admin: {
                description: 'Kurze Beschreibung für Barrierefreiheit.',
                condition: (_, siblingData) => siblingData?.section === 'about',
              },
            },
            {
              name: 'gallery',
              type: 'array',
              label: 'About-Galerie',
              admin: {
                description: 'Bilder, die auf der Galerie-Seite erscheinen.',
                condition: (_, siblingData) => siblingData?.section === 'about',
              },
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
                  label: 'Bildbeschreibung (Alt-Text)',
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
      admin: {
        position: 'sidebar',
        description: 'Nur relevant, wenn mehrere Seiten im selben Bereich sortiert werden.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'published',
      label: 'Veröffentlichungsstatus',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Entwurf', value: 'draft' },
        { label: 'Veröffentlicht', value: 'published' },
      ],
    },
  ],
}

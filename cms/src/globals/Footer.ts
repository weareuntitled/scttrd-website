import type { GlobalConfig } from 'payload'

// Footer: Spalten und Links, damit der Agent die Navigation ohne Deploy aendern kann.
export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: {
    group: 'Seiten',
    description: 'Spalten und Links im Footer der Website.',
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'groups',
      type: 'array',
      label: 'Spalten',
      fields: [
        { name: 'label', type: 'text', required: true, label: 'Ueberschrift der Spalte' },
        {
          name: 'links',
          type: 'array',
          label: 'Links',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'url', type: 'text', required: true, admin: { description: 'Pfad (/news/) oder URL (https://…)' } },
            {
              name: 'target',
              type: 'select',
              defaultValue: 'self',
              options: [
                { label: 'Gleiches Tab', value: 'self' },
                { label: 'Neues Tab', value: 'blank' },
              ],
            },
          ],
        },
      ],
    },
  ],
}

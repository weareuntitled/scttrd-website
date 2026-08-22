import type { CollectionConfig } from 'payload'

export const Shows: CollectionConfig = {
  slug: 'shows',
  admin: {
    useAsTitle: 'venue',
    defaultColumns: ['venue', 'city', 'date', 'status'],
  },
  access: {
    read: () => true,
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
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
  ],
}

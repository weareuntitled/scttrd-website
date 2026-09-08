import type { CollectionConfig } from 'payload'

const fillFromScrape = async (data: any) => {
  const complete =
    data?.label?.trim() && data?.platform && data.platform !== 'other' && data?.cover?.trim();
  if (!data?.url || complete) {
    return data;
  }
  try {
    const { scrapeLink, applyScrapedLink } = await import('../lib/linkScrape');
    const scraped = await scrapeLink(String(data.url));
    return { ...data, ...applyScrapedLink(data, scraped) };
  } catch {
    return data;
  }
};

export const Links: CollectionConfig = {
  slug: 'links',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['label', 'platform', 'url', 'order'],
    group: 'Seiten',
    description: 'Links im Menü/Footer (Instagram, Spotify, SoundCloud …)',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      async ({ data }) => fillFromScrape(data),
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: { description: 'Anzeigename, z. B. Instagram' },
    },
    {
      name: 'platform',
      type: 'select',
      defaultValue: 'other',
      options: [
        { label: 'Instagram', value: 'instagram' },
        { label: 'TikTok', value: 'tiktok' },
        { label: 'Spotify', value: 'spotify' },
        { label: 'SoundCloud', value: 'soundcloud' },
        { label: 'YouTube', value: 'youtube' },
        { label: 'Andere', value: 'other' },
      ],
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: { description: 'https://…' },
    },
    {
      name: 'cover',
      type: 'text',
      admin: { description: 'Cover-URL — automatisch via Link-Scrape, manuell überschreibbar' },
    },
    {
      name: 'scrapedAt',
      type: 'date',
      admin: { description: 'Letzter erfolgreicher Scrape', readOnly: true },
    },
    {
      name: 'target',
      type: 'select',
      defaultValue: '_blank',
      options: [
        { label: 'Neuer Tab', value: '_blank' },
        { label: 'Gleicher Tab', value: '_self' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 10,
    },
  ],
}

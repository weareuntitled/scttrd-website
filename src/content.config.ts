import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const shows = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/home/shows' }),
  schema: z.object({
    status: z.enum(['upcoming', 'past']),
    venue: z.string(),
    city: z.string(),
    date: z.string(),
    image: z.string(),
    imageAlt: z.string().default(''),
    title_de: z.string().optional(),
    title_en: z.string().optional(),
    srcset: z.string().optional(),
    link: z.string().url().optional(),
    order: z.number(),
  }),
});

const links = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/home/links' }),
  schema: z.object({
    platform: z.string(),
    label: z.string(),
    url: z.string().url(),
    order: z.number(),
  }),
});

const videos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/home/videos' }),
  schema: z.object({
    title: z.string(),
    poster: z.string(),
    video: z.string(),
    order: z.number(),
  }),
});

const reels = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/home/reels' }),
  schema: z.object({
    title: z.string(),
    video: z.string(),
    poster: z.string(),
    order: z.number(),
  }),
});

const press = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/home/press' }),
  schema: z.object({
    title: z.string(),
    cover: z.string(),
    link: z.string().url(),
    date: z.string(),
  }),
});

// Home texts: one singleton file holding all homepage text (hero, bio, CTA, footer).
const homeText = defineCollection({
  loader: glob({ pattern: 'text.md', base: './src/content/home' }),
  schema: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    headline: z.string().default('SCTTRD'),
    bio_de: z.string().optional(),
    bio_en: z.string().optional(),
    text: z.string().optional(),
    email: z.string().email(),
    cta_headline: z.string().optional(),
    cta_button: z.string().optional(),
    cta_button_email_subject: z.string().optional(),
  }),
});

// Page images: one singleton file per page holding only the images that page can swap.
const homeImages = defineCollection({
  loader: glob({ pattern: 'images.md', base: './src/content/home' }),
  schema: z.object({
    heroImage1: z.string().default('/images/DSC02807.jpg'),
    heroImage1Alt: z.string().default(''),
    heroImage2: z.string().default('/images/DSC02572-2.jpg'),
    heroImage2Alt: z.string().default(''),
  }),
});

const aboutPageImages = defineCollection({
  loader: glob({ pattern: 'images.md', base: './src/content/about' }),
  schema: z.object({
    heroImage: z.string().default(''),
    heroImageAlt: z.string().default(''),
    gallery: z.array(z.string()).default([]),
  }),
});

const aboutPage = {
  hero: defineCollection({
    loader: glob({ pattern: 'hero.md', base: './src/content/about' }),
    schema: z.object({
      heading: z.string(),
      subheading: z.string(),
      bio_en: z.string(),
      email: z.string().email(),
    }),
  }),
};

const contactPage = {
  contact: defineCollection({
    loader: glob({ pattern: 'contact.md', base: './src/content/contact' }),
    schema: z.object({
      email: z.string().email(),
      address: z.string(),
      text: z.string(),
      instagram_url: z.string().url(),
      instagram_handle: z.string(),
    }),
  }),
};

export const collections = {
  shows,
  links,
  videos,
  reels,
  press,
  homeText,
  homeImages,
  aboutPageImages,
  aboutHero: aboutPage.hero,
  contact: contactPage.contact,
};
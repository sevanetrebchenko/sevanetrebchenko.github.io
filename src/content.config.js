import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/blog' }),
  schema: z.object({
    title: z.string(),
    abstract: z.string(),
    tags: z.array(z.string()),
    date: z.coerce.date(),
    lastModified: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    series: z.object({
      name: z.string(),
      part: z.number(),
    }).optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    thumbnail: z.string().optional(),
    tags: z.array(z.string()),
    // External links shown as buttons on the project page (repo, video, live build, ...).
    // The icon and default label come from the URL's host; `label` overrides the text.
    links: z.array(z.object({
      url: z.url(),
      label: z.string().optional(),
    })).default([]),
    date: z.coerce.date(),
    lastModified: z.coerce.date().optional(),
    // 'showcase' gets a thumbnail and its own page; 'small' has neither and links to its first link
    kind: z.enum(['showcase', 'small']).default('showcase'),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    // Caption under the main image on the project page
    caption: z.string().optional(),
    // Blog series written about this project; each post in it links back with a "Related project" card
    series: z.string().optional(),
    // Blog post ids listed under "Related writing"
    writing: z.array(z.string()).default([]),
  }),
});

export const collections = { blog, projects };

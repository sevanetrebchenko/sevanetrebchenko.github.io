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
    thumbnail: z.string(),
    tags: z.array(z.string()),
    links: z.object({
      github: z.url().optional(),
      demo: z.url().optional(),
    }).optional(),
    date: z.coerce.date(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog, projects };

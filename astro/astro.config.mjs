import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { metaTransformer } from './src/plugins/shiki-meta-transformer.js';
import { classTransformer } from './src/plugins/shiki-class-transformer.js';

export default defineConfig({
  site: 'https://sevanetrebchenko.com',
  integrations: [
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      transformers: [metaTransformer(), classTransformer()],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});

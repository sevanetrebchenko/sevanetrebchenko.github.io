import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { cppAnnotationsTransformer } from './src/plugins/shiki-cpp-annotations.js';
import { metaTransformer } from './src/plugins/shiki-meta-transformer.js';

export default defineConfig({
  site: 'https://sevanetrebchenko.com',
  integrations: [
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
      transformers: [
        cppAnnotationsTransformer(),
        metaTransformer(),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});

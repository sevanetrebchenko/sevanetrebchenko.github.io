import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import rehypePrism from './src/plugins/rehype-prism.js';

export default defineConfig({
  site: 'https://sevanetrebchenko.com',
  outDir: 'build',
  integrations: [
    sitemap(),
  ],
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [rehypePrism],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});

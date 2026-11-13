import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypePrism from './src/plugins/rehype-prism.js';
import remarkMedia from './src/plugins/remark-media.js';

export default defineConfig({
  site: 'https://sevanetrebchenko.com',
  outDir: 'build',
  integrations: [
    sitemap(),
  ],
  markdown: {
    syntaxHighlight: false,
    remarkPlugins: [remarkDirective, remarkMath, remarkMedia],
    rehypePlugins: [rehypeKatex, rehypePrism],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});

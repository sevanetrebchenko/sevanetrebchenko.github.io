import { getCollection } from 'astro:content';

/**
 * Get all published blog posts, sorted by date (newest first).
 */
export async function getPublishedPosts() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/**
 * Collapse posts into writing-list entries: standalone posts as-is, and each series
 * as a single entry pointing at its first part. Sorted by date (newest first).
 * A series entry carries the union of its parts' tags and the parts themselves.
 */
export function getWritingEntries(posts) {
  const entries = [];
  const seen = new Set();
  for (const post of posts) {
    const series = post.data.series;
    if (!series) {
      entries.push({ title: post.data.title, href: `/blog/${post.id}`, date: post.data.date, abstract: post.data.abstract, tags: post.data.tags, parts: 0, seriesPosts: [] });
      continue;
    }
    if (seen.has(series.name)) continue;
    seen.add(series.name);
    const parts = getSeriesPosts(posts, series.name);
    const first = parts[0];
    const tags = [...new Set(parts.flatMap((part) => part.data.tags))];
    entries.push({ title: series.name, href: `/blog/${first.id}`, date: first.data.date, abstract: first.data.abstract, tags, parts: parts.length, seriesPosts: parts });
  }
  return entries.sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

/**
 * A series part's own title, without the "Series Name - Part N:" prefix.
 */
export function getPartTitle(post) {
  return post.data.series ? post.data.title.replace(/^.*? - Part \d+:\s*/, '') : post.data.title;
}

/**
 * Rough reading time in minutes, from the post's raw Markdown.
 */
export function getReadingMinutes(body = '') {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

/**
 * Get all posts belonging to a given series, sorted by series.part ascending.
 */
export function getSeriesPosts(posts, seriesName) {
  return posts
    .filter(p => p.data.series?.name === seriesName)
    .sort((a, b) => a.data.series.part - b.data.series.part);
}

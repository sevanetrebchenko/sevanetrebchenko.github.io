import { getCollection } from 'astro:content';

/**
 * Get all published blog posts, sorted by date (newest first).
 */
export async function getPublishedPosts() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/**
 * Build a Map of tag -> post count from a list of posts.
 */
export function getTagCounts(posts) {
  const tags = new Map();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      tags.set(tag, (tags.get(tag) || 0) + 1);
    }
  }
  return tags;
}

/**
 * Get all posts belonging to a given series, sorted by series.part ascending.
 */
export function getSeriesPosts(posts, seriesName) {
  return posts
    .filter(p => p.data.series?.name === seriesName)
    .sort((a, b) => a.data.series.part - b.data.series.part);
}

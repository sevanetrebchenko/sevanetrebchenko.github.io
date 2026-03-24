import rss from '@astrojs/rss';
import { getPublishedPosts } from '../lib/blog.js';

export async function GET(context) {
  const posts = await getPublishedPosts();

  return rss({
    title: "Seva's Programming Adventures",
    description: 'A blog about graphics programming, low-level systems, and building things from scratch.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.abstract,
      pubDate: post.data.date,
      link: `/blog/${post.id}`,
    })),
  });
}

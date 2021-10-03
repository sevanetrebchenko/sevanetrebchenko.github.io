import React from 'react'
import BlogEntry from './blog-entry';

// Styles.

export default function Blog(props = {}) {
  const { posts } = props;

  return (
    <div>
      {
        posts.map(post => 
          <BlogEntry
            key={post.url}
            post={post}
          />
        )
      }
    </div>
  );
}
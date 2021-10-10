import React from 'react'
import Archive from './archive';
import BlogEntry from './blog-entry';

// Styles.
import "./blog-entry.css"

export default function Blog(props = {}) {
  const { posts } = props;

  // Process 5 most recent posts.
  const recent = [];
  let numVisiblePosts = Math.min(posts.length, 7);
  for (let i = 0; i < numVisiblePosts; ++i) {
    recent.push(posts[i]);
  }
  
  return (
    <div className="blog-post-container">
      {
        recent.map(post => 
          <BlogEntry
            key={post.url}
            post={post}
          />
        )
      }
    </div>
  );
}
import React from 'react'
import { useHistory } from 'react-router';

// Styles.
import "../center.css";

export default function BlogEntry(props = {}) {
  const { post } = props;
  const history = useHistory();

  const RouteToBlogPost = (e) => {
    e.preventDefault();
    history.push('/blog/' + post.url);
  };

  return (
    <div className="blog-post-entry">
      <p className="blog-post-entry-title" onClick={RouteToBlogPost}>
        {post.title}
      </p>
      <p className="blog-post-entry-description">
        {post.month} {post.day}, {post.year} in {post.category}
      </p>
      <p className="blog-post-entry-abstract">
        {post.abstract}
      </p>
      <button className="blog-post-entry-button">
        Read more
      </button>
    </div>
  );
}
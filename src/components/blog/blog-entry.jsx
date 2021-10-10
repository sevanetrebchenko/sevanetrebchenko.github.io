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
    <div className="blog-post-entry-container">
      <div className="blog-post-entry" onClick={RouteToBlogPost}> 
        <p>
          {post.title}
        </p>
        <p>
          Date
        </p>
      </div>
      <p>
        {post.abstract}
      </p>
    </div>
  );
}
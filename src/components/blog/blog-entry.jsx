import React from 'react'
import { useHistory } from 'react-router';

// Styles.

export default function BlogEntry(props = {}) {
  const { post } = props;
  const history = useHistory();

  const routeToBlogPost = (e) => {
    e.preventDefault();
    history.push('/blog/' + post.url);
  };

  return (
    <div onClick={routeToBlogPost}> 
      <p>
        {post.title}
      </p>
    </div>
  );
}
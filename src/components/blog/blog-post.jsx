import React from 'react'
import Content from '../content'

// Styles.

export default function BlogPost(props = {}) {
  const { post } = props;

  return (
    <div>
      {
        post.content.map((content, index) => 
          <Content 
            key={index} 
            type={content.type}
            data={content.data} 
          />
        )
      }
    </div>
  );
}
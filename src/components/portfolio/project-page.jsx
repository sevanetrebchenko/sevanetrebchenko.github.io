import React from 'react'
import Content from '../content'

// Styles.
import "../../styles/project.css"

export default function ProjectPage(props = {}) {
  const { project } = props;

  return (
    <div>
      {
        project.content.map((content, index) => 
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
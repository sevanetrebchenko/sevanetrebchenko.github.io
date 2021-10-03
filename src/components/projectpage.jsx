import React from 'react'

// Styles.
import "../styles/project.css"

export default function ProjectPage(props = {}) {
  const { project } = props;

  return (
    <div>
      <p>
        {project.abstract}
      </p>
    </div>
  );
}
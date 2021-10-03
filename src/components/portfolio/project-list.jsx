import React from 'react'
import ProjectEntry from './project-entry';

// Styles.
import "../panel.css"

export default function ProjectList(props = {}) {
  const { projects } = props;

  return (
    <div className="panel-container">
      {
        projects.map(project => 
          <ProjectEntry 
            className={project.class}
            key={project.url}
            project={project}
          />
        )
      }
    </div>
  )
}
import React from 'react'
import ProjectEntry from './projectentry';

// Styles.
import "../styles/projectlist.css"

export default function ProjectList(props = {}) {
  const { projects } = props;

  return (
    <div className="project-list">
      {
        projects.map(project =>
          <ProjectEntry
            key={project.id}
            project={project}
          />
        )
      }
    </div>
  )
}
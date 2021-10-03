import React from 'react'

// Styles.
import "../styles/projectlist.css"
import ProjectEntry from './projectentry';


export default function ProjectList(props = {}) {
  const { projects } = props;
  console.log(projects);

  return (
    <div className="project-list">
      {
        projects.map(project =>
          <ProjectEntry
            project={project}
          />
        )
      }
    </div>
  )
}
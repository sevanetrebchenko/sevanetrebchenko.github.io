import React from 'react'
import Project from './project';

// Styles.
import "./projectlist.css"

const Projects = [
  {
    name: "Project1",
    description: "Something cool about the project goes here",
    path: "project1"
  },
  {
    name: "Project2",
    description: "Something cool about the project goes here",
    path: "project2"
  },
  {
    name: "Project3",
    description: "Something cool about the project goes here",
    path: "project3"
  }
];

export default function ProjectList(props = {}) {
  return (
    <div className="project-list">
      {
        Projects.map(model =>
          <Project
            name={model.name}
            description={model.description}
            path={model.path}
          />
        )
      }
    </div>
  )
}
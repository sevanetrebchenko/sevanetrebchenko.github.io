import React from 'react'
import { useHistory } from 'react-router';

// Styles.
import "./project-entry.css"
import "../global.css"

export default function ProjectEntry(props = {}) {
  const { project } = props;
  const history = useHistory();

  const routeToProjectPage = (e) => {
    e.preventDefault();
    history.push('/projects/' + project.url);
  };

  return (
    <div className="project-entry" onClick={routeToProjectPage}>
      <img className="project-entry-image" src="/images/mountains.jpeg" alt="" />

      <div className="project-entry-text">
        <h3>{project.title}</h3>
        <p>{project.abstract}</p>
      </div>

    </div>
  );
}
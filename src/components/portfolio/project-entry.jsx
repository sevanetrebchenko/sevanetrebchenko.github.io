import React from 'react'
import { useHistory } from 'react-router';

// Styles.
import "./project-entry.css"

export default function ProjectEntry(props = {}) {
  const { project } = props;
  const history = useHistory();

  const routeToProjectPage = (e) => {
    e.preventDefault();
    history.push('/projects/' + project.url);
  };

  return (
    <React.Fragment>
      <div className="project-entry" onClick={routeToProjectPage}>
        { /* Project image. */}
        <img className="project-image" src="/images/mountains.jpeg" alt="" />

        { /* Project abstract. */}
        <div className="project-text">
          <h3>{project.title}</h3>
          <p>{project.abstract}</p>
        </div>
      </div>
    </React.Fragment>

  );
}
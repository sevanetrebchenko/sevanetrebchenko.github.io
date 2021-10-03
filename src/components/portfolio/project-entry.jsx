import React from 'react'
import { useHistory } from 'react-router';

// Styles.
import "../../styles/project.css"

export default function ProjectEntry(props = {}) {
  const { project, className } = props;
  const history = useHistory();

  const routeToProjectPage = (e) => {
    e.preventDefault();
    history.push('/projects/' + project.url);
  };

  return (
    <div className={(className + " " || "") + "project"} onClick={routeToProjectPage}> 
      <p>
        {project.title}
      </p>
    </div>
  );
}
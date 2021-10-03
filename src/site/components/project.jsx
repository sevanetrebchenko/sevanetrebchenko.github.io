import React from 'react'
import { useHistory } from 'react-router-dom';

// Styles.
import "./project.css"

export default function Project(props = {}) {
  let history = useHistory();
  const { name, description, path } = props;

  return (
    <div
      className="project"
      onClick={e => {
        e.preventDefault();

        history.push('/projects/' + path );
      }}>
      <p>
        {name}
      </p>
    </div>
  )
}
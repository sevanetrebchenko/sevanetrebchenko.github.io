import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm'

// Styles.
import "./project-entry.css"

export default function ProjectEntry(props = {}) {
  const { project } = props;
  const history = useHistory();

  const routeToProjectPage = (e) => {
    e.preventDefault();
    history.push('/projects/' + project.url);
  };

  const [data, setData] = useState([]);
  const getData = () => {
    fetch("/test.md").then(response => {
      return response.text();
    })
    .then(fileText => {
      setData(fileText);
    });
  }
  useEffect(() => {
    getData();
  }, [])

  return (
    <React.Fragment>
      <div className="project-entry" onClick={routeToProjectPage}>
        { /* Project image. */}
        <img className="project-image" src="/images/mountains.jpeg" alt="" />

        { /* Project abstract. */}
        <div className="project-text">
          <ReactMarkdown remarkPlugins={[gfm]}>{{data}.data}</ReactMarkdown>
          <h3>{project.title}</h3>
          <p>{project.abstract}</p>
        </div>
      </div>
    </React.Fragment>

  );
}
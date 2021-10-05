import React, { Component } from 'react'
import { useHistory } from 'react-router';

// Styles.
import "./project-entry.css"
import "../global.css"


export class ProjectEntry1 extends Component {
  constructor(props = {}) {
    const { history } = props;

    super(props);

    this.state = {
      history: history
    }
  }

  OnRender = (props = {}) => {
    const { project } = props;
    const history = this.state.history;

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
}

export default function ProjectEntry(props = {}) {
  return (
    <></>
  );
}
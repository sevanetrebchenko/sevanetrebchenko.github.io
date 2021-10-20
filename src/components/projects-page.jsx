import React from "react";
import Paginator from "./paginator";
import { useHistory } from "react-router";

import "./portfolio/project-entry.css"

export default function ProjectsPage(props = {}) {
  const { items } = props;

  const ProjectFormatting = (project, index) => {
    const history = useHistory();

    // Project formatting function.
    const RouteToProjectPage = (e) => {
      e.preventDefault();
      history.push("/portfolio/" + project.url);
    };
  
    return (
      <React.Fragment key={index}>
        <div className="project-entry" onClick={RouteToProjectPage}>
          <img className="project-entry-image" src={project.image} alt="" />
  
          <div className="project-entry-text">
            <h3>{project.title}</h3>
            <p>{project.abstract}</p>
          </div>
  
        </div>
      </React.Fragment>
    );
  }

  return (
    <div className="project-container">
      <Paginator items={items} numItemsPerPage={3} FormatContent={ProjectFormatting} />
    </div>
  );
}
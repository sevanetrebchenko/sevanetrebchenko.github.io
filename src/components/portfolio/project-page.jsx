import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown';
import RemarkGFM from 'remark-gfm';

import "./project-page.css"

export default function ProjectPage(props = {}) {
  const { project } = props;
  return (
    <div>
      <MarkdownEntry project={project} />
    </div>
  );
}

function MarkdownEntry(props = {}) {
  const { project } = props;

  // Get referenced file.
  const [data, setData] = useState("");

  const request = new Request("/posts/" + project.path, {
    method: "GET",
    mode: "same-origin",
    cache: "reload",
    headers: {
      'Accept': "text/plain",
      'Content-Type': "text/plain",
    },
    credentials: "same-origin"
  });

  const getData = async () => {
    fetch(request)
      .then(response => {
        if (!response.ok) {
          // File not found.
          if (response.status === 404) {
            return "File not found.";
          }

          throw new Error('fetch() response was not ok');
        }
        return response.text();
      })
      .then(fileText => {
        setData(fileText);
      });
  };
  useEffect(() => {
    getData();
  });

  return (
    <div className="center">
      <ReactMarkdown remarkPlugins={[RemarkGFM]} children={{ data }.data} />
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import ReactMarkdown from "react-markdown";
import RemarkGFM from 'remark-gfm';

import "./center.css"

export default function MarkdownEntry(props = {}) {
  const { path } = props;

  // Get referenced file.
  const [file, setFile] = useState("");

  const request = new Request(path, {
    method: "GET",
    mode: "same-origin",
    cache: "reload",
    credentials: "same-origin",
    headers: {
      'Accept': "text/plain",
      'Content-Type': "text/plain",
    }
  });

  // Get file.
  const getFile = () => {
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
        setFile(fileText);
      });
  };
  useEffect(() => {
    getFile();
  });

  return (
    <div className="center">
      <ReactMarkdown remarkPlugins={[RemarkGFM]} children={file} />
    </div>
  )
}
import React from "react";

import MarkdownEntry from "../markdown-entry";

export default function ProjectPage(props = {}) {
  const { project } = props;
  return (
    <div>
      <MarkdownEntry path={"/portfolio/" + project.path} />
    </div>
  );
}

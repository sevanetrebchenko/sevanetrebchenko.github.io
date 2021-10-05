import React from "react";

export default function Posts(props = {}) {
  const { content, FormatContent } = props;

  return (
    <React.Fragment>
      {
        content.map((item, index) => (
          FormatContent(item, index))
        )
      }
    </React.Fragment>
  )
}
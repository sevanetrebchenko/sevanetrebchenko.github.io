import React from 'react'
import MarkdownEntry from '../markdown-entry';

// Styles.

export default function BlogPost(props = {}) {
  const { post } = props;

  return (
    <MarkdownEntry path={"/posts/" + post.path} />
  );
}
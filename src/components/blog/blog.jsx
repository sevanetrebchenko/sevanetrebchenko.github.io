import React from 'react'
import Paginator from '../paginator';
import { useHistory } from "react-router";

// Styles.
import "./blog-entry.css"

export default function Blog(props = {}) {
  const { posts } = props;

  // Blog post entry formatting function.
  const BlogPostFormatting = (post, index) => {
    const history = useHistory();

    const RouteToBlogPost = (e) => {
      e.preventDefault();
      history.push('/blog/' + post.url);
    };
  
    return (
      <React.Fragment key={index}>
        <div className={ index === 0 ? "blog-post-entry-first" : "blog-post-entry"}>
          <p className="blog-post-entry-title" onClick={RouteToBlogPost}>
            {post.title}
          </p>
          <p className="blog-post-entry-description">
            {post.month} {post.day}, {post.year} in {post.category}
          </p>
          <p className="blog-post-entry-abstract">
            {post.abstract}
          </p>
          <button className="blog-post-entry-button" onClick={RouteToBlogPost}>
            Read more
          </button>
        </div>
      </React.Fragment>
    );
  }

  return (
    <div className="blog-post-container">
      <Paginator items={posts} FormatContent={BlogPostFormatting} />
    </div>
  );



}
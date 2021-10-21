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
        <div className="blog-post-entry">
          <p className="blog-post-entry-title" onClick={RouteToBlogPost}>
            {post.title}
          </p>
          <p className="blog-post-entry-description">
            {post.month} {post.day}, {post.year}
          </p>
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="blog-post-container">
        <p></p>

        <Paginator items={posts} numItemsPerPage={5} FormatContent={BlogPostFormatting} />
      </div>
    </React.Fragment>
  );



}
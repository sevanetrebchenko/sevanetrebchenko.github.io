import React, { useState, useEffect } from "react";
import Content from "./content";

export default function Paginator(props = {}) {
  const { items, FormatContent } = props;

  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(3);

  // Set data.
  useEffect(() => {
    setPosts(items);
  }, [items]);

  // Get information about the current page.
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const visiblePosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  // Update the pagination of the current page.
  const ChangePage = (pageNumber) => {
    setCurrentPage(pageNumber);
  }

  return (
    <div className="content-pagination">
      <Content content={visiblePosts} FormatContent={FormatContent}/>
      <Pagination postsPerPage={postsPerPage} totalNumPosts={posts.length} ChangePage={ChangePage}/>
    </div>
  )
}

function Pagination(props = {}) {
  const { postsPerPage, totalNumPosts, ChangePage } = props;
  const pageNumbers = [];

  // Get all valid pagination indices.
  for (let i = 1; i <= Math.ceil(totalNumPosts / postsPerPage); ++i) {
    pageNumbers.push(i);
  }

  return (
    <nav>
      <ul>
        {
          pageNumbers.map(pageNumber => (
            <li key={pageNumber} onClick={() => ChangePage(pageNumber)}>
                {pageNumber}
            </li>
          ))
        }
      </ul>
    </nav>
  );
}
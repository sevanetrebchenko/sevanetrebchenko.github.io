import React, { useState, useEffect } from "react";
import Content from "./content";

import "./paginator.css"
import "./center.css"

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
    if (pageNumber === 0) {
      pageNumber = 1;
    }

    let finalPage = Math.ceil(posts.length / postsPerPage);

    if (pageNumber === (finalPage + 1)) {
      pageNumber = finalPage;
    }

    setCurrentPage(pageNumber);
  }

  return (
    <React.Fragment>
      <Content content={visiblePosts} FormatContent={FormatContent} />
      <Pagination postsPerPage={postsPerPage} totalNumPosts={posts.length} currentPage={currentPage} ChangePage={ChangePage} />
    </React.Fragment>
  )
}

function Pagination(props = {}) {
  const { postsPerPage, totalNumPosts, currentPage, ChangePage } = props;
  const pageNumbers = [];

  // Get all valid pagination indices.
  for (let i = 1; i <= Math.ceil(totalNumPosts / postsPerPage); ++i) {
    pageNumbers.push(i);
  }

  return (
    <div className="center pagination-container">

      {
        pageNumbers.map(pageNumber => (
          <li className="list-element" key={pageNumber} onClick={() => ChangePage(pageNumber)}>

            {
              pageNumbers.length > 1 ? 
                <button className={pageNumber == currentPage ? "pagination-element current" : "pagination-element"}>
                  {pageNumber}
                </button>
                : <></>
            }

          </li>
        ))
      }

    </div>
  );
}
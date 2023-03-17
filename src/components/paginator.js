
import React from 'react'
import { useState } from 'react'

// Components.
import Postcard from './postcard'

// Stylesheets.
import './paginator.css'

export default function Paginator(params) {
    // Takes in an array of posts to paginate.
    const { posts, postsPerPage } = params;
    const [currentPage, setCurrentPage] = useState(0);

    let pageNumbers = [];
    for (let i = 0; i < Math.ceil(posts.length / postsPerPage); ++i) {
        pageNumbers.push(i);
    }

    let visiblePosts = [...posts].splice(currentPage * postsPerPage, currentPage * postsPerPage + postsPerPage);

    const nextPage = function(e) {
        e.preventDefault();
        setCurrentPage(Math.min(currentPage + 1, posts.length - 1));
    }

    const previousPage = function(e) {
        e.preventDefault();
        setCurrentPage(Math.max(currentPage - 1, 0));
    }

    return (
        <React.Fragment>
            <div className='postcard-list'>
                {
                    visiblePosts.map((post, index) => (
                        <Postcard post={post} key={index}></Postcard>
                    ))
                }
            </div>
            <div className='pages'>

                <i className='fas fa-chevron-left fa-fw previous-page' onClick={previousPage}></i>

                <div className='page-list'>
                    {
                        pageNumbers.map((number) => {
                            const onClick = function (e) {
                                e.preventDefault();
                                setCurrentPage(number);
                            }
                            return (
                                <span className={currentPage == number ? 'page current' : 'page'} key={number} onClick={onClick}>{number + 1}</span>
                            );
                        })
                    }
                </div>

                <i className='fas fa-chevron-right fa-fw next-page' onClick={nextPage}></i>

            </div>
        </React.Fragment>

    );
}
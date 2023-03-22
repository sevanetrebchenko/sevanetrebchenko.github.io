
import React from 'react'
import { useState } from 'react'

// Components.
import Postcard from './postcard'

// Stylesheets.
import './paginator.css'

export default function Paginator(params) {
    // Takes in an array of posts to paginate.
    const { posts, numPostsPerPage, numPaddingPages } = params;
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    const numPages = Math.ceil(posts.length / numPostsPerPage);

    let pageNumbers = [];
    for (let i = 0; i < numPages; ++i) {
        pageNumbers.push(i);
    }

    const firstPageIndex = 0;
    const lastPageIndex = numPages;

    let elements = [];

    // Previous page chevron.
    const previousPage = function (e) {
        e.preventDefault();
        setCurrentPageIndex(Math.max(currentPageIndex - 1, firstPageIndex));
    }

    // elements.push(
    //     <i className='fas fa-chevron-left fa-fw previous-page' onClick={previousPage}></i>
    // );

    // //    1  2  3  4 ... 5 >
    // // <  1 ... 4  5  6 ... 9 >
    // // <  1 ... 3  4  5  6

    // if (currentPageIndex === 0) {
    //     // On the first page.

    //     // Push empty chevron icon to keep page numbers visually aligned.
    //     elements.push(
    //         <i className='fas fa-chevron-left fa-fw previous-page-icon hidden'></i>
    //     );

    //     elements.push(
    //         <span className={'page-number page-number-current'}>{1}</span>
    //     );

    //     if (lastPageIndex > 5) {

    //     }
    // }

    // elements.push(
    //     <span className={currentPageIndex === 0 ? 'page-number current' : 'page-number'} key={number} onClick={onClick}>
    //         {number + 1}
    //     </span>
    // );

    // if (currentPageIndex - firstPageIndex > bumper + 1) {
    //     elements.push(
    //         <span className={currentPageIndex === number ? 'page-number current' : 'page-number'} key={number} onClick={onClick}>
    //             {number + 1}
    //         </span>
    //     );
    // }
    // else {

    // }

    // // Next page chevron.
    // const nextPage = function (e) {
    //     e.preventDefault();
    //     setCurrentPageIndex(Math.min(currentPageIndex + 1, lastPageIndex - 1));
    // }

    // elements.push(
    //     <i className='fas fa-chevron-left fa-fw next-page' onClick={nextPage}></i>
    // );

    let visiblePosts = [...posts].splice(currentPageIndex * numPostsPerPage, currentPageIndex * numPostsPerPage + numPostsPerPage);





    return (
        <React.Fragment>
            <div className='postcard-list'>
                {
                    visiblePosts.map((post, index) => (
                        <Postcard post={post} key={index}></Postcard>
                    ))
                }
            </div>
            {/* <div className='page-numbers'>
                <i className='fas fa-chevron-left fa-fw previous-page' onClick={previousPage}></i>
                <div className='page-number-list'>
                    {
                        pageNumbers.map((number) => {
                            const onClick = function (e) {
                                e.preventDefault();
                                setCurrentPageIndex(number);
                            }
                            return (
                                <span className={currentPageIndex === number ? 'page-number current' : 'page-number'} key={number} onClick={onClick}>
                                    {number + 1}
                                </span>
                            );
                        })
                    }
                </div>
                <i className='fas fa-chevron-right fa-fw next-page' onClick={nextPage}></i>
            </div> */}
        </React.Fragment>

    );
}
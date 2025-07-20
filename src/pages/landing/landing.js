
import React, { Fragment, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {useMediaQuery} from "react-responsive";

// Components
import Sidebar from "./sidebar"
import Postcard from "./postcard";
import Search from "./search";
import {getResponsiveClassName, mobileDisplayWidthThreshold, tabletDisplayWidthThreshold} from "../../utils";

// Stylesheets
import "./landing.css"

function Paginate(props) {
    const [searchParams, setSearchParams] = useSearchParams();

    // screen size checks
    const isMobile = useMediaQuery({ maxWidth: mobileDisplayWidthThreshold });
    const isTablet = useMediaQuery({
        minWidth: mobileDisplayWidthThreshold + 1,
        maxWidth: tabletDisplayWidthThreshold,
    });
    const isHandheld = isMobile || isTablet;

    const { posts, postsPerPage } = props;
    const totalNumPages = Math.ceil(posts.length / postsPerPage);

    // Only on desktop do we manage the URL page param
    useEffect(() => {
        if (!isHandheld) {
            const page = parseInt(searchParams.get("page"), 10);
            if (isNaN(page) || page < 1) {
                const params = new URLSearchParams(searchParams);
                params.set("page", "1");
                setSearchParams(params, { replace: false });
            }
        }
    }, [isHandheld]);

    const [visibleCount, setVisibleCount] = useState(postsPerPage);

    const currentPage = parseInt(searchParams.get("page"), 10) || 1;

    // Determine which posts to show
    let currentPosts;
    if (isHandheld) {
        // Handheld devices have a 'Load More' button instead of true pagination
        currentPosts = posts.slice(0, visibleCount);
    }
    else {
        const startIndex = (currentPage - 1) * postsPerPage;
        currentPosts = posts.slice(startIndex, startIndex + postsPerPage);
    }

    // helper for desktop “go to page”
    const navigateToPage = (page) => {
        if (page < 1 || page > totalNumPages) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        setSearchParams(params, { replace: false });
    };

    const getPageItems = () => {
        const delta = 1;
        const currentPage = parseInt(searchParams.get("page"), 10) || 1;
        let left = currentPage - delta;
        let right = currentPage + delta;

        if (left < 2) {
            right = Math.min(right + (2 - left), totalNumPages - 1);
            left = 2;
        }
        if (right > totalNumPages - 1) {
            left = Math.max(left - (right - (totalNumPages - 1)), 2);
            right = totalNumPages - 1;
        }

        // First page is always visible
        const pageNumbers = [1];

        if (left > 2) {
            pageNumbers.push("...");
        }

        for (let i = left; i <= right; i++) {
            pageNumbers.push(i);
        }

        // Only add ellipsis if the replacement is not the next page number
        if (right < totalNumPages - 1) {
            pageNumbers.push("...");
        }

        // Last page is always visible
        if (totalNumPages > 1) {
            pageNumbers.push(totalNumPages);
        }

        return pageNumbers;
    };

    const pageNumbers = getPageItems();

    return (
        <Fragment>
            <div className={"content"}>
                {currentPosts.length > 0 ? (
                    <Fragment>
                        {currentPosts.map((post, i) => (
                            <Postcard post={post} key={i} />
                        ))}
                        {
                            isHandheld ?
                            (
                                visibleCount < posts.length && (
                                    <div className="load-more" onClick={() => setVisibleCount((prev) => prev + postsPerPage)}>
                                        <span>Load More</span>
                                        <i className="fa-solid fa-chevron-down fa-fw"></i>
                                    </div>
                                )
                            ) : (
                                <div className="pagination">
                                    <div className={"navigation-button" + (currentPage === 1 ? " disabled" : "")}
                                         onClick={() => navigateToPage(currentPage - 1)}>
                                        <i className="fa-fw fa-solid fa-chevron-left" />
                                        <span>Prev</span>
                                    </div>
                                    <div className="page-numbers">
                                        {pageNumbers.map((page, index) => {
                                            if (typeof page === "number") {
                                                return <span key={index} onClick={() => navigateToPage(page)} className={page === currentPage ? "active" : ""}>
                                                    {` ${page} `}
                                                </span>
                                            }
                                            else {
                                                return <span key={`${page}-${index}`} className="ellipsis">
                                                    {page}
                                                </span>
                                            }
                                        })}
                                    </div>
                                    <div className={"navigation-button align-right" + (currentPage === totalNumPages || totalNumPages === 0 ? " disabled" : "")}
                                         onClick={() => navigateToPage(currentPage + 1)}>
                                        <span>Next</span>
                                        <i className="fa-fw fa-solid fa-chevron-right" />
                                    </div>
                                </div>
                            )
                        }
                    </Fragment>
                ) : (
                    <div className="no-results">
                        <div className="description">
                            <span>No results found for </span>
                            <span className="query">"{searchParams.get("q")}"</span>
                        </div>
                    </div>
                )}
            </div>
        </Fragment>
    );
}

function Posts(props) {
    const {posts} = props;
    const {year, month} = useParams();
    const [searchParams] = useSearchParams();

    let filtered = posts;
    if (year) {
        filtered = filtered.filter(post => {
            return post.date.getFullYear() === Number(year);
        });

        if (month) {
            filtered = filtered.filter(post => {
                return post.date.getMonth() === Number(month - 1); // Months in JavaScript are zero-based
            });
        }
    }

    const searchQuery = searchParams.get("q") || "";

    let tags = searchParams.get("tags");
    if (tags) {
        tags = tags.split(",");
    } else {
        tags = []
    }

    // Filter posts based on the search query
    filtered = filtered.filter(post => {
        // Filter by query params
        if (searchQuery) {
            if (!post.title.toLowerCase().includes(searchQuery.toLowerCase()) && !post.abstract.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
        }

        // Filter by post categories
        if (tags.length > 0) {
            if (!tags.some(tag => post.tags.includes(tag))) {
                return false;
            }
        }

        return true;
    });

    const isMobile = useMediaQuery({ maxWidth: mobileDisplayWidthThreshold });
    const isTablet = useMediaQuery({ minWidth: mobileDisplayWidthThreshold + 1, maxWidth: tabletDisplayWidthThreshold });

    const classNames = ["posts"]
    if (isMobile) {
        classNames.push("mobile");
    }
    else if (isTablet) {
        classNames.push("tablet");
    }

    return (
        <div className={classNames.join(" ")}>
            {!isMobile && <Search></Search>}
            <Paginate posts={filtered} postsPerPage={7}></Paginate>
        </div>
    );
}

export default function Landing(props) {
    const {posts, tags, archive} = props;

    const isMobile = useMediaQuery({ maxWidth: mobileDisplayWidthThreshold });
    const isTablet = useMediaQuery({ minWidth: mobileDisplayWidthThreshold + 1, maxWidth: tabletDisplayWidthThreshold });

    return (
        <div className={getResponsiveClassName("landing", isMobile, isTablet)}>
            <div className="spacer left"></div>
            <Sidebar tags={tags} archive={archive}/>
            <Posts posts={posts}/>
            <div className="spacer right"></div>
        </div>
    );
}
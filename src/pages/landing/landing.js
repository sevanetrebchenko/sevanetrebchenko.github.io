
import React, { Fragment, useEffect } from "react";
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

    useEffect(() => {
        const page = parseInt(searchParams.get("page"), 10);
        if (isNaN(page) || page < 1) {
            // Add page to the URL on initial load
            const params = new URLSearchParams(searchParams);
            params.set("page", "1");
            setSearchParams(params, {replace: false});
        }
    }, []);

    const currentPage = parseInt(searchParams.get("page"), 10);

    const {posts, postsPerPage} = props;
    const totalNumPages = Math.ceil(posts.length / postsPerPage);

    // Determine which posts should be shown on this page
    const startIndex = (currentPage - 1) * postsPerPage;
    const currentPosts = posts.slice(startIndex, startIndex + postsPerPage);

    const navigateToPage = (page) => {
        if (page < 1 || page > totalNumPages) {
            return;
        }

        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        setSearchParams(params, {replace: false});
    };

    const isMobile = useMediaQuery({ maxWidth: mobileDisplayWidthThreshold });
    const isTablet = useMediaQuery({ minWidth: mobileDisplayWidthThreshold + 1, maxWidth: tabletDisplayWidthThreshold });

    return (
        <Fragment>
            <div className={getResponsiveClassName("content", isMobile, isTablet)}>
                {currentPosts.length > 0 ?
                    <Fragment>
                        {currentPosts.map((post, i) => (<Postcard post={post} key={startIndex + i}/>))}
                        <div className={getResponsiveClassName("paginate", isMobile, isTablet)}>
                            <div className={"navigation-button" + (currentPage === 1 ? " disabled" : "")}>
                                <div className="previous" onClick={() => navigateToPage(currentPage - 1)}>
                                    <i className="fa-fw fa-solid fa-chevron-left"></i>
                                    <span>Previous</span>
                                </div>
                            </div>

                            <div className="page-numbers">
                                {[...Array(totalNumPages)].map((_, i) => {
                                    const page = i + 1;
                                    return (
                                        <span key={page} onClick={() => navigateToPage(page)} className={page === currentPage ? "active" : ""}>
                                {page}
                            </span>
                                    );
                                })}
                            </div>

                            <div className={"navigation-button align-right" + ((currentPage === totalNumPages || totalNumPages === 0) ? " disabled" : "")}>
                                <div className="next" onClick={() => navigateToPage(currentPage + 1)}>
                                    <span>Next</span>
                                    <i className="fa-fw fa-solid fa-chevron-right"></i>
                                </div>
                            </div>
                        </div>
                    </Fragment>
                    :
                    (
                        <div className="no-results">
                            <div className="description">
                                <span>No results found for </span>
                                <span className="query">"{searchParams.get("q")}"</span>
                            </div>
                        </div>
                    )
                }
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
            <Search></Search>
            <Paginate posts={filtered} postsPerPage={7}></Paginate>
        </div>
    );
}

export default function Landing(props) {
    const {posts, tags, archive} = props;

    const isMobile = useMediaQuery({ maxWidth: mobileDisplayWidthThreshold });
    const isTablet = useMediaQuery({ minWidth: mobileDisplayWidthThreshold + 1, maxWidth: tabletDisplayWidthThreshold });

    const classNames = ["landing"]
    if (isMobile) {
        classNames.push("mobile");
    }
    else if (isTablet) {
        classNames.push("tablet");
    }

    return (
        <div className={classNames.join(" ")}>
            <Sidebar tags={tags} archive={archive}/>
            <Posts posts={posts}/>
        </div>
    );
}
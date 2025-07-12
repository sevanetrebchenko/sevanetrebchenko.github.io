
import React, {Fragment, useEffect} from "react";
import {useOutletContext, useParams, useSearchParams} from "react-router-dom";

// Components
import Sidebar from "./sidebar"
import Postcard from "./postcard";
import Search from "./search";

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
            setSearchParams(params, { replace: false });
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
        setSearchParams(params, { replace: false });
    };

    return (
        <Fragment>
            <div className="content">
                {currentPosts.map((post, i) => (
                    <Postcard post={post} key={startIndex + i}/>
                ))}
            </div>
            <div className="pagination">
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
    );
}

function Posts(props) {
    const { posts } = props;
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
    }
    else {
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

    return (
        <div className="posts">
            <Search></Search>
            <Paginate posts={filtered} postsPerPage={7}></Paginate>
        </div>
    );
}

export default function Landing(props) {
    const {posts, tags, archive} = props;
    return (
        <div className="landing">
            <div className="sidebar-container">
                <Sidebar tags={tags} archive={archive}/>
            </div>
            <div className="posts-container">
                <Posts posts={posts}/>
            </div>
        </div>
    );
}
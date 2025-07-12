
import React, {Fragment, useEffect, useState} from "react";
import {useLocation, useNavigate, useParams} from "react-router-dom";

// Components
import Sidebar from "./sidebar"
import Postcard from "./postcard";
import Search from "./search";

// Stylesheets
import "./landing.css"
import {useGlobalState} from "../../index";

function Paginate(props) {
    const location = useLocation();
    const navigateTo  = useNavigate();
    const [state, setGlobalState] = useGlobalState();

    // Parse initial page from URL, if it exists
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const initialPage = parseInt(params.get("page"), 10);

        if (!isNaN(initialPage) && initialPage > 0) {
            setGlobalState((prev) => ({
                ...prev,
                currentPage: initialPage,
            }));
        }
    }, [location.search, setGlobalState]);

    const {posts, postsPerPage} = props;
    const totalNumPages = Math.ceil(posts.length / postsPerPage);

    // Determine which posts should be shown on this page
    const startIndex = (state.currentPage - 1) * postsPerPage;
    const currentPosts = posts.slice(startIndex, startIndex + postsPerPage);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        params.set("page", state.currentPage.toString());
        navigateTo(`${location.pathname}?${params.toString()}`, { replace: false });
    }, [state.currentPage]);

    const navigateToPage = (page) => {
        if (page < 1 || page > totalNumPages) {
            return;
        }
        setGlobalState(prev => ({
            ...prev,
            currentPage: page,
        }));
    };

    return (
        <Fragment>
            <div className="content">
                {currentPosts.map((post, i) => (
                    <Postcard post={post} key={startIndex + i}/>
                ))}
            </div>
            <div className="pagination">
                <div className={"navigation-button" + (state.currentPage === 1 ? " disabled" : "")}>
                    <div className="previous" onClick={() => navigateToPage(state.currentPage - 1)}>
                        <i className="fa-fw fa-solid fa-chevron-left"></i>
                        <span>Previous</span>
                    </div>
                </div>

                <div className="page-numbers">
                    {[...Array(totalNumPages)].map((_, i) => {
                        const page = i + 1;
                        return (
                            <span key={page} onClick={() => navigateToPage(page)} className={page === state.currentPage ? "active" : ""}>
                                {page}
                            </span>
                        );
                    })}
                </div>

                <div className={"navigation-button align-right" + (state.currentPage === totalNumPages ? " disabled" : "")}>
                    <div className="next" onClick={() => navigateToPage(state.currentPage + 1)}>
                        <span>Next</span>
                        <i className="fa-fw fa-solid fa-chevron-right"></i>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}

function Posts(props) {
    const {posts} = props;
    const {year, month} = useParams();
    const location = useLocation();

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

    // Get the search query from the URL
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get("q") || "";
    const tags = queryParams.get("tags") || "";

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
            if (!tags.split(",").some(tag => post.tags.includes(tag))) {
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
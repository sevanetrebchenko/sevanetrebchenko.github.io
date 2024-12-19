
import React from "react";
import { useLocation, useParams } from "react-router-dom";

// Components
import Sidebar from "../components/sidebar";
import Search from "../components/search";
import PostCard from "../components/post-card";

// Stylesheets
import "./landing.css"

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
            <Search />
            <div className="content">
                {
                    filtered.map((post, id) => (
                        <PostCard post={post} key={id} />
                    ))
                }
            </div>
        </div>
    );
}

export default function Landing(props) {
    const {posts, tags, archive} = props;

    return (
        <div className="landing">
            <Sidebar tags={tags} archive={archive} />
            <Posts posts={posts} />
        </div>
    );
}
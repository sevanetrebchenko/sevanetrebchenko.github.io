
import React, { useState, useEffect } from 'react'

// Components.
import Profile from '../components/profile.js'
import Navbar from '../components/navbar.js'
import Paginator from '../components/paginator.js'
import Finder from '../components/finder.js'
import Archives from '../components/archives.js'
import Tags from '../components/tags.js'
import Categories from '../components/categories.js'

// Stylesheets.
import './landing.css';

// Landing page.
export default function Landing(params) {
    const { content } = params;
    let [posts, setPosts] = useState([...content.posts]);

    const onSearchInput = (query) => {
        let filtered = [...content.posts];
        query = query.trim();

        if (query) {
            // Filter posts based on search query.
            filtered = filtered.filter((post) => {
                const regex = new RegExp(query, 'i');
                return regex.test(post.title) || regex.test(post.abstract);
            });
        }

        setPosts(filtered);
    }

    return (
        <React.Fragment>
            <div className='header'>
                <Profile></Profile>
                <Navbar></Navbar>
            </div>
            <div className='content'>
                <Paginator posts={content.posts} postsPerPage={1}></Paginator>
            </div>
            <div className='sidebar'>
                <Finder onChange={onSearchInput}></Finder>
                <Archives archives={content.archives}></Archives>
                <Categories categories={content.categories}></Categories>
                <Tags tags={content.tags}></Tags>
            </div>
        </React.Fragment>
    );
}
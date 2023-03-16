
import React from 'react'
import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import { getDateObject } from './utility.js'

// Pages.
import Landing from './pages/landing.js'

// Stylesheets.
import './index.css'
import Search from './pages/search.js'

function loadContent() {
    const [content, setContent] = useState('');
    const filepath = 'content.json';

    // Load blog configuration.
    useEffect(() => {
        const request = new Request(filepath, {
            method: "GET",
            mode: "same-origin",
            cache: "reload",
            credentials: "same-origin",
            headers: {
                'Accept': "application/json",
                'Content-Type': "application/json",
            }
        });

        fetch(request)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        // TODO: 404 page.
                        return "File not found.";
                    }

                    throw new Error('fetch() response was not ok');
                }

                return response.json();
            })
            .then(text => {
                setContent(text);
            });
    }, []);

    return content;
}

// Entry point.
function Application() {
    const raw = loadContent();
    if (!raw) {
        console.debug('Loading website content...');
        return;
    }

    let content = [];
    content.posts = [];

    for (const post of raw.blog) {
        let copy = {...post};

        // Replace date string with object.
        copy.date = getDateObject(post.date);
        content.posts.push(copy);
    }

    for (let post of raw.projects) {
        let copy = {...post};

        // Replace date string with object.
        copy.date = getDateObject(post.date);
        content.posts.push(copy);
    }
    
    // Sort posts by date published.
    content.posts.sort((first, second) => {
        // Comparator: 
        // if a > b:  1, else
        // if a < b: -1, else
        // 0
        if (first.date.year == second.date.year) {
            if (first.date.month == second.date.month) {
                if (first.date.day == second.date.day) {
                    return 0; // Equal.
                }

                return first.date.day > second.date.day ? -1 : 1;
            }
            
            return first.date.month > second.date.month ? -1 : 1;
        }

        return first.date.year > second.date.year ? -1 : 1;
    });

    // Generate archive.
    let archives = new Map(); // Mapping of year to an array of posts published in that year.

    for (let i = 0; i < content.posts.length; ++i) {
        const post = content.posts[i];

        if (!archives.has(post.date.year)) {
            archives.set(post.date.year, []);
        }

        archives.get(post.date.year).push(i); // Save index of post, referenced later by content.posts[i].
    }

    content.archives = archives;

    // Generate tags list.
    let tags = new Set();
    for (const post of content.posts) {
        if (!post.tags) {
            continue;
        }

        for (const tag of post.tags) {
            tags.add(tag);
        }
    }

    content.tags = Array.from(tags).sort();

    // Generate categories list.
    let categories = new Set();
    for (const post of content.posts) {
        if (!post.categories) {
            continue;
        }

        for (const category of post.categories) {
            categories.add(category);
        }
    }

    content.categories = Array.from(categories).sort();

    let routes = [];

    // Set up routes for main site pages.
    routes.push(<Route exact path={'/'} element={<Landing content={content}/>}/>);
    routes.push(<Route path={'/search/*'} element={<Search/>}/>);
    // routes.push(<Route exact path={'/archives'} element={<Landing content={content}/>}/>);
    // routes.push(<Route exact path={'search'} element={<Search />}/>);

    // Set up routes to website post pages.
    for (const post of content.posts) {
    }

    return (
        <Router>
            <Routes>
                {
                    routes.map((route, index) => (
                        <React.Fragment key={index}>
                            {route}
                        </React.Fragment>
                    ))
                }
            </Routes>
        </Router>
    );
}

// main
createRoot(document.getElementsByClassName('root')[0]).render(<Application />)

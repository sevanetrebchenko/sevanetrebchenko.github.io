
import React, { createContext, useContext } from 'react'
import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'

// Components
import Landing from "./pages/landing/landing.js";
import Post from "./pages/post/post"
import {get, getPostUrl} from "./utils.js";

// Stylesheets
import "./index.css"

// Global application state
const initialState = {
    selectedTags: [],
    unselectedTags: [],
    currentPage: 1
};
const GlobalStateContext = createContext(null);

export function GlobalStateProvider(props) {
    const {children} = props;
    const [state, setState] = useState(initialState);

    return (
        <GlobalStateContext.Provider value={[state, setState]}>
            {children}
        </GlobalStateContext.Provider>
    );
}

// Custom hook to use the global state
export const useGlobalState = () => {
    return useContext(GlobalStateContext);
};


function parseDate(date) {
    const [month, day, year] = date.split('-');
    return new Date(year, month - 1, day); // month is 0-indexed in JavaScript
}

function parseLastModifiedTime(time) {
    return new Date(time)
}

function loadContent() {
    const [content, setContent] = useState(null);
    const filepath = 'site_content.json';

    // Load blog configuration
    useEffect(() => {
        async function load() {
            return await get("site_content.json");
        }
        load().then(response => {
            if (!response) {
                return;
            }

            const data = JSON.parse(response);

            // Parse post dates into JavaScript Date objects
            const parsed = data.posts.map(post => ({
                ...post,
                tags: post.tags.map(category => category.toLowerCase()),
                date: parseDate(post.date),
                lastModifiedTime: parseLastModifiedTime(post.last_modified_time),
            }));

            // Sort by publish date
            parsed.sort((a, b) => b.date - a.date)
            setContent({...data, posts: parsed});
        });
    }, []);

    return content;
}

function getTags(posts) {
    let tags = new Map();
    for (const post of posts) {
        if (!post.tags) {
            // Post has no tags
            continue;
        }

        // Get the number of posts that have a given tag
        for (const tag of post.tags) {
            if (!tags.has(tag)) {
                tags.set(tag, 0);
            }
            tags.set(tag, tags.get(tag) + 1);
        }
    }

    // Sort tag names alphabetically
    return new Map(
        Array.from(tags.entries()).sort((a, b) => {
            return a[0].localeCompare(b[0]);
        })
    );
}

function generateArchive(posts) {
    // Generate archive of all post dates
    let archive = new Map();
    for (const post of posts) {
        const date = post.date;
        if (!date) {
            // Skip post if no publish date was set
            continue;
        }

        const year  = post.date.getFullYear();
        const key = `${date.toLocaleString('default', {month: 'long'})} ${year}`
        archive.set(key, (archive.get(key) || 0) + 1);
    }

    // Sort posts by date published, most recent first
    return new Map(Array.from(archive.entries()).sort((a, b) => {
        return new Date(b[0]) - new Date(a[0]);
    }));
}

function App() {
    const content = loadContent();
    if (!content) {
        return null;
    }

    const tags = getTags(content.posts);
    const archive = generateArchive(content.posts);

    const routes = [];

    // Configure routes for main site pages
    const landing = <Landing posts={content.posts} tags={tags} archive={archive}></Landing>;
    routes.push(<Route path={'/'} element={landing}></Route>);
    routes.push(<Route path={'/archive/:year'} element={landing}></Route>);
    routes.push(<Route path={'/archive/:year/:month'} element={landing}></Route>);

    // Configure routes for post pages
    for (const post of content.posts) {
        routes.push(<Route path={getPostUrl(post.title)} element={<Post post={post} />}></Route>);
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
createRoot(document.getElementsByClassName('root')[0]).render(
    <GlobalStateProvider>
        <App />
    </GlobalStateProvider>
);

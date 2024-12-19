
import React, { createContext, useContext } from 'react'
import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Components
import Landing from "./pages/landing.js";
import { getPostUrl } from "./helpers.js";
import Post from "./pages/post.js";

// Stylesheet
import './index.css'

// Global application state
const initialState = {
    selectedTags: [],
    unselectedTags: [],
};
const GlobalStateContext = createContext();

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

function loadContent() {
    const [content, setContent] = useState(null);
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
                        return null;
                    }

                    throw new Error('fetch() response was not ok');
                }

                return response.json();
            })
            .then(data => {
                if (data) {
                    // Parse post dates into JavaScript Date objects
                    const parsed = data.posts.map(post => ({
                        ...post,
                        tags: post.tags.map(category => category.toLowerCase()),
                        date: parseDate(post.date)
                    }));

                    // Sort by publish date
                    parsed.sort((a, b) => b.date - a.date)
                    setContent({ ...data, posts: parsed });
                }
            });
    }, [filepath]);

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

        if (!archive.has(date)) {
            archive.set(date, 0);
        }
        archive.set(date, archive.get(date) + 1);
    }

    // Sort posts by date published, most recent first
    return new Map(Array.from(archive.entries()).sort((a, b) => {
        return new Date(b[0]) - new Date(a[0]);
    }));
}

function Application() {
    const content = loadContent();
    if (!content) {
        return null;
    }

    const tags = getTags(content.posts);
    const archive = generateArchive(content.posts);

    const routes = [];

    // Set up routes for main site pages

    // Landing page
    let landing = <Landing posts={content.posts} tags={tags} archive={archive}></Landing>;
    routes.push(<Route path={'/'} element={landing}></Route>);
    routes.push(<Route path={'/archive/:year'} element={landing}></Route>);
    routes.push(<Route path={'/archive/:year/:month'} element={landing}></Route>);

    // Posts
    // for (const post of content.posts) {
    //     routes.push(<Route path={getPostUrl(post.title)} element={<Post post={post} />}></Route>);
    // }
    // routes.push(<Route path={'/'} element={<Post post={content.posts[0]} />}></Route>);


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
        <Application />
    </GlobalStateProvider>
);

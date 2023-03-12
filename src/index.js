
import React from 'react'
import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Import components.
import Post from './components/post.js'
import Landing from './pages/landing.js'
import Archive from './pages/archive.js'

// Entry point.
function Application() {
    const [content, setContent] = useState('');

    // Load post list.
    useEffect(() => {
        const request = new Request('posts.json', {
            method: "GET",
            mode: "same-origin",
            cache: "reload",
            credentials: "same-origin",
            headers: {
                'Accept': "application/json",
                'Content-Type': "application/json",
            }
        });
        const loadContent = function () {
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
        };
        loadContent();
    }, []);

    if (!content) {
        console.log('Loading website content...');
        return;
    }

    let routes = [];

    // Set up routes to website post pages.
    for (let post of content.posts) {
        routes.push(<Route path={post.filepath} element={<Post data={post} />} />);
    }

    let archives = new Map();
    for (let post of content.posts) {
        const year = post.date.published.split('-')[2];
        archives.set(year, new Set());
    }

    // Generate list of posts for each year.
    for (let post of content.posts) {
        const year = post.date.published.split('-')[2];
        archives.get(year).add(post);
    }

    // Set up routes to archive pages.
    archives.forEach((archive, year) => {
        routes.push(<Route path={`archive/${year}`} element={<Archive posts={Array.from(archive)}/>} />)
    });

    routes.push(<Route exact path='/' element={<Landing content={content} archives={archives}/>} />);

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

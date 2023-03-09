
import React from 'react'
import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Import components.
import Post from './components/post.js'
import Landing from './components/landing.js'

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
    routes.push(<Route exact path='/' element={<Landing content={content}/>} />);

    // Set up routes to website post pages.
    for (let post of content.posts) {
        routes.push(<Route path={post.filepath} element={<Post data={post} />} />);
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

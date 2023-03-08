import React from 'react'
import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { join } from 'path-browserify'

// import components
import Directory from './components/directory.js'
import Post from './components/post.js'

// entry point
function Application() {
    const [directory, setDirectory] = useState('');

    // load public-facing directory structure (content)
    useEffect(() => {
        const file = 'posts.json'
        const request = new Request(file, {
            method: "GET",
            mode: "same-origin",
            cache: "reload",
            credentials: "same-origin",
            headers: {
                'Accept': "text/plain",
                'Content-Type': "text/plain",
            }
        });

        const getFile = () => {
            fetch(request)
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 404) {
                            return "File not found.";
                        }

                        throw new Error('fetch() response was not ok');
                    }

                    return response.json();
                })
                .then(text => {
                    setDirectory(text);
                });
        };

        getFile();
    }, []);

    if (!directory) {
        console.log('loading...');
        return;
    }

    console.log(directory);

    return (<React.Fragment></React.Fragment>);

    return (
        <Router>
            <Routes>
                {
                    generateRoutes(structure)
                }
            </Routes>
        </Router>
    )
}

// generate a Route component for each directory holding website content
function generateRoutes(structure) {
    const generateDirectoryList = (root) => {
        let directories = [];

        // push top-level directory
        directories.push(root)

        for (let i = 0; i < root['elements'].length; i++) {
            const element = root['elements'][i];

            if (element['type'] == 'directory') {
                directories = directories.concat(generateDirectoryList(element));
            }
        }

        return directories;
    };

    const directories = generateDirectoryList(structure['root']);

    // 'element' is a json object describing the directory structure at the given element
    return directories.map(function(element, index) {
        return (
            <React.Fragment key={index}>
                <Route path={join(element['path'], ':name')} element={<Post parent={element['path']} />} />
                <Route path={element['path']} element={<Directory structure={element} />} />
            </React.Fragment>
        );
    });
}


// main
createRoot(document.getElementById('root')).render(<Application />)

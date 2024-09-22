
import React from 'react'
import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Components
import Card from "./components/card";
import Sidebar from "./components/sidebar";

// Stylesheets
import './index.css'

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
            .then(text => {
                setContent(text);
            });
    }, [filepath]);

    return content;
}

function Posts(props) {
    const { posts } = props;
    return (
        <div className="posts-container">
            <div className="posts">
                {
                    posts.map((post, id) => (
                        <Card key={id} title={post.title} abstract={post.abstract} date={post.date} categories={post.categories} />
                    ))
                }
            </div>
        </div>
    )
}

function Application() {
    const content = loadContent();
    if (!content) {
        console.log("Loading site content...");
        return null;
    }
    console.log("done");

    return (
        <div className="landing">
            <div className="main">
                <Sidebar></Sidebar>
                <Posts posts={content["blog"]}></Posts>
            </div>
        </div>
    );
}


//
//
// // Entry point.
// function Application() {
//     const raw = loadContent();
//     AOS.init({
//         mirror: false,
//         once: true
//     });
//
//     if (!raw) {
//         console.debug('Loading website content...');
//         return;
//     }
//
//
//     let content = [];
//     content.posts = [];
//
//     for (const post of raw.blog) {
//         let copy = {...post};
//
//         // Replace date string with object.
//         copy.date = getDateObject(post.date);
//         content.posts.push(copy);
//     }
//
//     for (let post of raw.projects) {
//         let copy = {...post};
//
//         // Replace date string with object.
//         copy.date = getDateObject(post.date);
//         content.posts.push(copy);
//     }
//
//     // Sort posts by date published.
//     content.posts.sort((first, second) => {
//         // Comparator:
//         // if a > b:  1, else
//         // if a < b: -1, else
//         // 0
//         if (first.date.year == second.date.year) {
//             if (first.date.month == second.date.month) {
//                 if (first.date.day == second.date.day) {
//                     return 0; // Equal.
//                 }
//
//                 return first.date.day > second.date.day ? -1 : 1;
//             }
//
//             return first.date.month > second.date.month ? -1 : 1;
//         }
//
//         return first.date.year > second.date.year ? -1 : 1;
//     });
//
//     // Generate archive.
//     let archives = new Map(); // Mapping of year to an array of posts published in that year.
//     for (let i = 0; i < content.posts.length; ++i) {
//         const post = content.posts[i];
//
//         if (!archives.has(post.date.year)) {
//             archives.set(post.date.year, []);
//         }
//
//         archives.get(post.date.year).push(i); // Save index of post, referenced later by content.posts[i].
//     }
//
//     content.archives = archives;
//
//     // Generate category list.
//     let categories = new Map();
//     for (const post of content.posts) {
//         if (!post.categories) {
//             continue;
//         }
//
//         for (const category of post.categories) {
//             if (!categories.has(category)) {
//                 categories.set(category, 0);
//             }
//
//             categories.set(category, categories.get(category) + 1);
//         }
//     }
//
//     console.log(categories);
//
//     content.categories = Array.from(categories).sort(function(a, b) {
//         return a[0].localeCompare(b[0]);
//     });
//
//     let routes = [];
//
//     // Set up routes for main site pages.
//     routes.push(<Route exact path={'/'} element={<Landing content={content}/>}></Route>);
//     routes.push(<Route exact path={'/projects'} element={<Projects content={content}/>}></Route>);
//     routes.push(<Route exact path={'/journal'} element={<Blog content={content}/>}></Route>);
//     routes.push(<Route path={'/search/*'} element={<Search/>}/>);
//     // routes.push(<Route exact path={'/archives'} element={<Landing content={content}/>}/>);
//     // routes.push(<Route exact path={'search'} element={<Search />}/>);
//
//     // Set up routes to website post pages.
//     for (const post of content.posts) {
//     }
//     //
//     // return (
//     //     <Router>
//     //         <Routes>
//     //             {
//     //                 routes.map((route, index) => (
//     //                     <React.Fragment key={index}>
//     //                         {route}
//     //                     </React.Fragment>
//     //                 ))
//     //             }
//     //         </Routes>
//     //     </Router>
//     // );
// }

// main
createRoot(document.getElementsByClassName('root')[0]).render(<Application />)

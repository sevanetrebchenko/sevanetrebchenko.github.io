
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

// Components.
import Profile from '../components/profile.js'
import Navbar from '../components/navbar.js'
import Paginator from '../components/paginator.js'
import Postcard from '../components/postcard.js'
import Finder from '../components/finder.js'
import Archives from '../components/archives.js'
import Categories from '../components/categories.js'

// Stylesheets.
import './landing.css';
import Header from '../components/header.js'

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

    const style = {
        backgroundImage: 'url(\'images/render.png\')',
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
    };

    return (
        <React.Fragment>
                <Navbar></Navbar>
            <div className='main-container' style={style}>
                <div className='title-container'>
                    <span className='title'>seva netrebchenko</span>
                    <span className='description'>software engineer by profession, graphics enthusiast at heart</span>
                </div>
            </div>
        </React.Fragment>



        // <div className='cover-image-container'>
        //     <img src='images/render.png' className='cover-image'></img>
        //     <div className='content-container'>
        //         <div className='main-header'>
        //             <span className='navbar-element'>HOME</span>
        //             <span className='navbar-element'>ABOUT</span>
        //             <span className='navbar-element'>BLOG</span>
        //             <span className='navbar-element'>PROJECTS</span>
        //         </div>

        //         <div className='site-content'>
        //             <span className='site-name'>Seva Netrebchenko</span>
        //             <span className='site-description'>software engineer by profession, graphics enthusiast at heart</span>
        //         </div>
        //     </div>
        // </div>
        // <React.Fragment>
        //     <Header></Header>
        //     <div className='site'>
        //         <div className='content'>
        //             <div className='postcard-list'>
        //                 {
        //                     content.posts.map((post, index) => (
        //                         <Postcard post={post} key={index}></Postcard>
        //                     ))
        //                 }
        //             </div>

        //             {/* <Paginator posts={content.posts} postsPerPage={1}></Paginator> */}
        //         </div>
        //         <div className='sidebar'>
        //             <Finder onChange={onSearchInput}></Finder>
        //             <Archives archives={content.archives}></Archives>
        //             <Categories categories={content.categories}></Categories>
        //         </div>
        //     </div>
        // </React.Fragment>
    );
}

import React, { useState, useEffect } from 'react'

// Components.
import Profile from '../components/profile.js'
import Navbar from '../components/navbar.js'
import Postcard from '../components/postcard.js'
import Search from '../components/search.js'
import Archives from '../components/archives.js'
import Tags from '../components/tags.js'
import Categories from '../components/categories.js'

// Stylesheets.
import './landing.css';

// Landing page.
export default function Landing(params) {
    const { content } = params;

    return (
        <React.Fragment>
            <div className='header'>
                <Profile></Profile>
                <Navbar></Navbar>
            </div>
            <div className='content'>
                <div className='postcard-list'>
                    {
                        content.posts.map((post, index) => (
                            <Postcard post={post} key={index} />
                        ))
                    }
                </div>
            </div>
            <div className='sidebar'>
                <Search content={content}></Search>
                <Archives archives={content.archives}></Archives>
                <Categories categories={content.categories}></Categories>
                <Tags tags={content.tags}></Tags>
            </div>
        </React.Fragment>
    );
}
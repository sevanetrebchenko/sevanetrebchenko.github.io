
import React, { useState, useEffect } from 'react'

// Components.
import Profile from '../components/profile.js'
import Navbar from '../components/navbar.js'
import Postcard from '../components/postcard.js'

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
            </div>

        </React.Fragment>
    );
}

import React, { useState, useEffect } from 'react';

// Components.
import Profile from '../components/profile.js'
import Links from '../components/links.js'
import Navbar from '../components/navbar.js'
import Postcard from '../components/postcard.js'

// Stylesheets.
import './landing.css';

// Landing page for blog.
export default function Landing(params) {
    const { content } = params;

    return (
        <React.Fragment>
            <div className='header'>
                <Profile></Profile>
                <Links></Links>
                <Navbar></Navbar>
            </div>

            <div className='content'>
                <section className='postcard-list'>
                    {
                        content.posts.map((post, index) => (
                            <Postcard post={post} key={index} />
                        ))
                    }
                </section>
            </div>

            <div className='sidebar'>
            </div>

        </React.Fragment>
    );
}
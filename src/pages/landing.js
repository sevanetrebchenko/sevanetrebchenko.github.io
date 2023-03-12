
import React from 'react'

import Social from '../components/socials.js'
import Card from '../components/card.js'
import Archive from '../components/archive.js'
import { Link, useNavigate } from 'react-router-dom'

// Import components.
import Header from '../components/header.js'
import Socials from '../components/socials.js'
import Navbar from '../components/navbar.js'
import Tags from '../components/tags.js'

export default function Landing({ content }) {
    const navigateTo = useNavigate();

    // Social menu

    // Archives.
    let archives = new Map(); // Mapping from year to a list of posts published in that year.
    for (let post of content.posts) {
        const year = post.date.published.split('-')[2];

        // Add post to the correct archive.
        if (!archives.has(year)) {
            archives.set(year, new Set());
        }
        archives.get(year).add(post);
    }

    return (
        <React.Fragment>

            <div className='left-sidebar'>
                <Header></Header>
                <Socials></Socials>
                <Navbar></Navbar>
            </div>


            <div className='main-content'>
                {
                    Array.from(content.posts).map((post, index) => (
                        <Card post={post} key={index}></Card>
                    ))
                }
            </div>

            <div className='right-sidebar'>
                <Archive posts={content.posts}></Archive>
                <Tags posts={content.posts}></Tags>
            </div>

        </React.Fragment>
    );
}

import React from 'react'

// Components.
import Profile from '../components/profile.js'
import Navbar from '../components/navbar.js'
import Finder from '../components/finder.js'

// Stylesheets.
import './search.css'

export default function Search(params) {
    const { content } = params;

    const url = new URL(window.location.href);
    const search = new URLSearchParams(url.search).get('s');



    return (
        <div className='search-page'>
            <div className='search header'>
                <Profile></Profile>
                <Navbar></Navbar>
            </div>
            <div className='search content'>
                <Finder searchText={search}></Finder>
            </div>
        </div>
    );
}
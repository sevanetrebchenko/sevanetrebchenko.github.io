
import React from 'react';
import { Link } from 'react-router-dom';

// Stylesheets.
import './navbar.css';

export default function Navbar() {
    return (
        <div className='navbar'>
            <div className='entry'>
                <Link to={'/'} >
                    <i className='fa-solid fa-house fa-fw icon' />
                    <p>Home</p>
                </Link>
            </div>
            <div className='entry'>
                <Link to={'about'} >
                    <i className='fa-solid fa-user fa-fw icon' />
                    <p>About</p>
                </Link>
            </div>
            <div className='entry'>
                <Link to={'archives'} >
                    <i className='fa-solid fa-box-archive fa-fw icon' />
                    <p>Archives</p>
                </Link>
            </div>
        </div>
    );
}
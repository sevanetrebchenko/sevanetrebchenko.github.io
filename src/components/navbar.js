
import React from 'react'

// Import stylesheet(s).
import './navbar.css'
import './icon.css'

export default function Navbar() {
    return (
        <div className='navbar'>
            <div className='item'>
                <a href='/'>
                    <i className='fa-solid fa-house fa-fw icon' />
                    <p>Home</p>
                </a>
            </div>
            <div className='item'>
                <a href='about'>
                    <i className='fa-solid fa-user fa-fw icon' />
                    <p>About</p>
                </a>
            </div>
            <div className='item'>
                <a href='archives'>
                    <i className='fa-solid fa-box-archive fa-fw icon' />
                    <p>Archives</p>
                </a>
            </div>
        </div>
    );
}
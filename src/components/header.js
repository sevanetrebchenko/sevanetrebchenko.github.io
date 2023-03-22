
import React from 'react'

import './header.css'

export default function Header() {
    return (
        <div className='site-header'>
            <div className='site-navbar'>
                <span>Blog</span>
                <span>Projects</span>
                <span>|</span>
                <span>About</span>
            </div>
        </div>
    )
}

import React from 'react'

// Import stylesheets.
import './header.css'

export default function Header() {
    return (
        <div className='header'>
            <img src='assets/pfp.png' />
            <div className='description'>
                <h1>Seva Netrebchenko</h1>
                <h2>Software engineer by day, graphics enthusiast by night</h2>
            </div>
        </div>
    );
}

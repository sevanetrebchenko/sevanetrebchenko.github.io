
import React from 'react';

// Stylesheets
import './profile.css';

export default function Header() {
    return (
        <div className='profile'>
            <img src='assets/pfp.png'/>
            <div className='about'>
                <h1>Seva Netrebchenko</h1>
                <h2>Software engineer by day, graphics enthusiast by night</h2>
            </div>
        </div>
    );
}

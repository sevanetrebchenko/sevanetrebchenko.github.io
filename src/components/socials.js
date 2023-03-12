
import React from 'react'

// Import styles.
import './icon.css'

export default function Socials() {
    return (
        <div className='icon-container'>

            <i className='fas fa-envelope fa-fw icon' onClick={(e) => {
                e.preventDefault();
                window.location.href = 'mailto:seva.netrebchenko@gmail.com';
            }} />

            <i className='fab fa-github fa-fw icon' onClick={(e) => {
                e.preventDefault();
                window.location.href = 'https://github.com/sevanetrebchenko/';
            }} />

            <i className="fab fa-linkedin fa-fw icon" onClick={(e) => {
                e.preventDefault();
                window.location.href = 'https://www.linkedin.com/in/sevanetrebchenko/';
            }} />

            <i className="fab fa-twitter fa-fw icon" onClick={(e) => {
                e.preventDefault();
                window.location.href = 'https://twitter.com/netrebchenko/';
            }} />

        </div>
    );
}
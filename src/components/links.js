
import React from 'react'

// Import styles.
import './links.css'

export default function Links() {
    return (
        <div className='links'>
            <i className='fas fa-envelope fa-fw' onClick={(e) => {
                e.preventDefault();
                window.location.href = 'mailto:seva.netrebchenko@gmail.com';
            }} />

            <i className='fab fa-github fa-fw' onClick={(e) => {
                e.preventDefault();
                window.location.href = 'https://github.com/sevanetrebchenko/';
            }} />

            <i className="fab fa-linkedin fa-fw" onClick={(e) => {
                e.preventDefault();
                window.location.href = 'https://www.linkedin.com/in/sevanetrebchenko/';
            }} />

            <i className="fab fa-twitter fa-fw" onClick={(e) => {
                e.preventDefault();
                window.location.href = 'https://twitter.com/netrebchenko/';
            }} />
        </div>
    );
}
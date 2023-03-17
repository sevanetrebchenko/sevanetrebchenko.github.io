
import React from 'react'
import { Link } from 'react-router-dom'

// Stylesheets
import './profile.css'

export default function Profile() {
    return (
        <div className='profile'>
            <img src='/images/pfp.png' />
            <div className='profile-meta'>
                <span className='profile-name'>Seva Netrebchenko</span>
                <span className='profile-description'>Software engineer by profession, game developer and graphics enthusiast at heart</span>
            </div>
            {/* <div className='profile-socials'>
                <Link to={'mailto:seva.netrebchenko@gmail.com'}>
                    <i className='fas fa-envelope fa-fw'></i>
                </Link>

                <Link to={'https://github.com/sevanetrebchenko/'}>
                    <i className='fab fa-github fa-fw'></i>
                </Link>

                <Link to={'https://www.linkedin.com/in/sevanetrebchenko/'}>
                    <i className='fab fa-linkedin fa-fw'></i>
                </Link>

                <Link to={'https://twitter.com/netrebchenko/'}>
                    <i className='fab fa-twitter fa-fw'></i>
                </Link>
            </div> */}
        </div>
    );
}

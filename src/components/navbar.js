
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './navbar.css'

function NavbarElement(props) {
    const { destination, children } = props;
    const location = useLocation();

    let classNames = ['navbar-element'];

    if (location.pathname === '/') {
        // All navbar elements should be displayed as highlighted on the landing page.
        classNames.push('navbar-element-landing');
    }
    else if (location.pathname == destination) {
        classNames.push('navbar-element-current');
    }

    return (
        <Link to={destination} className={classNames.join(' ')}>
            {children}
        </Link>
    );
}

export default function Navbar(props) {
    return (
        <div className='navbar'>
            <NavbarElement destination={'/projects'}>
                <span className='navbar-element-name'>// projects</span>
            </NavbarElement>

            <NavbarElement destination={'/blog'}>
                <span className='navbar-element-name'>// blogs</span>
            </NavbarElement>

            <NavbarElement destination={'/about'}>
                <span className='navbar-element-name'>// about</span>
            </NavbarElement>
        </div>
    );
}
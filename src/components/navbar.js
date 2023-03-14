
import React from 'react'
import { Link, useLocation } from 'react-router-dom'

// Stylesheets.
import './navbar.css'

function NavbarElement(params) {
    const { destination, children } = params;
    const location = useLocation();

    return (
        <Link to={destination} className={(location.pathname === destination) ? 'navbar-element navbar-element-current' : 'navbar-element'}>
            {children}
        </Link>
    );
}

export default function Navbar(params) {
    return (
        <div className='navbar'>
            <NavbarElement destination={'/'}>
                <i className='fa-solid fa-house fa-fw navbar-element-icon' />
                <span className='navbar-element-name'>Home</span>
            </NavbarElement>

            <NavbarElement destination={'/about'}>
                <i className='fa-solid fa-user fa-fw navbar-element-icon' />
                <span className='navbar-element-name'>About</span>
            </NavbarElement>

            <NavbarElement destination={'/archives'}>
                <i className='fa-solid fa-box-archive fa-fw navbar-element-icon' />
                <span className='navbar-element-name'>Archives</span>
            </NavbarElement>
        </div>
    );
}
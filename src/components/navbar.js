
import React, { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import './navbar.css';

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
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const openDropdownButtonRef = useRef(null);
    const closeDropdownButtonRef = useRef(null);

    const openDropdown = function (event) {
        event.preventDefault();

        let dropdown = dropdownRef.current;
        dropdown.className = 'navbar-dropdown navbar-dropdown-open';

        let openDropdownButton = openDropdownButtonRef.current;
        openDropdownButton.className = 'hidden';

        let closeDropdownButton = closeDropdownButtonRef.current;
        closeDropdownButton.className = 'fa-solid fa-xmark fa-fw navbar-button';

        setDropdownOpen(true);
    }

    const closeDropdown = function (event) {
        event.preventDefault();

        let dropdown = dropdownRef.current;
        dropdown.className = 'navbar-dropdown';

        const timeout = setTimeout(() => {
            let openDropdownButton = openDropdownButtonRef.current;
            openDropdownButton.className = 'fa-solid fa-bars fa-fw navbar-button';
        }, 1 * 1000); // setTimeout requires milliseconds.
        
        setDropdownOpen(false);
    }

    return (
        <React.Fragment>
            <div className='navbar navbar-mobile'>
                <i className={'fa-solid fa-bars fa-fw navbar-button'} onClick={openDropdown} ref={openDropdownButtonRef}></i>

                <div className='navbar-dropdown' ref={dropdownRef}>
                    <div className='navbar-elements'>
                        <i className={'fa-solid fa-xmark fa-fw navbar-button'} onClick={closeDropdown} ref={closeDropdownButtonRef}></i>

                        <NavbarElement destination={'/projects'}>
                            <span className='navbar-element-name'>// projects</span>
                        </NavbarElement>

                        <NavbarElement destination={'/blog'}>
                            <span className='navbar-element-name'>// blog</span>
                        </NavbarElement>

                        <NavbarElement destination={'/about'}>
                            <span className='navbar-element-name'>// about</span>
                        </NavbarElement>
                    </div>
                </div>
            </div>

            {/* <div className='navbar navbar-desktop'>
                {
                    navbarElements.map((element, index) => (
                        <React.Fragment key={index}>{element}</React.Fragment>
                    ))
                }
            </div> */}
        </React.Fragment>
    );
}
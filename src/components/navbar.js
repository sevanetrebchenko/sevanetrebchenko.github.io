
import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { hasClassName, addClassName, removeClassName, enableScrolling, disableScrolling } from '../util/util.js';
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
    const dropdownRef = useRef(null);
    const openDropdownButtonRef = useRef(null);
    const overlayRef = useRef(null);

    const openDropdownAnimationTimeInSeconds = 0.3; // Time (in seconds) for the navbar to open / close.
    const openDropdownButtonAnimationTimeInSeconds = 0.18; // Time (in seconds) for the open dropdown button (bars) to fade out.

    const openDropdown = function (event) {
        event.preventDefault();

        // Append 'navbar-dropdown-open' CSS style to all relevant components.

        let dropdown = dropdownRef.current;
        let openDropdownButton = openDropdownButtonRef.current;
        let overlay = overlayRef.current;

        if (hasClassName(dropdown, 'navbar-dropdown-open')) {
            // Prevent attempt to open dropdown during dropdown open animation.
            return;
        }

        addClassName(dropdown, 'navbar-dropdown-open');
        addClassName(openDropdownButton, 'navbar-dropdown-open');

        // Apply fade to main page content to focus user attention on navbar dropdown.
        addClassName(overlay, 'navbar-dropdown-open');

        // Disable scrolling on the main page while the dropdown is open.
        disableScrolling();
    }

    const closeDropdown = function (event) {
        event.preventDefault();

        let dropdown = dropdownRef.current;
        let overlay = overlayRef.current;

        if (!hasClassName(dropdown, 'navbar-dropdown-open')) {
            // Prevent closing an already closed dropdown menu.
            return;
        }

        removeClassName(dropdown, 'navbar-dropdown-open');

        // Fade out overlay.
        removeClassName(overlay, 'navbar-dropdown-open');

        // Delay fade-in for dropdown open button slightly.
        setTimeout(() => {
            removeClassName(openDropdownButtonRef.current, 'navbar-dropdown-open'); // Guaranteed to exist.
        }, openDropdownButtonAnimationTimeInSeconds * 1000);

        // Re-enable scrolling on main page content.
        setTimeout(() => {
            enableScrolling();
        }, openDropdownAnimationTimeInSeconds * 1000);
    }

    useEffect(() => {
        // Add event listener to close dropdown menu if user clicks outside of it.
        function onClickOutside(event) {
            if (!dropdownRef.current.contains(event.target)) {
                closeDropdown(event);
            }
        }

        document.addEventListener('mousedown', onClickOutside);

        return () => {
            removeClassName(document.body, 'no-scroll');
            document.removeEventListener('mousedown', onClickOutside);
        };
    }, []); // Only run when mounting / unmounting.

    return (
        <React.Fragment>
            <div className='navbar navbar-mobile'>
                <i className='fa-solid fa-bars fa-fw navbar-button navbar-button-open-dropdown' onClick={openDropdown} ref={openDropdownButtonRef}></i>

                <div className='navbar-dropdown' ref={dropdownRef}>
                    <div className='navbar-elements'>
                        <i className='fa-solid fa-xmark fa-fw navbar-button' onClick={closeDropdown}></i>
                        <div className='navbar-links'>
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

                <div className='navbar-overlay' ref={overlayRef}>
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

import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { hasClassName, addClassName, removeClassName, enableScrolling, disableScrolling, toMilliseconds } from '../util/util.js';
import './navbar.scss';

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
    const dropdownToggleRef = useRef(null);
    const dropdownOverlayRef = useRef(null);

    const openDropdown = function (e) {
        const dropdown = dropdownRef.current;
        const dropdownToggle = dropdownToggleRef.current;
        const dropdownOverlay = dropdownOverlayRef.current;

        addClassName(dropdown, 'active');
        addClassName(dropdownToggle, 'active');
        addClassName(dropdownOverlay, 'active');

        // Push overlay z-index to the front to cover page content.
        addClassName(dropdownOverlay, 'visible');

        // Disable scrolling for main page content.
        disableScrolling();
    }

    const closeDropdown = function (e) {
        const dropdown = dropdownRef.current;
        const dropdownToggle = dropdownToggleRef.current;
        const dropdownOverlay = dropdownOverlayRef.current;

        removeClassName(dropdown, 'active');
        removeClassName(dropdownOverlay, 'active');

        setTimeout(() => {
            removeClassName(dropdownToggle, 'active');
        }, toMilliseconds(0.18));

        // Push overlay z-index to behind page content.
        setTimeout(() => {
            removeClassName(dropdownOverlay, 'visible');
        }, toMilliseconds(0.3));

        // Re-enable scrolling for main page content.
        enableScrolling();
    }

    useEffect(() => {
        const dropdown = dropdownRef.current;

        // Add event listener to close dropdown menu if user clicks outside of it.
        function onClickOutside(e) {
            // Do not attempt to close a closed navbar dropdown.
            if (!hasClassName(dropdown, 'active')) {
                return;
            }

            if (!dropdown.contains(e.target)) {
                closeDropdown(e);
            }
        }

        document.addEventListener('mousedown', onClickOutside);

        return () => {
            enableScrolling();
            document.removeEventListener('mousedown', onClickOutside);
        };
    }, []); // Only run when mounting / unmounting.

    return (
        <section className='navbar'>
            <div className='navbar-mobile'>
                <i className='fa-solid fa-bars fa-fw navbar-button navbar-dropdown-toggle' ref={dropdownToggleRef} onClick={openDropdown}></i>
                <React.Fragment>
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
                            </div>
                        </div>
                    </div>

                    <div className='navbar-dropdown-overlay' ref={dropdownOverlayRef}></div>
                </React.Fragment>
            </div>

            <div className='navbar-desktop'>
                <NavbarElement destination={'/projects'}>
                    <span className='navbar-element-name'>// projects</span>
                </NavbarElement>
                <NavbarElement destination={'/journal'}>
                    <span className='navbar-element-name'>// journal</span>
                </NavbarElement>
            </div>
        </section>
    );
}
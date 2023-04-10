
import React, { useEffect, useRef, useState } from 'react';
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

// Returns whether a className is present in the classNames of a given element.
function hasClassName(element, className) {
    className = className.trim();
    const classNameString = element.className.trim();
    const classNames = classNameString.split(/\s+/g);

    return classNames.includes(className);
}

// Appends a className to the given element (provided the element isn't already tagged with that className). 
function addClassName(element, className) {
    className = className.trim();
    if (className === '') {
        return;
    }

    const classNameString = element.className.trim();
    let classNames = [];

    if (classNameString !== '') {
        classNames = classNameString.split(/\s+/g);
    }

    if (!classNames.includes(className)) {
        classNames.push(className);
    }

    element.className = classNames.join(' ');
}

// Removes a className from the given element (provided the element is tagged with that className).
function removeClassName(element, className) {
    className = className.trim();
    if (className === '') {
        return;
    }

    const classNameString = element.className.trim();
    if (classNameString === '') {
        return;
    }

    // Remove all instances of 'className' from the 'classNames' list.
    let classNames = classNameString.split(/\s+/g);
    while (true) {
        const index = classNames.indexOf(className);

        if (index > -1) {
            classNames.splice(index, 1);
        }
        else {
            break;
        }
    }

    if (classNames.length === 0) {
        // Empty className, remove entire 'class' HTML attribute to keep DOM clean.
        element.removeAttribute('class');
    }
    else {
        element.className = classNames.join(' ');
    }
}

export default function Navbar(props) {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const openDropdownButtonRef = useRef(null);
    const overlayRef = useRef(null);

    const openDropdownButtonAnimationTimeInSeconds = 0.18; // Time (in seconds) for the open dropdown button (bars) to fade out.

    const openDropdown = function (event) {
        event.preventDefault();
        setDropdownOpen(true);

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
        addClassName(document.body, 'no-scroll');
    }

    const closeDropdown = function (event) {
        event.preventDefault();
        setDropdownOpen(false);

        let dropdown = dropdownRef.current;
        let overlay = overlayRef.current;

        if (!hasClassName(dropdown, 'navbar-dropdown-open')) {
            // Prevent closing an already closed dropdown menu.
            return;
        }

        removeClassName(dropdown, 'navbar-dropdown-open');

        // Fade out overlay.
        removeClassName(overlay, 'navbar-dropdown-open');

        // Re-enable scrolling on main page content.
        removeClassName(document.body, 'no-scroll');

        // Delay fade-in for dropdown open button slightly.
        const timeout = setTimeout(() => {
            removeClassName(openDropdownButtonRef.current, 'navbar-dropdown-open'); // Guaranteed to exist.
        }, openDropdownButtonAnimationTimeInSeconds * 1000);

        return () => {
            clearTimeout(timeout);
        }
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
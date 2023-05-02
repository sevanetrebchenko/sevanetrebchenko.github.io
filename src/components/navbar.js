
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { hasClassName, addClassName, removeClassName, enableScrolling, disableScrolling, toMilliseconds } from '../util/util.js';
import './navbar.css';


function useMountTransition(isMounted, transitionTimeInMilliseconds) {
    const [isTransitioned, setTransitioned] = useState(false);

    useEffect(() => {
        let timeout;

        if (isMounted && !isTransitioned) {
            // Component has been mounted, begin transition.
            setTransitioned(true);
        }
        else if (isTransitioned && !isMounted) {
            // Component is to be unmounted, wait the specified transition delay before unmounting completely.
            timeout = setTimeout(() => {
                setTransitioned(false);
            }, transitionTimeInMilliseconds);
        }

        return () => {
            clearTimeout(timeout);
        };
    }, [isMounted, isTransitioned, transitionTimeInMilliseconds]);

    return isTransitioned;
}

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

function NavbarDropdown(props) {
    const { children, unmountSelf } = props;
    const dropdownRef = useRef(null);
    const overlayRef = useRef(null);

    useEffect(() => {
        // Mounting.
        const dropdown = dropdownRef.current;
        const overlay = overlayRef.current;

        function onClickOutside(e) {
            if (hasClassName(dropdown, 'navbar-dropdown-opening')) {
                return;
            }

            if (!dropdown.contains(e.target)) {
                addClassName(dropdown, 'navbar-dropdown-closing');

                setTimeout(() => {
                    unmountSelf();
                }, toMilliseconds(0.3));
            }
        }

        addClassName(dropdown, 'navbar-dropdown-opening');

        // Register event listener.
        document.addEventListener('mousedown', onClickOutside);

        setTimeout(() => {
            removeClassName(dropdown, 'navbar-dropdown-opening');
        }, toMilliseconds(0.3));

        return () => {
            // Unmounting.
            document.body.removeEventListener('mousedown', onClickOutside);
            addClassName(dropdown, 'navbar-dropdown-closing');
        };
    }, []);

    return (
        <React.Fragment>
            <div className='navbar-dropdown' ref={dropdownRef}>
                <div className='navbar-elements'>
                    {children}
                </div>
            </div>

            <div className='navbar-overlay' ref={overlayRef}>
            </div>
        </React.Fragment>
    );
}

function NavbarDropdownToggle(props) {
    const { unmountSelf } = props;
    const dropdownToggleRef = useRef(null);

    useEffect(() => {
        // Mounting.
        const dropdownToggle = dropdownToggleRef.current;

        return () => {
            // Unmounting.
            addClassName(dropdownToggle, 'navbar-dropdown-closing');
        };
    }, []);

    return (
        <i className='fa-solid fa-bars fa-fw navbar-button navbar-button-open-dropdown'></i>
    );
}

function NavbarDropdownOverlay(props) {
    const { unmountSelf } = props;
    const dropdownOverlayRef = useRef(null);

    useEffect(() => {
        // Mounting.
        const dropdownOverlay = dropdownOverlayRef.current;
        addClassName(dropdownOverlay, 'navbar-dropdown-opening');

        setTimeout(() => {
            removeClassName(dropdownOverlay, 'navbar-dropdown-opening');
        }, toMilliseconds(0.3));

        return () => {
            // Unmounting.
            addClassName(dropdownOverlay, 'navbar-dropdown-closing');

            setTimeout(() => {
                unmountSelf();
            }, toMilliseconds(0.3));
        };
    }, []);

    return (
        <div className='navbar-dropdown-overlay'>
        </div>
    );
}

export default function Navbar(props) {
    // const dropdownRef = useRef(null);
    // const dropdownToggleRef = useRef(null);
    // const dropdownOverlayRef = useRef(null);

    // const [isDropdownVisible, setDropdownVisible] = useState(false);
    // const [isDropdownToggleVisible, setDropdownToggleVisible] = useState(true);
    // const [isDropdownOverlayVisible, setDropdownOverlayVisible] = useState(false);

    // const openDropdown = function (e) {
    //     const dropdownToggle = dropdownToggleRef.current;

    //     // Add the navigation menu HTML element to the page, apply open-dropdown animation.
    //     setDropdownVisible(true); // useEffect hook below handles animation on mount.
    //     console.log(dropdownRef);

    //     // // Apply fade-out animation to the dropdown toggle button, remove its HTML element from the page once the animation finishes.
    //     // addClassName(dropdownToggle, 'navbar-dropdown-toggle-closing');
    //     // setTimeout(() => {
    //     //     setDropdownToggleVisible(false);
    //     // }, toMilliseconds(0.18));

    //     // // Add overlay over the main page content.
    //     // setDropdownOverlayVisible(true); // useEffect hook below handles animation on mount.

    //     // // Disable scrolling for main page content.
    //     // disableScrolling();
    // }

    // const closeDropdown = function (e) {
    //     const dropdown = dropdownRef.current;
    //     const dropdownOverlay = dropdownOverlayRef.current;

    //     // Apply close-dropdown animation to the navigation menu, remove its HTML element from the page once the animation finishes.
    //     addClassName(dropdown, 'navbar-dropdown-closing');
    //     setTimeout(() => {
    //         setDropdownVisible(false);
    //     }, toMilliseconds(0.3));

    //     // Add the dropdown toggle button HTML element to the page, apply a fade-in animation.
    //     setTimeout(() => {
    //         setDropdownToggleVisible(true); // useEffect hook below handles animation on mount.
    //     }, toMilliseconds(0.18));

    //     // Apply a fade-out animation to the dropdown overlay, remove its HTML element from the page once the animation finishes.
    //     addClassName(dropdownOverlay, 'navbar-dropdown-closing');
    //     setTimeout(() => {
    //         setDropdownOverlayVisible(false);
    //     }, toMilliseconds(0.3));

    //     // Re-enabling scrolling on the main page content.
    //     enableScrolling();
    // }

    // // Mounting procedure for dropdown.
    // useEffect(() => {
    //     if (isDropdownVisible) {
    //         const dropdown = dropdownRef.current;

    //         function onClickOutside(e) {
    //             if (hasClassName(dropdown, 'navbar-dropdown-opening')) {
    //                 return;
    //             }

    //             // Close dropdown if user clicks outside of the navigation menu.
    //             if (!dropdown.contains(e.target)) {
    //                 addClassName(dropdown, 'navbar-dropdown-closing');

    //                 setTimeout(() => {
    //                     setDropdownVisible(false);
    //                 }, toMilliseconds(0.3));
    //             }
    //         }

    //         addClassName(dropdown, 'navbar-dropdown-opening');
    //         document.addEventListener('mousedown', onClickOutside);

    //         setTimeout(() => {
    //             removeClassName(dropdown, 'navbar-dropdown-opening');
    //         }, toMilliseconds(0.3));
    //     }
    // }, [isDropdownVisible]);

    // // Mounting procedure for dropdown toggle.
    // useEffect(() => {
    //     console.log('running');
    //     if (isDropdownToggleVisible) {
    //         // const dropdownToggle = dropdownToggleRef.current;
    //         // addClassName(dropdownToggle, 'navbar-dropdown-closing');

    //         // setTimeout(() => {
    //         //     set
    //         // }, toMilliseconds(0.18));
    //     }
    // }, [isDropdownToggleVisible]);

    // // Mounting procedure for dropdown overlay.
    // useEffect(() => {
    //     if (isDropdownOverlayVisible) {

    //     }
    // }, [isDropdownOverlayVisible]);


    // const openDropdown = function (event) {
    //     event.preventDefault();

    //     // Append 'navbar-dropdown-open' CSS style to all relevant components.

    //     let dropdown = dropdownRef.current;
    //     let openDropdownButton = openDropdownButtonRef.current;
    //     let overlay = overlayRef.current;

    //     if (hasClassName(dropdown, 'navbar-dropdown-open')) {
    //         // Prevent attempt to open dropdown during dropdown open animation.
    //         return;
    //     }

    //     addClassName(dropdown, 'navbar-dropdown-open');
    //     addClassName(openDropdownButton, 'navbar-dropdown-open');

    //     // Apply fade to main page content to focus user attention on navbar dropdown.
    //     addClassName(overlay, 'navbar-dropdown-open');

    //     // Disable scrolling on the main page while the dropdown is open.
    //     disableScrolling();
    // }

    // const closeDropdown = function (event) {
    //     event.preventDefault();

    //     let dropdown = dropdownRef.current;
    //     let overlay = overlayRef.current;

    //     if (!hasClassName(dropdown, 'navbar-dropdown-open')) {
    //         // Prevent closing an already closed dropdown menu.
    //         return;
    //     }

    //     removeClassName(dropdown, 'navbar-dropdown-open');

    //     // Fade out overlay.
    //     removeClassName(overlay, 'navbar-dropdown-open');

    //     // Delay fade-in for dropdown open button slightly.
    //     setTimeout(() => {
    //         removeClassName(openDropdownButtonRef.current, 'navbar-dropdown-open'); // Guaranteed to exist.
    //     }, openDropdownButtonAnimationTimeInSeconds * 1000);

    //     // Re-enable scrolling on main page content.
    //     setTimeout(() => {
    //         enableScrolling();
    //     }, openDropdownAnimationTimeInSeconds * 1000);
    // }

    // useEffect(() => {
    //     // Add event listener to close dropdown menu if user clicks outside of it.
    //     function onClickOutside(event) {
    //         if (!dropdownRef.current.contains(event.target)) {
    //             closeDropdown(event);
    //         }
    //     }

    //     document.addEventListener('mousedown', onClickOutside);

    //     return () => {
    //         removeClassName(document.body, 'no-scroll');
    //         document.removeEventListener('mousedown', onClickOutside);
    //     };
    // }, []); // Only run when mounting / unmounting.

    const dropdownRef = useRef(null);
    const dropdownToggleRef = useRef(null);
    const dropdownOverlayRef = useRef(null);

    const openDropdown = function (e) {
        const dropdown = dropdownRef.current;
        const dropdownToggle = dropdownToggleRef.current;
        const dropdownOverlay = dropdownOverlayRef.current;

        addClassName(dropdown, 'navbar-dropdown-open');
        addClassName(dropdownToggle, 'navbar-dropdown-open');
        addClassName(dropdownOverlay, 'navbar-dropdown-open');

        // Disable scrolling for main page content.
        disableScrolling();
    }

    const closeDropdown = function (e) {
        const dropdown = dropdownRef.current;
        const dropdownToggle = dropdownToggleRef.current;
        const dropdownOverlay = dropdownOverlayRef.current;

        removeClassName(dropdown, 'navbar-dropdown-open');
        removeClassName(dropdownOverlay, 'navbar-dropdown-open');

        setTimeout(() => {
            removeClassName(dropdownToggle, 'navbar-dropdown-open');
        }, toMilliseconds(0.18));

        // Re-enable scrolling for main page content.
        enableScrolling();
    }

    useEffect(() => {
        const dropdown = dropdownRef.current;

        // Add event listener to close dropdown menu if user clicks outside of it.
        function onClickOutside(e) {
            // Do not attempt to close a closed navbar dropdown.
            if (!hasClassName(dropdown, 'navbar-dropdown-open')) {
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
        <div className='navbar'>
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

                                <NavbarElement destination={'/about'}>
                                    <span className='navbar-element-name'>// about</span>
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

                <NavbarElement destination={'/blog'}>
                    <span className='navbar-element-name'>// blog</span>
                </NavbarElement>

                <NavbarElement destination={'/about'}>
                    <span className='navbar-element-name'>// about</span>
                </NavbarElement>
            </div>
        </div>
    );
}
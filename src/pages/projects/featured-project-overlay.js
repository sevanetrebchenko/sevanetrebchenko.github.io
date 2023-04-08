
import React, { forwardRef, useEffect } from 'react';

import { animationTimeInSeconds } from './featured-project-defines';
import './featured-project-overlay.css'

const FeaturedProjectOverlay = forwardRef((props, overlayRef) => {
    const { project, setVisible } = props;

    // Close out of project overlay if user clicks outside of the overlay window.
    useEffect(() => {
        function onClickOutside(event) {
            const overlay = overlayRef.current;
            if (!overlay) {
                return;
            }

            // TODO: is this good usability?
            // Do not allow closing the featured project overlay while it is fading in.
            const classNames = overlay.className.split(/\s+/g);
            if (classNames.includes('featured-project-overlay-fadein')) {
                return;
            }

            if (!overlay.contains(event.target)) {
                // Append fade out animation.
                overlay.className = [...overlay.className.split(/\s+/g), 'featured-project-overlay-fadeout'].join(' ');

                const timeout = setTimeout(() => {
                    setVisible(false);
                }, animationTimeInSeconds * 1000); // setTimeout requires milliseconds.

                return () => {
                    clearTimeout(timeout);
                };
            }
        }

        // Disable scrolling of main page while overlay is visible.
        document.body.className = 'noscroll';

        // Bind event listener.
        document.addEventListener('mousedown', onClickOutside);
        return () => {
            document.body.removeAttribute('class');
            document.removeEventListener("mousedown", onClickOutside);
        };
    }, [overlayRef]);

    return (
        <div className='featured-project-overlay-container'>
            <div className='featured-project-overlay' ref={overlayRef}>
                <div className='featured-project-overlay-images'>
                    {
                        project.images.map((image, index) => (
                            <img src={image} key={index} className='featured-project-image'></img>
                        ))
                    }
                </div>
                <div className='featured-project-overlay-image'>
                    <div className='featured-project-overlay-image-navigation'>
                        <i className='fa-solid fa-angle-left fa-fw featured-project-overlay-image-previous'></i>
                        <i className='fa-solid fa-angle-right fa-fw featured-project-overlay-image-next'></i>
                    </div>
                    <div className='featured-project-overlay-image-header'>
                        <span className='featured-project-overlay-image-title'>{'title'}</span>
                        <span className='featured-project-overlay-image-caption'>{'caption'}</span>
                    </div>
                </div>
                <div className='featured-project-overlay-content'>
                    <span className='featured-project-overlay-section'>Featured Project</span>
                    <span className='featured-project-overlay-title'>{project.title}</span>
                    <div className='featured-project-overlay-tools'>
                        {
                            project.tools.map((name, index) => (
                                <span className='featured-project-overlay-tool' key={index}>{name}</span>
                            ))
                        }
                    </div>
                    <span className='featured-project-overlay-section'>About</span>
                    <span className='featured-project-overlay-description'>{project.description}</span>
                    <div className='featured-project-overlay-links'>

                    </div>
                </div>
            </div>
        </div>
    );
});

export default FeaturedProjectOverlay;
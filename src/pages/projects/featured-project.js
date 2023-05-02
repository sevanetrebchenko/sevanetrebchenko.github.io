
import React, { useRef, useState, useEffect } from 'react';

import { hasClassName, addClassName, removeClassName, toMilliseconds, disableScrolling, enableScrolling } from '../../util/util';
import './featured-project.css';

export default function FeaturedProject(props) {
    const { project } = props;
    const [currentImageIndex, setImageIndex] = useState(0);
    const [currentTranslation, setTranslation] = useState(0);

    const imageContainer = useRef(null);
    let imageContainerStyle = {
        transform: `translateX(${currentTranslation}px)`,
    };

    // Construct navigation buttons for image carousel.
    let imageContainerNavigationButtons = [];
    for (let i = 0; i < project.images.length; ++i) {
        let classNames = ['featured-project-navigation-button'];

        if (i == currentImageIndex) {
            classNames.push('featured-project-navigation-button-current');
        }

        const navigateToImage = function (e) {
            e.preventDefault();

            const imageWidth = imageContainer.current.clientWidth;
            const desiredImageIndex = i;

            if (currentImageIndex == desiredImageIndex) {
                return;
            }

            let translation = currentTranslation;
            if (currentImageIndex > desiredImageIndex) {
                translation = currentTranslation + (currentImageIndex - desiredImageIndex) * imageWidth;
            }
            else {
                translation = currentTranslation - (desiredImageIndex - currentImageIndex) * imageWidth;
            }

            setTranslation(translation);
            imageContainerStyle = {
                transform: `translateX(${translation}px)`
            };

            setImageIndex(desiredImageIndex);
        }

        imageContainerNavigationButtons.push(<span className={classNames.join(' ')} onClick={navigateToImage}></span>);
    }

    // Construct navigation elements for carousel for showcasing project images.
    const navigateToPreviousImage = function (event) {
        event.preventDefault();

        const imageWidth = imageContainer.current.clientWidth;
        const previousImageIndex = Math.max(currentImageIndex - 1, 0);

        const translation = currentTranslation + (currentImageIndex - previousImageIndex) * imageWidth;
        setTranslation(translation);

        imageContainerStyle = {
            transform: `translateX(${translation}px)`
        };

        setImageIndex(previousImageIndex);
    }

    const navigateToNextImage = function (event) {
        event.preventDefault();

        const imageWidth = imageContainer.current.clientWidth;
        const nextImageIndex = Math.min(currentImageIndex + 1, project.images.length - 1);

        const translation = currentTranslation - (nextImageIndex - currentImageIndex) * imageWidth;
        setTranslation(translation);

        imageContainerStyle = {
            transform: `translateX(${translation}px)`
        };

        setImageIndex(nextImageIndex);
    }

    const openOverlay = function () {
        const overlayContainer = overlayContainerRef.current;
        const overlay = overlayRef.current;

        removeClassName(overlayContainer, 'hidden');
        overlay.offsetHeight; // Force browser repaint.
        addClassName(overlayContainer, 'featured-project-overlay-open');
        addClassName(overlay, 'featured-project-overlay-open');

        disableScrolling();
    }

    const closeOverlay = function () {
        const overlayContainer = overlayContainerRef.current;
        const overlay = overlayRef.current;

        removeClassName(overlay, 'featured-project-overlay-open');
        removeClassName(overlayContainer, 'featured-project-overlay-open');

        setTimeout(() => {
            addClassName(overlayContainer, 'hidden');
        }, toMilliseconds(0.2));

        enableScrolling();
    }

    useEffect(() => {
        // Mounting.
        const overlayContainer = overlayContainerRef.current;
        const overlay = overlayRef.current;

        function onClickOutside(e) {
            // Do not attempt to close a closed overlay.
            if (hasClassName(overlayContainer, 'hidden')) {
                return;
            }

            if (!overlay.contains(e.target)) {
                closeOverlay();
            }
        }

        addClassName(overlayContainer, 'hidden'); // Container holding overlay starts off as hidden.
        document.addEventListener('mousedown', onClickOutside);

        return () => {
            // Unmounting.
            document.removeEventListener('mousedown', onClickOutside);
            enableScrolling();
        };
    }, []); // Run only when mounting / unmounting.

    const overlayContainerRef = useRef(null);
    const overlayRef = useRef(null);

    return (
        <div className='featured-project'>
            <div className='featured-project-images' ref={imageContainer} style={imageContainerStyle}>
                {
                    project.images.map((image, index) => (
                        <img src={image} key={index} className='featured-project-image'></img>
                    ))
                }
            </div>

            <div className='featured-project-navigation'>
                <div className='featured-project-navigation-arrows'>
                    <i className='fa-solid fa-angle-left fa-fw featured-project-navigation-previous' onClick={navigateToPreviousImage}></i>
                    <i className='fa-solid fa-angle-right fa-fw featured-project-navigation-next' onClick={navigateToNextImage}></i>
                </div>
                <div className='featured-project-navigation-buttons'>
                    {
                        imageContainerNavigationButtons.map((element, index) => (
                            <React.Fragment key={index}>{element}</React.Fragment>
                        ))
                    }
                </div>
            </div>

            <div className='featured-project-content'>
                <span className='featured-project-banner'>Featured Project</span>
                <div className='featured-project-header'>
                    <span className='featured-project-title'>{project.title}</span>
                    <div className='featured-project-info'>
                        <i className='fa-solid fa-question fa-fw' onClick={openOverlay}></i>
                    </div>
                </div>
            </div>

            <div className='featured-project-overlay-container' ref={overlayContainerRef}>
                <div className='featured-project-overlay' ref={overlayRef}>
                    <div className='featured-project-overlay-images'>
                        {
                            project.images.map((image, index) => (
                                <React.Fragment>
                                    <img src={image} key={index} className='featured-project-image'></img>
                                    <div className='featured-project-overlay-image-header'>
                                        <span className='featured-project-overlay-image-title'>{'title'}</span>
                                        <span className='featured-project-overlay-image-caption'>{'this is a caption for this image'}</span>
                                    </div>
                                </React.Fragment>
                            ))
                        }
                        <div className='featured-project-overlay-image-navigation'>
                            <i className='fa-solid fa-angle-left fa-fw featured-project-overlay-image-previous'></i>
                            <i className='fa-solid fa-angle-right fa-fw featured-project-overlay-image-next'></i>
                        </div>
                    </div>
                    <div className='featured-project-overlay-content'>
                        <i className='fa-solid fa-xmark fa-fw featured-project-overlay-close' onClick={closeOverlay}></i>
                        <span className='featured-project-overlay-section-title'>Featured Project</span>
                        <span className='featured-project-overlay-title'>{project.title}</span>
                        <span className='featured-project-overlay-time'>July 2022 - Present (8 months)</span>
                        <span className='featured-project-overlay-section-title'>About</span>
                        <span className='featured-project-overlay-description'>{project.description}</span>
                        <div className='featured-project-overlay-cta'>
                            <span className='featured-project-overlay-cta-text'>Read More</span>
                            <i className='fa-solid fa-angle-right fa-fw featured-project-overlay-cta-icon'></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
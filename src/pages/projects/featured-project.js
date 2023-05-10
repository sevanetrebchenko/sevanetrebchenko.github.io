
import React, { useRef, useState, useEffect, createRef } from 'react';

import { hasClassName, addClassName, removeClassName, toMilliseconds, disableScrolling, enableScrolling } from '../../util/util';

function roundTo(number) {
    return Math.round(number * 10) / 10;
}

// Returns a reference to the state so that it can be used in a stale context.
function useStateRef(initialValue) {
    const [state, _setState] = useState(initialValue);
    const stateRef = useRef(state);

    const setState = (value) => {
        stateRef.current = value;
        _setState(value);
    };

    return [stateRef, setState];
}


function ImageShowcase(props) {
    const { images, showCaptions = false } = props;

    const [currentImageIndexRef, setImageIndex] = useStateRef(0);
    const [currentTranslationRef, setTranslation] = useStateRef(0);
    const [imageCaptionRefs, setImageCaptionRefs] = useState([]); // Array of references to image captions

    const imageContainerRef = useRef(null);
    let imageContainerStyle = {
        transform: `translateX(${currentTranslationRef.current}px)`,
    };

    const changeCaption = function (targetCaptionIndex) {
        if (!showCaptions) {
            return;
        }

        // Apply fade-out transition for all captions.
        for (let imageCaptionRef of imageCaptionRefs) {
            removeClassName(imageCaptionRef.current, 'active');
        }

        // Apply fade-in transition to desired caption.
        setTimeout(() => {
            addClassName(imageCaptionRefs[targetCaptionIndex].current, 'active');
        }, toMilliseconds(0.4));
    }

    const toPreviousImage = function (e) {
        e.preventDefault();

        // Apply translation to image carousel
        const imageWidth = imageContainerRef.current.getBoundingClientRect().width;
        const previousImageIndex = Math.max(currentImageIndexRef.current - 1, 0);

        const translation = currentTranslationRef.current + (currentImageIndexRef.current - previousImageIndex) * imageWidth;
        setTranslation(translation);

        addClassName(imageContainerRef.current, 'transition');

        imageContainerStyle = {
            transform: `translateX(${translation}px)`
        };

        // Apply transition animations to captions
        changeCaption(currentImageIndexRef.current);
        setImageIndex(previousImageIndex);

        setTimeout(() => {
            removeClassName(imageContainerRef.current, 'transition');
        }, toMilliseconds(0.3))
    }

    const toNextImage = function (e) {
        e.preventDefault();

        // Apply translation to image carousel
        const imageWidth = imageContainerRef.current.getBoundingClientRect().width;
        const nextImageIndex = Math.min(currentImageIndexRef.current + 1, images.length - 1);

        const translation = currentTranslationRef.current - (nextImageIndex - currentImageIndexRef.current) * imageWidth;
        setTranslation(translation);

        addClassName(imageContainerRef.current, 'transition');

        imageContainerStyle = {
            transform: `translateX(${translation}px)`
        };

        // Apply transition animations to captions
        changeCaption(nextImageIndex);
        setImageIndex(nextImageIndex);

        setTimeout(() => {
            removeClassName(imageContainerRef.current, 'transition');
        }, toMilliseconds(0.3))
    }

    // Fill image caption ref array
    useEffect(() => {
        // Assuming number of images does not change
        setImageCaptionRefs(() => (
            Array(images.length).fill().map((_, i) => imageCaptionRefs[i] || createRef())
        ));

        function onWindowResize(e) {
            console.log('resizing');
            console.log(currentImageIndexRef.current);

            // Resizing the screen invalidates the translation because the image container size changes
            // Recalculate translation based on new image container size
            const imageWidth = imageContainerRef.current.getBoundingClientRect().width;
            const translation = 0 - currentImageIndexRef.current * imageWidth;
            setTranslation(translation);

            imageContainerStyle = {
                transform: `translateX(${translation}px)`
            };
        }

        window.addEventListener('resize', onWindowResize);

        return () => {
            // Unmounting
            window.removeEventListener('resize', onWindowResize);
        };
    }, []);

    return (
        <div className='image-container-parent'>
            <div className='image-container'>
                <div className='image-showcase' ref={imageContainerRef} style={imageContainerStyle}>
                    <div className='images'>
                        {
                            images.map((image, index) => (
                                <img src={image.src} key={index}></img>
                            ))
                        }
                    </div>
                </div>
                <div className='image-navigation'>
                    <div className='arrows'>
                        <div className='arrow' onClick={toPreviousImage}>
                            <i className='fa-solid fa-angle-left fa-fw'></i>
                        </div>
                        <div className='arrow' onClick={toNextImage}>
                            <i className='fa-solid fa-angle-right fa-fw'></i>
                        </div>
                    </div>
                </div>
                {
                    showCaptions && <div className='image-captions'>
                        {
                            images.map((image, index) => {
                                let classNames = ['caption'];
                                if (index == 0) {
                                    classNames.push('active');
                                }

                                return (
                                    <div className={classNames.join(' ')} key={index} ref={imageCaptionRefs[index]}>
                                        <span className='title'>{image.title}</span>
                                        <span className='description'>{image.description}</span>
                                    </div>
                                );
                            })
                        }
                    </div>
                }
            </div>
        </div>

    );
}


function FeaturedProjectImageShowcase(props) {
    const { images, showCaptions } = props;

    const [currentImageIndex, setImageIndex] = useState(0);
    const [currentTranslation, setTranslation] = useState(0);

    const imageContainerRef = useRef(null);
    let imageContainerStyle = {
        transform: `translateX(${currentTranslation}px)`,
    };

    const navigateToPreviousImage = function (e) {
        e.preventDefault();

        const imageWidth = imageContainerRef.current.clientWidth;
        const previousImageIndex = Math.max(currentImageIndex - 1, 0);

        const translation = currentTranslation + (currentImageIndex - previousImageIndex) * imageWidth;
        setTranslation(translation);

        imageContainerStyle = {
            transform: `translateX(${translation}px)`
        };

        setImageIndex(previousImageIndex);
    }

    const navigateToNextImage = function (e) {
        e.preventDefault();

        const imageWidth = imageContainerRef.current.clientWidth;
        const nextImageIndex = Math.min(currentImageIndex + 1, images.length - 1);

        const translation = currentTranslation - (nextImageIndex - currentImageIndex) * imageWidth;
        setTranslation(translation);

        imageContainerStyle = {
            transform: `translateX(${translation}px)`
        };

        setImageIndex(nextImageIndex);
    }

    // Construct navigation buttons for image carousel.
    let imageContainerNavigationButtons = [];
    for (let i = 0; i < images.length; ++i) {
        let classNames = ['button'];

        if (i == currentImageIndex) {
            classNames.push('button-current');
        }

        const navigateToImage = function (e) {
            e.preventDefault();

            const imageWidth = imageContainerRef.current.clientWidth;
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

    return (
        <React.Fragment>
            <div className='image-showcase' ref={imageContainerRef} style={imageContainerStyle}>
                <div className='images'>
                    {
                        images.map((image, index) => (
                            <img src={image.src} key={index}></img>
                        ))
                    }
                </div>
            </div>
            <div className='image-navigation'>
                <div className='arrows'>
                    <div className='arrow' onClick={navigateToPreviousImage}>
                        <i className='fa-solid fa-angle-left fa-fw'></i>
                    </div>
                    <div className='arrow' onClick={navigateToNextImage}>
                        <i className='fa-solid fa-angle-right fa-fw'></i>
                    </div>
                </div>

                <div className='buttons'>
                    {
                        imageContainerNavigationButtons.map((element, index) => (
                            <React.Fragment key={index}>{element}</React.Fragment>
                        ))
                    }
                </div>
            </div>

            <div className='image-captions'>

            </div>
        </React.Fragment>
    );
}

export default function FeaturedProject(props) {
    const { project } = props;

    const [isOverlayVisible, setOverlayVisible] = useState(false);
    const overlayContainerRef = useRef(null);
    const overlayRef = useRef(null);

    const openOverlay = function () {
        const overlayContainer = overlayContainerRef.current;
        const overlay = overlayRef.current;

        removeClassName(overlayContainer, 'hidden');
        overlay.offsetHeight; // Force browser repaint.
        addClassName(overlayContainer, 'open');
        addClassName(overlay, 'open');

        disableScrolling();
    }

    const closeOverlay = function () {
        const overlayContainer = overlayContainerRef.current;
        const overlay = overlayRef.current;

        removeClassName(overlay, 'open');
        removeClassName(overlayContainer, 'open');

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


    return (
        <div className='featured-project'>
            <ImageShowcase images={project.images} showCaptions={false}></ImageShowcase>
            <div className='banner'>
                <span className='title'>Featured Project</span>
                <div className='header'>
                    <span className='title'>{project.title}</span>
                    <div className='info'>
                        <i className='fa-solid fa-question fa-fw' onClick={openOverlay}></i>
                    </div>
                </div>
            </div>
            <div className='overlay-container' ref={overlayContainerRef}>
                <div className='overlay' ref={overlayRef}>
                    <ImageShowcase images={project.images} showCaptions={true}></ImageShowcase>
                    <div className='content'>
                        <i className='fa-solid fa-xmark fa-fw featured-project-overlay-close' onClick={closeOverlay}></i>

                        <span className='featured-project-overlay-section-title'>Featured Project</span>
                        <span className='featured-project-overlay-title'>{project.title}</span>
                        <span className='featured-project-overlay-time'>July 2022 - Present (8 months)</span>

                        <span className='featured-project-overlay-section-title'>About</span>
                        <span className='featured-project-overlay-description'>{project.description}</span>

                        <div className='cta'>
                            <span>Read More</span>
                            <i className='fa-solid fa-angle-right fa-fw'></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
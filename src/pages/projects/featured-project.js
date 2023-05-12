
import React, { useRef, useState, useEffect, createRef } from 'react';

import { hasClassName, addClassName, removeClassName, toMilliseconds, disableScrolling, enableScrolling } from '../../util/util';
import useStateRef from '../../util/use-state-ref';

import './featured-project-image-showcase.less'
import './featured-project-overlay.less'

function ImageShowcase(props) {
    const { images, showCaptions = false } = props;

    const [imageIndexRef, setImageIndex] = useStateRef(0);
    const [translationRef, setTranslation] = useStateRef(0);

    // Populate image caption data.
    // Image caption stores ref to element and timeout.
    const [imageCaptionRefs, setImageCaptionRefs] = useState(Array(images.length).fill().map((_, i) => (
        {
            ref: createRef(),
            timeout: null
        }
    )));

    const imageContainerRef = useRef(null);
    let imageContainerStyle = {
        transform: `translateX(${translationRef.current}px)`,
    };

    const deactivateImageCaptions = function () {
        if (!showCaptions) {
            return;
        }

        for (const imageCaption of imageCaptionRefs) {
            removeClassName(imageCaption.ref.current, 'active');
            clearTimeout(imageCaption.timeout);
        }
    }

    const activateImageCaption = function (captionIndex) {
        if (!showCaptions) {
            return;
        }

        const imageCaption = imageCaptionRefs[captionIndex];

        // Fade-in caption at a slight delay after image transition.
        imageCaption.timeout = setTimeout(() => {
            addClassName(imageCaption.ref.current, 'active');
        }, toMilliseconds(0.15));
    }

    const toPreviousImage = function (e) {
        const imageContainer = imageContainerRef.current;
        const currentImageIndex = imageIndexRef.current;
        const currentTranslation = translationRef.current;

        if (currentImageIndex == 0) {
            return;
        }

        deactivateImageCaptions(); // Deactivate / clear any captions currently in-flight. 

        // Do not transition the image carousel if it is currently running the transition animation.
        if (hasClassName(imageContainer, 'transitioning')) {
            return;
        }

        // Apply translation to image container.
        const imageWidth = imageContainer.getBoundingClientRect().width;
        const desiredImageIndex = Math.max(currentImageIndex - 1, 0);
        const translation = currentTranslation + (currentImageIndex - desiredImageIndex) * imageWidth;

        addClassName(imageContainer, 'transitioning');
        setTimeout(() => {
            removeClassName(imageContainerRef.current, 'transitioning');

            // Activate caption only after the image has been transition to.
            activateImageCaption(desiredImageIndex);
        }, toMilliseconds(0.3));

        imageContainerStyle = {
            transform: `translateX(${translation}px)`
        };

        setImageIndex(desiredImageIndex);
        setTranslation(translation);
    }

    const toNextImage = function (e) {
        const imageContainer = imageContainerRef.current;
        const currentImageIndex = imageIndexRef.current;
        const currentTranslation = translationRef.current;

        if (currentImageIndex == (images.length - 1)) {
            return;
        }

        deactivateImageCaptions(); // Deactivate / clear any captions currently in-flight. 

        // Do not transition the image carousel if it is currently running the transition animation.
        if (hasClassName(imageContainer, 'transitioning')) {
            return;
        }

        // Apply translation to image carousel
        const imageWidth = imageContainer.getBoundingClientRect().width;
        const desiredImageIndex = Math.min(currentImageIndex + 1, images.length - 1);
        const translation = currentTranslation - (desiredImageIndex - currentImageIndex) * imageWidth;

        addClassName(imageContainer, 'transitioning');
        setTimeout(() => {
            removeClassName(imageContainerRef.current, 'transitioning');

            // Activate caption only after the image has been transition to.
            activateImageCaption(desiredImageIndex);
        }, toMilliseconds(0.3));

        imageContainerStyle = {
            transform: `translateX(${translation}px)`
        };

        setImageIndex(desiredImageIndex);
        setTranslation(translation);
    }

    useEffect(() => {
        function onWindowResize(e) {
            // Resizing the screen invalidates the translation because the image container size changes
            // Recalculate translation based on new image container size
            const imageWidth = imageContainerRef.current.getBoundingClientRect().width;
            const translation = 0 - imageIndexRef.current * imageWidth;
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
        <div className='featured-project-image-container'>
            <div className='featured-project-image-showcase' ref={imageContainerRef} style={imageContainerStyle}>
                <div className='featured-project-images'>
                    {
                        images.map((image, index) => (
                            <img src={image.src} key={index}></img>
                        ))
                    }
                </div>
            </div>
            <div className='featured-project-image-navigation'>
                <div className='navigation-arrows'>
                    <div className='navigation-arrow' onClick={toPreviousImage}>
                        <i className='fa-solid fa-angle-left fa-fw'></i>
                    </div>
                    <div className='navigation-arrow' onClick={toNextImage}>
                        <i className='fa-solid fa-angle-right fa-fw'></i>
                    </div>
                </div>
            </div>
            {
                showCaptions && <div className='featured-project-image-captions'>
                    {
                        images.map((image, index) => {
                            let classNames = ['featured-project-image-caption'];
                            if (index == 0) {
                                classNames.push('active');
                            }

                            return (
                                <div className={classNames.join(' ')} key={index} ref={imageCaptionRefs[index].ref}>
                                    <span className='featured-project-image-caption-title'>{image.title}</span>
                                    <span className='featured-project-image-caption-description'>{image.description}</span>
                                </div>
                            );
                        })
                    }
                </div>
            }
        </div>
    );
}

export default function FeaturedProject(props) {
    const { project } = props;

    const overlayContainerRef = useRef(null);
    const overlayRef = useRef(null);

    const openOverlay = function () {
        const overlayContainer = overlayContainerRef.current;
        const overlay = overlayRef.current;

        removeClassName(overlayContainer, 'hidden');
        overlay.offsetHeight; // Force browser repaint.
        addClassName(overlayContainer, 'active');
        addClassName(overlay, 'active');

        disableScrolling();
    }

    const closeOverlay = function () {
        const overlayContainer = overlayContainerRef.current;
        const overlay = overlayRef.current;

        removeClassName(overlay, 'active');
        removeClassName(overlayContainer, 'active');

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
            <div className='featured-project-overlay-container' ref={overlayContainerRef}>
                <div className='featured-project-overlay' ref={overlayRef}>
                    <ImageShowcase images={project.images} showCaptions={true}></ImageShowcase>
                    <div className='featured-project-overlay-content'>
                        <i className='fa-solid fa-xmark fa-fw featured-project-overlay-close-button' onClick={closeOverlay}></i>

                        <span className='featured-project-overlay-section'>Featured Project</span>
                        <span className='featured-project-overlay-project-title'>{project.title}</span>
                        <span className='featured-project-overlay-duration'>July 2022 - Present (8 months)</span>

                        <span className='featured-project-overlay-section'>About</span>
                        <span className='featured-project-overlay-project-description'>{project.description}</span>

                        <div className='featured-project-overlay-cta'>
                            <span>Read More</span>
                            <i className='fa-solid fa-angle-right fa-fw'></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
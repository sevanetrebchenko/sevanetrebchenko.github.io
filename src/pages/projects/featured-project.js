
import React, { useRef, useState, useEffect } from 'react';

import { hasClassName, addClassName, removeClassName, toMilliseconds, disableScrolling, enableScrolling } from '../../util/util';

function FeaturedProjectImageShowcase(props) {
    const { images } = props;

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
        </React.Fragment>
    );
}

function FeaturedProjectOverlayImageShowcase(props) {
    const { images } = props;

    const [currentImageIndex, setImageIndex] = useState(0);
    const [currentTranslation, setTranslation] = useState(0);

    const imageContainer = useRef(null);
    let imageContainerStyle = {
        transform: `translateX(${currentTranslation}px)`,
    };
}

export default function FeaturedProject(props) {
    const { project } = props;

    const [isOverlayVisible, setOverlayVisible] = useState(false);

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

    // useEffect(() => {
    //     // Mounting.
    //     const overlayContainer = overlayContainerRef.current;
    //     const overlay = overlayRef.current;

    //     function onClickOutside(e) {
    //         // Do not attempt to close a closed overlay.
    //         if (hasClassName(overlayContainer, 'hidden')) {
    //             return;
    //         }

    //         if (!overlay.contains(e.target)) {
    //             closeOverlay();
    //         }
    //     }

    //     addClassName(overlayContainer, 'hidden'); // Container holding overlay starts off as hidden.
    //     document.addEventListener('mousedown', onClickOutside);

    //     return () => {
    //         // Unmounting.
    //         document.removeEventListener('mousedown', onClickOutside);
    //         enableScrolling();
    //     };
    // }, []); // Run only when mounting / unmounting.

    const overlayContainerRef = useRef(null);
    const overlayRef = useRef(null);

    return (
        <div className='featured-project'>
            <div className='content'>
                <FeaturedProjectImageShowcase images={project.images}></FeaturedProjectImageShowcase>
                <div className='banner'>
                    <span className='title'>Featured Project</span>
                    <div className='header'>
                        <span className='title'>{project.title}</span>
                        <div className='info'>
                            <i className='fa-solid fa-question fa-fw' onClick={openOverlay}></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>



        // <div className='featured-project'>
        //     <div className='featured-project-container'>
        //         <FeaturedProjectImageShowcase images={project.images}></FeaturedProjectImageShowcase>

        //         <div className='featured-project-container-project-banner'>

        //         </div>

        //         <span className='featured-project-banner'>Featured Project</span>
        //         <div className='featured-project-header'>
        //             <span className='featured-project-title'>{project.title}</span>
        //             <div className='featured-project-info'>
        //                 <i className='fa-solid fa-question fa-fw' onClick={openOverlay}></i>
        //             </div>
        //         </div>
        //     </div>

        //     <div className='featured-project-overlay-container' ref={overlayContainerRef}>
        //         <div className='featured-project-overlay' ref={overlayRef}>
        //             {/* <div className='featured-project-overlay-image-showcase'>
        //                 <div className='featured-project-images'>
        //                     {
        //                         project.images.map((image, index) => (
        //                             <img src={image.src} key={index} className='featured-project-image'></img>
        //                         ))
        //                     }
        //                 </div>

        //                 <div className='featured-project-overlay-image-captions'>
        //                     {
        //                         project.images.map((image, index) => (
        //                             <div className='featured-project-overlay-image-caption' key={index}>
        //                                 <span className='featured-project-overlay-image-caption-title'>{image.title}</span>
        //                                 <span className='featured-project-overlay-image-caption-description'>{image.description}</span>
        //                             </div>
        //                         ))
        //                     }
        //                 </div>

        //                 <div className='featured-project-overlay-image-navigation'>
        //                     <div className='featured-project-navigation-arrows'>
        //                         <i className='fa-solid fa-angle-left fa-fw featured-project-navigation-previous'></i>
        //                         <i className='fa-solid fa-angle-right fa-fw featured-project-navigation-next'></i>
        //                     </div>
        //                     <div className='featured-project-navigation-buttons'>
        //                         {
        //                             imageContainerNavigationButtons.map((element, index) => (
        //                                 <React.Fragment key={index}>{element}</React.Fragment>
        //                             ))
        //                         }
        //                     </div>
        //                 </div>
        //             </div>

        //             <div className='featured-project-navigation'>
        //                 <div className='featured-project-navigation-arrows'>
        //                     <i className='fa-solid fa-angle-left fa-fw featured-project-navigation-previous' onClick={navigateToPreviousImage}></i>
        //                     <i className='fa-solid fa-angle-right fa-fw featured-project-navigation-next' onClick={navigateToNextImage}></i>
        //                 </div>
        //                 <div className='featured-project-navigation-buttons'>
        //                     {
        //                         imageContainerNavigationButtons.map((element, index) => (
        //                             <React.Fragment key={index}>{element}</React.Fragment>
        //                         ))
        //                     }
        //                 </div>
        //             </div> */}

        //             <div className='featured-project-overlay-content'>
        //                 <i className='fa-solid fa-xmark fa-fw featured-project-overlay-close' onClick={closeOverlay}></i>
        //                 <span className='featured-project-overlay-section-title'>Featured Project</span>
        //                 <span className='featured-project-overlay-title'>{project.title}</span>
        //                 <span className='featured-project-overlay-time'>July 2022 - Present (8 months)</span>
        //                 <span className='featured-project-overlay-section-title'>About</span>
        //                 <span className='featured-project-overlay-description'>{project.description}</span>
        //                 <div className='featured-project-overlay-cta'>
        //                     <span className='featured-project-overlay-cta-text'>Read More</span>
        //                     <i className='fa-solid fa-angle-right fa-fw featured-project-overlay-cta-icon'></i>
        //                 </div>
        //             </div>
        //         </div>
        //     </div>
        // </div>
    );
}
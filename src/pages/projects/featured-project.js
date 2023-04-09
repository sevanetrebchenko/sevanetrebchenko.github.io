
import React, { useRef, useState, useEffect } from 'react';

import FeaturedProjectOverlay from './featured-project-overlay';
import { animationTimeInSeconds } from './featured-project-defines';
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

    const [isOverlayVisible, setOverlayVisible] = useState(false);
    const overlayRef = useRef(null);

    // Fade in the project overlay when mounted.
    useEffect(() => {
        if (isOverlayVisible) {
            const overlay = overlayRef.current;
            if (!overlay) {
                return;
            }

            const classNames = overlay.className.split(/\s+/g);
            overlay.className = [...classNames, 'featured-project-overlay-fadein'].join(' '); // Append fade in animation.

            const timeout = setTimeout(() => {
                overlay.className = classNames.join(' '); // Remove fadein className once animation is finished.
            }, animationTimeInSeconds * 1000); // setTimeout requires milliseconds.

            return () => {
                clearTimeout(timeout);
            }
        }
    }, [isOverlayVisible]);

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
                        <i className='fa-solid fa-question fa-fw' onClick={(e) => {
                            setOverlayVisible(true);
                        }}></i>
                    </div>
                </div>
            </div>

            {isOverlayVisible && <FeaturedProjectOverlay project={project} setVisible={setOverlayVisible} ref={overlayRef}></FeaturedProjectOverlay>}
        </div>
    );
}
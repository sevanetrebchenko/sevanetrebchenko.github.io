import React, { useState, createRef, useRef, useEffect, } from 'react';
import useStateRef from '../../util/use-state-ref';
import { addClassName, hasClassName, removeClassName, toMilliseconds } from '../../util/util';

import './featured-project-showcase.less'

export default function FeaturedProjectShowcase(props) {
    const { images, justification, showCaptions = false } = props;

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
        <div className={'featured-project-showcase justify-' + justification}>
            <div className='featured-project-images' ref={imageContainerRef} style={imageContainerStyle}>
                {
                    images.map((image, index) => (
                        <img src={image.src} key={index}></img>
                    ))
                }
            </div>
            <div className='featured-project-navigation'>
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
                showCaptions && <div className='featured-project-captions'>
                    {
                        images.map((image, index) => {
                            const imageCaption = image.caption;

                            let classNames = ['featured-project-caption'];
                            classNames.push(imageCaption.position.trim().toLowerCase().replace(/\s+/g, '-'));

                            if (index == 0) {
                                classNames.push('active');
                            }

                            return (
                                <div className={classNames.join(' ')} key={index} ref={imageCaptionRefs[index].ref}>
                                    <span className='featured-project-caption-title'>{imageCaption.header}</span>
                                    <span className='featured-project-caption-description'>{imageCaption.description}</span>
                                </div>
                            );
                        })
                    }
                </div>
            }
        </div>

    );
}

import React, { useRef, useEffect } from 'react';

import { animationTimeInSeconds } from './featured-project-defines';
import './featured-project-overlay.css'
import '../body.css'
import { addClassName, disableScrolling, enableScrolling, hasClassName, removeClassName, toMilliseconds } from '../../util/util';


export default function FeaturedProjectOverlay(props) {
    const { project, setVisible } = props;
    const overlayRef = useRef(null);

    useEffect(() => {
        // Mounting.
        const overlay = overlayRef.current;

        function onClickOutside(e) {
            // Do not allow closing the featured project overlay while it is fading in.
            if (hasClassName(overlay, 'featured-project-overlay-opening')) {
                return;
            }

            if (!overlay.contains(e.target)) {
                addClassName(overlay, 'featured-project-overlay-closing');

                setTimeout(() => {
                    setVisible(false);
                }, toMilliseconds(animationTimeInSeconds));
            }
        }

        disableScrolling();
        addClassName(overlay, 'featured-project-overlay-opening');

        // Register event listener.
        document.body.addEventListener('mousedown', onClickOutside);

        setTimeout(() => {
            removeClassName(overlay, 'featured-project-overlay-opening');
        }, toMilliseconds(animationTimeInSeconds));

        return () => {
            // Unmounting.
            document.body.removeEventListener('mousedown', onClickOutside);
            enableScrolling();
        };
    }, []);

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
}













// const FeaturedProjectOverlay = forwardRef((props, overlayRef) => {
//     const { project, setVisible } = props;

//     // Close out of project overlay if user clicks outside of the overlay window.
//     useEffect(() => {
//         function onClickOutside(event) {
//             const overlay = overlayRef.current;
//             if (!overlay) {
//                 return;
//             }

//             // TODO: is this good usability?
//             // Do not allow closing the featured project overlay while it is fading in.
//             const classNames = overlay.className.split(/\s+/g);
//             if (classNames.includes('featured-project-overlay-fadein')) {
//                 return;
//             }

//             if (!overlay.contains(event.target)) {
//                 // Append fade out animation.
//                 overlay.className = [...overlay.className.split(/\s+/g), 'featured-project-overlay-fadeout'].join(' ');

//                 const timeout = setTimeout(() => {
//                     setVisible(false);
//                 }, animationTimeInSeconds * 1000); // setTimeout requires milliseconds.

//                 return () => {
//                     clearTimeout(timeout);
//                 };
//             }
//         }

//         // Disable scrolling of main page while overlay is visible.
//         let className = document.body.className.trim();
//         let classNames = [];
//         if (className !== '') {
//             classNames = [...document.body.className.split(/\s+/g)];
//         }
//         document.body.className = [...classNames.join(' '), 'no-scroll'];

//         document.addEventListener('mousedown', onClickOutside);

//         return () => {
//             if (classNames.length == 0) {
//                 document.body.removeAttribute('class');
//             }
//             else {
//                 document.body.className = classNames.join(' '); // Remove 'no-scroll'.
//             }

//             document.removeEventListener("mousedown", onClickOutside);
//         };
//     }, [overlayRef]);

    
// });

// export default FeaturedProjectOverlay;
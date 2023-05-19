
import React, { useRef } from 'react';
import FeaturedProjectShowcase from './featured-project-showcase.js';
import './featured-project.less'

export default function FeaturedProject(props) {
    const { project, index, justification } = props;
    const projectContainerRef = useRef(null);

    // useEffect(() => {
    //     const projectContainer = projectContainerRef.current;

    //     const options = {
    //         root: null, // Default to the browser viewport.
    //         rootMargin: '0px', // No padding.
    //         threshold: 0.4
    //     }

    //     const callbackFunction = function (entries) {
    //         const [ entry ] = entries;
    //         if (entry.isIntersecting) {
    //             addClassName(entry.target, 'active');
    //         }
    //     }

    //     const observer = new IntersectionObserver(callbackFunction, options);
    //     observer.observe(projectContainer);

    //     return () => {
    //         observer.unobserve(projectContainer);
    //     }
    // }, [projectContainerRef]);

    // 'justification' indicates which side the project overview is on
    return (
        <div className='featured-project'>
            <FeaturedProjectShowcase images={project.images} showCaptions={true} justification={justification}></FeaturedProjectShowcase>
            <div className={'featured-project-content justify-' + justification}>
                <span className='featured-project-index'>{(index + 1).toString().padStart(2, '0')}</span>

                <span className='featured-project-title'>{project.title}</span>
                <span className='featured-project-duration'>July 2022 - Present (8 months)</span>
                <span className='featured-project-description'>{project.description}</span>

                <div className='featured-project-cta'>
                    <span>Read More</span>
                    <i className='fa-solid fa-angle-right fa-fw'></i>
                </div>
            </div>
        </div>
    );
}
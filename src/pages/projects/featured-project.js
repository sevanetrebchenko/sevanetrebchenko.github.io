
import React, { useRef, useEffect } from 'react';
import FeaturedProjectShowcase from './featured-project-showcase.js';
import useStateRef from '../../util/use-state-ref.js';
import { addClassName, removeClassName } from '../../util/util.js';

import './featured-project.less'

export default function FeaturedProject(props) {
    const { project, index, justification } = props;
    const featuredProjectRef = useRef(null);
    const [featuredProjectBoundingRectRef, setFeaturedProjectBoundingRect] = useStateRef(null);

    useEffect(() => {
        const handleScroll = function () {
            const featuredProject = featuredProjectRef.current;
            if (!featuredProject) {
                return;
            }

            let featuredProjectBoundingRect = featuredProjectBoundingRectRef.current;
            if (!featuredProjectBoundingRectRef.current) {
                featuredProjectBoundingRect = featuredProject.getBoundingClientRect();
                setFeaturedProjectBoundingRect(featuredProjectBoundingRect);
            }

            if (window.scrollY + window.innerHeight > featuredProjectBoundingRect.y + (featuredProjectBoundingRect.height * 0.3)) {
                addClassName(featuredProject, 'active');
            }
            else {
                removeClassName(featuredProject, 'active');
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll, { passive: true });
        }
    }, []);

    return (
        <div className='featured-project-container'>
            <div className='featured-project' ref={featuredProjectRef}>
                <FeaturedProjectShowcase images={project.images} showCaptions={true} justification={justification}></FeaturedProjectShowcase>
                <div className={'featured-project-content justify-' + justification}>
                    <span className='featured-project-header'>
                        <span className='featured-project-title'>{project.title}</span>
                        <span className='featured-project-duration'>July 2022 - Present (8 months)</span>
                        <span className='featured-project-index'>{(index + 1).toString().padStart(2, '0')}</span>
                    </span>

                    <span className='featured-project-description'>{project.description}</span>

                    <div className='featured-project-cta'>
                        <span>Read More</span>
                        <i className='fa-solid fa-angle-right fa-fw'></i>
                    </div>
                </div>
            </div>
        </div>
    );
}
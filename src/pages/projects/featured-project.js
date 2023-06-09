
import React, { Fragment } from 'react';
import FeaturedProjectShowcase from './featured-project-showcase.js';

import './featured-project.scss'

export default function FeaturedProject(props) {
    const { project, index, justification } = props;

    return (
        <Fragment>
            <div className='featured-project' data-aos='fade-in' data-aos-duration='400' data-aos-easing='ease-in-out'>
                <FeaturedProjectShowcase images={project.images}
                    showCaptions={true}
                    justification={justification}></FeaturedProjectShowcase>
                <div className={'featured-project-content justify-' + justification}>
                    <span className='featured-project-header'>
                        <span className='featured-project-title'>{project.title}</span>
                        <span className='featured-project-duration'>July 2022 - Present (8 months)</span>
                        <span className='featured-project-index'>{(index + 1).toString().padStart(2, '0')}</span>
                    </span>

                    <span className='featured-project-description'>{project.description}</span>

                    <div className='featured-project-cta'>
                        <span>{'Read More'}</span>
                        <i className='fa-solid fa-angle-right fa-fw'></i>
                    </div>
                </div>
            </div>
        </Fragment>

    );
}
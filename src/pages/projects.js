
import React from 'react'
import Navbar from '../components/navbar.js'
import { Link } from 'react-router-dom'
import Finder from '../components/finder.js'
import { useState, useRef } from 'react'

import Info from '../../public/icons/info.svg'
import './projects.css'

// Featured project entry data:
// project = {
//     title: ""
//     description: ""
//     cover: img
//     tools: []
//     link: "" (optional) 
// }
function FeaturedProjectEntry(props) {
    const { project, justification } = props;
    const [currentCoverImageIndex, setCurrentCoverImageIndex] = useState(0);
    const [translation, setTranslation] = useState(0);
    const showcase = [];

    // Construct showcase elements.
    for (let i = 0; i < project.covers.length; ++i) {
        let classNames = ['featured-project-showcase-button'];

        if (currentCoverImageIndex == i) {
            classNames.push('featured-project-showcase-button-current')
        }

        // const onClick = function (e) {
        //     e.preventDefault();
        //     setCurrentCoverImageIndex(i);
        // }

        showcase.push(<div className={classNames.join(' ')}></div>);
    }

    // Negative modulo function.
    const mod = (n, m) => (n % m + m) % m;
    const coverContainer = useRef(null);

    const description = useRef(null);

    let style = {
        transform: `translateX(${translation}px)`
    };

    return (
        <div className='featured-project'>
            <div className='featured-project-covers' ref={coverContainer} style={style}>
                {
                    project.covers.map((cover, index) => (
                        <img src={cover} key={index} className='featured-project-cover'></img>
                    ))
                }
            </div>

            <div className='featured-project-showcase'>
                <div className='featured-project-showcase-arrows'>
                    <i className='fa-solid fa-angle-left fa-fw featured-project-showcase-previous' onClick={(e) => {
                        e.preventDefault();

                        // Get the width of the featured project container.
                        const width = coverContainer.current.clientWidth;
                        const current = currentCoverImageIndex;
                        const previous = Math.max(current - 1, 0);

                        const translate = translation + (current - previous) * width;
                        setTranslation(translate);

                        style = {
                            transform: `translateX(${translate}px)`
                        };

                        setCurrentCoverImageIndex(previous);
                    }}></i>
                    <i className='fa-solid fa-angle-right fa-fw featured-project-showcase-next' onClick={function (e) {
                        e.preventDefault();

                        // Get the width of the featured project container.
                        const width = coverContainer.current.clientWidth;
                        const current = currentCoverImageIndex;
                        const next = Math.min(current + 1, project.covers.length - 1);

                        const translate = translation - (next - current) * width;
                        setTranslation(translate);

                        style = {
                            transform: `translateX(${translate}px)`
                        };

                        setCurrentCoverImageIndex(next);
                    }}></i>
                </div>
            </div>



            <div className='featured-project-showcase-navigation'>
                {
                    showcase.map((element, index) => (
                        <React.Fragment key={index}>{element}</React.Fragment>
                    ))
                }
            </div>



            <div className='featured-project-content'>
                <span className='featured-project-banner'>Featured Project</span>
                <div className='featured-project-header'>
                    <span className='featured-project-title'>{project.title}</span>
                    <Info className='featured-project-info' onClick={function(e) {
                        e.preventDefault();
                        description.current.style.display = 'flex';
                    }}></Info>
                </div>
                <span className='featured-project-description' ref={description}>{project.description}</span>
            </div>

            <div className='featured-project-overlay'>
                <span className='featured-project-overlay-header'>At a glance</span>
                <span className='featured-project-overlay-description'>{project.description}</span>

                <span className='featured-project-overlay-header'>Tools:</span>
                <div className='featured-project-overlay-tools'>
                    {
                        project.tools.map((name, index) => (
                            <span className='featured-project-overlay-tool' key={index}>{name}</span>
                        ))
                    }
                </div>
            </div>
        </div >
    );
}

function ProjectEntry(props) {
    const { project } = props;

    return (
        <li className='project'>
            <div className='project-header'>
                {/* <i className='fa-regular fa-folder fa-fw project-icon'></i> */}
                <span className='project-title'>{project.title}</span>
                <i className='fa-solid fa-arrow-up-right-from-square fa-fw project-link'></i>
            </div>

            <div className='project-outline'>
                <span className='project-description'>{project.description}</span>
            </div>
            <div className='project-tools'>
                {
                    project.tools.map((name, index) => (
                        <span className='project-tool' key={index}>{name}</span>
                    ))
                }
            </div>
        </li>
    )
}


export default function Projects(props) {
    const { content } = props;

    const project = {
        title: "Software Raytracer",
        description: "An offline, CPU-based raytracer developed for CS500 during my senior year at the DigiPen Institute of Technology. Features metallic materials with configurable roughness parameters, refractive materials (glass), and emissive light sources.",
        covers: ["images/render.png", "images/depth_of_field.png", "images/reflection.jpg", "images/mountains.jpg", "images/reflection.jpg",],
        tools: ["C++", "Git", "CMake"],
        link: "https://github.com/sevanetrebchenko/"
    };

    let categories = ['Vulkan', 'Raytracing', 'Engine Development']

    return (
        <React.Fragment>
            <header className='projects-header'>
                <Navbar></Navbar>
            </header>

            <div className='projects-content'>
                <section className='projects-cover' style={{ backgroundImage: 'url(\'images/render.png\')' }}>
                    <div className='projects-title-container'>
                        <span className='projects-title'>projects</span>
                        <span className='projects-description'>this is the page for my completed projects</span>
                    </div>

                    <div className='overlay'>
                    </div>
                </section>

                {/* <div className='featured-projects-list-header'>
                    <span className='separator'></span>
                    <span className='featured-projects-list-title'>Featured Projects</span>
                    <span className='separator'></span>
                </div> */}

                <div className='featured-projects-list'>
                    <FeaturedProjectEntry project={project} justification={'left'}></FeaturedProjectEntry>
                    <FeaturedProjectEntry project={project} justification={'right'}></FeaturedProjectEntry>
                </div>


                <div className='projects-grid-header'>
                    <span className='projects-grid-title'>Other Noteworthy Projects</span>
                    <Link to={''}>
                        <span className='projects-grid-description'>view the archive</span>
                    </Link>
                </div>

                <ul className='projects-grid'>
                    <ProjectEntry project={project}></ProjectEntry>
                    <ProjectEntry project={project}></ProjectEntry>
                    <ProjectEntry project={project}></ProjectEntry>
                    <ProjectEntry project={project}></ProjectEntry>
                    <ProjectEntry project={project}></ProjectEntry>
                </ul>

            </div>
        </React.Fragment>
    )
}
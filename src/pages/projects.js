
import React from 'react'
import Navbar from '../components/navbar.js'
import { Link } from 'react-router-dom'
import Finder from '../components/finder.js'

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

    let header = [];
    header.push(<span className='featured-project-title'>{project.title}</span>);

    // Link element is optional.
    if (project.link) {
        header.push(
            <Link to={project.link}>
                <i className='fa-solid fa-arrow-up-right-from-square fa-fw'></i>
            </Link>
        );
    }

    const justficationClassName = 'justify-' + justification;

    return (
        <div className='featured-project'>
            <div className={'featured-project-cover' + ' ' + justficationClassName}>
                <img src={project.cover} alt=''></img>
            </div>
            <div className={'featured-project-outline' + ' ' + justficationClassName}>
                <span className='featured-project-banner'>Featured Project</span>
                <div className='featured-project-header'>
                    {
                        header.map((element, index) => (
                            <React.Fragment key={index}>{element}</React.Fragment>
                        ))
                    }
                </div>
                <span className='featured-project-description'>{project.description}</span>
                <div className='featured-project-tools'>
                    {
                        project.tools.map((name, index) => (
                            <span className='featured-project-tool' key={index}>{name}</span>
                        ))
                    }
                </div>
                <div className='featured-project-more'>
                    <Link to={'/'}>
                        <span>Read More</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function ProjectEntry(props) {
    const { project } = props;

    return (
        <li className='project' style={{ backgroundImage: 'url(\'images/render.png\')' }}>
            <div className='project-header'>
                <span className='project-title'>{project.title}</span>
                <i className='fa-solid fa-arrow-up-right-from-square fa-fw'></i>
            </div>
            <div className='project-outline' style={{overflow: 'hidden', textOverflow: 'ellipsis', maxHeight: '100px'}}>
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
        description: "An offline, CPU-based raytracer developed for CS500 during my senior year at the DigiPen Institute of Technology. Features metallic materials with configurable roughness parameters, refractive materials (glass), and emissive light sources",
        cover: "images/render.png",
        tools: ["C++", "Git", "CMake"],
        link: "https://github.com/sevanetrebchenko/"
    };

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

                <div className='featured-projects-list-header'>
                    <span className='separator'></span>
                    <span className='featured-projects-list-header'>Featured Projects</span>
                    <span className='separator'></span>
                </div>

                <div className='featured-projects-list'>
                    <FeaturedProjectEntry project={project} justification={'left'}></FeaturedProjectEntry>
                    <FeaturedProjectEntry project={project} justification={'right'}></FeaturedProjectEntry>
                </div>


                <div className='projects-grid-header'>
                    <span className='separator'></span>
                    <span className='projects-grid-title'>Other Noteworthy Projects</span>
                    <span className='separator'></span>
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
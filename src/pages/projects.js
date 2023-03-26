
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

                <div className='projects-list-header'>
                    <span className='separator'></span>
                    <span className='projects-list-title'>Projects List</span>
                    <span className='separator'></span>
                </div>

                <div className='featured-project-list'>
                    <FeaturedProjectEntry project={project} justification={'left'}></FeaturedProjectEntry>
                    <FeaturedProjectEntry project={project} justification={'right'}></FeaturedProjectEntry>
                    {/* <section className='featured-project'>
                        <div className='featured-project-image'>
                            <img src='images/render.png'></img>
                        </div>
                        <div className='featured-project-outline'>
                            <span className='featured-project-header'>Featured Project</span>
                            <div className='featured-project-title-container'>
                                <span className='featured-project-title'>Software Raytracer</span>
                                <Link to={'https://github.com/sevanetrebchenko/'} className='featured-project-link'>
                                    <i className='fa-solid fa-arrow-up-right-from-square fa-fw'></i>
                                </Link>
                            </div>

                            <span className='featured-project-description'>An offline, CPU-based raytracer developed for CS500 during my senior year at the DigiPen Institute of Technology. Features metallic materials with configurable roughness parameters, refractive materials (glass), and emissive light sources.</span>
                            <div className='featured-project-tools'>
                                <span className='featured-project-tool'>C++</span>
                                <span className='featured-project-tool'>Git</span>
                            </div>
                            <div className='featured-project-links'>
                                <div className='read-more'>
                                    <span className='read'>Read more</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className='featured-project'>
                        <div className='featured-project-image'>
                            <img src='images/render.png'></img>
                        </div>
                        <div className='featured-project-outline'>
                            <span className='featured-project-header'>Featured Project</span>
                            <span className='featured-project-title'>Software Raytracer</span>
                            <span className='featured-project-description'>An offline, CPU-based raytracer developed for CS500 during my senior year at the DigiPen Institute of Technology. Features metallic materials with configurable roughness parameters, refractive materials (glass), and emissive light sources.</span>
                            <div className='featured-project-tools'>
                                <span className='featured-project-tool'>C++</span>
                                <span className='featured-project-tool'>Git</span>
                            </div>
                            <div className='featured-project-links'>
                                <Link to={'https://github.com/sevanetrebchenko/'}>
                                    <i className='fab fa-github fa-fw'></i>
                                </Link>
                                <Link to={'https://www.linkedin.com/in/sevanetrebchenko/'}>
                                    <i className='fab fa-linkedin fa-fw'></i>
                                </Link>
                            </div>
                        </div>
                    </section> */}
                </div>

            </div>

            {/* <div className='projects' style={style}>
                <div className='projects-header'>
                    <Navbar></Navbar>
                </div>

                <div className='page-title'>
                    <div className='projects-title-container'>
                        <span className='projects-title'>projects</span>
                    </div>
                </div>
            </div> */}

        </React.Fragment>
    )



    return (
        <React.Fragment>
            <div className='projects-container' style={style}>
                <Navbar></Navbar>
                <div className='title-container'>
                    <span className='title'>projects</span>
                </div>
                <div className='fadeout'>
                </div>
            </div>
            <div className='projects-list'>
                <span>asdf</span>
            </div>
        </React.Fragment>
    );
}
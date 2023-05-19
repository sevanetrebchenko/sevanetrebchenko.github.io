
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom'
import Navbar from '../../components/navbar.js'
import PageCover from '../../components/page-cover.js';
import FeaturedProject from './featured-project.js'
import './projects.less';
import '../shared.less';

function ProjectEntry(props) {
    const { project, span } = props;

    return (
        <div className={'project ' + span}>
            <div className='project-header'>
                {/* <i className='fa-regular fa-folder fa-fw project-icon'></i> */}
                <span className='project-title'>{project.title}</span>
                <i className='fa-solid fa-arrow-up-right-from-square fa-fw project-link'></i>
            </div>

            {/* <div className='project-outline'>
                <span className='project-description'>{project.description}</span>
            </div> */}
            <div className='project-tools'>
                {
                    project.tools.map((name, index) => (
                        <span className='project-tool' key={index}>{name}</span>
                    ))
                }
            </div>
        </div>
    );
}


export default function Projects(props) {
    const { content } = props;

    const project = {
        title: "Software Raytracer",
        description: "An offline, CPU-based raytracer developed for CS500 during my senior year at the DigiPen Institute of Technology. Features metallic materials with configurable roughness parameters, refractive materials (glass), and emissive light sources. This project was written over the course of 8 months using C++ as the main development language, Git for source control, and CMake as the main project build system.\nAn offline, CPU-based raytracer developed for CS500 during my senior year at the DigiPen Institute of Technology. Features metallic materials with configurable roughness parameters, refractive materials (glass), and emissive light sources. This project was written over the course of 8 months using C++ as the main development language, Git for source control, and CMake as the main project build system.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.\nThis is a test for overflowing content in the main featured project overlay.",
        images: [
            {
                src: "images/render.png",
                caption: {
                    header: '2048 samples per pixel',
                    description: 'Time to render: 16 minutes, 48 seconds ',
                    position: 'top right'
                },
            },
            {
                src: "images/depth_of_field.png",
                caption: {
                    header: '2048 samples per pixel',
                    description: 'Time to render: 16 minutes, 48 seconds ',
                    position: 'top left'
                },
            },
            {
                src: "images/reflection.jpg",
                caption: {
                    header: '2048 samples per pixel',
                    description: 'Time to render: 16 minutes, 48 seconds ',
                    position: 'bottom right'
                },
            },
            {
                src: "images/mountains.jpg",
                caption: {
                    header: '2048 samples per pixel',
                    description: 'Time to render: 16 minutes, 48 seconds ',
                    position: 'bottom left'
                },
            },
            {
                src: "images/reflection.jpg",
                caption: {
                    header: '2048 samples per pixel',
                    description: 'Time to render: 16 minutes, 48 seconds ',
                    position: 'top right'
                },
            },
        ],
        tools: ["C++", "Git", "CMake"],
        link: "https://github.com/sevanetrebchenko/"
    };

    const projects = [
        project,
        project,
        project
    ];

    return (
        <React.Fragment>
            <header>
                <Navbar></Navbar>
            </header>

            <PageCover title={'projects'}
                description={'this is the page for my completed projects'}
                coverImageUrl={'images/render.png'}></PageCover>

            <div className='projects-page-content'>
                <span className='page-section-title'>Featured Projects</span>
                <div className='featured-projects'>
                    {
                        projects.map((project, index) => (
                            <FeaturedProject project={project}
                                index={index}
                                justification={index % 2 == 0 ? 'left' : 'right'}
                                key={index}></FeaturedProject>
                        ))
                    }
                </div>
                <span className='page-section-title'>Other Noteworthy Projects</span>
                <div className='projects-grid'>
                    <ProjectEntry project={project} span='normal'></ProjectEntry>
                    <ProjectEntry project={project} span='normal'></ProjectEntry>
                    <ProjectEntry project={project} span='double'></ProjectEntry>
                    <ProjectEntry project={project} span='normal'></ProjectEntry>
                    {/* <ProjectEntry project={project} span='triple'></ProjectEntry>
                    <ProjectEntry project={project} span='normal'></ProjectEntry>
                    <ProjectEntry project={project} span='normal'></ProjectEntry>
                    <ProjectEntry project={project} span='normal'></ProjectEntry>
                    <ProjectEntry project={project} span='normal'></ProjectEntry>
                    <ProjectEntry project={project} span='normal'></ProjectEntry>
                    <ProjectEntry project={project} span='normal'></ProjectEntry>
                    <ProjectEntry project={project} span='normal'></ProjectEntry>
                    <ProjectEntry project={project} span='normal'></ProjectEntry> */}
                </div>

            </div>

            {/* <div className='projects-grid-header'>
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
                </ul> */}
        </React.Fragment>
    )
}

import React, { forwardRef } from 'react'
import Navbar from '../components/navbar.js'
import { Link } from 'react-router-dom'
import Finder from '../components/finder.js'
import { useState, useRef, useEffect } from 'react'


import './projects.less';
import './body.css'

import FeaturedProject from './projects/featured-project.js'

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

    let categories = ['Vulkan', 'Raytracing', 'Engine Development']

    return (
        <React.Fragment>
            <header>
                <Navbar></Navbar>
            </header>

            <main className='projects'>
                <section className='projects-cover' style={{ backgroundImage: 'url(\'images/render.png\')' }}>
                    <div className='projects-title-container'>
                        <span className='projects-title'>projects</span>
                        <span className='projects-description'>this is the page for my completed projects</span>
                    </div>

                    <div className='overlay'>
                    </div>
                </section>

                <div className='featured-projects'>
                    {
                        projects.map((project, index) => (
                            <FeaturedProject project={project} index={index} key={index}></FeaturedProject>
                        ))
                    }
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

            </main>
        </React.Fragment>
    )
}
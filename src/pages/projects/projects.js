
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom'
import Navbar from '../../components/navbar.js'
import PageCover from '../../components/page-cover.js';
import Page from '../page.js';
import FeaturedProject from './featured-project.js'
import useStateRef from '../../util/use-state-ref.js';
import './projects.scss';
import '../shared.scss';
import { addClassName, removeClassName } from '../../util/util.js';

import { ContainerExpression } from '../../components/expression.js';

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
        // project,
        // project,
        // project
    ];

    return (
        <React.Fragment>
            <header>
                <Navbar></Navbar>
            </header>

            <Page title={'Projects'}
                description={'a showcase of some of my best work'}
                coverImageUrl={'images/render.png'}>
                <ContainerExpression name={'featured_projects'} type={'array'} content={projects.length} shouldEmphasizeName={true}>
                    <div className='featured-projects'>
                        {
                            projects.map((project, index) => (
                                <FeaturedProject project={project}
                                    index={index}
                                    justification={index % 2 == 0 ? 'right' : 'left'}
                                    key={index}></FeaturedProject>
                            ))
                        }
                    </div>
                </ContainerExpression>
            </Page>

            {/* <PageCover ></PageCover>

            <div className='projects-page-content'>
                <ContainerExpression name={'featured_projects'} type={'array'} content={projects.length} shouldEmphasizeName={true}>
                    <div className='featured-projects'>
                        {
                            projects.map((project, index) => (
                                <FeaturedProject project={project}
                                    index={index}
                                    justification={index % 2 == 0 ? 'right' : 'left'}
                                    key={index}></FeaturedProject>
                            ))
                        }
                    </div>
                </ContainerExpression>

                {/* <ArrayExpression name={'other_projects'} type={'list'} content={projects.length}>
                    <div className='projects-grid'>
                        <ProjectEntry project={project} span='normal'></ProjectEntry>
                        <ProjectEntry project={project} span='normal'></ProjectEntry>
                        <ProjectEntry project={project} span='double'></ProjectEntry>
                        <ProjectEntry project={project} span='normal'></ProjectEntry>
                    </div>
                </ArrayExpression> */}

        </React.Fragment>
    )
}
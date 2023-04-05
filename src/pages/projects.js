
import React, { forwardRef } from 'react'
import Navbar from '../components/navbar.js'
import { Link } from 'react-router-dom'
import Finder from '../components/finder.js'
import { useState, useRef, useEffect } from 'react'

import Info from '../../public/icons/info.svg'
import './projects.css'

const FeaturedProjectOverlay = forwardRef((props, overlayRef) => {
    const { project, setVisible } = props;

    // Close out of project overlay if user clicks outside of the overlay window.
    useEffect(() => {
        function onClickOutside(e) {
            const current = overlayRef.current;

            if (!current) {
                return;
            }

            if (current.style.display === 'none') {
                // Overlay is hidden.
                return;
            }

            if (!current.contains(e.target)) {
                // In seconds.
                const animationTime = 2;

                // Append fade out animation.
                current.style.animation = `fadeOut ease ${animationTime}s`;
                current.style.animationFillMode = 'forwards'; // Make the animation stay on the last frame after finishing.
                const timeout = setTimeout(() => {
                    setVisible(false);
                }, animationTime * 1000);

                return () => clearTimeout(timeout);
            }
        }

        // Bind event listener.
        document.addEventListener("mousedown", onClickOutside);
        return () => {
            document.removeEventListener("mousedown", onClickOutside);
        };
    }, [overlayRef]);

    return (
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
    );
});

// Featured project entry data:
// project = {
//     title: ""
//     description: ""
//     cover: img
//     tools: []
//     link: "" (optional) 
// }
function FeaturedProjectEntry(props) {
    const { project } = props;
    const [currentImageIndex, setImageIndex] = useState(0);
    const [currentTranslation, setTranslation] = useState(0);

    const imageContainer = useRef(null);
    let style = {
        transform: `translateX(${currentTranslation}px)`
    };

    // Construct pagination for image carousel.
    let imageNavigationButtons = [];
    for (let i = 0; i < project.images.length; ++i) {
        let classNames = ['featured-project-navigation-button'];

        if (i == currentImageIndex) {
            classNames.push('featured-project-navigation-button-current');
        }

        const jumpToImage = function (e) {
            e.preventDefault();

            const width = imageContainer.current.clientWidth;
            const current = currentImageIndex;
            const desired = i;

            if (current == desired) {
                return;
            }

            let translation = currentTranslation;
            if (current > desired) {
                translation = currentTranslation + (current - desired) * width;
            }
            else {
                translation = currentTranslation - (desired - current) * width;
            }

            setTranslation(translation);
            style = {
                transform: `translateX(${translation}px)`
            };

            setImageIndex(desired);
        }

        imageNavigationButtons.push(<span className={classNames.join(' ')} onClick={jumpToImage}></span>);
    }

    // Construct carousel for showcasing project images.
    const previousImage = function (e) {
        e.preventDefault();

        const width = imageContainer.current.clientWidth;
        const current = currentImageIndex;
        const previous = Math.max(currentImageIndex - 1, 0);

        const translation = currentTranslation + (current - previous) * width;
        setTranslation(translation);

        style = {
            transform: `translateX(${translation}px)`
        };

        setImageIndex(previous);
    }

    const nextImage = function (e) {
        e.preventDefault();

        const width = imageContainer.current.clientWidth;
        const current = currentImageIndex;
        const next = Math.min(current + 1, project.images.length - 1);

        const translation = currentTranslation - (next - current) * width;
        setTranslation(translation);

        style = {
            transform: `translateX(${translation}px)`
        };

        setImageIndex(next);
    }

    const [isOverlayVisible, setOverlayVisible] = useState(false);
    const overlayRef = useRef(null);

    // Fade in the project overlay when mounted.
    useEffect(() => {
        if (isOverlayVisible) {
            const current = overlayRef.current;
            if (!current) {
                return;
            }

            // In seconds.
            const animationTime = 2;

            // Append fade out animation.
            current.style.animation = `fadeIn ease ${animationTime}s`;
            current.style.animationFillMode = 'forwards'; // Make the animation stay on the last frame after finishing.

            const timeout = setTimeout(() => {
                current.removeAttribute('style');
            }, animationTime * 1000);

            return () => clearTimeout(timeout);
        }
    }, [isOverlayVisible]);

    return (
        <div className='featured-project'>
            <div className='featured-project-images' ref={imageContainer} style={style}>
                {
                    project.images.map((image, index) => (
                        <img src={image} key={index} className='featured-project-image'></img>
                    ))
                }
            </div>

            <div className='featured-project-navigation'>
                <div className='featured-project-navigation-arrows'>
                    <i className='fa-solid fa-angle-left fa-fw featured-project-navigation-previous' onClick={previousImage}></i>
                    <i className='fa-solid fa-angle-right fa-fw featured-project-navigation-next' onClick={nextImage}></i>
                </div>
                <div className='featured-project-navigation-buttons'>
                    {
                        imageNavigationButtons.map((element, index) => (
                            <React.Fragment key={index}>{element}</React.Fragment>
                        ))
                    }
                </div>
            </div>

            <div className='featured-project-content'>
                <span className='featured-project-banner'>Featured Project</span>
                <div className='featured-project-header'>
                    <span className='featured-project-title'>{project.title}</span>
                    <Info className='featured-project-info' onClick={(e) => {
                        setOverlayVisible(true);
                    }}></Info>
                </div>
            </div>

            {isOverlayVisible && <FeaturedProjectOverlay project={project} setVisible={setOverlayVisible} ref={overlayRef}></FeaturedProjectOverlay>}
        </div>
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
        images: ["images/render.png", "images/depth_of_field.png", "images/reflection.jpg", "images/mountains.jpg", "images/reflection.jpg",],
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

                <div className='featured-projects-list'>
                    {
                        projects.map((project, index) => (
                            <FeaturedProjectEntry project={project} key={index}></FeaturedProjectEntry>
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

            </div>
        </React.Fragment>
    )
}
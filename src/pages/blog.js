
import React from 'react'
import Finder from '../components/finder.js';
import Navbar from '../components/navbar.js'
import { Link } from 'react-router-dom';

import './blog.css'

function Post1(props) {
    const { content } = props;


    if (content.cover) {
        return (
            <div className='post'>
                <img src={content.cover} className='post-cover'></img>
                <div className='post-content'>
                    <div className='post-meta'>
                        <div className='post-tags'>
                            {
                                content.tags.map((tag, index) => (
                                    <span className='post-tag' key={index}>{tag}</span>
                                ))
                            }
                        </div>
                        <Link to={'/'}>
                            <i className='fa-solid fa-arrow-up-right-from-square fa-fw post-link'></i>
                        </Link>
                    </div>
                    <div className='post-header'>
                        <span className='post-title'>{content.title}</span>
                        <span className='post-date'>Nov 09, 2023</span>
                    </div>
                    <span className='post-description'>{content.description}</span>
                </div>
            </div>
        );
    }
    else {
        return (
            <div className='post-no-cover'>
                <div className='post-content'>
                    <div className='post-meta'>
                        <div className='post-tags'>
                            {
                                content.tags.map((tag, index) => (
                                    <span className='post-tag' key={index}>{tag}</span>
                                ))
                            }
                        </div>
                        <Link to={'/'}>
                            <i className='fa-solid fa-arrow-up-right-from-square fa-fw post-link'></i>
                        </Link>
                    </div>
                    <div className='post-header'>
                        <span className='post-title'>{content.title}</span>
                        <span className='post-date'>Nov 09, 2023</span>
                    </div>
                    <span className='post-description'>{content.description}</span>
                </div>
            </div>
        );
    }
}

function Header(props) {
    let categories = [
        'Vulkan',
        'Raytracing',
        'OpenGL',
        'Programming',
        'C++',
        'Physically-Based Rendering',
        'Implementation Details',
        'Tutorial'
    ];

    return (
        <div className='post-list-header'>
            <Finder></Finder>
            <div className='categories'>
                <div className='left'>
                    <i className='fa-solid fa-angle-left fa-fw'></i>
                </div>
                <div className='category-list'>
                    {
                        categories.map((name, index) => (
                            <span className='category' key={index}>{name}</span>
                        ))
                    }
                </div>
                <div className='right'>
                    <i className='fa-solid fa-angle-right fa-fw'></i>
                </div>
            </div>
        </div>
    )
}

export default function Blog(props) {
    const postWithCover = {
        tags: ['programming', 'raytracing'],
        cover: 'images/render.png',
        title: 'Software Raytracer',
        description: "An offline, CPU-based raytracer developed for CS500 during my senior year at the DigiPen Institute of Technology. Features metallic materials with configurable roughness parameters, refractive materials (glass), and emissive light sources.",
    }

    const postWithoutCover = {
        tags: ['programming', 'vulkan', 'opengl', 'realtime graphics'],
        title: 'Software Raytracer',
        description: "An offline, CPU-based raytracer developed for CS500 during my senior year at the DigiPen Institute of Technology. Features metallic materials with configurable roughness parameters, refractive materials (glass), and emissive light sources.",
    }

    return (
        <React.Fragment>
            <header className='blog-header'>
                <Navbar></Navbar>
            </header>

            <div className='blog-content'>
                <section className='blog-cover' style={{ backgroundImage: 'url(\'images/mountains.jpg\')' }}>
                    <div className='blog-title-container'>
                        <span className='blog-title'>blog</span>
                        <span className='blog-description'>this is where I put my thoughts into writing</span>
                    </div>

                    <div className='overlay'>
                    </div>
                </section>

                <Header></Header>

                <div className='post-list'>
                    <Post1 content={postWithCover}></Post1>
                    <Post1 content={postWithoutCover}></Post1>
                    <Post1 content={postWithoutCover}></Post1>
                    <Post1 content={postWithCover}></Post1>

                    <Post1 content={postWithoutCover}></Post1>
                    <Post1 content={postWithCover}></Post1>
                    <Post1 content={postWithoutCover}></Post1>
                    <Post1 content={postWithoutCover}></Post1>
                    <Post1 content={postWithoutCover}></Post1>
                    <Post1 content={postWithCover}></Post1>

                </div>
            </div>
        </React.Fragment>
    );
}
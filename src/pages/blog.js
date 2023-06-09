
import React from 'react'
import Finder from '../components/finder.js';
import Navbar from '../components/navbar.js'
import { Link } from 'react-router-dom';

import Page from './page.js';

import PageCover from '../components/page-cover.js';

import './blog.css'
import { ArrayExpression, StringExpression, SingleLineExpression, ObjectExpression, ContainerExpression } from '../components/expression.js';

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
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <ObjectExpression name={'search'} shouldEmphasizeName={true}>
                    <Finder></Finder>
                </ObjectExpression>
            </div>
            {/* <ArrayExpression name={'categories'} content={categories.length} shouldEmphasizeName={true}>
                <div className='categories'>
                    <div className='category-list'>
                        {
                            categories.map((name, index) => (
                                <span className='category' key={index}>{name}</span>
                            ))
                        }
                    </div>
                </div>
            </ArrayExpression> */}
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
            <Navbar></Navbar>
            <Page title={"Journal"} description={'a collection of notes, code snippets, and the ideas behind my work'} coverImageUrl={'images/reflection.jpg'}>
                <ObjectExpression name={'search'} shouldEmphasizeName={true}>
                    <Finder></Finder>
                </ObjectExpression>
                <ContainerExpression name={'notes'} type={'array'} content={8} shouldEmphasizeName={true}>
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
                </ContainerExpression>
            </Page>
        </React.Fragment>
    );
}
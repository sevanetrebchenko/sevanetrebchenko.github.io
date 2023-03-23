
import React from 'react'
import Navbar from '../components/navbar.js';

import './projects.css'

export default function Projects(props) {

    return (
        <React.Fragment>
            <header className='projects-header'>
                <Navbar></Navbar>
            </header>

            <div className='projects-content'>
                <section className='projects-cover'>
                    <div className='projects-title-container'>
                        <span className='projects-title'>projects</span>
                        <span className='projects-description'>this is the page for my completed projects</span>
                    </div>

                    <div className='overlay'>
                    </div>
                </section>

                <section className='projects-cover'>
                    <div className='projects-title-container'>
                        <span className='projects-title'>projects</span>
                        <span className='projects-description'>this is the page for my completed projects</span>
                    </div>
                </section>
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
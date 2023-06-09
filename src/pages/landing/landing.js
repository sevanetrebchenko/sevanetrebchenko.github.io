
import React from 'react';
import Navbar from '../../components/navbar.js'
import './landing.scss'

export default function Landing(props) {
    // const { title, description, coverImageUrl } = props;
    const title = 'seva netrebchenko'
    const description = 'software engineer by profession, graphics programmer at heart'
    const coverImageUrl = 'images/render.png'

    const style = {
        backgroundImage: `url(\'${coverImageUrl}\')`
    }

    return (
        <React.Fragment>
            <Navbar></Navbar>
            <div className='landing-page' style={style}>
                <span className='page-title'>{title}</span>
                <span className='page-description'>{description}</span>
            </div>
            <div className='landing-page-overlay'>
            </div>
        </React.Fragment>
    );
}
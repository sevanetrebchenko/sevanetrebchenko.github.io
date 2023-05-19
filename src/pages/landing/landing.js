
import React from 'react';
import Navbar from '../../components/navbar.js'
import PageCover from '../../components/page-cover.js';

export default function Landing(params) {
    return (
        <React.Fragment>
            <header>
                <Navbar></Navbar>
            </header>
            <main>
                <PageCover title={'seva netrebchenko'}
                    description={'software engineer by profession, graphics programmer at heart'}
                    coverImageUrl={'images/render.png'}></PageCover>
            </main>
        </React.Fragment>
    );
}
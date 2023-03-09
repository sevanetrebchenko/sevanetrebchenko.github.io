
import React from 'react'

import Social from './social.js'
import Card from './card.js'
import Archives from './archives.js'

export default function Landing({ content }) {
    let cards = [];
    for (let post of content.posts) {
        cards.push(<Card data={post} />)
    }

    return (
        <React.Fragment>
            <div className='sidebar social'>
            </div>

            <div className='content card-container'>
                {cards.map((element, index) => (<React.Fragment key={index}>{element}</React.Fragment>))}
            </div>

            <div className='sidebar widget-container'>
            </div>
        </React.Fragment>
    );
}

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Archive({ posts }) {
    if (posts.length == 0) {
        // TODO
        return;
    }

    // Archive posts are guaranteed to be of the same year.
    const year = posts[0].date.published.split('-')[2];
    console.log(year);

    const navigateTo = useNavigate();

    let years = new Set();
    for (let post of content.posts) {
        years.add(post.date.published.split('-')[2]);
    }

    let elements = Array.from(years).map((year) => {
        const handleClick = (event) => {
            event.preventDefault();
            navigateTo(`archives/${year}`)
        };

        return <div key={year} onClick={handleClick}>{year}</div>
    });

    return (
        <div className='widget archive'>
            {
                elements.map((element, index) => (
                    <React.Fragment key={index}>
                        {element}
                    </React.Fragment>
                ))
            }
        </div>
    );
}
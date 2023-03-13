
import React from 'react'
import { Link } from 'react-router-dom'

// Stylesheets.
import './archive.css'

export default function Archive(params) {
    const { archives } = params;
    if (archives.size == 0) {
        // TODO
        return;
    }

    return (
        <div className='archives'>
            <h1>Archives</h1>
            {
                Array.from(archives, ([year, posts]) => (
                    <Link to={`archive/${year}`} key={year}>
                        <span className='year'>{year}</span>
                        <span>{posts.length}</span>
                    </Link>
                ))
            }
        </div>
    );
}
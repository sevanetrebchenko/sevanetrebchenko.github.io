
import React from 'react'
import { Link } from 'react-router-dom'

// Import stylesheet(s).
import './archive.css'

export default function Archive({ posts }) {
    if (posts.length == 0) {
        // TODO
        return;
    }

    let archives = new Map();
    for (const post of posts) {
        const year = post.date.published.split('-')[2];

        if (!archives.has(year)) {
            archives.set(year, []);
        }

        archives.get(year).push(post);
    }

    return (
        <div className='archives'>
            <h1>Archives</h1>
            {
                Array.from(archives, ([year, posts]) => (
                    <div className='archive' key={year}>
                        <Link to={`a/${year}`}>
                            <span className='year'>{year}</span>
                            <span className='count'>{posts.length}</span>
                        </Link>
                    </div>
                ))
            }
        </div>
    );
}
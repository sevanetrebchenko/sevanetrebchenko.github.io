
import React from 'react'
import { Link } from 'react-router-dom'

// Stylesheets.
import './archives.css'

export default function Archives(params) {
    const { archives } = params; // Mapping of year to an array of posts published in that year.
    if (archives.size == 0) {
        // TODO
        return;
    }

    return (
        <div className='archives-container'>
            <div className='archives-container-header'>
                <i className='fa-solid fa-folder-open fa-fw archives-container-icon' />
                <span className='archives-container-title'>Archives</span>
            </div>
            <div className='archives-list'>
                {
                    Array.from(archives, ([year, posts]) => (
                        <Link to={`archives/${year}`} className='archive' key={year}>
                            <span className='archive-year'>{year}</span>
                            <span>{posts.length}</span>
                        </Link>
                    ))
                }
            </div>
        </div>
    );
}
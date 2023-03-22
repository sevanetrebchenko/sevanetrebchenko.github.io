
import React from 'react'
import { Link } from 'react-router-dom'

// Stylesheets.
import './archives.css'

export default function Archives(params) {
    const { archives } = params;
    if (!archives) {
        return;
    }

    return (
        <div className='archives-container'>
            <div className='archives-container-header'>
                <span className='archives-container-title'>Archives</span>
            </div>
            <div className='archives-list'>
                {
                    Array.from(archives, ([name, posts]) => {
                        const location = 'archives' + '/' + name;

                        return (
                            <Link to={location} className='archive' key={name}>
                                <span className='archive-name'>{name}</span>
                                <span className='archive-count'>{posts.length}</span>
                            </Link>
                        )
                    })
                }
            </div>
        </div>
    );
}
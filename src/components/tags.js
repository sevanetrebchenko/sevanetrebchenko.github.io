
import React from 'react'
import { Link } from 'react-router-dom'

// Stylesheets.
import './tags.css'

export default function Tags(params) {
    const { tags } = params;
    if (!tags) {
        return;
    }

    return (
        <div className='tags-container'>
            <div className='tags-container-header'>
                <span className='tags-container-title'>Tags</span>
            </div>
            <div className='tags-list'>
                {
                    Array.from(tags, ([name, count]) => {
                        const location = 'tags' + '/' + name.replace(' ', '-').toLowerCase();

                        return (
                            <Link to={location} className='tag' key={name}>
                                <span className='tag-name'>{name}</span>
                            </Link>
                        )
                    })
                }
            </div>
        </div>
    );
}

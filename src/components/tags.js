
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
                <i className='fa-solid fa-tag fa-fw tags-container-icon' />
                <span className='tags-container-title'>Tags</span>
            </div>
            <div className='tags-list'>
                {
                    tags.map((tag, index) => {
                        return (
                            <Link to={`tags/${tag.replace(' ', '-').toLowerCase()}`} className='tag' key={index}>
                                <span className='tag-name'>{tag}</span>
                            </Link>
                        );
                    })
                }
            </div>
        </div>
    );
}


import React from 'react'
import { Link } from 'react-router-dom'

// Stylesheets.
import './tags.css'

export default function Tags(params) {
    const { tags } = params;

    return (
        <div className='tags'>
            <h1>Tags</h1>
            <div className='tag-container'>
                {
                    Array.from(tags).map((tag, index) => (
                        <Link to={`tag/${tag}`} className='tag' key={index}>
                            <span>{tag}</span>
                        </Link>
                    ))
                }
            </div>
        </div>
    );
}
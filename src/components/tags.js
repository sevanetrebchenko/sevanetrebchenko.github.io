
import React from 'react'
import { Link } from 'react-router-dom'

// Import stylesheet(s).
import './tags.css'

export default function Tags({ posts }) {

    // Generate list of tags.
    let tags = new Set();

    for (const post of posts) {
        if (post.tags) {
            for (const tag of post.tags) {
                tags.add(tag);
            }
        }
    }

    return (
        <div className='tags'>
            <h1>Tags</h1>

            <div className='tag-container'>
                {
                    Array.from(tags).map((tag, index) => (
                        <div className='tag' key={index}>
                            <Link to={`a/${tag}`}>
                                <span>{tag}</span>
                            </Link>
                        </div>
                    ))
                }
            </div>
        </div>
    )

}

import React from 'react'
import { Link } from 'react-router-dom'

// Stylesheets.
import './categories.css'

export default function Categories(params) {
    const { categories } = params;
    if (!categories) {
        return;
    }

    return (
        <div className='categories-container'>
            <div className='categories-container-header'>
                <span className='categories-container-title'>Categories</span>
            </div>
            <div className='categories-list'>
                {
                    Array.from(categories, ([name, count]) => {
                        const location = 'category' + '/' + name.replace(' ', '-').toLowerCase();

                        return (
                            <Link to={location} className='category' key={name}>
                                <span className='category-name'>{name}</span>
                                <span className='category-count'>{'(' + count + ')'}</span>
                            </Link>
                        )
                    })
                }
            </div>
        </div>
    );
}
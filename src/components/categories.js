
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
                <i className='fa-solid fa-hashtag fa-fw categories-container-icon' />
                <span className='categories-container-title'>Categories</span>
            </div>
            <div className='categories-list'>
                {
                    categories.map((category, index) => {
                        return (
                            <Link to={`categories/${category.replace(' ', '-').toLowerCase()}`} className='category' key={index}>
                                <span className='category-name'>{category}</span>
                            </Link>
                        );
                    })
                }
            </div>
        </div>
    );
}
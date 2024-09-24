import React from 'react';

import './card.css'

export default function Card(props) {
    const { title, abstract, categories, date } = props;

    const handleClick = (category) => (e) => {
        e.preventDefault();

    }

    return (
        <div className="card">
            <span className="title">{title}</span>
            <span className="abstract">{abstract}</span>
            <div className="categories">
                {
                    categories.map((category, id) => (
                        <span key={id} onClick={handleClick(category)}>{category}</span>
                    ))
                }
            </div>
        </div>
    )
}
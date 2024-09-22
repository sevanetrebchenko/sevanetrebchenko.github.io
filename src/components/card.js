import React from 'react';

import './card.css'

export default function Card(props) {
    const { title, abstract, categories, date } = props;
    return (
        <div className="card">
            <p className="title">{title}</p>
            <p className="date">{date}</p>
            <p className="abstract">{abstract}</p>
            <div className="categories">
                {
                    categories.map((category, id) => (
                        <p key={id}>{category}</p>
                    ))
                }
            </div>
        </div>
    )
}
import React from 'react';

import './card.css'

export default function Card(props) {
    const { title, abstract, categories, date } = props;

    const handleClick = (e) => {
        e.preventDefault();
    }

    return (
        <div className="card" onClick={handleClick}>
            <div className="abstract">
                <span className="title">{title}</span>
                <span className="description">{abstract}</span>
            </div>
            <div className="meta">
                <div className="date">
                    <i className="fa fa-clock-o fa-fw"></i>
                    <span>{`${date.toLocaleString('default', {month: 'long'})} ${date.getDay()}, ${date.getFullYear()}`}</span>
                </div>
                <div className="categories">
                    {
                        categories.map((category, id) => (
                            <span key={id}>#{category}</span>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}
 import React from 'react';

import './card.css'

export default function Card(props) {
    const { title, description, date } = props;

    return (
        <div className="card">
            <p className="title">{title}</p>
            <p className="description">{description}</p>
        </div>
    )
}
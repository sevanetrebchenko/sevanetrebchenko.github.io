
import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Card({ data }) {
    const navigateTo = useNavigate();
    const handleClick = (event) => {
        event.preventDefault();
        navigateTo(data.filepath.toString())
    };

    return (
        <div className='card' onClick={handleClick}>
            <h1>{data.title}</h1>
            <p>{data.summary}</p>
        </div>
    );
}
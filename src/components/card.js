
import React from 'react'
import { useNavigate } from 'react-router-dom'

// Import stylesheet(s).
import './card.css'

export default function Card({ post }) {
    const navigateTo = useNavigate();
    const handleClick = (event) => {
        event.preventDefault();
        navigateTo(post.filepath.toString())
    };

    let elements = [];

    if (post.image) {
        elements.push(
            <div className='image'>
                <img src={post.image}></img>
            </div>
        )
    }

    let header = [];

    if (post.tags) {
        header.push(
            <div className='tags'>
                {
                    post.tags.map((tag, index) => (
                        <button className='tag' key={index}>{tag}</button>
                    ))
                }
            </div>
        );
    }

    header.push(<h1 className='title'>{post.title}</h1>);
    header.push(<p className='description'>{post.summary}</p>)

    if (post.date) {
        const split = post.date.published.split('-');

        const day = split[1];
        
        const months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
        ];
        const month = months[split[0] - 1];

        const year = split[2];


        header.push(
            <div className='date'>
                <i className='fa-regular fa-calendar fa-fw icon' />
                <p>{month + ' ' + day + ', ' + year}</p>
            </div>
        );
    }

    elements.push(
        <div className='header'>
            {
                header.map((element, index) => (
                    <React.Fragment key={index}>{element}</React.Fragment>
                ))
            }
        </div>
    );

    return (
        <div className='card' onClick={handleClick}>
            {
                elements.map((element, index) => (
                    <React.Fragment key={index}>{element}</React.Fragment>
                ))
            }
        </div>
    );
}
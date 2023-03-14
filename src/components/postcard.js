
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

// Stylesheets.
import './postcard.css'

export default function Postcard(params) {
    const navigateTo = useNavigate();
    const handleClick = (event) => {
        event.preventDefault();
        navigateTo('posts/' + post.filepath.toString())
    };

    const { post } = params;

    let elements = [];

    // Background image is optional.
    if (post.image) {
        // TODO: alt text
        elements.push(<img src={post.image} alt='' onClick={handleClick} />);
    }

    let header = [];

    // Tags are optional.
    if (post.tags) {
        // TODO: categories + tags
        header.push(
            <div className='postcard-categories'>
                {
                    post.tags.map((tag, index) => (
                        <Link to='/' key={index}>
                            {tag}
                        </Link>
                    ))
                }
            </div>
        );
    }

    // Post description (title, abstract, publish date).
    header.push(
        <div className='postcard-description' onClick={handleClick}>
            <span className='postcard-title'>{post.title}</span>
            <span className='postcard-abstract'>{post.abstract}</span>
        </div>
    );

    if (post.date) {
        const day = post.date.day;

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
        const month = months[post.date.month - 1];

        const year = post.date.year;

        header.push(
            <div className='postcard-publish-date'>
                <i className='fa-regular fa-calendar fa-fw' />
                <span>{month + ' ' + day + ', ' + year}</span>
            </div>
        );
    }

    elements.push(
        <div className='postcard-header'>
            {
                header.map((element, index) => (
                    <React.Fragment key={index}>
                        {element}
                    </React.Fragment>
                ))
            }
        </div>
    );

    return (
        <div className='postcard'>
            {
                elements.map((element, index) => (
                    <React.Fragment key={index}>
                        {element}
                    </React.Fragment>
                ))
            }
        </div>
    );
}
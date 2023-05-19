import React from 'react'
import './page-cover.less'

export default function PageCover(props) {
    const { title, description, coverImageUrl } = props;
    const style = {
        backgroundImage: `url(\'${coverImageUrl}\')`
    }

    return (
        <div className='page-cover' style={style}>
            <div className='page-cover-content'>
                <span className='page-cover-title'>{title}</span>
                <span className='page-cover-description'>{description}</span>
            </div>
            <div className='page-cover-overlay'>
            </div>
        </div>
    );
}
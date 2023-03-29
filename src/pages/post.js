
import React from 'react'

import './post.css'

export default function Post(props) {
    const { content } = props;

    let text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Nulla aliquet porttitor lacus luctus accumsan. Risus nullam eget felis eget nunc lobortis mattis aliquam faucibus. Porttitor leo a diam sollicitudin tempor id eu. Ut tellus elementum sagittis vitae et leo. Lorem sed risus ultricies tristique nulla aliquet enim tortor at. Suspendisse in est ante in. Tincidunt tortor aliquam nulla facilisi cras fermentum odio. Tellus in metus vulputate eu scelerisque felis imperdiet proin fermentum. Aliquam id diam maecenas ultricies mi eget mauris pharetra et. Blandit libero volutpat sed cras ornare arcu dui vivamus arcu. Pulvinar elementum integer enim neque volutpat ac tincidunt vitae semper. Eget mi proin sed libero enim sed. Molestie at elementum eu facilisis sed odio morbi. Eu turpis egestas pretium aenean pharetra. Eu ultrices vitae auctor eu augue ut lectus arcu."
    let tableOfContents = [];

    return (
        <div className='post'>
            <div className='post-content'>
            </div>
            <div className='post-sidebar'>
                <div className='post-table-of-contents'></div>
            </div>
        </div>
    );
}
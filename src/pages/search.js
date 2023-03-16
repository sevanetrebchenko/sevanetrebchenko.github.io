
import React from 'react'

export default function Search(params) {
    const url = new URL(window.location.href);
    const search = new URLSearchParams(url.search).get('s');

    console.log(search);

    return (
        <React.Fragment>
            {/* <div className='header'>
                <Profile></Profile>
                <Navbar></Navbar>
            </div>
            <div className='content'>
                <div className='postcard-list'>
                    {
                        posts.map((post, index) => (
                            <Postcard post={post} key={index} />
                        ))
                    }
                </div>
            </div>
            <div className='sidebar'>
                <Search onChange={onSearchInput}></Search>
                <Archives archives={content.archives}></Archives>
                <Categories categories={content.categories}></Categories>
                <Tags tags={content.tags}></Tags>
            </div> */}
        </React.Fragment>
    );
}
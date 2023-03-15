
import React, { useState } from 'react'

// Stylesheets.
import './search.css'

export default function Search(params) {
    const [input, setInput] = useState('');

    const handleChange = (event) => {
        event.preventDefault();
        console.log(event.target.value);
        setInput(event.target.value);

        return false;
    }

    return (
        <form className='search-bar' action='/search/'>
            <div className='search-bar-header'>
                <span className='search-bar-title'>Search</span>
                <input type='text' className='search-bar-input' required placeholder='Type something...' onChange={handleChange} value={input}></input>
            </div>

            <i className='fa-solid fa-magnifying-glass fa-fw search-button-icon' />
        </form>
    );

}

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Stylesheets.
import './search.css'

export default function Search(params) {
    const { onChange } = params;

    const [searchInput, setSearchInput] = useState('');
    const navigateTo = useNavigate();

    const handleChange = (event) => {
        event.preventDefault();
        const query = event.target.value;

        setSearchInput(query);

        // External 'onChange' event for live reloading site contents based on the search query.
        if (onChange) {
            onChange(query);
        }
    }

    const handleSubmit = (event) => {
        event.preventDefault();

        setSearchInput(searchInput.trim());
        if (searchInput) {
            navigateTo(`/search/?s=${searchInput.replace(/\s+/, '-')}`);
        }
    };

    return (
        <form className='search-bar' method="get" autoComplete="off" onSubmit={handleSubmit}>
            <div className='search-bar-header'>
                <label className='search-bar-title'>Search</label>
                <input name='' type='text' className='search-bar-input' required placeholder='Type something...' onChange={handleChange} value={searchInput}></input>
            </div>

            <button className='search-button' onClick={handleSubmit}>
                <i className='fa-solid fa-magnifying-glass fa-fw search-button-icon' />
            </button>
        </form>
    );
}

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Stylesheets.
import './finder.css'

export default function Finder(props) {
    const { onChange } = props;

    const navigateTo = useNavigate();
    const [search, setSearch] = useState('');

    const onSubmit = function (e) {
        e.preventDefault();

        // Do not navigate when an empty search is submitted.
        if (!search) {
            // TODO: navigate to search page?
            return;
        }

        navigateTo(`/search/?s=${search.replace(/\s+/, '-')}`);
    }

    const onInput = function (e) {
        e.preventDefault();

        const search = e.target.value;
        setSearch(search);
        if (onChange) {
            onChange(search);
        }
    }

    const onClear = function (e) {
        e.preventDefault();

        const search = '';
        setSearch(search);
        if (onChange) {
            onChange(search);
        }
    }

    // Configure visible buttons.
    let buttons = [];

    // Only display 'clear' button if the finder has input.
    if (search) {
        buttons.push(
            <button type='button' className='clear-button' onClick={onClear}>
                <i className='fa-solid fa-xmark fa-fw search-button-icon' />
            </button>
        );
    }

    // Display 'search' button all the time.
    buttons.push(
        <button type='button' className='search-button' onClick={onSubmit}>
            <i className='fa-solid fa-magnifying-glass fa-fw search-button-icon' />
        </button>
    );

    return (
        <form className='search-bar' method="get" autoComplete="off" onSubmit={onSubmit}>
            <div className='search-bar-header'>
                <label className='search-bar-title'>Search</label>
                <input type='text' className='search-bar-input' required placeholder='Type something...' onInput={onInput} value={search}></input>
            </div>

            {
                buttons.map((button, index) => (
                    <React.Fragment key={index}>
                        {button}
                    </React.Fragment>
                ))
            }

        </form>
    );
}
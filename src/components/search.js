
import React, {useEffect, useState} from "react";

// Stylesheet
import "./search.css"
import {useNavigate, useLocation} from "react-router-dom";

export default function Search(props) {
    const location = useLocation();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    // Initialize the query state based on the URL when the component mounts
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get('q') || '';
        setQuery(query);
    }, [location.search]); // Update the state when the URL changes

    const onInput = function (e) {
        e.preventDefault();
        const query = e.target.value;
        setQuery(query);

        if (query) {
            navigate(`?q=${query}`);
        }
        else {
            // Remove the query string from the URL, but maintain the location of the page
            navigate(location.pathname);
        }
    }

    const onClear = function (e) {
        e.preventDefault();
        setQuery('');
        navigate('/');
    }

    // Configure visible buttons
    let button = null;
    if (query) {
        // Display 'clear' button when the search field has input
        button = <i className='fa-solid fa-xmark fa-fw clear-button' onClick={onClear}/>;
    }
    else {
        // Display 'search' button when there is nothing in the input field
        button = <i className='fa-solid fa-magnifying-glass fa-fw search-button' />;
    }

    return (
        <div className="search">
            <input className='search-bar' placeholder='Type something...' onInput={onInput} value={query}></input>
            { button }
        </div>
    );
}
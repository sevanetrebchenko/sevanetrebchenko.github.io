
import React, {useEffect, useState} from "react";

// Stylesheet
import "./search.css"
import {useNavigate, useLocation} from "react-router-dom";

export default function Search(props) {
    const location = useLocation();
    const navigateTo = useNavigate();
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

        const queryParams = new URLSearchParams(location.search);

        if (query) {
            queryParams.set("q", query);
        }
        else {
            // Remove only the query string from the URL
            queryParams.delete("q");
        }

        navigateTo(`${location.pathname}?${queryParams.toString()}`);
    }

    const onClear = function (e) {
        e.preventDefault();
        setQuery('');

        const queryParams = new URLSearchParams(location.search);
        // Remove only the query string from the URL
        queryParams.delete("q");
        navigateTo(`${location.pathname}?${queryParams.toString()}`);
    }

    // Configure visible buttons
    let button;
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
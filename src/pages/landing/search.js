import React, {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";

// Stylesheet
import "./search.css"
import {useGlobalState} from "../../index";

export default function Search() {
    const location = useLocation();
    const navigateTo = useNavigate();
    const [query, setQuery] = useState("");
    const [state, setGlobalState] = useGlobalState();

    // Initialize the query state based on the URL when the component mounts
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get("q") || "";
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

        // Reset the page number on search
        setGlobalState((prev) => ({
            ...prev,
            currentPage: 1
        }));
        queryParams.set("page", "1");
        navigateTo(`${location.pathname}?${queryParams.toString()}`);
    }

    const onClear = function (e) {
        e.preventDefault();
        setQuery("");

        const queryParams = new URLSearchParams(location.search);
        // Remove only the query string from the URL
        queryParams.delete("q");

        // Reset the page number on search
        setGlobalState((prev) => ({
            ...prev,
            currentPage: 1
        }));
        queryParams.set("page", "1");
        navigateTo(`${location.pathname}?${queryParams.toString()}`);
    }

    return (
        <div className="search">
            <input className="query" placeholder="Type something..." onInput={onInput} value={query}></input>
            {
                // Display "clear" button when the search field has input, otherwise display "search" button
                query ? <i className="fa-solid fa-xmark fa-fw clear-button" onClick={onClear}/> : <i className="fa-solid fa-magnifying-glass fa-fw search-button"/>
            }
        </div>
    );
}
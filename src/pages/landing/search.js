import React, {useEffect, useRef} from "react";
import {useSearchParams} from "react-router-dom";

// Stylesheet
import "./search.css"
import {useResponsiveBreakpoint} from "../../utils";

export default function Search(props) {
    const { focused } = props;
    const inputRef = useRef(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get("q") || "";

    const onInput = function (e) {
        const params = new URLSearchParams(searchParams);
        const target = e.target.value;

        if (target) {
            // User entered a query into the search box
            params.set("q", target);
        }
        else {
            params.delete("q");
        }

        // Reset the page number on search
        params.set("page", "1");

        setSearchParams(params, { replace: true });
    }

    const onClear = function (e) {
        const params = new URLSearchParams(searchParams);
        params.delete("q");
        params.set("page", "1");
        setSearchParams(params, { replace: true });
        inputRef.current?.focus();
    }

    useEffect(() => {
        if (focused) {
            inputRef.current?.focus();
        }
    }, []);

    const { label, isMobile, isCompact, isTablet, isDesktop, isWide, atLeast, atMost } = useResponsiveBreakpoint();

    return (
        <div className="search" data-size={label}>
            <input className="query" ref={inputRef} placeholder="Type something..." onInput={onInput} value={query}></input>
            {
                // Display "clear" button when the search field has input, otherwise display "search" button
                query ? <i className="fa-solid fa-xmark fa-fw clear-button" onClick={onClear}/> : <i className="fa-solid fa-magnifying-glass fa-fw search-button"/>
            }
        </div>
    );
}
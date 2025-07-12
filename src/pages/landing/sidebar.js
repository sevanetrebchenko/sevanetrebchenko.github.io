import React, {useEffect} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {useGlobalState} from "../../index";
import {sortByName} from "../../utils";

// Stylesheet
import "./sidebar.css"

function Header() {
    const navigateTo = useNavigate();
    const [state, setState] = useGlobalState();

    const onClick = (e) => {
        e.preventDefault();
        // Reset global tag state
        setState({
            ...state,
            selectedTags: [],
            unselectedTags: sortByName(state.selectedTags.concat(state.unselectedTags))
        });
        navigateTo("/"); // Go to landing
    }

    return (
        <div className="header" onClick={onClick}>
            <span className="title">Seva Netrebchenko</span>
            <span className="description">Software engineer and graphics enthusiast</span>
        </div>
    );
}

function Tags(props) {
    const {tags} = props;

    const [state, setGlobalState] = useGlobalState();
    const navigateTo = useNavigate();
    const location = useLocation();

    const handleSelectTag = (tag) => (e) => {
        e.preventDefault();
        setGlobalState((prev) => ({
            ...prev,
            currentPage: 1,
            // Add tag to selected tags list
            selectedTags: sortByName([...prev.selectedTags, tag]),
            // Remove tag from unselected tags list
            unselectedTags: prev.unselectedTags.filter(t => t !== tag),
        }));
    }

    const handleDeselectTag = (tag) => (e) => {
        e.preventDefault();

        setGlobalState((prev) => ({
            ...prev,
            currentPage: 1,
            // Remove tag from selected tags list
            selectedTags: prev.selectedTags.filter(t => t !== tag),
            // Add tag to unselected tags list
            unselectedTags: sortByName([...prev.unselectedTags, tag])
        }));
    }

    const handleClearSelection = (e) => {
        e.preventDefault();
        // Reset global tag state
        setGlobalState((prev) => ({
            ...prev,
            currentPage: 1,
            selectedTags: [],
            unselectedTags: sortByName(prev.selectedTags.concat(prev.unselectedTags))
        }));
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (state.selectedTags.length > 0) {
            // Set the tags parameter
            queryParams.set("tags", state.selectedTags.join(","));
        }
        else {
            queryParams.delete("tags");
        }

        // Page gets reset to 1 when any tags change
        queryParams.set("page", "1");
        navigateTo(`${location.pathname}?${queryParams.toString()}`);
    }, [state.selectedTags, location.search]);

    return (
        <div className="section">
            <div className="header">
                <span className="title">Tags</span>
                {
                    state.selectedTags.length > 0 && <div className='clear-button' onClick={handleClearSelection}>
                        <span>CLEAR SELECTION</span>
                        <i className="fa-solid fa-xmark fa-fw"></i>
                    </div>
                }
            </div>
            {
                state.selectedTags.length > 0 && <div className="selected-elements">
                    {
                        state.selectedTags.map((tag) => (
                            <div className="element selected" onClick={handleDeselectTag(tag)} key={tag}>
                                <span className="name">{tag}</span>
                                <span className="count">({tags.get(tag)})</span>
                                <i className="fa-solid fa-xmark fa-fw"></i>
                            </div>
                        ))
                    }
                </div>
            }
            <div className="elements">
                {
                    state.unselectedTags.map((tag) => (
                        <div className="element" onClick={handleSelectTag(tag)} key={tag}>
                            <span className="name">{tag}</span>
                            <span className="count">({tags.get(tag)})</span>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}

function Archive(props) {
    const {archive} = props;
    const location = useLocation();
    const navigateTo = useNavigate();
    const [state, setGlobalState] = useGlobalState();

    return (
        <div className="section">
            <div className='header'>
                <span className="title">Archive</span>
            </div>
            <div className="elements archive">
                {
                    Array.from(archive, ([name, count]) => {
                        const parsed = new Date(name);
                        const path = `archive/${parsed.getFullYear()}/${(parsed.getMonth() + 1)}`;
                        const selected = location.pathname === `/${path}`;

                        const selectArchive = (e) => {
                            e.preventDefault();

                            // Keep query params unmodified
                            const queryParams = new URLSearchParams(location.search);

                            // Reset the page number on when archive changes
                            setGlobalState((prev) => ({
                                ...prev,
                                currentPage: 1
                            }));
                            queryParams.set("page", "1");
                            navigateTo(selected ? `/?${queryParams.toString()}` : `/${path}?${queryParams.toString()}`, {replace: true});
                        };

                        return (
                            <div className={"element" + (selected ? " selected" : "")} onClick={selectArchive} key={name}>
                                <span className="name">{name}</span>
                                <span className="count">({count})</span>
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
}

function Footer() {
    return (
        <div className="footer">
            <div className="socials">
                <i className="fab fa-github fa-fw" onClick={(e) => {
                    e.preventDefault();
                    window.location.href = 'https://github.com/sevanetrebchenko/';
                }}/>
                <i className="fab fa-linkedin fa-fw" onClick={(e) => {
                    e.preventDefault();
                    window.location.href = 'https://www.linkedin.com/in/sevanetrebchenko/';
                }}/>
                <i className="fab fa-youtube fa-fw" onClick={(e) => {
                    e.preventDefault();
                    window.location.href = 'https://www.youtube.com/@sevanetrebchenko';
                }}/>
            </div>
            <span className="copyright">Copyright © 2024 Seva Netrebchenko</span>
        </div>
    );
}

export default function Sidebar(props) {
    const {tags, archive} = props;
    const [state, setGlobalState] = useGlobalState();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tagParam = params.get("tags");
        const pageParam = parseInt(params.get("page"), 10);

        // Pull selected tags from URL (default to empty list)
        const selected = tagParam ? tagParam.split(",") : [];

        const allTags = Array.from(tags.keys());
        const unselected = sortByName(
            allTags.filter(t => !selected.includes(t))
        );

        // Pull page number from URL (default to 1)
        const page = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;

        // Merge into global state
        setGlobalState(prev => ({
            ...prev,
            selectedTags: sortByName(selected),
            unselectedTags: unselected,
            currentPage: page,
        }));
    }, [location.search, tags, setGlobalState]);

    return (
        <div className="sidebar">
            <Header></Header>
            <div className="content">
                <Tags tags={tags}></Tags>
                <Archive archive={archive}></Archive>
            </div>
            <Footer></Footer>
        </div>
    );
}
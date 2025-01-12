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

    const [state, setState] = useGlobalState();
    const navigateTo = useNavigate();
    const location = useLocation();

    const selectTag = (tag) => (e) => {
        e.preventDefault();
        setState({
            ...state,
            // Add tag to selected tags list
            selectedTags: sortByName([...state.selectedTags, tag]),
            // Remove tag from unselected tags list
            unselectedTags: state.unselectedTags.filter(t => t !== tag),
        });
    }

    const deselectTag = (tag) => (e) => {
        e.preventDefault();
        setState({
            ...state,
            // Remove tag from selected tags list
            selectedTags: state.selectedTags.filter(t => t !== tag),
            // Add tag to unselected tags list
            unselectedTags: sortByName([...state.unselectedTags, tag])
        });
    }

    const handleClearSelection = (e) => {
        e.preventDefault();
        // Reset global tag state
        setState({
            ...state,
            selectedTags: [],
            unselectedTags: sortByName(state.selectedTags.concat(state.unselectedTags))
        });
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (state.selectedTags.length > 0) {
            // Set the tags parameter
            queryParams.set("tags", state.selectedTags.join(","));
        } else {
            // Clear only the tags parameter
            queryParams.delete("tags");
        }
        navigateTo(`${location.pathname}?${queryParams.toString()}`);
    }, [state.selectedTags]);

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
                            <div className="element selected" onClick={deselectTag(tag)} key={tag}>
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
                        <div className="element" onClick={selectTag(tag)} key={tag}>
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

    return (
        <div className="section">
            <div className='header'>
                <span className="title">Archive</span>
            </div>
            <div className="elements archive">
                {
                    Array.from(archive, ([date, count]) => {
                        const year = date.getFullYear();
                        const path = `archive/${year}/${(date.getMonth() + 1)}`;
                        const selected = location.pathname === `/${path}`;
                        const name = `${date.toLocaleString('default', {month: 'long'})} ${year}`
                        const selectArchive = (e) => {
                            e.preventDefault();

                            // Keep query params unmodified
                            const searchParams = new URLSearchParams(location.search);
                            console.log(path);
                            navigateTo(selected ? `/?${searchParams.toString()}` : `/${path}?${searchParams.toString()}`, {replace: true});
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

    // Load tags into global state once on mount
    const [state, setGlobalState] = useGlobalState();
    useEffect(() => {
        setGlobalState({
            ...state,
            selectedTags: [],
            unselectedTags: sortByName(Array.from(tags.keys()))
        })
    }, []);

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
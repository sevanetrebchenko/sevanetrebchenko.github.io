import React, {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";

// Stylesheet
import "./tags.css"
import ClearSelectionButton from "./clear-selection-button";
import SidebarButton from "./sidebar-button";
import {useGlobalState} from "../index";

export default function Tags(props) {
    const {tags} = props;

    const [unselectedTags, setUnselectedTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [state, setState] = useGlobalState();
    const navigateTo = useNavigate();
    const location = useLocation();

    const selectTag = (tag) => (e) => {
        e.preventDefault();

        // Add tag to selected
        const selected = [...selectedTags, tag].sort((a, b) => a.localeCompare(b));

        // Remove tag from unselected
        const unselected = unselectedTags.filter(t => t !== tag);

        setSelectedTags(selected);
        setUnselectedTags(unselected);

        // Update global state immediately
        setState({
            selectedTags: selected,
            unselectedTags: unselected,
        });
    }

    const deselectTag = (tag) => (e) => {
        e.preventDefault();

        // Remove tag from selected
        const selected = selectedTags.filter(t => t !== tag);

        // Add tag to unselected
        const unselected = [...unselectedTags, tag].sort((a, b) => a.localeCompare(b))

        setSelectedTags(selected);
        setUnselectedTags(unselected);

        // Update global state immediately
        setState({
            selectedTags: selected,
            unselectedTags: unselected,
        });
    }

    const handleClearSelection = (e) => {
        e.preventDefault();

        const selected = [];
        const unselected = Array.from(tags.keys());

        setSelectedTags(selected);
        setUnselectedTags(unselected);

        // Update global state immediately
        setState({
            selectedTags: selected,
            unselectedTags: unselected,
        });
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (selectedTags.length > 0) {
            // Set the tags parameter
            queryParams.set('tags', selectedTags.join(','));
        } else {
            // Clear only the tags parameter
            queryParams.delete('tags');
        }
        navigateTo(`${location.pathname}?${queryParams.toString()}`);
    }, [selectedTags]);

    // Initialize component state from global state when component mounts
    useEffect(() => {
        const unselected = Array.from(tags.keys());
        setSelectedTags([]);
        setUnselectedTags(unselected);
        setState({
            ...state,
            selectedTags: [],
            unselectedTags: Array.from(tags.keys()),
        });
    }, []);

    // Update component state when global state is updated
    useEffect(() => {
        const selected = state.selectedTags;
        if (selected.length > 0) {
            setSelectedTags(selected);
        }
        const unselected = state.unselectedTags;
        if (unselected.length > 0) {
            setUnselectedTags(unselected);
        }
    }, [state]);

    return (
        <div className="tags">
            <div className="sidebar-tag-header">
                <span className="title">Tags</span>
                <ClearSelectionButton shouldRender={() => selectedTags.length > 0} onClick={handleClearSelection}></ClearSelectionButton>
            </div>
            {
                selectedTags.length > 0 && <div className="tags-elements selected">
                    {
                        selectedTags.map((tag) => (
                            <SidebarButton name={tag} count={tags.get(tag)} selected={true} onClick={deselectTag(tag)} key={tag}></SidebarButton>
                        ))
                    }
                </div>
            }
            <div className="sidebar-tags-elements">
                {
                    unselectedTags.map((tag) => (
                        <SidebarButton name={tag} count={tags.get(tag)} selected={false} onClick={selectTag(tag)} key={tag}></SidebarButton>
                    ))
                }
            </div>
        </div>
    );
}
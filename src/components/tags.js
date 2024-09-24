import React, {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";

// Stylesheet
import "./tags.css"
import ClearSelectionButton from "./clear-selection-button";
import SidebarButton from "./sidebar-button";

function Tag(props) {
    const { name, count, selected, onClick } = props;

    let classNames = ["tag"];
    if (selected) {
        classNames.push("selected");
    }

    return (
        <div className={classNames.join(" ")} onClick={onClick}>
            <span className='name'>{name}</span>
            <span className='count'>({count})</span>
            {
                selected && <i className="fa-solid fa-xmark fa-fw"></i>
            }
        </div>
    )
}

export default function Tags(props) {
    const {tags} = props;

    const [unselectedTags, setUnselectedTags] = useState(Array.from(tags.keys()));
    const [selectedTags, setSelectedTags] = useState([]);
    const navigateTo = useNavigate();
    const location = useLocation();

    const selectTag = (tag) => (e) => {
        e.preventDefault();

        // Remove tag from unselected
        setUnselectedTags(unselectedTags.filter(t => t !== tag));

        // Add tag to selected
        setSelectedTags([...selectedTags, tag].sort((a, b) => {
            return a.localeCompare(b);
        }));
    }

    const deselectTag = (tag) => (e) => {
        e.preventDefault();

        // Remove tag from selected
        setSelectedTags(selectedTags.filter(t => t !== tag));

        // Add tag to unselected
        setUnselectedTags([...unselectedTags, tag].sort((a, b) => {
            return a.localeCompare(b);
        }));
    }

    const handleClearSelection = (e) => {
        e.preventDefault();
        setSelectedTags([]);
        setUnselectedTags(Array.from(tags.keys()));
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

    return (
        <div className="tags">
            <div className="tags-header">
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
            <div className="tags-elements">
                {
                    unselectedTags.map((tag) => (
                        <SidebarButton name={tag} count={tags.get(tag)} selected={false} onClick={selectTag(tag)} key={tag}></SidebarButton>
                    ))
                }
            </div>
        </div>
    );
}
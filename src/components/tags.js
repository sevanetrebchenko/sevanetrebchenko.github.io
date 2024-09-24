import React, {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";

// Stylesheet
import "./tags.css"

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

    const handleClick = (tag) => (e) => {
        let selected = selectedTags;
        let unselected = unselectedTags;

        if (selected.includes(tag)) {
            // Remove tag from selected
            setSelectedTags(selected.filter(t => t !== tag));

            // Add tag to unselected
            setUnselectedTags([...unselected, tag].sort((a, b) => {
                return a.localeCompare(b);
            }));
        } else {
            // Remove tag from unselected
            setUnselectedTags(unselected.filter(t => t !== tag));

            // Add tag to selected
            setSelectedTags([...selected, tag].sort((a, b) => {
                return a.localeCompare(b);
            }));
        }
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
                {
                    selectedTags.length > 0 && <div className='clear-button' onClick={handleClearSelection}>
                        <span>CLEAR SELECTION</span>
                        <i className="fa-solid fa-xmark fa-fw"></i>
                    </div>
                }
            </div>
            {
                selectedTags.length > 0 && <div className="tags-elements selected">
                    {
                        Array.from(tags)
                            .filter(([tag, _]) => selectedTags.includes(tag))
                            .map(([tag, count]) => (<Tag name={tag} count={count} selected={true} onClick={handleClick(tag)} key={tag}></Tag>))
                    }
                </div>
            }
            <div className="tags-elements">
                {
                    Array.from(tags)
                        .filter(([tag, _]) => unselectedTags.includes(tag))
                        .map(([tag, count]) => (<Tag name={tag} count={count} selected={false} onClick={handleClick(tag)} key={tag}></Tag>))
                }
            </div>
        </div>
    );
}
import React from 'react';
import {useNavigate} from "react-router-dom";

// Components
import {useGlobalState} from "../index";
import {getPostUrl} from "../helpers";

// Stylesheet
import './post-card.css'

export default function PostCard(props) {
    const {post} = props;
    const [state, setState] = useGlobalState();
    const navigateTo = useNavigate();

    const handleClick = (e) => {
        e.preventDefault();
        navigateTo(getPostUrl(post.title));
    }

    const selectTag = (tag) => {
        if (state.selectedTags.includes(tag)) {
            // Tags should only be added once
            return;
        }
        setState({
            ...state,

            // Add tag to selected
            selectedTags: [...state.selectedTags, tag].sort((a, b) => a.localeCompare(b)),

            // Remove tag from unselected
            unselectedTags: state.unselectedTags.filter(t => t !== tag),
        });
    }

    return (
        <div className="card" onClick={handleClick}>
            <div className="abstract">
                <span className="title">{post.title}</span>
                <span className="description">{post.abstract}</span>
            </div>
            <div className="meta">
                <div className="date">
                    <i className="fa fa-clock-o fa-fw"></i>
                    <span>{`${post.date.toLocaleString('default', {month: 'long'})} ${post.date.getDate()}, ${post.date.getFullYear()}`}</span>
                </div>
                <div className="categories">
                    {
                        post.tags.map((tag, id) => {
                            let className = null;
                            if (state.selectedTags.includes(tag)) {
                                className = "selected"
                            }

                            return <span key={id} className={className} onClick={(e) => {
                                e.stopPropagation();
                                selectTag(tag);
                            }}>#{tag}</span>
                        })
                    }
                </div>
            </div>
        </div>
    );
}
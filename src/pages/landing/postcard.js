import React from "react";
import {useNavigate} from "react-router-dom";
import {useGlobalState} from "../../index";
import {getPostUrl, sortByName} from "../../utils";

// Stylesheet
import "./postcard.css"

export default function Postcard(props) {
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
            selectedTags: sortByName([...state.selectedTags, tag]),
            // Remove tag from unselected
            unselectedTags: state.unselectedTags.filter(t => t !== tag),
        });
    }

    return (
        <div className="postcard" onClick={handleClick}>
            <div className="abstract">
                <span className="title">{post.title}</span>
                <span className="description">{post.abstract}</span>
            </div>
            <div className="metadata">
                <div className="date">
                    <i className="fa fa-clock-o fa-fw"></i>
                    <span>{`${post.date.toLocaleString('default', {month: 'long'})} ${post.date.getDate()}, ${post.date.getFullYear()}`}</span>
                </div>
                <div className="tags">
                    {
                        post.tags.map((tag, id) => {
                            let classNames = ["tag"];
                            if (state.selectedTags.includes(tag)) {
                                classNames.push("selected");
                            }

                            return <span key={id} className={classNames.join(" ")} onClick={(e) => {
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
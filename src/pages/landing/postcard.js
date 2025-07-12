import React from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {getPostUrl, sortByName} from "../../utils";

// Stylesheet
import "./postcard.css"

export default function Postcard(props) {
    const {post} = props;
    const navigateTo = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Derive selected tags from URL
    const selectedTags = (searchParams.get("tags") || "")
        .split(",")
        .filter(Boolean);

    const handleClick = (e) => {
        e.preventDefault();
        navigateTo(getPostUrl(post.title));
    }

    const handleTagClick = (tag, e) => {
        e.stopPropagation();
        const params = new URLSearchParams(searchParams.toString());

        const current = new Set(selectedTags);
        current.add(tag);

        // Set tags back in URL
        params.set("tags", sortByName(Array.from(current)).join(","));

        // Page gets reset on tag select / deselect
        params.set("page", "1");
        setSearchParams(params, { replace: false });
    };

    return (
        <div className="postcard" onClick={handleClick}>
            <div className="abstract">
                <span className="title">{post.title}</span>
                <span className="description">{post.abstract}</span>
            </div>
            <div className="metadata">
                <div className="date">
                    <i className="fa fa-clock-o fa-fw"></i>
                    <span>{`${post.date.toLocaleString("default", {month: "long"})} ${post.date.getDate()}, ${post.date.getFullYear()}`}</span>
                </div>
                <div className="tags">
                    {
                        post.tags.map((tag, id) => {
                            let classNames = ["tag"];
                            if (selectedTags.includes(tag)) {
                                classNames.push("selected");
                            }
                            return <span key={id} className={classNames.join(" ")} onClick={(e) => handleTagClick(tag, e)}>#{tag}</span>
                        })
                    }
                </div>
            </div>
        </div>
    );
}
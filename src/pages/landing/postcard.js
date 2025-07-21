import React, {Fragment, useEffect, useRef, useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {getPostUrl, getResponsiveClassName, mobileDisplayWidthThreshold, sortByName, tabletDisplayWidthThreshold} from "../../utils";

// Stylesheet
import "./postcard.css"
import {useMediaQuery} from "react-responsive";

export default function Postcard(props) {
    const {post} = props;
    const navigateTo = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tagsVisible, setTagsVisible] = useState(false);

    // Derive selected tags from URL
    const selectedTags = (searchParams.get("tags") || "")
        .split(",")
        .filter(Boolean);

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

    const toggleTags = (e) => {
        e.stopPropagation();
        setTagsVisible(!tagsVisible);
    }

    const tagLabelRef = useRef(null);
    useEffect(() => {
        if (!tagsVisible) return;

        function handleClickOutside(e) {
            if (!tagLabelRef.current?.contains(e.target)) {
                setTagsVisible(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [tagsVisible]);

    // Post abstracts may contain inline code that should be parsed out
    const parts = post.abstract.split(/(`[^`]+`)/g);

    const isMobile = useMediaQuery({ maxWidth: mobileDisplayWidthThreshold });
    const isTablet = useMediaQuery({ minWidth: mobileDisplayWidthThreshold + 1, maxWidth: tabletDisplayWidthThreshold });

    return (
        <div className={getResponsiveClassName("postcard", isMobile, isTablet)} onClick={() => navigateTo(getPostUrl(post.title))}>
            <div className="abstract">
                <span className="title">{post.title}</span>
                <span className="description">
                    {
                        parts.map((part, idx) => {
                            if (part.startsWith('`') && part.endsWith('`')) {
                                const code = part.slice(1, -1);
                                return (
                                    <span key={idx} className="inline">
                                      {code}
                                    </span>
                                );
                            } else {
                                return <span key={idx}>{part}</span>;
                            }
                        })
                    }
                </span>
            </div>
            <div className="metadata">
                <div className="date">
                    <i className="fa fa-clock-o fa-fw"></i>
                    <span>
                        {
                            isMobile || isTablet ?
                                `${post.date.getMonth() + 1}/${post.date.getDate()}/${post.date.getFullYear()}`
                                : `${post.date.toLocaleString("default", {month: "long"})} ${post.date.getDate()}, ${post.date.getFullYear()}`
                        }
                    </span>
                </div>
                {
                    (isMobile || isTablet) && <span className="tag-label" ref={tagLabelRef} onClick={(e) => toggleTags(e)}>
                        {
                            tagsVisible ? " Hide tags " : ` Show ${post.tags.length} tags `
                        }
                    </span>
                }
                {
                    (((isMobile || isTablet) && tagsVisible) || !(isMobile || isTablet)) && <div className="tags">
                        {
                            post.tags.map((tag, id) => {
                                let classNames = ["tag"];
                                if (selectedTags.includes(tag)) {
                                    classNames.push("selected");
                                }
                                return <span key={id} className={classNames.join(" ")} onClick={() => (isMobile || isTablet ? null : handleTagClick(tag, e))}>#{tag}</span>
                            })
                        }
                    </div>
                }
            </div>
        </div>
    );
}
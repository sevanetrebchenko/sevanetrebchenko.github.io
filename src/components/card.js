import React from 'react';

// Components
import {useGlobalState} from "../index";

// Stylesheet
import './card.css'

export default function Card(props) {
    const { title, abstract, categories, date } = props;
    const [state, setState] = useGlobalState();

    const handleClick = (e) => {
        e.preventDefault();
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
                <span className="title">{title}</span>
                <span className="description">{abstract}</span>
            </div>
            <div className="meta">
                <div className="date">
                    <i className="fa fa-clock-o fa-fw"></i>
                    <span>{`${date.toLocaleString('default', {month: 'long'})} ${date.getDate()}, ${date.getFullYear()}`}</span>
                </div>
                <div className="categories">
                    {
                        categories.map((category, id) => {
                            let className = null;
                            if (state.selectedTags.includes(category)) {
                                className = "selected"
                            }

                            return <span key={id} className={className} onClick={() => selectTag(category)}>#{category}</span>
                        })
                    }
                </div>
            </div>
        </div>
    )
}
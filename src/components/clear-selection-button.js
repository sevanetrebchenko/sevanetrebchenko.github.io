
import React from "react";

// Stylesheet
import "./clear-selection-button.css"

export default function ClearSelectionButton(props) {
    const { shouldRender, onClick } = props;

    if (!shouldRender()) {
        return null;
    }

    return (
        <div className='clear-button' onClick={onClick}>
            <span>CLEAR SELECTION</span>
            <i className="fa-solid fa-xmark fa-fw"></i>
        </div>
    )
}
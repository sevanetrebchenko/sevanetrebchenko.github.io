
import React from 'react';

import "./sidebar-button.css"

export default function SidebarButton(props) {
    const { name, count, className, selected, onClick } = props;

    let classNames = ["sidebar-button"];
    if (className) {
        classNames.push(className);
    }
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
    );
}
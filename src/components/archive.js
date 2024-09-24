import React from "react";
import {Link, useLocation} from "react-router-dom";

// Stylesheet
import "./archive.css"

export default function Archive(props) {
    const {archive} = props;
    const location = useLocation();

    return (
        <div className="archive">
            <span className='archive-title'>Archive</span>
            <div className="archive-elements">
                {
                    Array.from(archive, ([date, count]) => {
                        const year = date.getFullYear();
                        const path = `archive/${year}/${(date.getMonth() + 1)}`;

                        let classNames = ["archive-element"]
                        if (location.pathname === `/${path}`) {
                            classNames.push("selected");
                        }

                        return (
                            <Link to={path} key={path} className={classNames.join(" ")}>
                                <span className='name'>{date.toLocaleString('default', {month: 'long'}) + ' ' + year}</span>
                                <span className='count'>({count})</span>
                            </Link>
                        );
                    })
                }
            </div>
        </div>
    );
}
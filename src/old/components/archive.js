import React from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";

// Stylesheet
import "./archive.css"
import SidebarButton from "./sidebar-button";

export default function Archive(props) {
    const {archive} = props;
    const location = useLocation();
    const navigateTo = useNavigate();

    return (
        <div className="archive">
            <div className='archive-header'>
                <span className="title">Archive</span>
            </div>
            <div className="archive-elements">
                {
                    Array.from(archive, ([date, count]) => {
                        const year = date.getFullYear();
                        const path = `archive/${year}/${(date.getMonth() + 1)}`;
                        const selected = location.pathname === `/${path}`;
                        const selectArchive = (e) => {
                            e.preventDefault();

                            // Keep query params unmodified
                            const queryParams = new URLSearchParams(location.search);
                            navigateTo(selected ? `/?${queryParams.toString()}` : `${path}?${queryParams.toString()}`);
                        };

                        return (
                            <div className={"tag" + (selected ? " selected" : "")} onClick={selectArchive}>
                                <span
                                    className="name">{`${date.toLocaleString('default', {month: 'long'})} ${year}`}</span>
                                <span className="count">({count})</span>
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
}
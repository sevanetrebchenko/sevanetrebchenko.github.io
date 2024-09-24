import React, {useEffect, useState} from "react";
import {Link, useLocation, useNavigate} from 'react-router-dom'

// Components
import Archive from "./archive";
import Tags from "./tags";

// Stylesheet
import "./sidebar.css"

function Masthead() {
    return (
        <Link to={'/'} className="sidebar-masthead">
            <span className="title">
                Seva Netrebchenko
            </span>
            <span className="description">
                Software engineer and graphics enthusiast
            </span>
        </Link>
    )
}

function Social() {
    return (
        <div className="social">
            <i className="fab fa-github fa-fw" onClick={(e) => {
                e.preventDefault();
                window.location.href = 'https://github.com/sevanetrebchenko/';
            }}/>
            <i className="fab fa-linkedin fa-fw" onClick={(e) => {
                e.preventDefault();
                window.location.href = 'https://www.linkedin.com/in/sevanetrebchenko/';
            }}/>
            <i className="fab fa-youtube fa-fw" onClick={(e) => {
                e.preventDefault();
                window.location.href = 'https://www.youtube.com/@sevanetrebchenko';
            }}/>
        </div>
    );
}

function Footer() {
    return (
        <div className="sidebar-footer">
            <Social></Social>
            <span className="copyright">Copyright © 2024 Seva Netrebchenko</span>
        </div>
    );
}

export default function Sidebar(props) {
    const {tags, archive} = props;

    return (
        <div className="sidebar">
            <div className="sidebar-content">
                <Masthead></Masthead>
                <Tags tags={tags}></Tags>
                <Archive archive={archive}></Archive>
            </div>
            <Footer></Footer>
        </div>
    );
}

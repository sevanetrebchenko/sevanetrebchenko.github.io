import React, {useEffect, useState} from "react";
import {Link, useLocation, useNavigate} from 'react-router-dom'

// Components
import Archive from "./archive";
import Tags from "./tags";

// Stylesheet
import "./sidebar.css"

function Masthead() {

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



export default function Sidebar(props) {
    const {tags, archive} = props;

    return (
        <div className="sidebar">
            <div className="content">
                <Masthead></Masthead>
                <Tags tags={tags}></Tags>
                <Archive archive={archive}></Archive>
            </div>
            <Footer></Footer>
        </div>
    );
}

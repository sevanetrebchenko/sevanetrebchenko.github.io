
import React from "react";

// Stylesheets
import "./sidebar.css"
import {redirect} from "react-router-dom";

function Masthead() {
    return (
        <div className="sidebar-masthead">
            <p className="title">
                Seva Netrebchenko
            </p>
            <p className="description">
                Software engineer and graphics enthusiast
            </p>
        </div>
    )
}

function Link(props) {
    const { icon, url, children } = props;

    let onClick = (e) => {
        e.preventDefault();
        window.location.href = url;
    }

    return (
        <div className="link" onClick={onClick}>
            <i className={icon}></i>
            <p>{ children }</p>
        </div>
    )
}

function Social() {
    return (
        <div className="sidebar-social">
            <Link icon="fab fa-github" url="https://github.com/sevanetrebchenko/">GitHub</Link>
            <Link icon="fab fa-linkedin" url="https://www.linkedin.com/in/sevanetrebchenko/">LinkedIn</Link>
            <Link icon="fab fa-youtube" url="https://www.youtube.com/@sevanetrebchenko">YouTube</Link>
        </div>
    );
}

function Categories() {

}

function Footer() {

}

export default function Sidebar() {
    return (
        <div className="sidebar">
            <div className="sidebar-container">
                <Masthead></Masthead>
                <Social></Social>
            </div>
        </div>
    );
}
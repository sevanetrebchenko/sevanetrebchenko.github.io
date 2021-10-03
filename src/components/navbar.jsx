import React from 'react'
import { useHistory } from 'react-router-dom';

// Styles.
import "../styles/navbar.css"
import "../styles/mouse-events.css"
import "../styles/panel.css"

        
export default function Navbar(props = {}) {
    let history = useHistory();

    return (
        <div className="panel-item-container">
            <p className="navbar-element"
                onClick={e => {
                    e.preventDefault();
                    history.push('/projects');
                }}
            >Projects</p>
            <p className="navbar-element"
                onClick={e => {
                    e.preventDefault();
                    history.push('/blog');
                }}
            >Blog</p>
            <p className="navbar-element"
                onClick={e => {
                    e.preventDefault();
                    history.push('/resume');
                }}
            >Resume</p>
            <p className="navbar-element"
                onClick={e => {
                    e.preventDefault();
                    window.location.href = "https://github.com/sevanetrebchenko";
                }}
            >GitHub</p>
            <p className="navbar-element"
                onClick={e => {
                    e.preventDefault();
                    window.location.href = "https://www.linkedin.com/in/sevanetrebchenko/";
                }}
            >LinkedIn</p>
        </div>
    );
}
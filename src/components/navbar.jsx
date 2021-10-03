import React from 'react'
import { useHistory } from 'react-router-dom';

import "./navbar.css"
        
export default function Navbar(props = {}) {
    let history = useHistory();

    return (
        <div className="navbar">
            <p className="navbar-element"
                onClick={e => {
                    e.preventDefault();
                    history.push('/projects');
                }}
            >Porfolio</p>
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
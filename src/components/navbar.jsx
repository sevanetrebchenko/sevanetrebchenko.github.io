import React from 'react'
import { useHistory } from 'react-router-dom';

// Styles.
import "../styles/navbar.css"

export default function Navbar(props = {}) {
    let history = useHistory();

    return (
        <div className='navbar'>
            <button
                onClick={e => {
                    e.preventDefault();
                    history.push('/projects');
                }}
            >Projects</button>
            <button
                onClick={e => {
                    e.preventDefault();
                    history.push('/blog');
                }}
            >Blog</button>
            <button
                onClick={e => {
                    e.preventDefault();
                    history.push('/resume');
                }}
            >Resume</button>
            <button
                onClick={e => {
                    e.preventDefault();
                    window.location.href = "https://github.com/sevanetrebchenko";
                }}
            >GitHub</button>
            <button
                onClick={e => {
                    e.preventDefault();
                    window.location.href = "https://www.linkedin.com/in/sevanetrebchenko/";
                }}
            >LinkedIn</button>
        </div>
    );
}
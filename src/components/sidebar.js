
import React from "react";
import { Link } from 'react-router-dom'

// Stylesheets
import "./sidebar.css"

function Masthead() {
    return (
        <div className="sidebar-masthead">
            <span className="title">
                Seva Netrebchenko
            </span>
            <span className="description">
                Software engineer and graphics enthusiast
            </span>
        </div>
    )
}

function Social() {
    return (
        <div className="social">
            <i className="fab fa-github" onClick={(e) => {
                e.preventDefault();
                window.location.href = 'https://github.com/sevanetrebchenko/';
            }}/>
            <i className="fab fa-linkedin" onClick={(e) => {
                e.preventDefault();
                window.location.href = 'https://www.linkedin.com/in/sevanetrebchenko/';
            }}/>
            <i className="fab fa-youtube" onClick={(e) => {
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

function Categories(props) {
    const {categories} = props;

    return (
        <div className="sidebar-categories">
            <span>Categories</span>
            <div className="categories">
                {
                    Array.from(categories, ([name, count]) => {
                        const location = 'category' + '/' + name.replace(' ', '-').toLowerCase();
                        return (
                            <Link to={location} className='category' key={name}>
                                <span className='name'>{name}</span>
                                <span className='count'>{count}</span>
                            </Link>
                        );
                    })
                }
            </div>
        </div>
    )
}

export default function Sidebar(props) {
    const { categories } = props;
    if (!categories) {
        return null;
    }

    return (
        <div className="sidebar">
            <div className="sidebar-content">
                <Masthead></Masthead>
                <Categories categories={categories}></Categories>
            </div>
            <Footer></Footer>
        </div>
    );
}

import React from "react";
import { Link } from 'react-router-dom'

// Stylesheets
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
                        const location = 'tag' + '/' + name.replace(' ', '-').toLowerCase();
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

function Archive(props) {
    const { archive } = props;
    return (
        <div className="sidebar-archive">
            <span>Archive</span>
            <div className="archive">
                {
                    Array.from(archive, ([date, count]) => {
                        const year = date.getFullYear();
                        const month = date.toLocaleString('default', { month: 'long' });
                        const location = 'archive' + '/' + year + '/' + (date.getMonth() + 1); // Date month is zero-based
                        return (
                            <Link to={location} className='category' key={location}>
                                <span className='name'>{month}</span>
                                <span className='count'> ({count})</span>
                            </Link>
                        );
                    })
                }
            </div>
        </div>
    );
}

export default function Sidebar(props) {
    const { categories, archive } = props;

    return (
        <div className="sidebar">
            <div className="sidebar-content">
                <Masthead></Masthead>
                <Categories categories={categories}></Categories>
                <Archive archive={archive}></Archive>
            </div>
            <Footer></Footer>
        </div>
    );
}

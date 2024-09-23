import React, {useEffect, useState} from "react";
import {Link, useLocation, useNavigate} from 'react-router-dom'

// Stylesheets
import "./sidebar.css"
import {sort} from "css-loader/dist/utils";

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

function Categories(props) {
    const {categories} = props;

    const [unselectedTags, setUnselectedTags] = useState(Array.from(categories.keys()));
    const [selectedTags, setSelectedTags] = useState([]);
    const navigateTo = useNavigate();
    const location = useLocation();

    const handleClick = (tag) => (e) => {
        e.preventDefault();

        let selected = selectedTags;
        let unselected = unselectedTags;

        if (selected.includes(tag)) {
            // Remove tag from selected
            setSelectedTags(selected.filter(t => t !== tag));

            // Add tag to unselected
            setUnselectedTags([...unselected, tag].sort((a, b) => {
                return a.localeCompare(b);
            }));
        } else {
            // Remove tag from unselected
            setUnselectedTags(unselected.filter(t => t !== tag));

            // Add tag to selected
            setSelectedTags([...selected, tag].sort((a, b) => {
                return a.localeCompare(b);
            }));
        }
    }

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (selectedTags.length > 0) {
            // Set the tags parameter
            queryParams.set('tags', selectedTags.join(','));
        } else {
            // Clear only the tags parameter
            queryParams.delete('tags');
        }
        navigateTo(`${location.pathname}?${queryParams.toString()}`);
    }, [selectedTags]);

    return (
        <div className="sidebar-categories">
            <span>Tags</span>
            <div className="selected-categories">
                {
                    Array.from(categories)
                        .filter(([tag, _]) => selectedTags.includes(tag))
                        .map(([tag, count]) => (
                            <div className={"category selected"} key={tag} onClick={handleClick(tag)}>
                                <span className='name'>{tag}</span>
                                <span className='count'>{count}</span>
                                <i className="fa-solid fa-xmark fa-fw"></i>
                            </div>
                        ))
                }
            </div>
            <div className="categories">
                {
                    Array.from(categories)
                        .filter(([tag, _]) => unselectedTags.includes(tag))
                        .map(([tag, count]) => (
                            <div className={"category"} key={tag} onClick={handleClick(tag)}>
                                <span className='name'>{tag}</span>
                                <span className='count'>{count}</span>
                            </div>
                        ))
                }
            </div>
        </div>
    )
}

function Archive(props) {
    const {archive} = props;
    return (
        <div className="sidebar-archive">
            <span>Archive</span>
            <div className="archive">
                {
                    Array.from(archive, ([date, count]) => {
                        const year = date.getFullYear();
                        const month = date.toLocaleString('default', {month: 'long'});
                        const location = 'archive' + '/' + year + '/' + (date.getMonth() + 1); // Date month is zero-based
                        return (
                            <Link to={location} key={location}>
                                <span className='name'>{month + ' ' + year}</span>
                                <span className='count'>{count}</span>
                            </Link>
                        );
                    })
                }
            </div>
        </div>
    );
}

export default function Sidebar(props) {
    const {categories, archive} = props;

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

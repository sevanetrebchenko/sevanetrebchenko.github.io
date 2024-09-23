
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
    const navigateTo = useNavigate();

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
    const { categories } = props;
    const [selectedTags, setSelectedTags] = useState([]);
    const navigateTo = useNavigate();
    const location = useLocation();

    const handleClick = (tag) => (e) => {
        e.preventDefault();
        if (selectedTags.includes(tag)) {
            // Deselect tag (remove it from the selected tags list)
            setSelectedTags(selectedTags.filter(selected => selected !== tag));
        }
        else {
            // Sort selected tags alphabetically in query params
            let tags = [...selectedTags, tag].sort((a, b) => {
                return a.localeCompare(b);
            });
            setSelectedTags(tags);
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
            <div className="categories">
                {
                    Array.from(categories, ([tag, count]) => {
                        return (
                            <div className={"category"} key={tag} onClick={handleClick(tag)}>
                                <span className='name'>{tag}</span>
                                <span className='count'>{count}</span>
                            </div>
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

import React, {forwardRef, Fragment, useEffect, useRef, useState} from "react";
import {useLocation, useNavigate, useSearchParams} from "react-router-dom";
import {
    getResponsiveClassName,
    sortByName,
    mobileDisplayWidthThreshold,
    tabletDisplayWidthThreshold
} from "../../utils";

// Stylesheet
import "./sidebar.css"
import MenuIcon from "../icons";
import {useMediaQuery} from "react-responsive";
import Search from "./search";

function Tags(props) {
    const {tags} = props;
    const [searchParams, setSearchParams] = useSearchParams();

    // Determine selected / unselected tags from the page URL
    const selected = (searchParams.get("tags") || "")
        .split(",")
        .filter(Boolean)
        .sort();
    const unselected = sortByName(
        Array.from(tags.keys()).filter((t) => !selected.includes(t))
    );

    const updateTags = (next) => {
        const params = new URLSearchParams(searchParams.toString());
        if (next.length) {
            params.set("tags", next.join(","));
        } else {
            params.delete("tags");
        }

        // Reset page number on tag change
        params.set("page", "1");
        setSearchParams(params, {replace: true});
    }

    return (
        <div className="section">
            <div className="header">
                <span className="title">Tags</span>
                {
                    selected.length > 0 && <div className='clear-button' onClick={() => updateTags([])}>
                        <span>CLEAR SELECTION</span>
                        <i className="fa-solid fa-xmark fa-fw"></i>
                    </div>
                }
            </div>
            {
                selected.length > 0 && <div className="selected-elements">
                    {
                        selected.map((tag) => (
                            <div className="element selected" onClick={() => updateTags(selected.filter((t) => t !== tag))} key={tag}>
                                <span className="name">{tag}</span>
                                <span className="count">({tags.get(tag)})</span>
                                <i className="fa-solid fa-xmark fa-fw"></i>
                            </div>
                        ))
                    }
                </div>
            }
            <div className="elements">
                {
                    unselected.map((tag) => (
                        <div className="element" onClick={() => updateTags([...selected, tag])} key={tag}>
                            <span className="name">{tag}</span>
                            <span className="count">({tags.get(tag)})</span>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}

function Archive(props) {
    const {archive} = props;
    const location = useLocation();
    const navigateTo = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    return (
        <div className="section">
            <div className='header'>
                <span className="title">Archive</span>
            </div>
            <div className="elements archive">
                {
                    Array.from(archive, ([name, count]) => {
                        const parsed = new Date(name);
                        const path = `archive/${parsed.getFullYear()}/${(parsed.getMonth() + 1)}`;
                        const selected = location.pathname === `/${path}`;

                        const selectArchive = (e) => {
                            e.preventDefault();

                            // Reset the page number on when archive changes
                            const params = new URLSearchParams(searchParams.toString());
                            params.set("page", "1");

                            const target = selected ? `/?${params}` : `/${path}?${params}`;
                            navigateTo(target, { replace: true });
                        };

                        return (
                            <div className={"element" + (selected ? " selected" : "")} onClick={selectArchive} key={name}>
                                <span className="name">{name}</span>
                                <span className="count">({count})</span>
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
}

function Footer() {
    return (
        <div className="footer">
            <div className="socials">
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
            <span className="copyright">© {new Date().getFullYear()} Seva Netrebchenko</span>
        </div>
    );
}

const MobileSidebar = forwardRef((props, ref) => {
    const { tags, archive } = props;

    const [searchParams, setSearchParams] = useSearchParams();
    const [searchActive, setSearchActive] = useState(false);
    const [dropdownActive, setDropdownActive] = useState(false);
    const searchRef = useRef(null);
    const hamburgerRef = useRef(null);

    // Close the dropdown if the user clicks outside of it
    useEffect(() => {
        function onClick(e) {
            if (!ref.current?.contains(e.target)) {
                setDropdownActive(false);
            }
        }

        setSearchActive(searchParams.has("q"));

        document.addEventListener("mousedown", onClick);
        return () => {
            document.removeEventListener("mousedown", onClick);
        };
    }, []);

    useEffect(() => {
        if (!searchActive) return;

        function handleOutsideClick(e) {
            searchRef.current && !searchRef.current.contains(e.target);
            //

            if (!searchRef.current?.contains(e.target) && !ref.current?.contains(e.target)) {
                if (!searchParams.get("q")) {
                    setSearchActive(false);
                }
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [searchActive, searchParams]);

    return (
        <Fragment>
            <div className="header">
                <div className="dropdown-button" ref={hamburgerRef} onClick={() => {
                    setDropdownActive(!dropdownActive);
                    if (!searchParams.get("q")) {
                        setSearchActive(false);
                    }
                }}>
                    <i className={"fa-fw fa-solid " + (dropdownActive ? "fa-xmark" : "fa-bars")}></i>
                </div>

                {
                    !searchActive && <div className="masthead">
                        <span className="title">Seva's Programming Adventures</span>
                    </div>
                }

                {
                    searchActive ? <div className="mobile-search" ref={searchRef}>
                        <Search focused={true}></Search>
                    </div> : <i className="fa-fw fa-solid fa-search" onClick={() => {
                        setSearchActive(true);
                        setDropdownActive(true);
                    }}></i>
                }
            </div>
            {
                dropdownActive && <div className="content">
                    <span className="description">A blog about graphics programming, low-level systems, and building things from scratch.</span>
                    <Tags tags={tags}></Tags>
                    <Archive archive={archive}></Archive>
                </div>
            }
        </Fragment>
    );
})

function DesktopSidebar(props) {
    const {tags, archive} = props;
    const navigateTo = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const onClick = (e) => {
        e.preventDefault();

        searchParams.delete("tags");
        searchParams.delete("q");
        searchParams.set("page", "1");
        setSearchParams(searchParams, { replace: true });

        navigateTo(`/?${searchParams}`); // Go to landing
    }

    return (
        <div className="content">
            <div className="header" onClick={onClick}>
                <div className="masthead">
                    <span className="title">Seva's Programming Adventures</span>
                    <span className="description">A blog about graphics programming, low-level systems, and building things from scratch.</span>
                </div>
            </div>
            <Tags tags={tags}></Tags>
            <Archive archive={archive}></Archive>
            <Footer></Footer>
        </div>
    );
}

export default function Sidebar(props) {
    const {tags, archive} = props;

    const sidebarRef = useRef(null);

    const isMobile = useMediaQuery({maxWidth: mobileDisplayWidthThreshold});
    const isTablet = useMediaQuery({minWidth: mobileDisplayWidthThreshold + 1, maxWidth: tabletDisplayWidthThreshold});

    return (
        <div className={getResponsiveClassName("sidebar", isMobile, isTablet)} ref={sidebarRef}>
            {
                isMobile || isTablet ? <MobileSidebar tags={tags} archive={archive} ref={sidebarRef}/> : <DesktopSidebar tags={tags} archive={archive} />
            }
        </div>
    );
}
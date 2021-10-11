import React, { useEffect, useRef, useState } from 'react'
import { useHistory } from 'react-router';

import "./header.css"

export default function Header(props = {}) {
  const history = useHistory();
  const [expanded, setExpanded] = useState(false);

  const dropDownButton = useRef();
  const navbar = useRef();

  useEffect(() => {
    // add when mounted
    document.addEventListener("mousedown", HandleClick);

    // return function to be called when unmounted
    return () => {
      document.removeEventListener("mousedown", HandleClick);
    };
  }, []);

  const HandleClick = (e) => {
    // If navbar contains clickaway target, redirect instead.
    if (navbar.current.contains(e.target)) {
      return;
    }

    if (!dropDownButton.current.contains(e.target)) {
      setExpanded(false);
    }
  };

  return (
    <React.Fragment>
      <div className="header">
        <p className="name"
            onClick={e => {
          e.preventDefault();
          history.push('/projects');
        }}>
          Seva Netrebchenko</p>
        <button className="button">
          <i className={(expanded ? "fas fa-times icon expanded" : "fas fa-bars icon collapsed")}
            ref={dropDownButton}
            onClick={() => setExpanded(expanded ? false : true)} />
        </button>

        <div className="header navbar-desktop">
          <NavbarElements />
        </div>
      </div>
      <div className="header navbar-mobile" ref={navbar}>
        {expanded ? <NavbarElements /> : <></>}
      </div>
      {expanded ? <div className="separator" /> : <></>}

    </React.Fragment>
  );
}

function NavbarElements(props = {}) {
  const history = useHistory();

  return (
    <React.Fragment>
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
          window.location.href = "https://github.com/sevanetrebchenko/";
        }}
      >GitHub</p>
      <p className="navbar-element"
        onClick={e => {
          e.preventDefault();
          window.location.href = "https://www.linkedin.com/in/sevanetrebchenko/";
        }}
      >LinkedIn</p>
    </React.Fragment>
  )
}
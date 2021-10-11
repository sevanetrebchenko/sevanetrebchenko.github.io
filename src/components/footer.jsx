import React, { useRef, useEffect } from "react";

import "./footer.css";

export default function Footer(props = {}) {
  const clickable = useRef();
  useEffect(() => {
    // add when mounted
    document.addEventListener("mousedown", handleClick);

    // return function to be called when unmounted
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const handleClick = (e) => {
    if (!clickable.current.contains(e.target)) {
    }
  };

  return (
    <React.Fragment>
      <div className="footer">

        <button className="footer-button">
          <i className="fas fa-envelope footer-icon" ref={clickable}/>
        </button>

        <button className="footer-button">
          <i className="fab fa-github footer-brand-icon" ref={clickable}/>
        </button>

        <button className="footer-button">
          <i className="fab fa-linkedin footer-brand-icon" ref={clickable}/>
        </button>

        <button className="footer-button">
          <i className="fab fa-twitter footer-brand-icon" ref={clickable}/>
        </button>

      </div>
      <p className="copyright">
        Copyright © 2021 Seva Netrebchenko. All rights reserved.
      </p>
    </React.Fragment>
  );
}
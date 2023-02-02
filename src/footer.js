import React from "react";
import "./footer.css";

export default function Footer(props = {}) {
  return (
    <React.Fragment>
      <div className="footer">

        <button className="footer-button">
          <i className="fas fa-envelope footer-icon" 
             onClick = {(e) => { 
              e.preventDefault();
              window.location = 'mailto:seva.netrebchenko@gmail.com';
            }}/>
        </button>

        <button className="footer-button">
          <i className="fab fa-github footer-brand-icon"
              onClick = {(e) => { 
              e.preventDefault();
              window.location.href = 'https://github.com/sevanetrebchenko/';
            }}/>
        </button>

        <button className="footer-button">
          <i className="fab fa-linkedin footer-brand-icon"
              onClick = {(e) => { 
                e.preventDefault();
                window.location.href = 'https://www.linkedin.com/in/sevanetrebchenko/';
            }}/>
        </button>

        <button className="footer-button">
          <i className="fab fa-twitter footer-brand-icon"
              onClick = {(e) => { 
              e.preventDefault();
              window.location.href = 'https://twitter.com/netrebchenko/';
          }}/>
        </button>

      </div>
      <p className="copyright">
        Copyright © 2021 Seva Netrebchenko. All rights reserved.
      </p>
    </React.Fragment>
  );
}
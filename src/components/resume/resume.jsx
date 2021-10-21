import React from "react";

import "./resume.css"

export default function Resume(props = {}) {

  const RouteToResume = (e) => {
    e.preventDefault();
    window.location.href = "https://drive.google.com/file/d/1kquGDhURf46yFYBPrqXLWGi622AQMdEj/view?usp=sharing";
  };

  return (
      <div className="resume">
        <img src="/resume/SevaNetrebchenko_Resume.svg" alt="2021 Resume"/>
        <button className="download" onClick={RouteToResume}>
          Download
        </button>
      </div>
  );
}
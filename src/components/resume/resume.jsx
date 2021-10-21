import React from "react";

import "./resume.css"

export default function Resume(props = {}) {
  return (
      <div className="resume">
        <img src="/resume/SevaNetrebchenko_Resume.svg" alt="2021 Resume"/>
        <button className="download">
          Download
        </button>
      </div>
  );
}
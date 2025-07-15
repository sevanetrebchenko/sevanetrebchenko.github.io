import React from 'react';

export default function MenuIcon({
                                     width = 24,
                                     height = 24,
                                     stroke = "black",
                                     strokeWidth = 1.75,
                                     ...props
                                 }) {
    return (
        <svg fill="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#000000" strokeWidth="0.00024000000000000003">
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <path d="M2,4A1,1,0,0,1,3,3H21a1,1,0,0,1,0,2H3A1,1,0,0,1,2,4Zm1,9H21a1,1,0,0,0,0-2H3a1,1,0,0,0,0,2Zm0,8H21a1,1,0,0,0,0-2H3a1,1,0,0,0,0,2Z"></path>
            </g>
        </svg>
    );
}
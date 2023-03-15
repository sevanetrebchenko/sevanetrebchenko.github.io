
import React from 'react'

export default function Search(params) {
    const search = window.location;
    const query = new URLSearchParams(search).get('q');

    console.log(query);

    return (
        <div>
        </div>
    );
}
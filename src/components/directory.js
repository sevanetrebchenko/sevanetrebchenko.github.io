import React from 'react'
import { Link } from 'react-router-dom'
import { dirname, basename } from 'path-browserify'

// import components

export default function Directory({ structure }) {
    const directories = [];

    const hasParentDirectory = structure['path'] != '/';
    if (hasParentDirectory) {
        // first element in the directory contents should be '..' for navigating up one directory
        const parent = dirname(structure['path']);
        directories.push(
            <li className='folder'>
                <Link to={parent} >
                    ..
                </Link>
            </li>
        );
    }

    // generate components for directory contents
    const files = []

    for (let i = 0; i < structure['elements'].length; i++) {
        const element = structure['elements'][i];

        const name = basename(element['path']);

        switch (element['type']) {
            case 'directory':
                directories.push(
                    <li className="folder">
                        <Link to={element['path']} >
                            {name}
                        </Link>
                    </li>
                );
                break;

            case 'file':
                files.push(
                    <li>
                        <Link to={element['path']} >
                            {name}
                        </Link>
                    </li>
                );
                break;
        }
    }

    // display the absolute path to the current directory as the page header

    return (
        <React.Fragment>
            <h1>seva netrebchenko</h1>

            <ul className='directory-tree'>
                <li className='folder'>
                    {structure['path']}
                </li>
                <ul className='directory-tree'>
                    {
                        // display directories
                        directories.map((component, index) => (
                            <React.Fragment key={index}> {component} </React.Fragment>
                        ))
                    }
                    {
                        // display files
                        files.map((file, index) => (
                            <React.Fragment key={index}> {file} </React.Fragment>
                        ))
                    }
                </ul>
            </ul>
        </React.Fragment>
    )
}
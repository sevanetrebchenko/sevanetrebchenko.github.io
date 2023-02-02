#!/usr/bin/node

const { dir } = require('console');
const fs = require('fs')
const path = require('path')
const process = require('process')

// files / directories to ignore during directory serialization (local to the directory being serialized)
const ignore = [
    // directories
    'assets',
    
    // files
    'index.html',
    'structure.json'
]

function parseDirectory(directory) {
    const structure = [];
    fs.readdirSync(directory).forEach((item) => {
        const filepath = path.join(directory, item);
        const stat = fs.statSync(filepath);
        const modificationTime = stat.mtimeMs;
    
        // https://www.w3schools.com/js/js_date_methods.asp
        const date = new Date(modificationTime);
    
        const object = {
            'modificationTime': modificationTime,
            'day': date.getDate(),         // 1 - 31
            'month': date.getMonth() + 1,  // 0 - 11
            'year': date.getFullYear(),    // yyyy
            'type': stat.isDirectory() ? 'directory' : 'file',
            'path': path.join('/', filepath)
        };

        // ensure element being processed is not marked for ignore
        // TODO: abstract into script parameters for configurability
        for (let i = 0; i < ignore.length; i++) {
            const name = path.basename(object['path'])
            if (name == ignore[i]) {
                // console.log('ignoring ' + name);
                return;
            }
        }

        if (object['type'] == 'directory') {
            // recursively process other directories
            object['elements'] = parseDirectory(filepath);
        }

        structure.push(object);
    });

    return structure;
}

function serializeDirectoryStructure() {
    const directory = 'public';
    process.chdir(directory);

    // generate metadata of the root directory
    const structure = {
        'root': {
            'path': '/',
            'type': 'directory',
            'elements': parseDirectory('.')
        }
    };

    fs.writeFileSync('structure.json', JSON.stringify(structure));
}

serializeDirectoryStructure();
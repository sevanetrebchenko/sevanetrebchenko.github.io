
import React from 'react'
import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { join, basename, dirname, extname } from 'path-browserify'
import ReactMarkdown from 'react-markdown'
import RemarkGFM from 'remark-gfm'
import RehypeRaw from 'rehype-raw'

import Highlight, { defaultProps } from "prism-react-renderer";
import rangeParser from 'parse-numeric-range'

export default function Post({ parent }) {
    const { name } = useParams();
    const [content, setContent] = useState('');

    const filepath = join(parent, name);

    // load post content
    useEffect(() => {
        const request = new Request(filepath, {
            method: "GET",
            mode: "same-origin",
            cache: "reload",
            credentials: "same-origin",
            headers: {
                'Accept': "text/plain",
                'Content-Type': "text/plain",
            }
        });

        const getFile = () => {
            fetch(request)
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 404) {
                            return "File not found.";
                        }

                        throw new Error('fetch() response was not ok');
                    }

                    return response.text();
                })
                .then(text => {
                    setContent(text);
                });
        };

        getFile();
    }, []);

    const extension = extname(filepath);

    switch (extension) {
        case '.md':
            return <MarkdownFile path={filepath} content={content} />
    }
}

function MarkdownFile({ path, content }) {
    const name = basename(path);
    const parent = dirname(path);

    const MarkdownComponents = {
        code({ node, inline, className, children, ...args }) {
            // for combining diff syntax highlighting with regular code highlighting
            let added = [];       // lines in the code block that have been added
            let removed = [];     // lines in the code block that have been removed
            let modified = [];    // lines in the code block that have been modified
            let hidden = [];
            let highlighted = []; // lines in the code block that have been emphasized

            let containers = []; // namespace + class names

            const parseMetadata = (line) => {
                // parsing: added lines
                {
                    let regex = /added:{[-,\d\s]+}/g;
                    let match = regex.exec(line);
                    if (match) {
                        added.push(...rangeParser(match[0].replace(/[^-,\d]+/g, '')));
                    }
                }

                // parsing: removed lines
                {
                    let regex = /removed:{[-,\d\s]+}/g;
                    let match = regex.exec(line);
                    if (match) {
                        removed.push(...rangeParser(match[0].replace(/[^-,\d]+/g, '')));
                    }
                }

                // parsing: modified lines
                {
                    let regex = /modified:{[-,\d\s]+}/g;
                    let match = regex.exec(line);
                    if (match) {
                        modified.push(...rangeParser(match[0].replace(/[^-,\d]+/g, '')));
                    }
                }

                // parsing: highlighted lines
                {
                    let regex = /highlighted:{[-,\d\s]+}/g;
                    let match = regex.exec(line);
                    if (match) {
                        highlighted.push(...rangeParser(match[0].replace(/[^-,\d]+/g, '')));
                    }
                }
            }

            // namespaces + class names
            // namespaces are collections or name declarations and/or definitions, and structs/classes are collection of data and functions
            let collections = [
                // standard namespaces
                'std',
                'chrono',

                // standard types
                'uin32_t',

                // standard types / containers
                'vector',
                'unordered_map',
                'unique_ptr',
                'weak_ptr',
                'shared_ptr',
                'type', // std:: ... ::type
                'value', // std:: ... ::value
            ];

            const parseCollections = (tokens) => {
                // 'tokens' is an array of tokens, where Token = { types: [ ... ], content: '...' }

                // parse class names
                for (let token of tokens) {
                    if (token.types.includes('class-name')) {
                        let name = token.content.replace(/[\s]+/g, '');
                        if (!collections.includes(name)) {
                            collections.push(name);
                        }
                    }
                }

                // parse namespace names
                // valid syntax highlighting variants:
                //   - namespace a::b::c { ... }
                //   - using namespace a::b::c;
                //   - namespace alias = a::b::c;
                //   - using a::b; (namespace class member)

                let line = '';
                for (let token of tokens) {
                    line += token.content;
                }

                // parsing: namespace a::b::c { ... }
                {
                    let regex = /^\s*namespace [\w\s:]+/;
                    let match = regex.exec(line);

                    if (match) {
                        // parse match for namespace names
                        const names = match[0].replace(/(\s*namespace )|\s/g, '') // remove leading 'namespace ' and whitespace
                                              .split(/:{2}/);                     // split on scope resolution operator
                    
                        for (let name of names) {
                            if (name == '') {
                                continue;
                            }

                            if (!collections.includes(name)) {
                                collections.push(name);
                            }
                        }
                    }
                }

                // parsing: using namespace a::b::c;
                {
                    let regex = /^\s*using namespace [\w\s:]+/;
                    let match = regex.exec(line);

                    if (match) {
                        const names = match[0].replace(/(\s*using namespace )|\s/g, '') // remove leading 'using namespace ' and whitespace
                                              .split(/:{2}/);                           // split on scope resolution operator
                        
                        for (let name of names) {
                            if (name == '') {
                                continue;
                            }

                            if (!collections.includes(name)) {
                                collections.push(name);
                            }
                        }
                    }
                }
                
                // parsing: namespace alias = a::b::c;
                {
                    let regex = /^\s*namespace \w+ = [\w\s:]+/;
                    let match = regex.exec(line);

                    if (match) {
                        const names = match[0].replace(/(\s*namespace )|\s/g, '') // replace leading 'namespace ' and whitespace
                                              .replace(/=/, '::')                 // replace ' = ' with '::'
                                              .split(/:{2}/);                     // split on scope resolution operator

                        for (let name of names) {
                            if (name == '') {
                                continue;
                            }

                            if (!collections.includes(name)) {
                                collections.push(name);
                            }
                        }
                    }
                }

                // parsing: using alias = a::b::c; (where c is a namespace class member)
                // note: this assumes 'c' is not a global / static variable, which is usually the case for my personal coding style
                {
                    let regex = /^\s*using \w+ = [\w\s,<>:]+/;
                    let match = regex.exec(line);

                    let primitives = [
                        'bool', 'b8',
                        'char', 'u8', 'i8',
                        'short', 'u16', 'i16',
                        'int', 'u32', 'i32',
                        'float', 'f32',
                        'double', 'f64',
                        'void'
                    ]

                    let keywords = [
                        'unsigned', 'signed',
                        'const'
                    ]

                    if (match) {
                        const names = match[0].replace(/(\s*using )/, '')           // replace leading 'using ' and trailing ';' 
                                              .replace(/( = )|[,\s<>:{2}]+/g, '::') // replace separators with '::'
                                              .split('::');                         // split on scope resolution operator

                        for (let name of names) {
                            if (name == '') {
                                continue;
                            }

                            // template arguments may have type decorators (references, pointers)
                            name = name.replace(/[*&]+/g, '');

                            // template arguments may be of a primitive type
                            if (primitives.includes(name)) {
                                continue;
                            }

                            // template arguments may be qualified
                            if (keywords.includes(name)) {
                                continue;
                            }

                            // snake_case styling for variables (class names are CamelCase, and will have uppercase letters)
                            // note that if 'c' is a class static, it is still not a collection and will be handled elsewhere
                            const lowercase = /^[a-z_]*$/.test(name);
                            if (!collections.includes(name) && !lowercase) {
                                collections.push(name);
                            }
                        }
                    }
                }
            }

            // parse the code block language.
            let regex = /language-(\w+)/;
            const language = regex.test(className) ? regex.exec(className)[1] : '';

            // code block metadata stores which lines to highlight
            parseMetadata(node?.data?.meta);

            return (
                <Highlight {...defaultProps} code={children.toString()} language={language}>
                    {
                        function ({ className, tokens, getLineProps, getTokenProps }) {
                            // individual line scope
                            return (
                                <pre className={className} style={{}} >
                                    {
                                        tokens.map(function (line, lineNumber) {
                                            parseCollections(line);
                                            console.log(collections);

                                            // re-parse certain tokens for more tailored syntax highlighting
                                            let tokens = [];

                                            for (let i = 0; i < line.length; ++i) {
                                                // token = line[i], where Token { types:[], content:'' }
                                                let content = line[i].content;
                                                let types = line[i].types;

                                                // tokens marked as 'plain' may contain namespace / class names that need to be recategorized
                                                if (types.includes('plain')) {

                                                    let split = content.trim().split(/\s/); // remove leading and trailing spaces
                                                    if (split.length > 1) {
                                                        // token has multiple elements (separated by spaces) that need to be split
                                                        let regex = /\s*\w+/g;
                                                        let match = null;

                                                        while ((match = regex.exec(content)) !== null) {
                                                            let token = match[0].trim();
                                                            let typesLocal = [...types];

                                                            if (collections.includes(token)) {
                                                                // token is a collection
                                                                typesLocal.splice(types.indexOf('plain'), 1); // remove 'plain' tag
                                                                typesLocal.push('collection-name');
                                                            }

                                                            tokens.push({
                                                                types: typesLocal,
                                                                content: match[0]
                                                            });
                                                        }
                                                    }
                                                    else {
                                                        let token = content.trim();
                                                        let typesLocal = [...types];

                                                        console.log(token);

                                                        if (collections.includes(token)) {
                                                            // token is a collection
                                                            typesLocal.splice(types.indexOf('plain'), 1); // remove 'plain' tag
                                                            typesLocal.push('collection-name');
                                                        }

                                                        tokens.push({
                                                            types: typesLocal,
                                                            content: content
                                                        });
                                                    }
                                                }
                                                else if (types.includes('class-name')) {
                                                    let token = content.trim();

                                                    if (collections.includes(token)) {
                                                        // token is a collection
                                                        types.splice(types.indexOf('plain'), 1); // remove 'plain' tag
                                                        types.push('collection-name');
                                                    }

                                                    tokens.push({
                                                        types: types,
                                                        content: content
                                                    });
                                                }
                                                else {
                                                    tokens.push({
                                                        types: types,
                                                        content: content
                                                    });
                                                }
                                            }

                                            line = tokens;

                                            return (
                                                <pre {...getLineProps({line, key: lineNumber})} style={{}} key={lineNumber}>
                                                    {
                                                        line.map(function (token, index) {
                                                            let tokenProps = getTokenProps({ token, index });
                                                            return (
                                                                <span {...tokenProps} style={{}} key={index} >
                                                                </span>
                                                            )
                                                        })
                                                    }
                                                </pre>
                                            )
                                        })
                                    }
                                </pre>
                            )
                        }
                    }
                </Highlight>
            )
        }
    }

    return(
        <React.Fragment >
            <ReactMarkdown components={MarkdownComponents}>
                {content}
            </ReactMarkdown>
        </React.Fragment >
        //     // </React.Fragment>
    );
}

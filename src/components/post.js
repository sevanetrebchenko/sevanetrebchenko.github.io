
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

                // standard types / containers
                'vector',
                'unordered_map',
                'unique_ptr',
                'weak_ptr',
                'shared_ptr'
            ];

            const parseCollections = (line) => {
                // 'line' is an array of tokens, where Token = { types: [ ... ], content: '...' }

                // parse class names
                for (let token of line) {
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

                let source = '';
                for (let token of line) {
                    source += token.content;
                }

                // parsing: namespace a::b::c { ... }
                // notes: a, b, and c are all valid namespace names
                {
                    let regex = /^\s*namespace (\w+(:{2}| {))+/;
                    let match = regex.exec(source);

                    if (match) {
                        // parse match for namespace names
                        const names = match[0].replace(/(\s*namespace )|( {)/, '') // remove leading 'namespace ' and trailing ' {'
                                              .split(/:{2}/);                      // split on scope resolution operator
                    
                        for (let name of names) {
                            if (name == '') {
                                continue;
                            }

                            if (collections.includes(name)) {
                                continue;
                            }

                            collections.push(name);
                        }
                    }
                }

                // parsing: using namespace a::b::c;
                // notes: a, b, and c are all valid namespace names
                {
                    let regex = /^\s*using namespace (\w+(:{2}|;))+/;
                    let match = regex.exec(source);

                    if (match) {
                        const names = match[0].replace(/(\s*using namespace )|(;)/, '') // remove leading 'using namespace ' and trailing ';'
                                              .split(/:{2}/);                           // split on scope resolution operator
                        
                        for (let name of names) {
                            if (name == '') {
                                continue;
                            }

                            if (collections.includes(name)) {
                                continue;
                            }

                            collections.push(name);
                        }
                    }
                }
                
                // parsing: namespace alias = a::b::c;
                // notes: alias, a, b, and c are all valid namespace names
                {
                    let regex = /^\s*namespace \w+ = (\w+(:{2}|;))+/;
                    let match = regex.exec(source);

                    if (match) {
                        const names = match[0].replace(/(\s*namespace )|;/, '') // replace leading 'namespace ' and trailing ';'
                                              .replace(/( = )/, '::')             // replace ' = ' with '::'
                                              .split(/:{2}/);                   // split on scope resolution operator

                        for (let name of names) {
                            if (name == '') {
                                continue;
                            }

                            if (collections.includes(name)) {
                                continue;
                            }

                            collections.push(name);
                        }
                    }
                }

                // parsing: using alias = a::b::c; (where c is a namespace class member)
                {
                    let regex = /^\s*using \w+ = [\w\s,<>:]+/;
                    let match = regex.exec(source);

                    if (match) {
                        const names = match[0].replace(/(\s*using )|;/g, '')           // replace leading 'using ' and trailing ';' 
                                              .replace(/( = )|[,(\s,)<>(::)]+/g, '::') // replace separators with '::'
                                              .split('::');                            // split on scope resolution operator

                        for (let name of names) {
                            if (!collections.includes(name)) {
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
                                            // register class names + namespaces from this line
                                            parseCollections(line);
                                            console.log(collections);

                                            // re-parse certain tokens for more tailored syntax highlighting
                                            let tokens = [];
                                            for (let i = 0; i < line.length; ++i) {
                                                // token = line[i], where Token { types:[], content:'' }
                                                let content = line[i].content;
                                                let types = line[i].types;

                                                // tokens marked as 'plain' may contain namespace / class names that need to be recategorized
                                                if (types.includes('plain') || types.includes('class-name')) {
                                                    // tokens may have multiple elements (separated by spaces) that need to be split and recategorized
                                                    let regex = /[\s]*[\w]+/g;
                                                    let match = null;
                                                    while ((match = regex.exec(content)) !== null) {
                                                        let token = match[0].replace(/\s+/g, '');

                                                        if (collections.includes(token)) {

                                                            // console.log(token);

                                                            // token is either a namespace or the name of a class
                                                            types.splice(types.indexOf('plain'), 1); // remove 'plain' tag
                                                            types.push('container');
                                                        }
                                                    }
                                                }

                                                tokens.push({
                                                    types: types,
                                                    content: content
                                                });
                                            }

                                            line.tokens = tokens;

                                            // for (let i in line) {
                                            //     let token = line[i];

                                            //     if (token.types.includes('plain')) {
                                            //         // let content = token.content;
                                            //         // let s = content.split(/\s/);
                                            //         // if (s.length > 1) {
                                            //         //     line.splice(i, 1);

                                            //         //     let change = line;
                                            //         //     for (let j = 0; j < s.length; ++j) {
                                            //         //         change = insert(change, i + j, s[j])
                                            //         //     }
                                            //         //     console.log(change);
                                            //         // }
                                            //     }
                                            // }

                                            // let string = '';
                                            // for (let token of line) {
                                            //     // replace leading and trailing whitespace

                                                

                                            //     string += token.content;
                                            // }
                                            // parseNamespaces(string);

                                            // let isNamespace = false;
                                            // for (let token of line) {
                                            //     let content = token.content.replace(/\s+/g, '');
                                            //     let types = token.types;

                                            //     if (content == 'namespace') {
                                            //         //  current line contains a namespace definition
                                            //         isNamespace = true;
                                            //         continue;
                                            //     }
                                            //     else if (identifiers.includes(content)) {
                                            //         types.push('namespace-name');
                                            //     }

                                            //     if (isNamespace) {
                                            //         let isPlain = false;
                                            //         for (let i = types.length - 1; i >= 0; --i) {
                                            //             if (types[i] == 'plain') {
                                            //                 // only tokens that are marked as 'plain' (i.e. namespace names) should be highlighted as namespace tokens
                                            //                 types.splice(i);
                                            //                 isPlain = true;
                                            //             }
                                            //         }

                                            //         if (isPlain) {
                                            //              // recategorize 'plain' tokens into 'namespace-name' tokens for proper css styling
                                            //             types.push('namespace-name');
                                            //         }

                                            //         if (!identifiers.includes(content)) {
                                            //             // register namespace name
                                            //             identifiers.push(content);
                                            //         }
                                            //     }
                                            // }

                                            return (
                                                <pre {...getLineProps({line, key: lineNumber})} style={{}} key={lineNumber}>
                                                    {
                                                        line.map(function (token, index) {

                                                            // parseClassNames(token);

                                                            // // token style overrides
                                                            let tokenProps = getTokenProps({ token, index });
                                                            // let style = tokenProps.style;
                                                            // let className = tokenProps.className;

                                                            // // 
                                                            // if (language == 'cpp') {
                                                            //     // if (className.includes('directive keyword')) {
                                                            //     //     style.color = 'rgb(207, 201, 31)';
                                                            //     //     className = className.replace('keyword', '');
                                                            //     // }

                                                            //     if (className.includes('plain') && classNames.includes(token.content.replace(/[\s]+/g, ''))) {
                                                            //         className = className.replace('plain', 'class-name');
                                                            //     }
                                                            //  }

                                                            // tokenProps.className = className;
                                                            // tokenProps.style = style;

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

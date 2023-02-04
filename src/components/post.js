
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

            const source = children.toString().replace(/\n+$/, ''); // remove any trailing newlines
            let split = source.split('\n');

            // parse the code block language.
            let regex = /language-(\w+)/;
            const language = regex.test(className) ? regex.exec(className)[1] : '';

            // code block metadata stores which lines to highlight
            const metadata = node?.data?.meta;
            console.log(metadata);

            let namespaces = new Set();

            if (metadata) {
                let match;

                // added lines (file diff)
                let added = [];
                regex = new RegExp('added:{([\\d,-]+)}', 'g');
                while ((match = regex.exec(metadata)) !== null) {
                    added.push(...rangeParser(match[1]));
                }
                console.log('added: ' + added);

                // removed lines (file diff)
                let removed = [];
                regex = new RegExp('removed:{([\\d,-]+)}', 'g');
                while ((match = regex.exec(metadata)) !== null) {
                    removed.push(...rangeParser(match[1]));
                }
                console.log('removed: ' + removed);

                // modified lines (file diff)
                regex = /modified:{([\d,-]+)}/g;

                // highlighted lines
                regex = /highlight:{([\d,-]+)}/g;

                // class names
                regex = /class-names:{([\d,-]+)}/g;

                // namespace names


                // preprocessor directives
                regex = /directives:{([\d,-]+)}/g;
            }

            const parseNamespaces = (line) => {
                // https://en.cppreference.com/w/cpp/language/namespace

                // parsing: namespace::member
                {
                    let regex = /^[\s]*([\s]*[\w]+[\s]*(::)+)+/g // matches up until 'member' (exclusively, as 'member' is a member of the namespace and not a namespace itself)
                    let match = regex.exec(line);

                    if (match) {
                        console.log(match[0])
                        // parse match for namespace names
                        const names = match[0].replace(/\s+/g, '')         // remove any spaces between namespace names
                                              .split('::')                 // split on scope resolution operator
                                              .filter(element => element); // remove empty elements 

                        names.forEach(element => namespaces.add(element));
                    } 
                }

                // parsing: namespace first::second::third {}
                {
                    let regex = /^[\s]*namespace([\s]*[\w]+[\s]*(::)*)+/g;
                    let match = regex.exec(line);

                    if (match) {
                        // parse match for namespace names
                        const names = match[0].replace(/[\s]*namespace[\s]+/, '') // remove leading 'namespace' keyword
                                              .replace(/\s+/g, '')                // remove any spaces between namespace names
                                              .split('::')                        // split on scope resolution operator
                                              .filter(element => element);        // remove empty elements 
                    
                        names.forEach(element => namespaces.add(element));
                    }
                }

                // parsing: inline namespace first::second::third {}

                // parsing: using namespace first::second {}

                // parsing: namespace alias = first::second;

                // (4)

                // (5)
                
                // (6)

                // (7)

                // (8)

                // (9)

            };

            return (
                <Highlight {...defaultProps} code={source} language={language}>
                    {
                        function ({ className, tokens, getLineProps, getTokenProps }) {
                            // individual line scope
                            return (
                                <pre className={className} style={{}} >
                                    {
                                        tokens.map(function (line, lineNumber) {
                                            // individual token scope

                                            let string = '';
                                            for (let token of line) {
                                                string += token.content;
                                            }
                                            parseNamespaces(string);

                                            const lineProps = getLineProps({ line, key: lineNumber });

                                            let isNamespace = false;
                                            for (let token of line) {
                                                let content = token.content.replace(/\s+/g, '');
                                                let types = token.types;

                                                if (content == 'namespace') {
                                                    //  current line contains a namespace definition
                                                    isNamespace = true;
                                                    continue;
                                                }
                                                else if (namespaces.includes(content)) {
                                                    types.push('namespace-name');
                                                }

                                                if (isNamespace) {
                                                    let isPlain = false;
                                                    for (let i = types.length - 1; i >= 0; --i) {
                                                        if (types[i] == 'plain') {
                                                            // only tokens that are marked as 'plain' (i.e. namespace names) should be highlighted as namespace tokens
                                                            types.splice(i);
                                                            isPlain = true;
                                                        }
                                                    }

                                                    if (isPlain) {
                                                         // recategorize 'plain' tokens into 'namespace-name' tokens for proper css styling
                                                        types.push('namespace-name');
                                                    }

                                                    if (!namespaces.includes(content)) {
                                                        // register namespace name
                                                        namespaces.push(content);
                                                    }
                                                }
                                            }

                                            return (
                                                <pre {...lineProps} style={{}} key={lineNumber}>
                                                    {
                                                        line.map(function (token, index) {
                                                            // token style overrides
                                                            let tokenProps = getTokenProps({ token, index });
                                                            let style = tokenProps.style;
                                                            let className = tokenProps.className;

                                                            // 
                                                            if (language == 'cpp') {
                                                                if (className.includes('directive keyword')) {
                                                                    style.color = 'rgb(207, 201, 31)';
                                                                    className = className.replace('keyword', '');
                                                                }
                                                            }

                                                            tokenProps.className = className;
                                                            tokenProps.style = style;

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

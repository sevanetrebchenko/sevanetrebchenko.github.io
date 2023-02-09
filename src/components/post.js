
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

            // parse the code block language.
            let regex = /language-(\w+)/;
            const language = regex.test(className) ? regex.exec(className)[1] : '';

            // code block metadata stores which lines to highlight
            parseMetadata(node?.data?.meta);


            const splitJoinedTokens = (tokens) => {
                let split = [];

                for (let token of tokens) {
                    let types = token.types;

                    if (!types.includes('comment')) {
                        for (let element of token.content.split(/(\s+)/)) {
                            if (element.length == 0) {
                                continue;
                            }

                            if (element.replace(/\s/g, '').length == 0) {
                                // empty elements (only whitespace) are categorized as 'plain' tokens.
                                split.push({
                                    content: element,
                                    types: ['plain']
                                });
                            }
                            else {
                                // split tokens receive the same types as the parent
                                split.push({
                                    content: element,
                                    types: types
                                });
                            }
                        }
                    }
                    else {
                        split.push({
                            content: token.content,
                            types: types
                        });
                    }
                }

                return split;
            }

            let classes = [
                // standard class types
                'cout',
                'endl',
                'unique_ptr',
                'weak_ptr',
                'shared_ptr',
                'type', // std:: ... :: type

                // standard containers
                'vector',
                'unordered_map',
                'unordered_set',
                'stack',
                'queue',
                'deque',
            ];

            let namespaces = [
                // standard namespaces
                'std'
            ];

            const parseNamespaceNames = (tokens) => {
                // namespaces are more easily parsed with regex
                let line = '';
                for (let token of tokens) {
                    line += token.content.toString();
                }

                // valid syntax highlighting variants:
                //   - namespace a::b::c { ... }
                //   - using namespace a::b::c;
                //   - namespace alias = a::b::c;
                //   - using a::b; (namespace class member)

                {
                    let regex = /^\s*namespace [\w\s:]+/;
                    let match = regex.exec(line);

                    if (match) {
                        // parse match for namespace names
                        const names = match[0].replace(/(\s*namespace )|\s/g, '').split(/:{2}/);

                        for (let name of names) {
                            if (name == '') {
                                continue;
                            }

                            if (!namespaces.includes(name)) {
                                namespaces.push(name);
                            }
                        }
                    }
                }

                // parsing: using namespace a::b::c;
                {
                    let regex = /^\s*using namespace [\w\s:]+/;
                    let match = regex.exec(line);

                    if (match) {
                        const names = match[0].replace(/(\s*using namespace )|\s/g, '').split(/:{2}/);

                        for (let name of names) {
                            if (name == '') {
                                continue;
                            }

                            if (!namespaces.includes(name)) {
                                namespaces.push(name);
                            }
                        }
                    }
                }

                // parsing: namespace alias = a::b::c;
                {
                    let regex = /^\s*namespace \w+ = [\w\s:]+/;
                    let match = regex.exec(line);

                    if (match) {
                        const names = match[0].replace(/(\s*namespace )|\s/g, '').replace(/=/, '::').split(/:{2}/);

                        for (let name of names) {
                            if (name == '') {
                                continue;
                            }

                            if (!namespaces.includes(name)) {
                                namespaces.push(name);
                            }
                        }
                    }
                }

                // parsing: using alias = a::b::c; (where c is a namespace class member)
                {
                    let regex = /^\s*using \w+ = [\s\S]+/;
                    let match = regex.exec(line);

                    let keywords = [
                        'bool', 'b8',
                        'char', 'u8', 'i8',
                        'short', 'u16', 'i16',
                        'int', 'u32', 'i32',
                        'float', 'f32',
                        'double', 'f64',
                        'void',
                        'unsigned', 'signed',
                        'const'
                    ];

                    if (match) {
                        const names = match[0].replace(/(\s*using )/, '').replace(/( = )|[,\s<>:{2}]+/g, '::').split(/:{2}/);

                        for (let i in names) {
                            let name = names[i];
                            name = name.replace(/[*&]+/g, '');

                            if (name == '') {
                                continue;
                            }

                            if (keywords.includes(name)) {
                                continue;
                            }

                            const lowercase = /^[a-z_]*$/.test(name);
                            if (!classes.includes(name) && !namespaces.includes(name) && lowercase && i != names.length) {
                                namespaces.push(name);
                            }
                        }
                    }
                }
            }

            const parseClassNames = (tokens) => {
                // register classes properly parsed by the parsing library
                for (let token of tokens) {
                    let content = token.content;
                    let types = token.types;

                    if (types.includes('class-name') && !classes.includes(content)) {
                        classes.push(content);
                    }
                }

                let line = '';
                for (let token of tokens) {
                    line += token.content.toString();
                }

                // parsing: using alias = a::b::c; (where c is a namespace class member)
                {
                    let regex = /^\s*using \w+ = [\s\S]+/;
                    let match = regex.exec(line);

                    let keywords = [
                        'bool', 'b8',
                        'char', 'u8', 'i8',
                        'short', 'u16', 'i16',
                        'int', 'u32', 'i32',
                        'float', 'f32',
                        'double', 'f64',
                        'void',
                        'unsigned', 'signed',
                        'const'
                    ];

                    if (match) {
                        const names = match[0].replace(/(\s*using )/, '').replace(/( = )|[,\s<>]+/g, '::').split(/:{2}/);

                        for (let i in names) {
                            let name = names[i];
                            name = name.replace(/[*&]+/g, '');

                            if (name == '') {
                                continue;
                            }

                            if (keywords.includes(name)) {
                                continue;
                            }

                            const lowercase = /^[a-z_]*$/.test(name);
                            if (!classes.includes(name) && !lowercase) {
                                classes.push(name);
                            }
                        }
                    }
                }
            }

            let preprocessorDirectives = [];

            const parsePreprocessorDirectives = (tokens) => {
                let line = '';
                for (let token of tokens) {
                    line += token.content.toString();
                }

                // parsing: #define <TOKEN>
                {
                    let regex = /^\s*#define [A-Z0-9_]+/;
                    let match = regex.exec(line);

                    if (match) {
                        let directive = match[0].replace(/[#define\s()]/g, '').trim();
                        if (!preprocessorDirectives.includes(directive)) {
                            preprocessorDirectives.push(directive);
                        }
                    }
                }

                // // parsing: #ifdef <TOKEN>
                // {
                //     let regex = /^\s*#ifdef [A-Z0-9_]+/;
                //     let match = regex.exec(line);

                //     if (match) {
                //         let directive = match[0].replace(/[#if\sdef()]+/g, '');

                //         if (preprocessorDirectives.includes(directive)) {
                //             preprocessorDirectiveScopes.push(directive);
                //         }
                //     }
                // }

                // // parsing: #if defined(<TOKEN>)
                // {
                //     let regex = /^\s*#if defined\([A-Z0-9]+\)/;
                //     let match = regex.exec(line);

                //     if (match) {
                //         let directive = match[0].replace(/[#if\sdefined()]+/g, '').trim();
                //         scopes.push(directive);
                //     }
                // }

                // // parsing: #elifdef <TOKEN>
                // {
                //     let regex = /^\s*#elifdef \([A-Z0-9]+\)/;
                //     let match = regex.exec(line);

                //     if (match) {
                //         let directive = match[0].replace(/[#elifdef\s()]/g, '').trim();
                //         scopes.push(directive);
                //     }
                // }

                // // parsing: #elif defined(<TOKEN>)
                // {
                //     let regex = /^\s*#elif defined\([A-Z0-9]+\)/;
                //     let match = regex.exec(line);

                //     if (match) {
                //         let directive = match[0].replace(/[#elifdefined\s()]/g, '').trim();
                //         scopes.push(directive);
                //     }
                // }

                // // parsing: #else
                // {
                //     let regex = /^\s*#else/;
                //     let match = regex.exec(line);

                //     if (match) {

                //     }
                // }

                // // parsing: #endif
                // {
                //     let regex = /\s*#endif/;
                //     let match = regex.exec(line);

                //     if (match) {
                //         scopes.pop();
                //     }
                // }
            }

            const updateSyntaxHighlighting = (tokens) => {
                let updated = [];

                for (let i = 0; i < tokens.length; ++i) {
                    if (tokens[i].content.length == 0) {
                        continue;
                    }

                    if (tokens[i].types.includes('punctuation') || tokens[i].types.includes('operator')) {
                        // namespace + member variables

                        if (tokens[i].content == '::') {
                            // punctuation token remains unmodified
                            updated.push({
                                content: tokens[i].content,
                                types: tokens[i].types
                            });

                            if (++i == tokens.length) {
                                break;
                            }

                            if (tokens[i].types.includes('plain')) {
                                if (namespaces.includes(tokens[i].content)) {
                                    updated.push({
                                        content: tokens[i].content,
                                        types: ['token', 'namespace-name']
                                    });
                                }
                                else if (classes.includes(tokens[i].content)) {
                                    updated.push({
                                        content: tokens[i].content,
                                        types: ['token', 'class-name']
                                    });
                                }
                                else {
                                    const lowercase = /^[a-z_]*$/.test(tokens[i].content);

                                    if (lowercase) {
                                        if (tokens[i].content == 'type') {
                                            // handle ... ::type separately (and first before general classname pass) so that variables named 'type' do not highlight as class names
                                            updated.push({
                                                content: tokens[i].content,
                                                types: ['token', 'class-name']
                                            });
                                        }
                                        else {
                                            updated.push({
                                                content: tokens[i].content,
                                                types: ['token', 'member-variable']
                                            });
                                        }
                                    }
                                    else {
                                        updated.push({
                                            content: tokens[i].content,
                                            types: ['token', 'class-name']
                                        });
                                    }
                                }
                            }
                        }
                        else if (tokens[i].content == '.' || tokens[i].content == '->') {
                            // operator token remains unmodified
                            updated.push({
                                content: tokens[i].content,
                                types: tokens[i].types
                            });

                            if (++i == tokens.length) {
                                break;
                            }

                            if (tokens[i].types.includes('plain')) {
                                updated.push({
                                    content: tokens[i].content,
                                    types: ['token', 'member-variable']
                                });
                            }
                        }
                        else {
                            updated.push({
                                content: tokens[i].content,
                                types: tokens[i].types
                            });
                        }
                    }
                    else if (tokens[i].types.includes('directive')) {
                        // preprocessor directives

                        if (tokens[i].content == 'if' || tokens[i].content == 'elif') {
                            // if / elif
                            updated.push({
                                content: tokens[i].content,
                                types: tokens[i].types
                            });

                            if (++i == tokens.length) {
                                break;
                            }

                            // whitespace
                            updated.push({
                                content: tokens[i].content,
                                types: tokens[i].types
                            });

                            if (++i == tokens.length) {
                                break;
                            }

                            // defined ( #if defined(...) / #if defined ... or #elif defined(...) / #elif defined ... )
                            updated.push({
                                content: tokens[i].content,
                                types: ['token', 'macro', 'property', 'directive']
                            });

                            if (++i == tokens.length) {
                                break;
                            }

                            // opening parenthese / whitespace token (unmodified)
                            updated.push({
                                content: tokens[i].content,
                                types: tokens[i].types
                            });

                            if (++i == tokens.length) {
                                break;
                            }

                            // macro name
                            updated.push({
                                content: tokens[i].content,
                                types: ['token', 'macro', 'property', 'macro-name']
                            });
                        }
                        else if (tokens[i].content == 'ifdef' || tokens[i].content == 'ifndef') {
                            // ifdef / ifndef
                            updated.push({
                                content: tokens[i].content,
                                types: tokens[i].types
                            });

                            if (++i == tokens.length) {
                                break;
                            }

                            // whitespace
                            updated.push({
                                content: tokens[i].content,
                                types: tokens[i].types
                            });

                            if (++i == tokens.length) {
                                break;
                            }

                            // macro name
                            updated.push({
                                content: tokens[i].content,
                                types: ['token', 'macro', 'property', 'macro-name']
                            });
                        }
                        else {
                            // unmodified (include, endif)
                            updated.push({
                                content: tokens[i].content,
                                types: tokens[i].types
                            });
                        }
                    }
                    else if (tokens[i].types.includes('plain')) {
                        // namespace + class names

                        if (namespaces.includes(tokens[i].content)) {
                            updated.push({
                                content: tokens[i].content,
                                types: ['token', 'namespace-name']
                            });
                        }
                        else if (classes.includes(tokens[i].content)) {
                            updated.push({
                                content: tokens[i].content,
                                types: ['token', 'class-name']
                            });
                        }
                        else {
                            updated.push({
                                content: tokens[i].content,
                                types: tokens[i].types
                            });
                        }
                    }
                    else {
                        // unmodified
                        updated.push({
                            content: tokens[i].content,
                            types: tokens[i].types
                        });
                    }
                }

                return updated;
            }


            return (
                <Highlight {...defaultProps} code={children.toString()} language={language}>
                    {
                        function ({ className, tokens, getLineProps, getTokenProps }) {
                            for (let i in tokens) {
                                tokens[i] = splitJoinedTokens(tokens[i]);

                                parseNamespaceNames(tokens[i]);
                                parseClassNames(tokens[i]);
                                parsePreprocessorDirectives(tokens[i]);

                                tokens[i] = updateSyntaxHighlighting(tokens[i]);
                            }

                            console.log(preprocessorDirectives);

                            return (
                                <pre className={className} style={{}} >
                                    {
                                        tokens.map((line, lineNumber) => (
                                            <pre {...getLineProps({ line, key: lineNumber })} style={{}} key={lineNumber}>
                                                {
                                                    line.map((token, index) => (
                                                        <span {...getTokenProps({ token, index })} style={{}} key={index} >
                                                        </span>
                                                    ))
                                                }
                                            </pre>
                                        ))
                                    }
                                </pre>
                            )
                        }
                    }
                </Highlight>
            )
        }
    }

    return (
        <React.Fragment >
            <ReactMarkdown components={MarkdownComponents}>
                {content}
            </ReactMarkdown>
        </React.Fragment >
        //     // </React.Fragment>
    );
}

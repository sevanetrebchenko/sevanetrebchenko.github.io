
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
            let directives = [];

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

            let scopes = [];

            // returns the index of the first occurerence of 'type' in 'tokens'
            const indexOf = (tokens, ...types) => {
                for (let i in tokens) {
                    let token = tokens[i];

                    let valid = true;

                    for (let type of types) {
                        if (!token.types.includes(type)) {
                            valid = false;
                            break;
                        }
                    }

                    if (valid) {
                        return i;
                    }
                }

                return -1; // not found
            }

            // called when processing a line declaring a preprocessor directive
            const processDirective = (tokens) => {




                if (indexOf(tokens, 'macro', 'property', 'directive-hash') == -1) {
                    return;
                }

                let directiveIndex = indexOf(tokens, 'macro', 'property', 'directive');
                let directive = directiveIndex != -1 ? tokens[directiveIndex].content.trim() : null;

                let expressionIndex = indexOf(tokens, 'macro', 'property', 'expression');
                let expression = expressionIndex != -1 ? tokens[expressionIndex].content.trim() : null;

                console.log(directive);
                console.log(expression);
            }



            const parseScopes = (tokens) => {
                let line = '';
                for (let token of tokens) {
                    line += token.content;
                }

                // parsing: #define <TOKEN>
                {
                    let regex = /^\s*#define [A-Z0-9]+/;
                    let match = regex.exec(line);

                    if (match) {
                        let directive = match[0].replace(/[#define\s()]/g, '').trim();
                        if (!directives.includes(directive)) {
                            directives.push(directive);
                        }
                    }
                }

                // parsing: #ifdef <TOKEN>
                {
                    let regex = /^\s*#ifdef [A-Z0-9]+/;
                    let match = regex.exec(line);

                    if (match) {
                        let directive = match[0].replace(/[#if\sdef()]+/g, '').trim();
                        scopes.push(directive);
                    }
                }

                // parsing: #if defined(<TOKEN>)
                {
                    let regex = /^\s*#if defined\([A-Z0-9]+\)/;
                    let match = regex.exec(line);

                    if (match) {
                        let directive = match[0].replace(/[#if\sdefined()]+/g, '').trim();
                        scopes.push(directive);
                    }
                }

                // parsing: #elifdef <TOKEN>
                {
                    let regex = /^\s*#elifdef \([A-Z0-9]+\)/;
                    let match = regex.exec(line);

                    if (match) {
                        let directive = match[0].replace(/[#elifdef\s()]/g, '').trim();
                        scopes.push(directive);
                    }
                }

                // parsing: #elif defined(<TOKEN>)
                {
                    let regex = /^\s*#elif defined\([A-Z0-9]+\)/;
                    let match = regex.exec(line);

                    if (match) {
                        let directive = match[0].replace(/[#elifdefined\s()]/g, '').trim();
                        scopes.push(directive);
                    }
                }

                // parsing: #else
                {
                    let regex = /^\s*#else/;
                    let match = regex.exec(line);

                    if (match) {

                    }
                }

                // parsing: #endif
                {
                    let regex = /\s*#endif/;
                    let match = regex.exec(line);

                    if (match) {
                        scopes.pop();
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
                        console.log(match[0]);
                        const names = match[0].replace(/(\s*using )/, '').replace(/( = )|[,\s<>]+/g, '::').split(/:{2}/);

                        console.log(names);

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

            const updateSyntaxHighlighting = (tokens) => {
                let updated = [];

                for (let i = 0; i < tokens.length; ++i) {
                    let token = tokens[i];
                    let content = token.content;
                    let types = token.types;

                    if (types.includes('punctuation') || types.includes('operator')) {
                        let before = token.content;

                        // punctuation token remains unmodified
                        updated.push({
                            content: content,
                            types: types
                        });

                        token = tokens[++i];
                        content = token.content;
                        types = token.types;

                        if (before == '::') {
                            if (types.includes('plain')) {
                                if (namespaces.includes(content)) {
                                    types = ['token', 'namespace-name'];
                                }
                                else if (classes.includes(content)) {
                                    types = ['token', 'class-name'];
                                }
                                else {
                                    const lowercase = /^[a-z_]*$/.test(content);

                                    // handle ... ::type separately (and first before general classname pass) so that variables named 'type' do not highlight as class names
                                    if (lowercase) {
                                        if (content == 'type') {
                                            types = ['token', 'class-name'];
                                        }
                                        else {
                                            types = ['token', 'member-variable'];
                                        }
                                    }
                                    else {
                                        types = ['token', 'class-name'];
                                    }
                                }
                            }
                        }
                        else if (before == '.' || before == '->') {
                            if (types.includes('plain')) {
                                types = ['token', 'member-variable'];
                            }
                        }
                    }
                    else if (types.includes('plain')) {
                        if (namespaces.includes(content)) {
                            types = ['token', 'namespace-name'];
                        }
                        else if (classes.includes(content)) {
                            types = ['token', 'class-name'];
                        }
                    }

                    updated.push({
                        content: content,
                        types: types
                    });
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

                                tokens[i] = updateSyntaxHighlighting(tokens[i]);
                            }

                            console.log(classes);
                            console.log(namespaces);

                            return (
                                <pre className={className} style={{}} >
                                    {
                                        tokens.map(function (line, lineNumber) {
                                            return (
                                                <pre {...getLineProps({ line, key: lineNumber })} style={{}} key={lineNumber}>
                                                    {
                                                        line.map(function (token, index) {
                                                            return (
                                                                <span {...getTokenProps({ token, index })} style={{}} key={index} >
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

    return (
        <React.Fragment >
            <ReactMarkdown components={MarkdownComponents}>
                {content}
            </ReactMarkdown>
        </React.Fragment >
        //     // </React.Fragment>
    );
}

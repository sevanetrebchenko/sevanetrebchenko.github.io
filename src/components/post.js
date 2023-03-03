
import React from 'react'
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { join, basename, dirname, extname } from 'path-browserify'
import ReactMarkdown from 'react-markdown'
import RemarkGFM from 'remark-gfm'
import RehypeRaw from 'rehype-raw'

import { Prism } from "prism-react-renderer";
import rangeParser from 'parse-numeric-range'

import processLanguageCpp from '../languages/cpp'

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
            console.log('found on line ' + node.position.start.line);

            let added = [];
            let removed = [];
            let modified = [];
            let hidden = [];
            let highlighted = [];
            let useLineNumbers = false;

            const parseMetadata = function (line) {
                // parsing: added lines 
                {
                    const regex = /\badded\b:{([-,\d\s]+)}/g;
                    const match = regex.exec(line);
                    if (match) {
                        added.push(...rangeParser(match[1]));
                    }
                }

                // parsing: removed lines
                {
                    const regex = /\bremoved\b:{([-,\d\s]+)}/;
                    const match = regex.exec(line);
                    if (match) {
                        removed.push(...rangeParser(match[1]));
                    }
                }

                // parsing: modified lines
                {
                    const regex = /\bmodified\b:{([-,\d\s]+)}/;
                    const match = regex.exec(line);
                    if (match) {
                        modified.push(...rangeParser(match[1]));
                    }
                }

                // parsing: hidden lines
                {
                    const regex = /\bhidden\b:{([-,\d\s]+)}/;
                    const match = regex.exec(line);
                    if (match) {
                        hidden.push(...rangeParser(match[1]));
                    }
                }

                // parsing: highlighted lines
                {
                    const regex = /\bhighlighted\b:{([-,\d\s]+)}/;
                    const match = regex.exec(line);
                    if (match) {
                        highlighted.push(...rangeParser(match[1]));
                    }
                }

                // parsing: enable/disable line numbers
                {
                    const regex = /\bline-numbers\b:{(\w+)}/;
                    const match = regex.exec(line);
                    if (match) {
                        const flag = match[1].toLowerCase();
                        useLineNumbers = (flag == 'enabled' || flag == 'enable');
                    }
                }
            }

            const processToken = function (token, parentTypes = []) {
                let tokenized = [];

                if (typeof token == 'string') {
                    // split on newlines and whitespace characters
                    let temp = [];
                    for (let word of token.split(/(?=[\n\s])|(?<=[\n\s])/g)) {
                        temp.push(word);
                    }

                    for (let i = 0; i < temp.length; ++i) {
                        if (temp[i] == '\n') {
                            // newlines are excluded as they will be used for splitting lines
                            tokenized.push({
                                types: ['plain'],
                                content: temp[i]
                            });
                        }
                        else if (temp[i].length > 1) {
                            tokenized.push({
                                types: parentTypes.length > 0 ? parentTypes : ['plain'],
                                content: temp[i]
                            });
                        }
                        else {
                            // combine adjacent (identical) whitespace into a single token
                            let result = temp[i];
                            for (let j = i + 1; j < temp.length; j++, i++) {
                                if (temp[i] !== temp[j]) {
                                    break;
                                }

                                result += temp[j];
                            }

                            tokenized.push({
                                types: ['plain'],
                                content: result
                            });
                        }
                    }
                }
                else { // if (typeof input == 'object') {
                    let types = [...parentTypes];
                    if (!parentTypes.includes(token.type)) {
                        types.push(token.type);
                    }

                    if (token.content instanceof Array) {
                        for (let element of token.content) {
                            tokenized = tokenized.concat(processToken(element, types));
                        }
                    }
                    else {
                        tokenized.push({
                            types: types,
                            content: token.content
                        });
                    }
                }

                return tokenized;
            }

            const tokenize = function (source, language) {
                let tokens = []; // Token[][]
                let line = [];

                for (let token of Prism.tokenize(source.toString(), Prism.languages[language])) {
                    for (let element of processToken(token)) {
                        line.push(element);
                        if (element.content === '\n') {
                            tokens.push(line);
                            line = [];
                        }
                    }
                }

                return tokens;
            }

            // parse code block metadata
            const regex = /language-(\w+)/;
            const language = regex.test(className) ? regex.exec(className)[1] : '';
            parseMetadata(content.split('\n')[node.position.start.line - 1]);

            // tokenize source code using detected language
            let tokens = [];
            switch (language) {
                case 'cpp': {
                    tokens = processLanguageCpp(tokenize(children.toString(), language));
                }
            }

            // remove hidden lines
            for (let i = tokens.length - 1; i >= 0; --i) {
                if (hidden.includes(i)) {
                    tokens.splice(i, 1);
                }
            }

            let lines = [];

            for (let i = 0; i < tokens.length; ++i) {
                let elements = [];

                let types = ['code-block'];

                // line numbers
                {
                    // right-justify line number text
                    let content = (i + 1).toString().padStart(tokens.length.toString().length, ' ');
                    elements.push(<div className='line-number no-select'>{content}</div>);

                    elements.push(<div className='padding no-select'></div>); // padding
                    elements.push(<div className='separator no-select' />);    // separator
                }

                // diff
                {
                    if (added.length > 0 || removed.length > 0 || modified.length > 0 || highlighted.length > 0) {
                        if (added.includes(i)) {
                            elements.push(<div className='diff added no-select'>+</div>);
                            types.push('added');
                        }
                        else if (removed.includes(i)) {tokens
                            elements.push(<div className='diff removed no-select'>-</div>);
                            types.push('added');
                        }
                        else if (modified.includes(i)) {
                            elements.push(<div className='diff modified no-select'> </div>);
                            types.push('modified');
                        }
                        else if (highlighted.includes(i)) {
                            elements.push(<div className='diff highlighted no-select'> </div>);
                            types.push('highlighted');
                        }
                        else {
                            // empty 'diff' element for padding purposes
                            elements.push(<div className='diff no-select'> </div>);
                        }
                    }
                    else {
                        elements.push(<div className='padding no-select'></div>); // padding
                    }
                }

                // code block
                {
                    elements.push(
                        <div className={types.join(' ')}>
                            {
                                tokens[i].map((token, index) => (
                                    <span className={token.types.join(' ')} key={index}>
                                        {token.content}
                                    </span>
                                ))
                            }
                        </div>
                    );
                }

                lines.push(
                    <div className='line-container'>
                        {
                            elements.map((element, index) => (
                                <React.Fragment key={index}>
                                    {element}
                                </React.Fragment>
                            ))
                        }
                    </div>
                );
            }

            let types = ['code-container', className];
            return (
                <div className={types.join(' ')}>
                    {
                        lines.map((element, index) => (
                            <React.Fragment key={index}>
                                {element}
                            </React.Fragment>
                        ))
                    }
                </div>
            );
        }
    }

    return (
        <ReactMarkdown components={MarkdownComponents} rehypePlugins={[RehypeRaw]} remarkPlugins={[RemarkGFM]}>
            {content}
        </ReactMarkdown>
    );
}

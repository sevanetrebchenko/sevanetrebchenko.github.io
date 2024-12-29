import React, {Fragment, useEffect, useState} from "react";
import ReactMarkdown from "react-markdown";
import RehypeRaw from "rehype-raw";
import RemarkGFM from "remark-gfm";
import rangeParser from "parse-numeric-range";
import processLanguageCpp from "../../old/languages/cpp";
import {Prism} from "prism-react-renderer";

// Stylesheet
import "./post.css"

function MarkdownFile(props) {
    const {filepath, content} = props;

    const MarkdownComponents = {
        code({node, inline, className, children, ...args}) {
            // Helper functions to transform results from Prism syntax highlighting
            const processToken = function (token, parentTypes = []) {
                let tokenized = [];

                if (typeof token == "string") {
                    // 'string' tokens are source code that is left unmodified by Prism
                    // These are custom class names, variables, etc.
                    // Split on newlines and whitespace characters in preparation for future parsing
                    let temp = [];
                    for (let word of token.split(/(?=[\n\s])|(?<=[\n\s])/g)) {
                        temp.push(word);
                    }

                    for (let i = 0; i < temp.length; ++i) {
                        if (temp[i] === "\n") {
                            // newlines are excluded as they will be used for splitting lines
                            tokenized.push({
                                types: ["plain"],
                                content: temp[i]
                            });
                        }
                        else if (temp[i].length > 1) {
                            // Tokens that are broken up should still reference the same types as before
                            tokenized.push({
                                types: parentTypes.length > 0 ? parentTypes : ["plain"],
                                content: temp[i]
                            });
                        }
                        else {
                            // Aggregate adjacent whitespace into a single token
                            let result = temp[i];
                            for (let j = i + 1; j < temp.length; j++, i++) {
                                if (temp[i] !== temp[j]) {
                                    break;
                                }

                                result += temp[j];
                            }

                            tokenized.push({
                                types: ["plain"],
                                content: result
                            });
                        }
                    }
                }
                else { // if (typeof token == 'object') {
                    // Tokens recognized by Prism are passed as 'Token' objects
                    let types = [...parentTypes];
                    if (!parentTypes.includes(token.type)) {
                        types.push(token.type);
                    }

                    if (token.content instanceof Array) {
                        // Macro definitions are wrapped into Token arrays
                        console.log(token)
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
                // Array of arrays
                // Lines of tokens
                let tokens = []; // Token[][]
                let line = [];

                for (let token of Prism.tokenize(source.toString(), Prism.languages[language])) {
                    for (let element of processToken(token)) {
                        line.push(element);
                        if (element.content === "\n") {
                            tokens.push(line);
                            line = [];
                        }
                    }
                }

                return tokens;
            }

            // Section start: syntax highlighting
            // Parse code block metadata

            // An assumption made here is that metadata is on the same line as the start of the code block (right after ```)
            const metadata = content.split('\n')[node.position.start.line - 1];

            // Parse metadata
            let language = "";
            let added = [];
            let removed = [];
            let modified = [];
            let hidden = [];
            let highlighted = [];
            let useLineNumbers = false;

            // Language is provided by the ReactMarkdown plugin through the className parameter
            {
                const regexp = /language-(\w+)/;
                if (regexp.test(className)) {
                    language = regexp.exec(className)[1];
                }
            }

            // Added lines are specified by the added:{[range]} metadata tag
            // These lines show up with a green background
            {
                const regexp = /\badded\b:{([-,\d\s]+)}/;
                const match = regexp.exec(metadata);
                if (match) {
                    added.push(...rangeParser(match[1]));
                }
            }

            // Removed lines are specified by the removed:{[range]} metadata tag
            // These lines should up with a red background
            {
                const regexp = /\bremoved\b:{([-,\d\s]+)}/;
                const match = regexp.exec(metadata);
                if (match) {
                    removed.push(...rangeParser(match[1]));
                }
            }

            // Modified lines are specified by the modified:{[range]} metadata tag
            // These lines show up with a yellow background
            {
                const regexp = /\bmodified\b:{([-,\d\s]+)}/;
                const match = regexp.exec(metadata);
                if (match) {
                    modified.push(...rangeParser(match[1]));
                }
            }

            // Hidden lines are specified with the hidden:{[range]} metadata tag
            // These lines are hidden from the rendered output
            // One use case of this is to supply definitions for syntax highlighting while keeping code snippets lightweight
            {
                const regexp = /\bhidden\b:{([-,\d\s]+)}/;
                const match = regexp.exec(metadata);
                if (match) {
                    hidden.push(...rangeParser(match[1]));
                }
            }

            // Highlighted lines are specified with the highlighted:{[range]} metadata tag
            // These lines show up with a blue TODO: ? background
            {
                const regexp = /\bhighlighted\b:{([-,\d\s]+)}/;
                const match = regexp.exec(metadata);
                if (match) {
                    highlighted.push(...rangeParser(match[1]));
                }
            }

            // Toggling line numbers is specified by the line-numbers:{enable/disable/enabled/disabled} metadata tag
            {
                const regexp = /\bline-numbers\b:{(\w+)}/;
                const match = regexp.exec(metadata);
                if (match) {
                    const flag = match[1].toLowerCase();
                    useLineNumbers = (flag === 'enabled' || flag === 'enable');
                }
            }

            // Tokenize source code using detected language
            let tokens = [];
            switch (language) {
                case "cpp": {
                    tokens = processLanguageCpp(tokenize(children.toString(), language));
                }
            }

            // remove hidden lines
            for (let i = tokens.length - 1; i >= 0; --i) {
                if (hidden.includes(i + 1)) {
                    tokens.splice(i, 1);
                }
            }

            let containers = [];

            let metadataContainer = [];
            let codeContainer = [];

            for (let i = 0; i < tokens.length; ++i) {
                // metadata block
                let metadataBlock = [];

                // line numbers
                if (useLineNumbers) {
                    metadataBlock.push(<div className='padding'></div>);

                    const lineNumber = (i + 1).toString().padStart(tokens.length.toString().length, ' ');
                    metadataBlock.push(<div className='line-number'>{lineNumber}</div>);

                    metadataBlock.push(<div className='padding'></div>);
                    metadataBlock.push(<div className='separator'></div>);
                }

                // diff
                let override = '';
                if (added.length > 0 || removed.length > 0) {
                    let symbol = ' ';

                    // added / removed tags have diff symbols and require different formatting globally for easier readability
                    if (added.includes(i + 1)) {
                        symbol = '+';
                        override = 'added';
                    }
                    else if (removed.includes(i + 1)) {
                        symbol = '-';
                        override = 'removed';
                    }
                    // no symbols for modified / highlighted tags
                    else if (modified.includes(i + 1)) {
                        override = 'modified';
                    }
                    else if (highlighted.includes(i + 1)) {
                        override = 'highlighted';
                    }

                    if (override.length > 0) {
                        metadataBlock.push(<div className={'padding' + ' ' + override}></div>);
                        metadataBlock.push(<div className={override}>{symbol}</div>);
                        metadataBlock.push(<div className={'padding' + ' ' + override}></div>);
                    }
                    else {
                        metadataBlock.push(<div className='padding'></div>);
                        metadataBlock.push(<div>{symbol}</div>);
                        metadataBlock.push(<div className='padding'></div>);
                    }
                }
                else {
                    if (modified.includes(i + 1)) {
                        override = 'modified';
                    }
                    else if (highlighted.includes(i + 1)) {
                        override = 'highlighted';
                    }

                    metadataBlock.push(<div className={('padding' + ' ' + override).trim()}></div>);
                }

                metadataContainer.push(
                    <div className='meta-block'>
                        {
                            metadataBlock.map((element, index) => (
                                <React.Fragment key={index}>
                                    {element}
                                </React.Fragment>
                            ))
                        }
                    </div>
                );


                // code block
                let codeBlock = [];

                codeBlock.push(
                    <div className={'block'}>
                        {
                            tokens[i].map((token, index) => (
                                <span className={token.types.join(' ')} key={index}>
                                    {token.content}
                                </span>
                            ))
                        }
                    </div>
                );

                codeBlock.push(<div className={'padding'}></div>);

                codeContainer.push(
                    <div className={('code-block' + ' ' + override).trim()}>
                        {
                            codeBlock.map((element, index) => (
                                <Fragment key={index}>
                                    {element}
                                </Fragment>
                            ))
                        }
                    </div>
                );
            }

            return (
                <div className={className}>
                    <div className='meta-container'>
                        {
                            metadataContainer.map((element, index) => (
                                <Fragment key={index}>
                                    {element}
                                </Fragment>
                            ))
                        }
                    </div>
                    <div className='code-container'>
                        {
                            codeContainer.map((element, index) => (
                                <Fragment key={index}>
                                    {element}
                                </Fragment>
                            ))
                        }
                    </div>
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

export default function Post(props) {
    const {post} = props;
    const [content, setContent] = useState("");

    // load post content
    useEffect(() => {
        const request = new Request(post.filepath, {
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

    return (
        <div className="post">
            <div className="header">
                <span className="title">{post.title}</span>
            </div>
            <div className="content">
                <MarkdownFile filepath={post.filepath} content={content}/>
            </div>
        </div>
    );
}
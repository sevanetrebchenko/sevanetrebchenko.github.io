import React, {Fragment, useEffect, useState} from "react";
import ReactMarkdown from "react-markdown";
import RehypeRaw from "rehype-raw";
import RemarkGFM from "remark-gfm";
import rangeParser from "parse-numeric-range";
import processLanguageCpp from "../languages/cpp";

import {useNavigate} from "react-router-dom";
import {get} from "../../utils";
import {compile, run} from "@mdx-js/mdx";
import * as runtime from 'react/jsx-runtime'
import { visit } from 'unist-util-visit';

import {Prism} from "prism-react-renderer";
// Prism must exist before loading language definitions
// ref: https://github.com/FormidableLabs/prism-react-renderer?tab=readme-ov-file#custom-language-support
(typeof global !== "undefined" ? global : window).Prism = Prism

// Language definitions
await import("prismjs/components/prism-cpp")
await import("prismjs/components/prism-glsl")

// Stylesheet
import "./post.css"
import "../languages/cpp.css"
import "../languages/json.css"

function Header(props) {
    const {title, tags, publishedDate, lastModifiedDate} = props;
    const navigateTo = useNavigate();

    const onClick = (e) => {
        e.preventDefault();
        navigateTo("/");
    }

    return (
        <div className="header">
            <div className="back">
                <i className="fa-solid fa-chevron-left"></i>
                <span onClick={onClick}>BACK</span>
            </div>
            <div className="title">
                {title}
            </div>
            <div className="metadata">
                <span>
                    {
                        `Published ${publishedDate.toLocaleString('default', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}`
                    }
                </span>
                <div className="separator"></div>
                <span>
                    {
                        `Last revised ${lastModifiedDate.toLocaleString('default', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true, // Use 12-hour format with AM/PM
                        })}`
                    }
                </span>
            </div>
        </div>
    );
}

function tokenize(token, types = []) {
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
                    content: temp[i],
                    types: ["plain"]
                });
            }
            else if (temp[i].length > 1) {
                // Tokens that are broken up should still reference the same types as before
                tokenized.push({
                    content: temp[i],
                    types: types.length > 0 ? types : ["plain"],
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
                    content: result,
                    types: ["plain"]
                });
            }
        }
    }
    else { // if (typeof token == 'object') {
        // Tokens recognized by Prism are passed as 'Token' objects
        let types_ = [...types];
        if (!types_.includes(token.type)) {
            types_.push(token.type);
        }

        if (token.content instanceof Array) {
            // Macro definitions are wrapped into Token arrays
            for (let element of token.content) {
                tokenized = tokenized.concat(tokenize(element, types_));
            }
        }
        else {
            tokenized.push({
                content: token.content,
                types: types_
            });
        }
    }

    return tokenized;
}

function IC(props) {
    return (
        <div className="image-carousel">
        </div>
    )
}

function CodeBlock(props) {
    const { className, children, useLineNumbers, added, removed, modified, hidden, highlighted } = props;
    if (!children) {
        return;
    }
    const source = children.toString();

    const inline = className === undefined;
    if (inline) {
        // Inline code blocks have no inherent language
        return (
            <span className="inline">
                {source}
            </span>
        );
    }

    // Specifying the language is optional
    let language = "";
    const regexp = /language-([\w-]+)/;
    if (regexp.test(className)) {
        language = regexp.exec(className)[1];
    }

    // Tokenize source
    let tokens = [];
    for (const raw of Prism.tokenize(source, Prism.languages[language])) {
        for (const processed of tokenize(raw)) {
            tokens.push(processed);
        }
    }

    // Separate tokens array into an array of lines
    let lines = [];
    let line = [];
    for (const token of tokens) {
        line.push(token);
        if (token.content === "\n") {
            lines.push(line);
            line = [];
        }
    }

    // Language-specific processing
    switch (language) {
        case "cpp": {
            for (const i in lines) {
                lines[i] = processLanguageCpp(lines[i])
            }
        }
    }

    // remove hidden lines from final output
    for (let i = lines.length - 1; i >= 0; --i) {
        if (hidden.includes(i + 1)) {
            tokens.splice(i, 1);
        }
    }

    let metadataContainer = [];
    let codeContainer = [];

    for (let i = 0; i < lines.length; ++i) {
        // metadata block
        let metadataBlock = [];

        // line numbers
        if (useLineNumbers) {
            metadataBlock.push(<div className='padding'></div>);

            const lineNumber = (i + 1).toString().padStart(lines.length.toString().length, ' ');
            metadataBlock.push(<div className='line-number'>{lineNumber}</div>);

            metadataBlock.push(<div className='padding'></div>);
            metadataBlock.push(<div className='separator'></div>);
        }

        // diff
        let override = null;
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

            if (override?.length > 0) {
                metadataBlock.push(<div className={'padding' + ' ' + override}></div>);
                metadataBlock.push(<div className={override}>{symbol}</div>);
                metadataBlock.push(<div className={'padding' + ' ' + override}></div>);
            }
        }
        else {
            if (modified.includes(i + 1)) {
                override = 'modified';
            }
            else if (highlighted.includes(i + 1)) {
                override = 'highlighted';
            }

            if (override) {
                metadataBlock.push(<div className={('padding' + ' ' + override).trim()}></div>);
            }
        }
        if (metadataBlock.length > 0) {
            metadataContainer.push(
                <div>
                    {
                        metadataBlock.map((element, index) => (
                            <React.Fragment key={index}>
                                {element}
                            </React.Fragment>
                        ))
                    }
                </div>
            );
        }

        let codeBlock = [];
        codeBlock.push(
            <div className={'block'}>
                {
                    lines[i].map((token, index) => (
                        <span className={token.types.join(' ')} key={index}>
                                    {token.content}
                                </span>
                    ))
                }
            </div>
        );

        if (metadataBlock.length > 0) {
            codeBlock.push(<div className={'padding'}></div>);
        }

        codeContainer.push(
            <div className={override ? override : null}>
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
            {metadataContainer.length > 0 ? <div className='metadata'>
                {
                    metadataContainer.map((element, index) => (
                        <Fragment key={index}>
                            {element}
                        </Fragment>
                    ))
                }
            </div> : null }
            <div className='code'>
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


function parseCodeBlockMetadata() {
    return (tree) => {
        // Traverse the generated AST
        visit(tree, "code", (node) => {
            // Code blocks can have optional metadata that influence how the code block is rendered
            const meta = node.meta || '';

            let added = [];
            let removed = [];
            let modified = [];
            let hidden = [];
            let highlighted = [];
            let useLineNumbers = false;

            // Added lines are specified by the added:{[range]} metadata tag
            // These lines show up with a green background
            {
                const regexp = /\badded\b:{([-,\d\s]+)}/;
                const match = regexp.exec(meta);
                if (match) {
                    added.push(...rangeParser(match[1]));
                }
            }

            // Removed lines are specified by the removed:{[range]} metadata tag
            // These lines should up with a red background
            {
                const regexp = /\bremoved\b:{([-,\d\s]+)}/;
                const match = regexp.exec(meta);
                if (match) {
                    removed.push(...rangeParser(match[1]));
                }
            }

            // Modified lines are specified by the modified:{[range]} metadata tag
            // These lines show up with a yellow background
            {
                const regexp = /\bmodified\b:{([-,\d\s]+)}/;
                const match = regexp.exec(meta);
                if (match) {
                    modified.push(...rangeParser(match[1]));
                }
            }

            // Hidden lines are specified with the hidden:{[range]} metadata tag
            // These lines are hidden from the rendered output
            // One use case of this is to supply definitions for syntax highlighting while keeping code snippets lightweight
            {
                const regexp = /\bhidden\b:{([-,\d\s]+)}/;
                const match = regexp.exec(meta);
                if (match) {
                    hidden.push(...rangeParser(match[1]));
                }
            }

            // Highlighted lines are specified with the highlighted:{[range]} metadata tag
            // These lines show up with a blue TODO: ? background
            {
                const regexp = /\bhighlighted\b:{([-,\d\s]+)}/;
                const match = regexp.exec(meta);
                if (match) {
                    highlighted.push(...rangeParser(match[1]));

                }
            }

            // Toggling line numbers is specified by the line-numbers:{enable/disable/enabled/disabled} metadata tag
            {
                const regexp = /\bline-numbers\b:{(\w+)}/;
                const match = regexp.exec(meta);
                if (match) {
                    const flag = match[1].toLowerCase();
                    useLineNumbers = (flag === 'enabled' || flag === 'enable');
                }
            }

            // Pass as attributes to the element
            node.data = {
                ...node.data,
                hProperties: {
                    ...(node.data?.hProperties || {}),
                    useLineNumbers,
                    added,
                    removed,
                    modified,
                    hidden,
                    highlighted,
                },
            };
        });
    };
}

export default function Post(props) {
    const {post} = props;
    const [Content, setContent] = useState(null);

    // load post content
    useEffect(() => {
        async function loadPostContent(url) {
            try {
                const source = await get(url);

                // Compile file content (.mdx)
                const code = await compile(source, {
                    outputFormat: 'function-body',
                    remarkPlugins: [parseCodeBlockMetadata]
                }).then(response => response.toString());

                // Execute compiled source to get MDX content
                const { default: MDXContent } = await run(code, { ...runtime });
                setContent(() => MDXContent);
            }
            catch (error) {
                console.error("Error loading post content: ", error);
            }
        }

        loadPostContent(post.filepath);
    }, [post.filepath]);

    if (Content == null) {
        console.log("Loading...");
        return;
    }

    const components = {
        IC: IC,
        code: CodeBlock
    }

    return (
        <div className="post">
            <Header title={post.title} tags={post.tags} publishedDate={post.date} lastModifiedDate={post.lastModifiedTime}/>
            <Content components={components}></Content>
            <div className="footer"></div>
        </div>
    );
}


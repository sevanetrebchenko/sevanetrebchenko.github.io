import React, {Fragment, useEffect, useRef, useState} from "react";
import ReactMarkdown from "react-markdown";
import RehypeRaw from "rehype-raw";
import RemarkGFM from "remark-gfm";
import rangeParser from "parse-numeric-range";
import processLanguageCpp from "../languages/cpp";
import { Link } from 'react-router-dom';

import {useNavigate} from "react-router-dom";
import {get, getPostUrl, mobileDisplayWidthThreshold, tabletDisplayWidthThreshold, getResponsiveClassName} from "../../utils";
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
import "../languages/yaml.css"
import "../languages/css.css"
import {useMediaQuery} from "react-responsive";

function Header(props) {
    const {title, tags, publishedDate, lastModifiedDate} = props;
    const navigateTo = useNavigate();

    const onClick = (e) => {
        e.preventDefault();
        navigateTo("/");
    }

    const isMobile = useMediaQuery({ maxWidth: mobileDisplayWidthThreshold });
    const isTablet = useMediaQuery({ minWidth: mobileDisplayWidthThreshold + 1, maxWidth: tabletDisplayWidthThreshold });
    const isDesktop = useMediaQuery({minWidth: tabletDisplayWidthThreshold + 1});
    return (
        <div className={getResponsiveClassName("header", isMobile, isTablet)}>
            {
                isDesktop && <div className="back">
                    <i className="fa-solid fa-chevron-left"></i>
                    <span onClick={onClick}>BACK</span>
                </div>
            }
            <div className="title">
                <span>{title}</span>
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
            } else if (temp[i].length > 1) {
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

function CopyButton(props) {
    const { source, visibleDuration, fadeDuration } = props;
    const [opacity, setOpacity] = useState(0.0);
    const intervalRef = useRef(null);

    const handleClick = async () => {
        await navigator.clipboard.writeText(source);

        // Clear any existing interval before setting a new one
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Reset the timer every time the copy button is clicked
        setOpacity(1.0);
        setTimeout(() => {
            // Update the opacity at a fixed interval
            const step = 0.01;
            intervalRef.current = setInterval(() => {
                setOpacity((prev) => {
                    if (prev <= step) {
                        clearInterval(intervalRef.current); // Stop fading process
                        intervalRef.current = null;
                        return 0.0;
                    }

                    return prev - step;
                });
            }, fadeDuration * 1000 * step);
        }, visibleDuration * 1000); // Wait 'visibleDuration' ms before starting fade out
    };

    const visible = opacity > 0.0;

    return (
        <div className="copy-button" onClick={handleClick}>
            {
                visible && <span style={{opacity: opacity}}>
                    Copied to clipboard!
                </span>
            }
            <i className="fa-regular fa-fw fa-clone"></i>
        </div>
    );
}

function IC(props) {
    return (
        <div className="image-carousel">
        </div>
    )
}

function CodeBlock(props) {
    let { className, children, options, title, added, removed, modified, highlighted, hidden } = props;
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

    // HTML attributes are automatically converted to strings by the Markdown engine
    // If present, map diff elements back from comma-separated strings to an array of numbers
    added = added ? added.split(",").map(Number) : [];
    removed = removed ? removed.split(",").map(Number) : [];
    hidden = hidden ? hidden.split(",").map(Number) : [];
    modified = modified ? modified.split(",").map(Number) : []
    highlighted = highlighted ? highlighted.split(",").map(Number) : [];
    options = JSON.parse(options);

    let [lineCount, setLineCount] = useState(options.lineCount);
    let [expanded, setExpanded] = useState(false);

    // Specifying the language is optional
    let language = "";
    const regexp = /language-([\w-]+)/;
    if (regexp.test(className)) {
        language = regexp.exec(className)[1];
    }

    // Language extensions
    Prism.languages.yaml = Prism.languages.extend("yaml", {
        comment: [
            {
                pattern: /\/\/.*/,
                greedy: true,
            },
            {
                pattern: /\/\*[\s\S]*?\*\//,
                greedy: true,
            },
        ],
    });

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
            lines.splice(i, 1);
        }
    }

    let hasOverride = false;
    let metadataContainer = [];
    let codeContainer = [];

    const count = (lineCount === -1) ? lines.length : lineCount;
    for (let i = 0; i < count; ++i) {
        // metadata block
        let metadataBlock = [];

        // line numbers
        if (options.useLineNumbers) {
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
            else if (modified.includes(i + 1)) {
                override = 'modified';
            }
            else if (highlighted.includes(i + 1)) {
                override = 'highlighted';
            }

            if (override?.length > 0) {
                metadataBlock.push(<div className={'padding' + ' ' + override}></div>);
                metadataBlock.push(<span className={override}>{symbol}</span>);
                metadataBlock.push(<div className={'padding' + ' ' + override}></div>);
            }
            else {
                metadataBlock.push(<div className='padding'></div>);
                metadataBlock.push(<span className={override}>{symbol}</span>);
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

            if (override) {
                metadataBlock.push(<div className={'padding' + ' ' + override}></div>);
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

        codeContainer.push(
            <div className={override ? override : null}>
                {
                    lines[i].map((token, index) => (
                        <span className={token.types.join(' ')} key={index}>
                            {token.content}
                        </span>
                    ))
                }
            </div>
        );

        hasOverride |= override != null;
    }

    // Build header
    let headerContainer = [];
    let headerClassNames = ["code-header"];
    if (title) {
        headerContainer.push(<span className="title">{title}</span>);
    }
    else {
        // Code snippet headers with no title should only display the copy code button
        headerClassNames.push("no-banner");
    }
    headerContainer.push(<CopyButton source={source} visibleDuration={0.5} fadeDuration={1}></CopyButton>);

    return (
        <div className={className}>
            <div className={headerClassNames.join(" ")}>
                {
                    headerContainer.map((element, index) => (
                        <Fragment key={index}>
                            {element}
                        </Fragment>
                    ))
                }
            </div>
            <div className="code-block">
                {metadataContainer.length > 0 ? <div className='metadata'>
                    {
                        metadataContainer.map((element, index) => (
                            <Fragment key={index}>
                                {element}
                            </Fragment>
                        ))
                    }
                </div> : null }
                <div className={"code" + (hasOverride ? " diff" : "")}>
                    {
                        codeContainer.map((element, index) => (
                            <Fragment key={index}>
                                {element}
                            </Fragment>
                        ))
                    }
                </div>
            </div>
            {options.lineCount !== -1 && <div className="overlay" onClick={(e) => {
                e.preventDefault();
                if (expanded) {
                    setLineCount(options.lineCount);
                }
                else {
                    setLineCount(lines.length);
                }

                setExpanded(!expanded);
            }}>
                {
                    expanded ? <Fragment>
                        <span>Collapse</span>
                        <i className="fa-solid fa-chevron-up fa-fw"></i>
                    </Fragment> : <Fragment>
                        <span>Expand</span>
                        <i className="fa-solid fa-chevron-down fa-fw"></i>
                    </Fragment>
                }
            </div>}
        </div>
    );
}

function Heading(props) {
    let { children, depth, position } = props;
    console.log(children)
    return <div>

    </div>
}


function parseCodeBlockMetadata() {
    return (tree) => {
        // Traverse the generated AST
        // Possible sections: code (code blocks), heading (h1, h2, h3, etc.), paragraph (p, span)
        visit(tree, "code", (node) => {
            // Code blocks can have optional metadata that influence how the code block is rendered
            const meta = node.meta || '';

            let added = [];
            let removed = [];
            let hidden = [];
            let modified = [];
            let highlighted = [];
            let lineCount = -1; // -1 means show all lines
            let useLineNumbers = false;
            let title = null;

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

            // Modified lines are specified with the modified:{[range]} metadata tag
            // These lines show up with a yellow background
            {
                const regexp = /\bmodified\b:{([-,\d\s]+)}/;
                const match = regexp.exec(meta);
                if (match) {
                    modified.push(...rangeParser(match[1]));
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

            // Code snippet title is specified by the title:{...} metadata tag
            {
                const regexp = /\btitle\b:{([^}]*)}/;
                const match = regexp.exec(meta);
                if (match) {
                    title = match[1];
                }
            }

            // Collapsible code snippet height is specified by the show-lines{...} metadata tag
            {
                const regexp = /\bshow-lines\b:{(\d+)}/;
                const match = regexp.exec(meta);
                if (match) {
                    lineCount = match[1];
                }
            }

            // Pass as attributes to the element
            // hProperties is used to store HTML attributes of nodes
            // These properties are automatically converted to a string value
            node.data = {
                ...node.data,
                hProperties: {
                    ...(node.data?.hProperties || {}),
                    // Pass dictionary of options as a JSON blob
                    options: JSON.stringify({
                        useLineNumbers: useLineNumbers,
                        lineCount: lineCount
                    }),
                    title: title,
                    added: added.join(","),
                    removed: removed.join(","),
                    modified: modified.join(","),
                    highlighted: highlighted.join(","),
                    hidden: hidden.join(","),
                },
            };
        });
    };
}

function extractSectionHeaders(sectionHeaders) {
    return () => (tree) => {
        visit(tree, "heading", (node) => {
            const header = node.children[0].name;
            sectionHeaders.push({
                name: header,
                depth: node.depth
            });
        });
    }
}

function useDimensions() {
    // Define breakpoints
    const getDeviceCategory = (width) => {
        if (width < 768) return "mobile";
        if (width < 1024) return "tablet";
        return "desktop";
    };

    const [deviceCategory, setDeviceCategory] = useState(getDeviceCategory(window.innerWidth));
    const prevCategory = useRef(deviceCategory); // Ref to track the previous category

    useEffect(() => {
        const handleResize = () => {
            const newCategory = getDeviceCategory(window.innerWidth);

            // Only update state if the category actually changes
            if (prevCategory.current !== newCategory) {
                prevCategory.current = newCategory; // Update ref first
                setDeviceCategory(newCategory);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return deviceCategory;
}

function SectionHeaders(props) {
    const { markdownRef } = props;

    const [headers, setHeaders] = useState([]);
    const [currentHeader, setCurrentHeader] = useState(null)

    // Extract rendered header information
    useEffect(() => {
        if (!markdownRef.current) {
            return;
        }

        let headers = Array.from(markdownRef.current.querySelectorAll("h1, h2, h3, h4, h5, h6"));
        headers = headers.map((header) => ({
            text: header.innerText,
            depth: parseInt(header.tagName.charAt(1)), // h1 -> 1, h2 -> 2, etc.
            position: header.getBoundingClientRect().top
        }));

        setHeaders(headers);
    }, [markdownRef]);

    console.log(headers)

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            let current = null;

            console.log(scrollY);

            for (const header of headers) {
                if (scrollY + window.innerHeight / 4 >= header.position) {
                    current = header;
                }
            }

            setCurrentHeader(current);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [headers]);

    if (!headers) {
        return <div></div>;
    }

    return <div className="headers">
        {
            headers.map((header, index) => {
                let classNames = ["section-header"];
                if (currentHeader && currentHeader.text === header.text) {
                    classNames.push("active");
                }

                return <span key={index} className={classNames.join(" ")} style={{paddingLeft: `${header.depth * 10}px`}}>
                    {header.text}
                </span>
            })
        }
    </div>
}

function Section(props) {
    const { children } = props;

    return <div className="section">
        {children}
    </div>
}

function LocalLink(props) {
    const {text, to} = props;
    return <Link to={getPostUrl(to)}>{text}</Link>;
}

export default function Post(props) {
    const {post} = props;
    const [Content, setContent] = useState(null);
    const category = useDimensions();
    const markdownRef = useRef(null);

    // load post content
    useEffect(() => {
        async function loadPostContent(url) {
            try {
                const source = await get(url);
                let headers = [];

                // Compile file content (.mdx)
                const code = await compile(source, {
                    outputFormat: 'function-body',
                    remarkPlugins: [
                        parseCodeBlockMetadata,
                    ]
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

    const postRef = useRef(null);
    useEffect(() => {
        if (postRef.current) {
            console.log("resetting scroll position");
            postRef.current.scrollTop = 0;
        }
    }, [Content]);

    const isMobile = useMediaQuery({ maxWidth: mobileDisplayWidthThreshold });
    const isTablet = useMediaQuery({ minWidth: mobileDisplayWidthThreshold + 1, maxWidth: tabletDisplayWidthThreshold });

    if (Content == null) {
        return;
    }

    const components = {
        LocalLink: LocalLink,
        code: CodeBlock,
    }
    return (
        <div className={getResponsiveClassName("post", isMobile, isTablet)} ref={postRef}>
            <Header title={post.title} tags={post.tags} publishedDate={post.date} lastModifiedDate={post.lastModifiedTime}/>
            <div className={getResponsiveClassName("body", isMobile, isTablet)} ref={markdownRef}>
                <Content components={components}></Content>
            </div>
            <div className="footer"></div>
        </div>
    );
}

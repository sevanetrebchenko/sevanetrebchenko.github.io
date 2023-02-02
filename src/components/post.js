
import React from 'react'
import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { join, basename, dirname, extname } from 'path-browserify'
import ReactMarkdown from 'react-markdown'
import RemarkGFM from 'remark-gfm'
import RehypeRaw from 'rehype-raw'

import Highlight, { defaultProps } from "prism-react-renderer";
import theme from '../styles/cpp.js'

// SyntaxHighlighter.registerLanguage('cpp', cpp);
// SyntaxHighlighter.registerLanguage('cmake', cmake);
// SyntaxHighlighter.registerLanguage('glsl', glsl);
// SyntaxHighlighter.registerLanguage('diff', diff);

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

// custom component?
// https://stackoverflow.com/questions/66707123/is-it-possible-to-highlight-specific-characters-in-a-line-using-react-syntax-hig
// https://github.com/react-syntax-highlighter/react-syntax-highlighter
// https://react-syntax-highlighter.github.io/react-syntax-highlighter/demo/diff.htmln

function MarkdownFile({ path, content }) {
    const name = basename(path);
    const parent = dirname(path);

    // const MarkdownComponents = {
    //     code({ node, inline, className, children, ...args }) {
    //         if (!className) {
    //             className = '';
    //         }

    //         console.log(node);
    //         console.log(node?.data);

    //         return;

    //         const source = children.toString().replace(/\n+$/, ''); // remove any trailing newlines
    //         const language = /language-(\w+)/.exec(className); // syntax highlighter expects only the language name ('cpp' from 'language-cpp')

    //         if (inline || (className == '')) {
    //             // inline code, or code without an explicit language specification
    //             //
    //             // ```inline code```
    //             //
    //             // ```
    //             // code with no language
    //             // ```
    //             // return (
    //             //     <code style={darcula} {...args}>
    //             //         {source}
    //             //     </code>
    //             // )
    //         }
    //         else {
    //             let split = source.split('\n');

    //             // manually support git diff syntax to maintain main language syntax highlighting
    //             // '+' for added line, '-' for removed line (must be the first character of the line)
    //             const added = split.map((_, lineNumber) => lineNumber).filter(lineNumber => split[lineNumber].match(/^[+].*/));
    //             const removed = split.map((_, lineNumber) => lineNumber).filter(lineNumber => split[lineNumber].match(/^[-].*/));

    //             // adding a '!' to the beginning of any line causes the line appearing highlighted
    //             const highlighted = split.map((_, lineNumber) => lineNumber).filter(lineNumber => split[lineNumber].match(/^[!].*/));

    //             // remove '!' from highlighted lines.
    //             for (let i = 0; i < highlighted.length; i++) {
    //                 split[highlighted[i]] = split[highlighted[i]].substring(1);
    //             }

    //             return (
    //                 <SyntaxHighlighter
    //                     language={language[1]}
    //                     style={darcula}
    //                     showLineNumbers={true}
    //                     startingLineNumber={0}
    //                     customStyle={{
    //                         padding: 0,
    //                         borderRadius: '10px'
    //                     }}
    //                     lineNumberContainerStyle={{
    //                         display: 'none',
    //                         minWidth: 0,
    //                         paddingRight: 0
    //                     }}
    //                     lineNumberStyle={
    //                         {
    //                             display: 'none',
    //                             minWidth: 0,
    //                             paddingRight: 0
    //                         }
    //                     }
    //                     wrapLines={true}
    //                     children={split.join('\n')}
    //                     lineProps={lineNumber => {
    //                         const style = {
    //                             display: 'block',
    //                             paddingRight: '1em',
    //                             paddingLeft: '1em'
    //                         };

    //                         if (lineNumber == 0) {
    //                             style.paddingTop = '0.5em';
    //                         }
    //                         else if (lineNumber == split.length - 1) {
    //                             style.paddingBottom = '0.5em';
    //                         }


    //                         if (added.includes(lineNumber)) {
    //                             style.backgroundColor = "rgb(40, 125, 62)";
    //                         }
    //                         else if (removed.includes(lineNumber)) {
    //                             style.backgroundColor = "#FF5555";
    //                         }
    //                         else if (highlighted.includes(lineNumber)) {
    //                             style.backgroundColor = "#44475a";
    //                         }

    //                         return { style };
    //                     }}
    //                     {...args}>


    //                 </SyntaxHighlighter>
    //             )
    //         }
    //     }
    // }

    // // define custom renderers for markdown components
    // const MarkdownComponents = {
    //     code({ node, inline, className, children, ...args }) {
    //         if (!className) {
    //             className = '';
    //         }

    //         // parse the code block language.
    //         let regex = /language-(\w+)/;
    //         const language = regex.test(className) ? regex.exec(className)[1] : null;
    //         const hasMetadata = node?.data?.meta ? true : false;

    //         // 
    //         const highlight = (lineNumber) => {
    //             const style = {};

    //             if (!hasMetadata) {
    //                 return { style };
    //             }

    //             // 
    //             regex = /{([\d,-]+)}/;
    //             const metadata = node.data.meta?.replace(/\s/g, ''); // remove spaces

    //             // 
    //             if (!regex.test(metadata)) {
    //                 return { style };
    //             }

    //             const lines = rangeParser(regex.exec(metadata)[1]); // only use first group
    //             if (!lines.includes(lineNumber)) {
    //                 return { style };
    //             }

    //             // highlighted line css style
    //             style.display = 'block';
    //             style.minWidth = scroll;
    //             style.overflow = 'hidden';
    //             style.background = "#44475a";
    //             return { style };
    //         }

    //         if (language) {
    //             return <SyntaxHighlighter
    //                 language={language}
    //                 style={darcula}
    //                 showLineNumbers={true}
    //                 startingLineNumber={1}
    //                 customStyle={{
    //                     padding: 0,
    //                     borderRadius: '10px',
    //                 }}
    //                 // lineNumberContainerStyle={{
    //                 //     display: 'none',
    //                 // }}
    //                 // lineNumberStyle={{
    //                 //     display: 'none',
    //                 // }}
    //                 wrapLines={hasMetadata}
    //                 children={children}
    //                 lineProps={lineNumber => (highlight(lineNumber))}
    //             >
    //             </SyntaxHighlighter>
    //         }
    //         else {
    //             // inline code block
    //         }
    //     }
    // }
    {/* {({ className, style, tokens, getLineProps, getTokenProps }) => (
                        <pre className={className} style={style}>
                            {tokens.map((line, i) => (
                                <pre {...getLineProps({ line, key: i })} style={{ margin: '0', borderRadius: '10px' }} >
                                    {line.map((token, key) => (
                                        <span {...getTokenProps({ token, key })} />
                                    ))}
                                </pre>
                            ))}
                        </pre>
                    )} */}
    const MarkdownComponents = {
        code({ node, inline, className, children, ...args }) {

            const source = children.toString().replace(/\n+$/, ''); // remove any trailing newlines

            // parse the code block language.
            let regex = /language-(\w+)/;
            const language = regex.test(className) ? regex.exec(className)[1] : '';

            // code block metadata stores which lines to highlight
            regex = /{([\d,-]+)}/;
            const metadata = node?.data?.meta?.replace(/\s/g, ''); // remove spaces


            //             const added = split.map((_, lineNumber) => lineNumber).filter(lineNumber => split[lineNumber].match(/^[+].*/));
            //             const removed = split.map((_, lineNumber) => lineNumber).filter(lineNumber => split[lineNumber].match(/^[-].*/));



            return (
                <Highlight {...defaultProps} code={source} language={language} theme={theme}>
                    {
                        function ({ className, style, tokens, getLineProps, getTokenProps }) {
                            // individual line scope
                            return (
                                <pre className={className} style={style} >
                                    {
                                        tokens.map(function (line, lineNumber) {
                                            // individual token scope

                                            const lineProps = getLineProps({ line, key: lineNumber });
                                            console.log(lineProps);

                                            return (
                                                <pre {...getLineProps({ line, key: lineNumber })} key={lineNumber}>
                                                    {
                                                        line.map(function (token, index) {
                                                            return (
                                                                <span {...getTokenProps({ token, index })} key={index} >
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


            // // 
            // const highlight = (lineNumber) => {
            //     const style = {};

            //     if (!hasMetadata) {
            //         return { style };
            //     }

            //     // 
            //     regex = /{([\d,-]+)}/;
            //     const metadata = node.data.meta?.replace(/\s/g, ''); // remove spaces

            //     // 
            //     if (!regex.test(metadata)) {
            //         return { style };
            //     }

            //     const lines = rangeParser(regex.exec(metadata)[1]); // only use first group
            //     if (!lines.includes(lineNumber)) {
            //         return { style };
            //     }

            //     // highlighted line css style
            //     style.display = 'block';
            //     style.minWidth = scroll;
            //     style.overflow = 'hidden';
            //     style.background = "#44475a";
            //     return { style };
            // }

            return (
                <SyntaxHighlighter language={language} style={darcula}>
                    {children}
                </SyntaxHighlighter>
            )

            //className={'language-diff-' + language + ' diff-highlight'}>
            return (
                <React.Fragment>
                    <pre >
                        <code className={className}>
                            {children}
                        </code>
                    </pre>
                </React.Fragment>
            );
        }
    };


    return (
        //     // <React.Fragment>
        //     //     <header>
        //     //         <Link to={parent} style={{ textDecoration: "none", fontWeight: "bold", fontSize: "2em" }}>..</Link>
        //     //         <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
        //     //             <h1> {name} </h1>
        //     //             <h1 style={{ textAlign: "right", fontWeight: "normal" }}>01/24/2023</h1>
        //     //         </div>
        //     //     </header>
        <React.Fragment>
            <ReactMarkdown components={MarkdownComponents}>
                {content}
            </ReactMarkdown>
        </React.Fragment>
        //     // </React.Fragment>
    )
}

// import { remark } from "remark";
// import html from "remark-html";
// import remarkPrism from "remark-prism";

// async function markdownToHtml(markdown) {
//   const result = await remark()
//     .use(html, { sanitize: false })
//     .use(remarkPrism, { plugins: ["line-numbers"] })
//     .process(markdown);

//   return result.toString();
// }


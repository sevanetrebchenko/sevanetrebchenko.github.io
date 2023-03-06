
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
                if (hidden.includes(i + 1)) {
                    tokens.splice(i, 1);
                }
            }

            let containers = [];

            for (let i = 0; i < tokens.length; ++i) {
                let elements = [];
                const current = i + 1;

                // line numbers
                if (useLineNumbers) {
                    elements.push(<div className='padding'></div>);

                    // right-justify line number text
                    const lineNumber = current.toString().padStart(tokens.length.toString().length, ' ');
                    elements.push(<div className='line-number'>{lineNumber}</div>);

                    elements.push(<div className='padding'></div>);
                    elements.push(<div className='separator'></div>);
                }

                // diff elements
                let override = '';

                if (added.length > 0 || removed.length > 0) {
                    let symbol = ' '; // empty

                    // apply padding to make diff symbol more visible
                    if (added.includes(current)) {
                        symbol = '+';
                        override = 'added';
                    }
                    else if (removed.includes(current)) {
                        symbol = '-';
                        override = 'removed';
                    }
                    else if (modified.includes(current)) {
                        override = 'modified';
                    }
                    else if (highlighted.includes(current)) {
                        override = 'highlighted';
                    }

                    const className = ('diff' + ' ' + override).trim();
                    elements.push(<div className={className}>{symbol}</div>);
                }
                else {
                    // modified / highlighted lines contain no diff symbol
                    if (modified.includes(current)) {
                        override = 'modified';
                    }
                    else if (highlighted.includes(current)) {
                        override = 'highlighted';
                    }

                    const className = ('padding' + ' ' + override).trim();
                    elements.push(<div className={className}></div>);
                }

                // code
                elements.push(
                    <div className={('line-block' + ' ' + override).trim()}>
                        {
                            tokens[i].map((token, index) => (
                                <span className={token.types.join(' ')} key={index}>
                                    {token.content}
                                </span>
                            ))
                        }
                    </div>
                );

                const className = ('padding' + ' ' + override).trim();
                elements.push(<div className={className}></div>);

                containers.push(
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

            // // code container
            // let code = [];
            // for (let i = 0; i < tokens.length; ++i) {
            //     let block = [];

            //     block.push(
            //         tokens[i].map((token, index) => (
            //             <span className={token.types.join(' ')} key={index}>
            //                 {token.content}
            //             </span>
            //         ))
            //     );

            //     let types = ['line-block'];
            //     const current = i + 1;

            //     if (added.includes(current)) {
            //         types.push('added');
            //     }
            //     else if (removed.includes(current)) {
            //         types.push('removed');
            //     }
            //     else if (modified.includes(current)) {
            //         types.push('modified');
            //     }
            //     else if (highlighted.includes(current)) {
            //         types.push('highlighted');
            //     }

            //     code.push(
            //         <div className={types.join(' ')}>
            //             {
            //                 block.map((element, index) => (
            //                     <React.Fragment key={index}>
            //                         {element}
            //                     </React.Fragment>
            //                 ))
            //             }
            //         </div>
            //     );
            // }

            // containers.push(
            //     <div className='line-container'>
            //         {
            //             code.map((element, index) => (
            //                 <React.Fragment key={index}>
            //                     {element}
            //                 </React.Fragment>
            //             ))
            //         }
            //     </div>
            // );

            // // container for diff elements
            // let diff = [];
            // for (let i = 0; i < tokens.length; ++i) {
            //     let types = [];
            //     const current = i + 1;

            //     if (added.length > 0 || removed.length > 0) {
            //         let symbol = '';
            //         types.push('diff-block');

            //         // added / removed elements should get padding to account for the diff symbol
            //         if (added.includes(current)) {
            //             symbol = '+';
            //             types.push('added');
            //         }
            //         else if (removed.includes(current)) {
            //             symbol = '-';
            //             types.push('removed');
            //         }
            //         else if (modified.includes(current)) {
            //             types.push('modified');
            //         }
            //         else if (highlighted.includes(current)) {
            //             types.push('highlighted');
            //         }

            //         // pad empty space so that all diff elements (including those that don't have diff symbols) are the same width
            //         diff.push(<div className={types.join(' ')}>{symbol.padStart(1, ' ')}</div>);
            //     }
            //     else {
            //         types.push('padding');

            //         if (modified.includes(current)) {
            //             types.push('modified');
            //         }
            //         else if (highlighted.includes(current)) {
            //             types.push('highlighted');
            //         }

            //         diff.push(<div className={types.join(' ')}></div>);
            //     }
            // }

            // containers.push(
            //     <div className='diff-container'>
            //         {
            //             diff.map((element, index) => (
            //                 <React.Fragment key={index}>
            //                     {element}
            //                 </React.Fragment>
            //             ))
            //         }
            //     </div>
            // );


            // // metadata container (line numbers, diff)
            // let meta = [];
            // for (let i = 0; i < tokens.length; ++i) {
            //     let block = [];
            //     const current = i + 1;

            //     block.push(<div className='padding'></div>);

            //     // line numbers
            //     if (useLineNumbers) {
            //         // right-justify line number text
            //         let content = (current).toString().padStart(tokens.length.toString().length, ' ');
            //         block.push(<div className='line-number'>{content}</div>);

            //         block.push(<div className='padding'></div>);
            //         block.push(<div className='separator'></div>);
            //     }

            //     // diff
            //     let types = [];

            //     if (added.length > 0 || removed.length > 0) {
            //         let symbol = '';
            //         types.push('diff');

            //         // added / removed elements should get padding to account for the diff symbol
            //         if (added.includes(current)) {
            //             symbol = '+';
            //             types.push('added');
            //         }
            //         else if (removed.includes(current)) {
            //             symbol = '-';
            //             types.push('removed');
            //         }
            //         else if (modified.includes(current)) {
            //             types.push('modified');
            //         }
            //         else if (highlighted.includes(current)) {
            //             types.push('highlighted');
            //         }

            //         // pad empty space so that all diff elements (including those that don't have diff symbols) are the same width
            //         block.push(<div className={types.join(' ')}>{symbol.padStart(1, ' ')}</div>);
            //     }
            //     else {
            //         types.push('padding');

            //         if (modified.includes(current)) {
            //             types.push('modified');
            //         }
            //         else if (highlighted.includes(current)) {
            //             types.push('highlighted');
            //         }

            //         block.push(<div className={types.join(' ')}></div>);
            //     }

            //     meta.push(
            //         <div className='meta-block'>
            //             {
            //                 block.map((element, index) => (
            //                     <React.Fragment key={index}>
            //                         {element}
            //                     </React.Fragment>
            //                 ))
            //             }
            //         </div>
            //     );
            // }

            // containers.push(
            //     <div className='meta-container'>
            //         {
            //             meta.map((element, index) => (
            //                 <React.Fragment key={index}>
            //                     {element}
            //                 </React.Fragment>
            //             ))
            //         }
            //     </div>
            // );

            // // code container
            // let code = [];
            // for (let i = 0; i < tokens.length; ++i) {
            //     code.push(
            //         <div className='line-block'>
            //             {
            //                 tokens[i].map((token, index) => (
            //                     <span className={token.types.join(' ')} key={index}>
            //                         {token.content}
            //                     </span>
            //                 ))
            //             }
            //         </div>
            //     );
            // }

            // containers.push(
            //     <div className='line-container'>
            //         {
            //             code.map((element, index) => (
            //                 <React.Fragment key={index}>
            //                     {element}
            //                 </React.Fragment>
            //             ))
            //         }
            //     </div>
            // );

            // 






            // // meta container
            // let meta = [];

            // for (let i = 0; i < tokens.length; ++i) {
            //     let block = [];

            //     if (i == 0) {
            //         // apply top-left border-radius manually to first element
            //         block.push(<div className='padding no-select' style={{borderTopLeftRadius: '10px'}}></div>);
            //     }
            //     else if (i == tokens.length - 1) {
            //         // apply bottom-left border-radius manually to last element
            //         block.push(<div className='padding no-select' style={{borderBottomLeftRadius: '10px'}}></div>);
            //     }
            //     else {
            //         block.push(<div className='padding no-select'></div>);
            //     }

            //     if (useLineNumbers) {
            //         // right-justify line number text
            //         let content = (i + 1).toString().padStart(tokens.length.toString().length, ' ');
            //         block.push(<div className='line-number no-select'>{content}</div>);

            //         block.push(<div className='padding no-select'></div>);   // padding
            //         block.push(<div className='separator no-select'></div>); // separator
            //     }

            //     meta.push(
            //         <div className='meta-block'>
            //             {
            //                 block.map((element, index) => (
            //                     <React.Fragment key={index}>
            //                         {element}
            //                     </React.Fragment>
            //                 ))
            //             }
            //         </div>
            //     )
            // }

            // containers.push(
            //     <div className='meta-container'>
            //         {
            //             meta.map((element, index) => (
            //                 <React.Fragment key={index}>
            //                     {element}
            //                 </React.Fragment>
            //             ))
            //         }
            //     </div>
            // )



            // for (let i = 0; i < tokens.length; ++i) {
            //     let elements = []; // elements for this line

            //     // line numbers
            //     if (useLineNumbers) {
            //         // right-justify line number text
            //         let content = (i + 1).toString().padStart(tokens.length.toString().length, ' ');
            //         elements.push(<div className='line-number no-select'>{content}</div>);

            //         elements.push(<div className='padding no-select'></div>);   // padding
            //         elements.push(<div className='separator no-select'></div>); // separator
            //     }

            //     // diff 
            //     let type = '';

            //     const current = i + 1;
            //     if (added.length > 0 || removed.length > 0) {
            //         let symbol = '';

            //         // added / removed elements should get padding to account for the diff symbol
            //         if (added.includes(current)) {
            //             symbol = '+';
            //             type = 'added';
            //         }
            //         else if (removed.includes(current)) {
            //             symbol = '-';
            //             type = 'removed';
            //         }
            //         else if (modified.includes(current)) {
            //             type = 'modified';
            //         }
            //         else if (highlighted.includes(current)) {
            //             type = 'highlighted';
            //         }

            //         const types = ['diff', 'no-select'];
            //         if (type.length > 0) {
            //             types.push(type);
            //         }

            //         // pad empty space so that all diff elements (including those that don't have diff symbols) are the same width
            //         elements.push(<div className={types.join(' ')}>{symbol.padStart(1, ' ')}</div>);
            //     }
            //     else {
            //         if (modified.includes(current)) {
            //             type = 'modified';
            //         }
            //         else if (highlighted.includes(current)) {
            //             type = 'highlighted';
            //         }

            //         const types = ['padding', 'no-select'];
            //         if (type.length > 0) {
            //             types.push(type);
            //         }

            //         elements.push(<div className={types.join(' ')}></div>);
            //     }

            //     // code
            //     elements.push(
            //         <div className={'code-block' + ' ' + type}>
            //             {
            //                 tokens[i].map((token, index) => (
            //                     <span className={token.types.join(' ')} key={index}>
            //                         {token.content}
            //                     </span>
            //                 ))
            //             }
            //         </div>
            //     );

            //     // padding
            //     const types = ['padding', 'no-select'];
            //     if (type.length > 0) {
            //         types.push(type);
            //     }
            //     elements.push(<div className={types.join(' ')}></div>);

            //     let className = 'line-container';
            //     if (i == 0) {
            //         className += '-top';
            //     }

            //     containers.push(
            //         <div className={className}>
            //             {
            //                 elements.map((element, index) => (
            //                     <React.Fragment key={index}>
            //                         {element}
            //                     </React.Fragment>
            //                 ))
            //             }
            //         </div>
            //     );
            // }













            // let containers = [];

            // if (useLineNumbers) {
            //     let meta = [];
            //     for (let i = 0; i < tokens.length; ++i) {
            //         let block = [];

            //         // right-justify line number text
            //         let content = (i + 1).toString().padStart(tokens.length.toString().length, ' ');
            //         block.push(<div className='line-number no-select'>{content}</div>);

            //         block.push(<div className='padding no-select'></div>);   // padding
            //         block.push(<div className='separator no-select'></div>); // separator

            //         meta.push(
            //             <div className='meta-block'>
            //                 {
            //                     block.map((element, index) => (
            //                         <React.Fragment key={index}>
            //                             {element}
            //                         </React.Fragment>
            //                     ))
            //                 }
            //             </div>
            //         )
            //     }
            //     containers.push(
            //         <div className='meta-container'>
            //             {
            //                 meta.map((element, index) => (
            //                     <React.Fragment key={index}>
            //                         {element}
            //                     </React.Fragment>
            //                 ))
            //             }
            //         </div>
            //     );
            // }



            // // container for code block
            // let code = [];
            // for (let i = 0; i < tokens.length; ++i) {
            //     let line = [];
            //     let types = [];

            //     // diff
            //     const current = i + 1;
            //     if (added.length > 0 || removed.length > 0) {
            //         // added / removed elements should get padding to account for the diff symbol
            //         if (added.includes(current)) {
            //             line.push(<div className='diff added no-select'>+</div>);
            //             types.push('added');
            //         }
            //         else if (removed.includes(current)) {
            //             line.push(<div className='diff removed no-select'>-</div>);
            //             types.push('removed');
            //         }
            //         else if (modified.includes(current)) {
            //             line.push(<div className='diff modified no-select'> </div>);
            //             types.push('modified');
            //         }
            //         else if (highlighted.includes(current)) {
            //             line.push(<div className='diff highlighted no-select'> </div>);
            //             types.push('highlighted');
            //         }
            //         else {
            //             // empty 'diff' element for padding purposes
            //             line.push(<div className='diff no-select'> </div>);
            //         }
            //     }
            //     else {
            //         // if diff consists of only modified / highlighted elements, do not append diff symbol (these tags do not have diff symbols like added / removed elements do)
            //         line.push(<div className='padding no-select'></div>);

            //         if (modified.includes(current)) {
            //             types.push('modified');
            //         }
            //         else if (hidden.includes(current)) {
            //             types.push('hidden');
            //         }
            //     }

            //     // code block
            //     line.push(
            //         <div className='code-block'>
            //             {
            //                 tokens[i].map((token, index) => (
            //                     <span className={token.types.join(' ')} key={index}>
            //                         {token.content}
            //                     </span>
            //                 ))
            //             }
            //         </div>
            //     );

            //     code.push(
            //         <div className={'line-block ' + types.join(' ')}>
            //             {
            //                 line.map((element, index) => (
            //                     <React.Fragment key={index}>
            //                         {element}
            //                     </React.Fragment>
            //                 ))
            //             }
            //         </div>
            //     );
            // }



            // let lines = [];





            // for (let i = 0; i < tokens.length; ++i) {
            //     let elements = [];


            //     // line numbers
            //     if (useLineNumbers) {
            //         // right-justify line number text
            //         let content = (i + 1).toString().padStart(tokens.length.toString().length, ' ');
            //         elements.push(<div className='line-number no-select'>{content}</div>);

            //         elements.push(<div className='padding no-select'></div>); // padding
            //         elements.push(<div className='separator no-select' />);   // separator
            //     }



            //     // code block
            //     elements.push(
            //         <div className={types.join(' ')}>
            //             {
            //                 tokens[i].map((token, index) => (
            //                     <span className={token.types.join(' ')} key={index}>
            //                         {token.content}
            //                     </span>
            //                 ))
            //             }
            //         </div>
            //     );

            //     lines.push(
            //         <div className='line-container'>
            //             {
            //                 elements.map((element, index) => (
            //                     <React.Fragment key={index}>
            //                         {element}
            //                     </React.Fragment>
            //                 ))
            //             }
            //         </div>
            //     );
            // }

            return (
                <div className='root'>
                    <div className={'code-container ' + className}>
                        {
                            containers.map((element, index) => (
                                <React.Fragment key={index}>
                                    {element}
                                </React.Fragment>
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

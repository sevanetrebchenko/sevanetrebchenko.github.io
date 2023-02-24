
import React from 'react'
import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { join, basename, dirname, extname } from 'path-browserify'
import ReactMarkdown from 'react-markdown'
import RemarkGFM from 'remark-gfm'
import RehypeRaw from 'rehype-raw'

import { Prism } from "prism-react-renderer";
import rangeParser from 'parse-numeric-range'
import { lang } from 'moment'
import { Token } from 'prismjs'

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
            let added = [];
            let removed = [];
            let modified = [];
            let hidden = [];
            let highlighted = [];

            const parseMetadata = function (line) {
                // parsing: added lines 
                {
                    const regex = /\badded\b:{[-,\d\s]+}/g;
                    const match = regex.exec(line);
                    if (match) {
                        added.push(...rangeParser(match[0].replace(/[^-,\d]+/g, '')));
                    }
                }

                // parsing: removed lines
                {
                    const regex = /\bremoved\b:{[-,\d\s]+}/g;
                    const match = regex.exec(line);
                    if (match) {
                        removed.push(...rangeParser(match[0].replace(/[^-,\d]+/g, '')));
                    }
                }

                // parsing: modified lines
                {
                    const regex = /\bmodified\b:{[-,\d\s]+}/g;
                    const match = regex.exec(line);
                    if (match) {
                        modified.push(...rangeParser(match[0].replace(/[^-,\d]+/g, '')));
                    }
                }

                // parsing: hidden lines
                {
                    const regex = /\bhidden\b:{[-,\d\s]+}/g;
                    const match = regex.exec(line);
                    if (match) {
                        hidden.push(...rangeParser(match[0].replace(/[^-,\d]+/g, '')));
                    }
                }

                // parsing: highlighted lines
                {
                    const regex = /\bhighlighted\b:{[-,\d\s]+}/g;
                    const match = regex.exec(line);
                    if (match) {
                        highlighted.push(...rangeParser(match[0].replace(/[^-,\d]+/g, '')));
                    }
                }
            }

            

            let preprocessorDirectives = [];
            let isDefined = true;

            const parsePreprocessorDirectives = function (tokens) {
                if (typeof parsePreprocessorDirectives.initialized == 'undefined') {
                    // scopes keep track of conditional preprocessor branches
                    // {
                    //     hasActiveBranch: whether conditional preprocessor block has an active (defined) branch
                    //     originalState: defined state before current conditional preprocessor block
                    // }
                    parsePreprocessorDirectives.scopes = [];

                    parsePreprocessorDirectives.initialized = true;
                }

                let line = '';
                for (let token of tokens) {
                    line += token.content.toString();
                }

                // notes: 
                //  - asserting position at the beginning of the line in regex (^) guarantees preprocessor directives that have been commented out do not return valid matches
                //  - top-level preprocessor directives always appear defined

                // parsing: #define <TOKEN>
                {
                    const regex = /^\s*#define [A-Z0-9_]+/;
                    const match = regex.exec(line);

                    if (match) {
                        const directive = match[0].replace(/[#define\s()]/g, '').trim();

                        if (isDefined) {
                            // preprocessor defines are only valid if they appear within a defined preprocessor block
                            if (!preprocessorDirectives.includes(directive)) {
                                preprocessorDirectives.push(directive);
                            }
                        }

                        return {
                            forceDefine: isDefined,
                            isNextDefined: isDefined
                        };
                    }
                }

                // parsing: #if defined(<TOKEN>)
                {
                    const regex = /^\s*#if defined\([A-Z0-9_]+\)/;
                    const match = regex.exec(line);

                    if (match) {
                        const directive = match[0].replace(/[#if\sdefined()]+/g, '').trim();
                        const isBranchActive = preprocessorDirectives.includes(directive);
                        const isTopLevel = parsePreprocessorDirectives.scopes.length == 0;

                        parsePreprocessorDirectives.scopes.push({
                            hasActiveBranch: isBranchActive,
                            originalState: isDefined
                        });

                        return {
                            forceDefine: isTopLevel || isDefined,
                            isNextDefined: isBranchActive && isDefined
                        };
                    }
                }

                // parsing: #elif defined(<TOKEN>)
                {
                    const regex = /^\s*#elif defined\([A-Z0-9_]+\)/;
                    const match = regex.exec(line);

                    if (match) {
                        const directive = match[0].replace(/[#elifdefined\s()]/g, '').trim();
                        const isBranchActive = preprocessorDirectives.includes(directive);

                        if (parsePreprocessorDirectives.scopes.length == 0) {
                            // invalid syntax, but process it like it is
                            console.error("Encountered #elif(...) preprocessor directive without prior #if(...) directive (invalid syntax).");
                            return {
                                forceDefine: isDefined,
                                isNextDefined: isBranchActive && isDefined
                            };
                        }

                        const isTopLevel = parsePreprocessorDirectives.scopes.length == 1; // #if(...) directive opened a new scope
                        const hasActiveBranch = parsePreprocessorDirectives.scopes[parsePreprocessorDirectives.scopes.length - 1].hasActiveBranch;
                        return {
                            forceDefine: isTopLevel || isDefined,
                            isNextDefined: !hasActiveBranch && isBranchActive && isDefined
                        };
                    }
                }

                // parsing: #else
                {
                    let regex = /^\s*#else/;
                    let match = regex.exec(line);

                    if (match) {
                        if (parsePreprocessorDirectives.scopes.length == 0) {
                            // invalid syntax, but process it like it is
                            console.error("Encountered #else preprocessor directive without prior #if(...) directive (invalid syntax).");
                            return {
                                forceDefine: isDefined,
                                isNextDefined: isDefined
                            };
                        }

                        const isTopLevel = parsePreprocessorDirectives.scopes.length == 1;
                        const hasActiveBranch = parsePreprocessorDirectives.scopes[parsePreprocessorDirectives.scopes.length - 1].hasActiveBranch;
                        return {
                            forceDefine: isTopLevel || isDefined,
                            isNextDefined: !hasActiveBranch && isDefined
                        };
                    }
                }

                // parsing: #endif
                {
                    let regex = /^\s*#endif/;
                    let match = regex.exec(line);

                    if (match) {
                        if (parsePreprocessorDirectives.scopes.length == 0) {
                            // invalid syntax, but process like it is
                            console.error("Encountered #endif preprocessor directive without prior #if(...) directive (invalid syntax).");
                            return {
                                forceDefine: isDefined,
                                isNextDefined: isDefined
                            };
                        }

                        const isTopLevel = parsePreprocessorDirectives.scopes.length == 1;
                        const originalState = parsePreprocessorDirectives.scopes[parsePreprocessorDirectives.scopes.length - 1].originalState;
                        parsePreprocessorDirectives.scopes.pop(); // clear preprocessor block scope

                        return {
                            forceDefine: isTopLevel || originalState,
                            isNextDefined: originalState
                        };
                    }
                }

                return {
                    forceDefine: false,
                    isNextDefined: isDefined
                };
            }

            let memberVariables = [];

            const parseMemberVariables = (tokens) => {
                if (typeof parseMemberVariables.initialized == 'undefined') {
                    parseMemberVariables.scopes = [];
                    parseMemberVariables.initialized = true;
                }

                let line = '';
                for (const token of tokens) {
                    line += token.content.toString();
                }

                // regex for class / enum definition:
                //  - class ... {
                //  - enum class ... {
                //  - enum ... {  
                // note: my personal coding style always has the scope opening brace on the same line
                let regex = /^\s*(?:(?:\benum\b\s+)?\bclass\b\s+[a-zA-Z0-9]+|\benum\b\s+[a-zA-Z0-9]+)/;
                let match = regex.exec(line);

                if (match) {
                    let open = false;
                    for (const token of tokens) {
                        if (token.types.includes('punctuation') && token.content == '{') {
                            // register start of class definition (not just declaration)
                            open = true;
                            break;
                        }
                    }

                    if (!open) {
                        // class declaration has no member variables
                        return;
                    }

                    parseMemberVariables.scopes.push(true);
                    return;
                }

                // determine if current line is opening a new scope
                for (const token of tokens) {
                    if (token.types.includes('punctuation') && token.content == '{') {
                        // new scope is a function / lambda (if new scope was a nested class / struct ir would have been processed above)
                        // do not register member variables from functions / lambdas
                        parseMemberVariables.scopes.push(false);
                        return;
                    }
                }

                // determine if current line is closing an existing scope
                for (const token of tokens) {
                    if (token.types.includes('punctuation') && token.content == '}') {
                        parseMemberVariables.scopes.pop();
                        return;
                    }
                }

                if (parseMemberVariables.scopes.length > 0) {
                    for (const token of tokens) {
                        const content = token.content;
                        const types = token.types;
                        const isScopeValid = parseMemberVariables.scopes[parseMemberVariables.scopes.length - 1];
    
                        if (types.includes('plain') && isScopeValid) {
                            if (content.replace(/\s/g, '').length == 0) {
                                // ignore whitespace tokens
                                continue;
                            }
    
                            // ignore tokens that have been classified as other (custom) types but have not had their token types updated
                            if (classes.includes(content)) {
                                continue;
                            }
    
                            if (namespaces.includes(content)) {
                                continue;
                            }
    
                            if (preprocessorDirectives.includes(content)) {
                                continue;
                            }
    
                            memberVariables.push(content);
                        }
                    }
                }
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
                            else {
                                updated.push({
                                    content: tokens[i].content,
                                    types: tokens[i].types
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
                                types: ['token', 'macro', 'property', 'directive', 'keyword']
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
                        else if (tokens[i].content == 'ifdef' || tokens[i].content == 'ifndef' || tokens[i].content == 'elifdef' || tokens[i].content == 'elifndef') {
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
                            // unmodified (include, endif, define)
                            updated.push({
                                content: tokens[i].content,
                                types: tokens[i].types
                            });
                        }
                    }
                    else if (tokens[i].types.includes('plain') || (tokens[i].types.includes('macro') && tokens[i].types.includes('expression'))) {
                        // namespace + class + macro names

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
                        else if (preprocessorDirectives.includes(tokens[i].content)) {
                            updated.push({
                                content: tokens[i].content,
                                types: ['token', 'macro', 'property', 'macro-name']
                            });
                        }
                        else if (memberVariables.includes(tokens[i].content)) {
                            updated.push({
                                content: tokens[i].content,
                                types: ['token', 'member-variable']
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

                for (let i in updated) {
                    if (!isDefined) {
                        updated[i].types.push('undefined'); // top-level css style
                    }
                }

                return updated;
            }



            // mak
            const regex = /language-(\w+)/;
            const language = regex.test(className) ? regex.exec(className)[1] : '';

            parseMetadata(node?.data?.meta);

            const processToken = function (token, parentTypes = []) {
                let tokenized = [];

                if (typeof token == 'string') {
                    // split on newlines and whitespace characters
                    let temp = [];
                    for (let word of token.split(/(?=[\n\s])|(?<=[\n\s])/g)) {
                        temp.push(word);
                    }

                    for (let i = 0; i < temp.length; ++i) {
                        if (temp[i] == '\n' || temp[i].length > 1) {
                            // newlines and words get appended unchanged
                            // newlines are excluded as they will be used for splitting lines
                            tokenized.push({
                                types: ['plain'],
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
                            // certain token types (ex. macro expressions) appear as nested 'string' tokens and 
                            // should be manually processed to maintain token typing
                            if (typeof element == 'string') {
                                console.log(element); // ' Tddd'

                                tokenized.push({
                                    types: types,
                                    content: element
                                });
                            }
                            else {
                                tokenized = tokenized.concat(processToken(element, types));
                            }
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
                let tokens = [[]]; // Token[][]
                let index = 0;

                let line = [];

                for (let token of Prism.tokenize(source.toString(), Prism.languages[language])) {
                    // console.log(token);
                    let current = processToken(token);
                    // console.log(current);

                    for (let element of current) {
                        line.push(element);

                        if (element.content === '\n') {
                            tokens[index] = [...line];
                            tokens[++index] = [];

                            line = []; // clear
                        }
                    }
                }

                return tokens;
            }

            // tokenize source code using parsed language
            const tokens = tokenize(children.toString(), language);

            for (let i = 0; i < tokens.length; ++i) {
                parseNamespaceNames(tokens[i]);
                parseClassNames(tokens[i]);
                parseMemberVariables(tokens[i]);

                const { forceDefine, isNextDefined } = parsePreprocessorDirectives(tokens[i]);
                if (forceDefine) {
                    isDefined = true;
                }

                tokens[i] = updateSyntaxHighlighting(tokens[i]);
                isDefined = isNextDefined;
            }

            // // remove hidden lines
            // for (let i = tokens.length - 1; i >= 0; --i) {
            //     if (hidden.includes(i)) {
            //         tokens.splice(i, 1);
            //     }
            // }

            // generate react elements for line numbers
            // let lineNumbers = [];
            // const requiresPadding = added.length > 0 || removed.length > 0 || modified.length > 0 || highlighted.length > 0;

            // for (let i = 0; i < tokens.length; ++i) {
            //     if (added.includes(i)) {
            //         lineNumbers.push({
            //             content: '+',
            //             className: 'diff added'
            //         });
            //     }
            //     else if (removed.includes(i)) {
            //         lineNumbers.push({
            //             content: '-',
            //             className: 'diff removed'
            //         });
            //     }
            //     else if (modified.includes(i)) {
            //         lineNumbers.push({
            //             content: ' ',
            //             className: 'diff modified'
            //         });
            //     }
            //     else if (highlighted.includes(i)) {
            //         lineNumbers.push({
            //             content: ' ',
            //             className: 'diff highlighted'
            //         });
            //     }
            //     else if (requiresPadding) {
            //         lineNumbers.push({
            //             content: ' ',
            //             className: ''
            //         });
            //     }
            // }

            return (
                <pre className={className}>
                    {/* <pre className='meta'>
                        {
                            lineNumbers.map((element, index) => (
                                <span className={element.className} key={index}>
                                    {element.content}
                                </span>
                            ))
                        }
                    </pre> */}
                    <pre className='code'>
                        {
                            tokens.map((line, index) => (
                                <pre className='line' key={index}>
                                    {
                                        line.map((token, index) => (
                                            <span className={token.types.join(' ')} key={index}>
                                                {token.content}
                                            </span>
                                        ))
                                    }
                                </pre>
                            ))
                        }
                    </pre>
                </pre>
            );
        }
    }

    return (
        <React.Fragment >
            <ReactMarkdown components={MarkdownComponents}>
                {content}
            </ReactMarkdown>
        </React.Fragment >
    );
}

// utility functionality
const code = new function() {
    this.cpp = new function() {
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
            let line = '';
            for (let token of tokens) {
                line += token.content.toString();
            }

            // valid syntax highlighting variants:
            //   - namespace a::b::c { ... }
            //   - using namespace a::b::c;
            //   - namespace alias = a::b::c;
            //   - using a::b; (namespace class member)

            // parsing: namespace a::b::c { ... }
            {
                let regex = /^\s*(?:\bnamespace\b)\s+[a-zA-Z0-9:\s]+/;
                let match = regex.exec(line);

                if (match) {
                    // split by scope resolution operator
                    const names = match[0].replace(/\bnamespace\b|[:]/g, ' ').trim().split(/\s+/);

                    for (let name of names) {
                        if (!namespaces.includes(name)) {
                            namespaces.push(name);
                        }
                    }
                }
            }

            // parsing: using namespace a::b::c;
            {
                let regex = /^\s*(?:\busing\b)\s+(?:\bnamespace\b)\s+[a-zA-Z0-9:\s]+/;
                let match = regex.exec(line);

                if (match) {
                    // split by scope resolution operator
                    const names = match[0].replace(/(\busing\b)|(\bnamespace\b)|[:]/g, ' ').trim().split(/\s+/);

                    for (let name of names) {
                        if (!namespaces.includes(name)) {
                            namespaces.push(name);
                        }
                    }
                }
            }

            // parsing: namespace alias = a::b::c;
            {
                let regex = /^\s*(?:\bnamespace\b)\s+\w+\s+=\s+[a-zA-Z0-9:\s]+/;
                let match = regex.exec(line);

                if (match) {
                    const names = match[0].replace(/(\bnamespace\b)|[:=]/g, ' ').trim().split(/\s+/);

                    for (let name of names) {
                        if (!namespaces.includes(name)) {
                            namespaces.push(name);
                        }
                    }
                }
            }

            // parsing: using alias = a::b::c; (where c is a namespace class member)
            {
                let regex = /^\s*(?:\busing\b)\s+\w+\s+=\s+[a-zA-Z0-9:<>,\*&\s]+/;
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
                    const names = match[0].replace(/(\busing\b)|[:<>,\*&\s=]/g, ' ').trim().split(/\s+/g);
                    console.log(names);

                    for (let name of names) {
                        if (keywords.includes(name)) {
                            continue;
                        }

                        const isLowercase = /^[a-z_]*$/.test(name);

                        // namespaces are always going to be lowercase
                        if (!classes.includes(name) && !namespaces.includes(name) && isLowercase) {
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

    }

}

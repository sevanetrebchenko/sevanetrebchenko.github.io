
let memberVariables = [];

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
]

let namespaces = [
    // standard namespaces
    'std'
];

let preprocessorDirectives = [];
let isDefined = true;

import "./cpp.css"

function isLowercase(token) {
    return /^[a-z0-9_]*$/.test(token);
}

function parseClassNames(tokens) {
    // Include classes parsed by Prism
    for (let token of tokens) {
        let content = token.content;
        let types = token.types;

        if (types.includes("class-name") && !classes.includes(content)) {
            classes.push(content);
        }
    }

    let line = "";
    for (let token of tokens) {
        line += token.content.toString();
    }

    // using alias = a::b::c; (where c is a class within namespace a::b)
    {
        const regexp = /^\s*using \w+ = [\s\S]+/;
        const match = regexp.exec(line);
        if (match) {
            const names = match[0].replace(/\s*using\s+/, "").replace(/[,\s<>=]+/g, ":").split(":");

            for (const i in names) {
                let name = names[i];

                // Alias may be for a pointer / reference type
                name = name.replace(/[*&]+/g, "");
                if (name === "") {
                    continue;
                }
                if (keywords.includes(name)) {
                    // Type may contain C++ keywords, which should be ignored
                    continue;
                }

                // In my personal coding style, lowercase identifiers represent namespaces and should not be considered here
                if (!classes.includes(name) && !isLowercase(name)) {
                    classes.push(name);
                }
            }
        }
    }
}

function parseNamespaceNames(tokens) {
    let line = '';
    for (let token of tokens) {
        line += token.content.toString();
    }

    // As this syntax highlighting is based on my personal C++ coding style, there is a subset of valid namespace variants that I use:
    //   - namespace a::b::c { ... }
    //   - using namespace a::b::c;
    //   - namespace alias = a::b::c;

    // namespace a::b::c { ... }
    {
        const regexp = /^\s*\bnamespace\b\s+[a-zA-Z0-9_:\s]+/;
        const match = regexp.exec(line);
        if (match) {
            // Split by scope resolution operator
            const names = match[0].replace(/\bnamespace\b|:/g, " ").trim().split(/\s+/);
            for (const name of names) {
                if (!namespaces.includes(name)) {
                    namespaces.push(name);
                }
            }
        }
    }

    // using namespace a::b::c;
    {
        const regexp = /^\s*\busing\b\s+\bnamespace\b\s+[a-zA-Z0-9_:\s]+/;
        const match = regexp.exec(line);
        if (match) {
            // Split by scope resolution operator
            const names = match[0].replace(/\busing\b|\bnamespace\b|:/g, " ").trim().split(/\s+/);
            for (const name of names) {
                if (!namespaces.includes(name)) {
                    namespaces.push(name);
                }
            }
        }
    }

    // namespace alias = a::b::c;
    {
        const regexp = /^\s*\bnamespace\b\s+\w+\s+=\s+[a-zA-Z0-9_:\s]+/;
        const match = regexp.exec(line);
        if (match) {
            const names = match[0].replace(/\bnamespace\b|[:=]/g, ' ').trim().split(/\s+/);
            for (const name of names) {
                if (!namespaces.includes(name)) {
                    namespaces.push(name);
                }
            }
        }
    }
}

function parsePreprocessorDirectives(tokens) {
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

function parseMemberVariables(tokens) {
    if (typeof parseMemberVariables.initialized == 'undefined') {
        parseMemberVariables.scopes = [];
        parseMemberVariables.initialized = true;
    }

    let line = '';
    for (const token of tokens) {
        line += token.content.toString();
    }

    // regex for class / struct / enum definition:
    //  - class ... {
    //  - enum class ... {
    //  - enum ... {
    // note: my personal coding style always has the scope opening brace on the same line
    let regex = /^\s*(?:(?:\benum\b\s+)?\bclass\b\s+[a-zA-Z0-9]+|\benum\b\s+[a-zA-Z0-9]+)|(?:\bstruct\b\s+[a-zA-Z0-9]+)/;
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
            // new scope is a function / lambda (if new scope was a nested class / struct or would have been processed above)
            // do not register member variables from functions / lambdas
            parseMemberVariables.scopes.push(false);
            return;
        }
    }

    // determine if current line is closing an existing scope
    for (const token of tokens) {
        if (token.types.includes('punctuation') && token.content == '}') {
            parseMemberVariables.scopes.pop();
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

function updateSyntaxHighlighting(tokens) {
    let updatedTokens = [];

    // remove 'base-clause' types from any tokens
    for (let i = 0; i < tokens.length; ++i) {
        let types = [];

        for (let type of tokens[i].types) {
            if (type != 'base-clause') {
                types.push(type);
            }
        }

        tokens[i].types = types;
    }

    for (let i = 0; i < tokens.length; ++i) {
        if (tokens[i].types.includes('punctuation')) {
            if (tokens[i].content == ';') {
                // highlight ; as a keyword
                updatedTokens.push({
                    content: ';',
                    types: ['semicolon']
                });
            }
            else {
                // unmodified
                updatedTokens.push({
                    content: tokens[i].content,
                    types: tokens[i].types
                });
            }
        }
        else if (tokens[i].types.includes('double-colon')) {
            // parsing: scope resolution operator (namespace / class name)
            // token: scope resolution operator
            updatedTokens.push({
                content: tokens[i].content,
                types: tokens[i].types
            });

            if (++i == tokens.length) {
                break;
            }

            if (tokens[i].types.includes('plain')) {
                if (namespaces.includes(tokens[i].content)) {
                    // token: namespace name
                    updatedTokens.push({
                        content: tokens[i].content,
                        types: ['namespace-name']
                    });
                }
                else if (classes.includes(tokens[i].content) || tokens[i].content == 'type') {
                    // token: class name or ...::type
                    updatedTokens.push({
                        content: tokens[i].content,
                        types: ['class-name']
                    });
                }
                else {
                    updatedTokens.push({
                        content: tokens[i].content,
                        types: tokens[i].types
                    });
                }
            }
            else {
                // unmodified
                updatedTokens.push({
                    content: tokens[i].content,
                    types: tokens[i].types
                });
            }
        }
        else if (tokens[i].types.includes('directive-hash')) {
            // token: directive hash
            updatedTokens.push({
                content: tokens[i].content,
                types: ['macro-directive-hash']
            });

            if (++i == tokens.length) {
                break;
            }

            // note: I make the assumption that preprocessor directives do not have spaces between the directive hash and the directive

            if (tokens[i].content == 'if' || tokens[i].content == 'elif') {
                // parsing: #if defined(...) / #if defined ... or #elif defined(...) / #elif defined ...
                // token: directive
                updatedTokens.push({
                    content: tokens[i].content,
                    types: ['macro-directive']
                });

                if (++i == tokens.length) {
                    break;
                }

                // token: whitespace
                updatedTokens.push({
                    content: tokens[i].content,
                    types: tokens[i].types
                });

                if (++i == tokens.length) {
                    break;
                }

                // token: defined
                updatedTokens.push({
                    content: tokens[i].content,
                    types: ['macro-directive']
                });

                if (++i == tokens.length) {
                    break;
                }

                {
                    // remove 'macro' and 'expression' types from opening parentheses ( defined(...) ) or whitespace ( defined ... )
                    //                                                                         ^                              ^
                    let types = [];
                    for (let type of tokens[i].types) {
                        if (type == 'macro') {
                            continue;
                        }

                        if (type == 'expression') {
                            continue;
                        }

                        types.push(type);
                    }

                    // token: whitespace or (
                    updatedTokens.push({
                        content: tokens[i].content,
                        types: types
                    });

                    if (++i == tokens.length) {
                        break;
                    }
                }

                // token: macro name
                updatedTokens.push({
                    content: tokens[i].content,
                    types: ['macro-name']
                });

                if (++i == tokens.length) {
                    break;
                }

                {
                    // remove 'macro' and 'expression' types from closing parentheses ( defined(...) ) or whitespace ( defined ... )
                    //                                                                             ^                              ^
                    let types = [];
                    for (let type of tokens[i].types) {
                        if (type == 'macro') {
                            continue;
                        }

                        if (type == 'expression') {
                            continue;
                        }

                        types.push(type);
                    }

                    if (types.length == 0) {
                        types.push('plain');
                    }

                    // token: whitespace or )
                    updatedTokens.push({
                        content: tokens[i].content,
                        types: types
                    });
                }
            }
            else if (tokens[i].content == 'ifdef' || tokens[i].content == 'ifndef' || tokens[i].content == 'elifdef' || tokens[i].content == 'elifndef') {
                // parsing: #ifdef ... / #ifndef ... or #elifdef ... / #elifndef ...
                // token: directive
                updatedTokens.push({
                    content: tokens[i].content,
                    types: tokens[i].types
                });

                if (++i == tokens.length) {
                    break;
                }

                // token: whitespace
                updatedTokens.push({
                    content: tokens[i].content,
                    types: tokens[i].types
                });

                if (++i == tokens.length) {
                    break;
                }

                // token: macro name
                updatedTokens.push({
                    content: tokens[i].content,
                    types: ['macro-name']
                });
            }
            else {
                // parsing: define, endif, pragma, include
                // token: directive
                updatedTokens.push({
                    content: tokens[i].content,
                    types: ['macro-directive']
                });

                if (++i == tokens.length) {
                    break;
                }

                // token: whitespace
                updatedTokens.push({
                    content: tokens[i].content,
                    types: ['plain']
                });

                // remove 'macro' and 'expression' types from any of the tokens in the expression and reparse
                for (let j = i + 1; j < tokens.length; ++j) {
                    let types = [];

                    for (let type of tokens[j].types) {
                        if (type == 'macro') {
                            continue;
                        }

                        if (type == 'expression') {
                            continue;
                        }

                        types.push(type);
                    }

                    if (types.length == 0) {
                        types.push('plain');
                    }

                    tokens[j].types = types;
                }
            }
        }
        else if (tokens[i].types.includes('plain')) {
            let types = [];

            if (namespaces.includes(tokens[i].content)) {
                types = ['namespace-name'];
            }
            else if (classes.includes(tokens[i].content)) {
                types = ['class-name'];
            }
            else if (memberVariables.includes(tokens[i].content)) {
                types = ['member-variable'];
            }
            else if (preprocessorDirectives.includes(tokens[i].content)) {
                types = ['macro-name'];
            }
            else {
                types = tokens[i].types;
            }

            updatedTokens.push({
                content: tokens[i].content,
                types: types
            });
        }
        else {
            // unmodified
            updatedTokens.push({
                content: tokens[i].content,
                types: tokens[i].types
            });
        }
    }

    for (let i in updatedTokens) {
        if (!isDefined) {
            updatedTokens[i].types.push('undefined'); // top-level css style
        }
    }

    return updatedTokens;
}

// cpp-specific processing
export default function processLanguageCpp(tokens) {
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

    return tokens;
}
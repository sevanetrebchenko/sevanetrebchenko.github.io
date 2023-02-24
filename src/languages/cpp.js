
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

let namespaces = [
    // standard namespaces
    'std'
];

let preprocessorDirectives = [];
let isDefined = true;


function parseClassNames(tokens) {
    // register classes parsed by the parsing library
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

                // lowercase identifiers typically represent global variables or namespaces
                const isLowercase = /^[a-z_]*$/.test(name);
                if (!classes.includes(name) && !isLowercase) {
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

function updateSyntaxHighlighting(tokens) {
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

// cpp-specific processing
export default function processLanguageCpp(tokens) {
    for (let line of tokens) {
        parseNamespaceNames(line.content);
        parseClassNames(line.content);
        parseMemberVariables(line.content);
    
        const { forceDefine, isNextDefined } = parsePreprocessorDirectives(line.content);
        if (forceDefine) {
            isDefined = true;
        }
    
        line.content = updateSyntaxHighlighting(line.content);
        isDefined = isNextDefined;
    }

    return tokens;
}

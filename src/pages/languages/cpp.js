
let memberVariables = [];

// Contains a non-exhaustive list of standard C++ types I use
let classes = [
    // Containers
    "array",
    "vector",
    "list",
    "forward_list",
    "deque",
    "queue",
    "priority_queue",
    "stack",
    "set",
    "multiset",
    "map",
    "multimap",
    "unordered_set",
    "unordered_multiset",
    "unordered_map",
    "unordered_multimap",

    // Types
    "string",
    "wstring",
    "u16string",
    "u32string",
    "pair",
    "tuple",
    "complex",
    "random_device",
    "mt19937",
    "any",
    "optional",
    "variant",
    "function",
    "regex",
    "smatch",

    // Streams
    "cin",
    "cout",
    "cerr",
    "ifstream",
    "ofstream",
    "fstream",
    "istringstream",
    "ostringstream",
    "stringstream",

    // Managed pointers
    "unique_ptr",
    "shared_ptr",
    "weak_ptr",

    // Threading
    "thread",
    "mutex",
    "lock_guard",
    "unique_lock",
    "condition_variable",
    "future",
    "promise",
    "async",

    // Chrono library
    "time_point",
    "duration",
    "system_clock",
    "high_resolution_clock",

    // Exceptions
    "exception",
    "runtime_error",
    "logic_error",
    "domain_error",
    "invalid_argument",
    "out_of_range",

    "type" // Support for ::type to be registered as a class
];

let keywords = [
    "alignas",
    "alignof",
    "and",
    "and_eq",
    "asm",
    // "atomic_cancel",
    // "atomic_commit",
    // "atomic_noexcept",
    "auto",
    "bitand",
    "bitor",
    "bool",
    "break",
    "case",
    "catch",
    "char",
    "char8_t",
    "char16_t",
    "char32_t",
    "class",
    "compl",
    "concept",
    "const",
    "consteval",
    "constexpr",
    "constinit",
    "const_cast",
    "continue",
    "co_await",
    "co_return",
    "co_yield",
    "decltype",
    "default",
    "delete",
    "do",
    "double",
    "dynamic_cast",
    "else",
    "enum",
    "explicit",
    "export",
    "extern",
    "false",
    "float",
    "for",
    "friend",
    "goto",
    "if",
    "inline",
    "int",
    "long",
    "mutable",
    "namespace",
    "new",
    "noexcept",
    "not",
    "not_eq",
    "nullptr",
    "operator",
    "or",
    "or_eq",
    "private",
    "protected",
    "public",
    // "reflexpr",
    "register",
    "reinterpret_cast",
    "requires",
    "return",
    "short",
    "signed",
    "sizeof",
    "static",
    "static_assert",
    "static_cast",
    "struct",
    "switch",
    // "synchronized",
    "template",
    "this",
    "thread_local",
    "throw",
    "true",
    "try",
    "typedef",
    "typeid",
    "typename",
    "union",
    "unsigned",
    "using",
    "virtual",
    "void",
    "volatile",
    "wchar_t",
    "while",
    "xor",
    "xor_eq"
]

let namespaces = [
    // Standard namespaces
    "std",
    "chrono"
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
        // Scopes keep track of conditional preprocessor branches
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

    // Notes:
    //  - Asserting position at the beginning of the line in regex (^) guarantees preprocessor directives that have been commented out do not return valid matches
    //  - Top-level preprocessor directives always appear defined

    // #define <TOKEN>
    {
        const regexp = /^\s*#define\s+([A-Z0-9_]+)/;
        const match = regexp.exec(line);
        if (match) {
            const directive = match[0];

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

    // #if defined(<TOKEN>) or #if defined (<TOKEN>)
    {
        const regexp = /^\s*#if\s+defined\s*\(([A-Z0-9_]+)\)/;
        const match = regexp.exec(line);

        if (match) {
            const directive = match[0];
            const isBranchActive = preprocessorDirectives.includes(directive);
            const isTopLevel = parsePreprocessorDirectives.scopes.length === 0;

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

    // #if defined <TOKEN>
    {
        const regexp = /^\s*#if\s+defined\s+([A-Z0-9_]+)/;
        const match = regexp.exec(line);

        if (match) {
            const directive = match[0];
            const isBranchActive = preprocessorDirectives.includes(directive);
            const isTopLevel = parsePreprocessorDirectives.scopes.length === 0;

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

    // #elif defined(<TOKEN>) or #elif defined (<TOKEN>)
    {
        const regex = /^\s*#elif\s+defined\s*\(([A-Z0-9_]+\))/;
        const match = regex.exec(line);

        if (match) {
            const directive = match[0];
            const isBranchActive = preprocessorDirectives.includes(directive);

            if (parsePreprocessorDirectives.scopes.length === 0) {
                // Invalid syntax, but process it like it is
                console.error("Encountered #elif(...) preprocessor directive without prior #if(...) directive (invalid syntax).");
                return {
                    forceDefine: isDefined,
                    isNextDefined: isBranchActive && isDefined
                };
            }

            const isTopLevel = parsePreprocessorDirectives.scopes.length === 1; // #if(...) directive opened a new scope
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
            if (parsePreprocessorDirectives.scopes.length === 0) {
                // Invalid syntax, but process it like it is
                console.error("Encountered #else preprocessor directive without prior #if(...) directive (invalid syntax).");
                return {
                    forceDefine: isDefined,
                    isNextDefined: isDefined
                };
            }

            const isTopLevel = parsePreprocessorDirectives.scopes.length === 1;
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
            if (parsePreprocessorDirectives.scopes.length === 0) {
                // Invalid syntax, but process like it is
                console.error("Encountered #endif preprocessor directive without prior #if(...) directive (invalid syntax).");
                return {
                    forceDefine: isDefined,
                    isNextDefined: isDefined
                };
            }

            const isTopLevel = parsePreprocessorDirectives.scopes.length === 1;
            const originalState = parsePreprocessorDirectives.scopes[parsePreprocessorDirectives.scopes.length - 1].originalState;
            parsePreprocessorDirectives.scopes.pop(); // Clear preprocessor block scope

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

function parseClasses(tokens) {
    // Combine tokens into single sloc
    let source = "";
    for (const line of tokens) {
        for (const token of line) {
            source += token.content.toString();
        }
    }
    // console.log(source);

    // Regex expression for matching my classes / structs
    // Note: this is specialized to my C++ coding style
    //   - match[1]: templates (optional)
    //   - match[2]: class name
    //   - match[3]: inheritance string (optional)
    //   - match[4]: class body
    const regexp = /\s*(template\s*<\s*[^>]*\s*>)?\s*(?:class|struct)\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*([^;{]*))?\s*\{\s*([^{}]*(?:\{[^{}]*}[^{}]*)*)?}\s*;/g;

    let match;
    const matches = [];
    while ((match = regexp.exec(source)) !== null) {
        matches.push(match);
    }

    for (match of matches) {
        if (match[1]) {
            // template <typename ...>
        }

        if (match[2]) {
            // class name
            if (!classes.includes(match[2])) {
                classes.push(match[2]);
            }
        }

        if (match[3]) {
            // inheritance
        }
    }

    for (const m of matches) {
        console.log("Full match:", m[0]); // Entire matched string
        console.log("Template (if any):", m[1]); // First capturing group
        console.log("Class/struct name:", m[2]); // Second capturing group
        console.log("Base classes (if any):", m[3]); // Third capturing group
        console.log("Body (if any):", m[4]); // Fourth capturing group
    }
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

    // Remove 'base-clause' types from any tokens
    for (let i = 0; i < tokens.length; ++i) {
        let types = [];

        for (let type of tokens[i].types) {
            if (type !== "base-clause") {
                types.push(type);
            }
        }

        tokens[i].types = types;
    }

    for (let i = 0; i < tokens.length; ++i) {
        if (tokens[i].types.includes("punctuation")) {
            if (tokens[i].content === ";") {
                // Highlight ; as a keyword
                updatedTokens.push({
                    content: ";",
                    types: ["punctuation", "semicolon"],
                });
            }
            else {
                updatedTokens.push({
                    content: tokens[i].content,
                    types: tokens[i].types
                });
            }
        }
        // else if (tokens[i].types.includes('double-colon')) {
        //     // parsing: scope resolution operator (namespace / class name)
        //     // token: scope resolution operator
        //     updatedTokens.push({
        //         content: tokens[i].content,
        //         types: tokens[i].types
        //     });
        //
        //     if (++i == tokens.length) {
        //         break;
        //     }
        //
        //     if (tokens[i].types.includes('plain')) {
        //         if (namespaces.includes(tokens[i].content)) {
        //             // token: namespace name
        //             updatedTokens.push({
        //                 content: tokens[i].content,
        //                 types: ['namespace-name']
        //             });
        //         }
        //         else if (classes.includes(tokens[i].content) || tokens[i].content == 'type') {
        //             // token: class name or ...::type
        //             updatedTokens.push({
        //                 content: tokens[i].content,
        //                 types: ['class-name']
        //             });
        //         }
        //         else {
        //             updatedTokens.push({
        //                 content: tokens[i].content,
        //                 types: tokens[i].types
        //             });
        //         }
        //     }
        //     else {
        //         // unmodified
        //         updatedTokens.push({
        //             content: tokens[i].content,
        //             types: tokens[i].types
        //         });
        //     }
        // }
        // else if (tokens[i].types.includes('directive-hash')) {
        //     // token: directive hash
        //     updatedTokens.push({
        //         content: tokens[i].content,
        //         types: ['macro-directive-hash']
        //     });
        //
        //     if (++i == tokens.length) {
        //         break;
        //     }
        //
        //     // note: I make the assumption that preprocessor directives do not have spaces between the directive hash and the directive
        //
        //     if (tokens[i].content == 'if' || tokens[i].content == 'elif') {
        //         // parsing: #if defined(...) / #if defined ... or #elif defined(...) / #elif defined ...
        //         // token: directive
        //         updatedTokens.push({
        //             content: tokens[i].content,
        //             types: ['macro-directive']
        //         });
        //
        //         if (++i == tokens.length) {
        //             break;
        //         }
        //
        //         // token: whitespace
        //         updatedTokens.push({
        //             content: tokens[i].content,
        //             types: tokens[i].types
        //         });
        //
        //         if (++i == tokens.length) {
        //             break;
        //         }
        //
        //         // token: defined
        //         updatedTokens.push({
        //             content: tokens[i].content,
        //             types: ['macro-directive']
        //         });
        //
        //         if (++i == tokens.length) {
        //             break;
        //         }
        //
        //         {
        //             // remove 'macro' and 'expression' types from opening parentheses ( defined(...) ) or whitespace ( defined ... )
        //             //                                                                         ^                              ^
        //             let types = [];
        //             for (let type of tokens[i].types) {
        //                 if (type == 'macro') {
        //                     continue;
        //                 }
        //
        //                 if (type == 'expression') {
        //                     continue;
        //                 }
        //
        //                 types.push(type);
        //             }
        //
        //             // token: whitespace or (
        //             updatedTokens.push({
        //                 content: tokens[i].content,
        //                 types: types
        //             });
        //
        //             if (++i == tokens.length) {
        //                 break;
        //             }
        //         }
        //
        //         // token: macro name
        //         updatedTokens.push({
        //             content: tokens[i].content,
        //             types: ['macro-name']
        //         });
        //
        //         if (++i == tokens.length) {
        //             break;
        //         }
        //
        //         {
        //             // remove 'macro' and 'expression' types from closing parentheses ( defined(...) ) or whitespace ( defined ... )
        //             //                                                                             ^                              ^
        //             let types = [];
        //             for (let type of tokens[i].types) {
        //                 if (type == 'macro') {
        //                     continue;
        //                 }
        //
        //                 if (type == 'expression') {
        //                     continue;
        //                 }
        //
        //                 types.push(type);
        //             }
        //
        //             if (types.length == 0) {
        //                 types.push('plain');
        //             }
        //
        //             // token: whitespace or )
        //             updatedTokens.push({
        //                 content: tokens[i].content,
        //                 types: types
        //             });
        //         }
        //     }
        //     else if (tokens[i].content == 'ifdef' || tokens[i].content == 'ifndef' || tokens[i].content == 'elifdef' || tokens[i].content == 'elifndef') {
        //         // parsing: #ifdef ... / #ifndef ... or #elifdef ... / #elifndef ...
        //         // token: directive
        //         updatedTokens.push({
        //             content: tokens[i].content,
        //             types: tokens[i].types
        //         });
        //
        //         if (++i == tokens.length) {
        //             break;
        //         }
        //
        //         // token: whitespace
        //         updatedTokens.push({
        //             content: tokens[i].content,
        //             types: tokens[i].types
        //         });
        //
        //         if (++i == tokens.length) {
        //             break;
        //         }
        //
        //         // token: macro name
        //         updatedTokens.push({
        //             content: tokens[i].content,
        //             types: ['macro-name']
        //         });
        //     }
        //     else {
        //         // parsing: define, endif, pragma, include
        //         // token: directive
        //         updatedTokens.push({
        //             content: tokens[i].content,
        //             types: ['macro-directive']
        //         });
        //
        //         if (++i == tokens.length) {
        //             break;
        //         }
        //
        //         // token: whitespace
        //         updatedTokens.push({
        //             content: tokens[i].content,
        //             types: ['plain']
        //         });
        //
        //         // remove 'macro' and 'expression' types from any of the tokens in the expression and reparse
        //         for (let j = i + 1; j < tokens.length; ++j) {
        //             let types = [];
        //
        //             for (let type of tokens[j].types) {
        //                 if (type == 'macro') {
        //                     continue;
        //                 }
        //
        //                 if (type == 'expression') {
        //                     continue;
        //                 }
        //
        //                 types.push(type);
        //             }
        //
        //             if (types.length == 0) {
        //                 types.push('plain');
        //             }
        //
        //             tokens[j].types = types;
        //         }
        //     }
        // }
        // else if (tokens[i].types.includes('plain')) {
        //     let types = [];
        //
        //     if (namespaces.includes(tokens[i].content)) {
        //         types = ['namespace-name'];
        //     }
        //     else if (classes.includes(tokens[i].content)) {
        //         types = ['class-name'];
        //     }
        //     else if (memberVariables.includes(tokens[i].content)) {
        //         types = ['member-variable'];
        //     }
        //     else if (preprocessorDirectives.includes(tokens[i].content)) {
        //         types = ['macro-name'];
        //     }
        //     else {
        //         types = tokens[i].types;
        //     }
        //
        //     updatedTokens.push({
        //         content: tokens[i].content,
        //         types: types
        //     });
        // }
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
        tokens[i] = updateSyntaxHighlighting(tokens[i]);
    }

    return tokens;
}
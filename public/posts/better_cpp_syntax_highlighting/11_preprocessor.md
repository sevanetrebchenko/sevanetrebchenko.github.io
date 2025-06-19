
Part of the reason why the `Annotator` and `Tokenizer` were added as member variables was so that they could be reused in different contexts.
In all of our posts in this series so far, we have worked directly with nodes of the AST.
However, the AST is generated after the preprocessor runs, meaning all preprocessor definitions and directives are already parsed out.
If we want to insert syntax highlighting annotations for these symbols, we need to configure the compiler in the `ASTFrontendAction` before the AST is generated.

## Hooking into the Clang preprocessor

Clang's LibTooling API exposes the `PPCallbacks` interface, which allows client applications to hook into and observe the actions of the Clang preprocessor.
Not only does this interface allow us to visit macro invocations, file include statements, and code flow directives, it also provides the result of evaluating certain directives at compile time.
For example, hooking into the `PPCallbacks::PragmaMessage` function would allow a tool (such as an IDE) to underline or highlight an active `#pragma GCC warning` or `#pragma GCC error` directive.

As with the `ASTFrontendAction`, we need to derive an implementation of the `PPCallbacks` interface and override hooks for the preprocessor directives we are interested in processing.
There are a lot of preprocessor directives, many of which I've never used before, so implement hooks for the most common ones and leave the implementation of the more specialized ones as an exercise for the reader.
The implementation for these hooks follows a common pattern (similar to what we saw with the AST node visitors), and most of the required information is readily available.

## Registering a `PPCallbacks`

Hooking into the Clang preprocessor is a straightforward addition to our `ASTFrontendAction`.
Our `PPCallbacks` interface is defined as follows:
```cpp title:{preprocessor.hpp}
class Preprocessor final : public clang::PPCallbacks {
    public:
        Preprocessor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Preprocessor() override;
        
        // Overrides for preprocessor directive visitors
        // ...
        
    private:
        clang::ASTContext* m_context;
        Annotator* m_annotator;
        Tokenizer* m_tokenizer;
};
```
In addition to the AST context, which manages the generation and traversal of the AST, the Clang compiler also exposes a way to access the preprocessor.
Registering our `PPCallbacks` object via the `clang::Preprocessor::addPPCallbacks` function enables us to visit preprocessor directives.
```cpp
std::unique_ptr<clang::ASTConsumer> SyntaxHighlighter::CreateASTConsumer(clang::CompilerInstance& compiler, clang::StringRef file) {
    clang::ASTContext& context = compiler.getASTContext();
    
    m_tokenizer = new Tokenizer(&context);
    
    // Hook into preprocessor to add annotations for macros / preprocessor definitions
    compiler.getPreprocessor().addPPCallbacks(std::make_unique<Preprocessor>(&context, &m_annotator, m_tokenizer));
    return std::make_unique<Consumer>(&m_annotator, m_tokenizer);
}
```
We also provide references to the AST context for accessing information about the preprocessor directives, the annotator for inserting syntax highlighting annotations, and tokenizer for retrieving subsets of tokens contained within a given `SourceRange`.
Now all that's left to do is implement the various preprocessor directive visitors.

## Macro definitions

First up are macro definitions, specified by the `#define` preprocessor directive.
We can set up visiting macro definitions by overriding the `MacroDefined` hook:
```cpp
class Preprocessor final : public clang::PPCallbacks {
    public:
        Preprocessor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Preprocessor() override;
        
        // For visiting macro definitions
        void MacroDefined(const clang::Token& name, const clang::MacroDirective* directive) override;
        
    private:
        clang::ASTContext* m_context;
        Annotator* m_annotator;
        Tokenizer* m_tokenizer;
};
```
Annotating a macro definition consists of 4 parts:
1. Annotating name of the macro,
1. Annotating any macro arguments (optional),
1. Annotating references to other macros and macro arguments in the macro body, and
1. Annotating the `#define` preprocessor directive

Consider the following example:
```cpp
#define ASSERT(EXPRESSION, MESSAGE, ...) \
    do { \
        if (!(EXPRESSION)) { \
            std::source_location location = std::source_location::current(); \
            utils::logging::error("Assertion '{}' failed in {}:{}: {}", #EXPRESSION, location.file_name(), location.line(), MESSAGE, ##__VA_ARGS__); \
        } \
    } while (false)
```

Before we get started, let's do some initial setup of the visitor.
```cpp
void Preprocessor::MacroDefined(const clang::Token& name, const clang::MacroDirective* directive) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    
    // Ensure this macro comes from the 'main' file
    const clang::MacroInfo* info = directive->getMacroInfo();
    clang::SourceLocation location = info->getDefinitionLoc();
    if (source_manager.getFileID(location) != source_manager.getMainFileID()) {
        return;
    }
    
    // ...
}
```
As with our AST visitors, we only want to annotate definitions for macros that come from the main file we are annotating.
Using the `MacroDirective` parameter provided to the visitor, we can retrieve the location through the `MacroInfo` structure, which encapsulates the data about a macro definition.
Applications can query various properties about the macro, such as if it is aa built-in macro definition, whether it is function-like, or even if it is a macro used for a header guard.
The `MacroInfo::getDefinitionLoc` member function allows us to retrieve the source location where the macro is defined.
The `SourceManager::isInMainFile` check ensures that the node originates from the "main" file we are annotating - the one provided to `runToolOnCodeWithArgs`.

### Annotating the name of the macro

Annotating the name of the macro is straightforward, as the name is provided to us as a function parameter.
All we need to do is query the `SourceManager` for the exact line and column for where we need to insert the annotation.
```cpp added:{11-14}
void Preprocessor::MacroDefined(const clang::Token& name, const clang::MacroDirective* directive) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    
    // Ensure this macro comes from the 'main' file
    const clang::MacroInfo* info = directive->getMacroInfo();
    clang::SourceLocation location = info->getDefinitionLoc();
    if (source_manager.getFileID(location) != source_manager.getMainFileID()) {
        return;
    }
    
    // Step 1: annotate the name of the macro
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    m_annotator->insert_annotation("macro-name", line, column, name.length());
    
    // ...
}
```
Macro definitions are annotated with the `macro-name` annotation.
```text
#define [[macro-name,ASSERT]](EXPRESSION, MESSAGE, ...) \
    do { \
        if (!(EXPRESSION)) { \
            std::source_location location = std::source_location::current(); \
            utils::logging::error("Assertion '{}' failed in {}:{}: {}", #EXPRESSION, location.file_name(), location.line(), MESSAGE, ##__VA_ARGS__); \
        } \
    } while (false)
```

### Annotating macro arguments

Next up are macro arguments.
Similar to the approach used for annotating AST nodes, we retrieve the tokens spanning the range of the macro definition and check for tokens with certain spellings.
We can retrieve an `IdentifierInfo` structure for each of the macro arguments with the `MacroInfo::params` function, and compare each token with the spelling of the macro argument.
We can annotate both the arguments and references to them with the same approach.
```cpp
void Preprocessor::MacroDefined(const clang::Token& name, const clang::MacroDirective* directive) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    
    // Ensure this macro comes from the 'main' file
    const clang::MacroInfo* info = directive->getMacroInfo();
    clang::SourceLocation location = info->getDefinitionLoc();
    if (source_manager.getFileID(location) != source_manager.getMainFileID()) {
        return;
    }
    
    // Step 1: annotate the name of the macro
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    m_annotator->insert_annotation("macro-name", line, column, name.length());
    
    std::span<const Token> tokens = m_tokenizer->get_tokens(location, info->getDefinitionEndLoc());

    // Steps 2 and 3: annotate macro arguments (definitions and references)
    for (const Token& token : tokens) {
        for (const clang::IdentifierInfo* argument : info->params()) {
            std::string argument_name = argument->getName().str();
            if (token.spelling == argument_name) {
                // Clang lexer automatically handles comments and strings, so no need to check for invalid here
                m_annotator->insert_annotation("macro-argument", token.line, token.column, argument_name.length());
            }
        }
    }
}
```
Macro arguments are annotated with the `macro-argument` annotation.
```text
#define [[macro-name,ASSERT]]([[macro-argument,EXPRESSION]], [[macro-argument,MESSAGE]], ...) \
    do { \
        if (!([[macro-argument,EXPRESSION]])) { \
            std::source_location location = std::source_location::current(); \
            utils::logging::error("Assertion '{}' failed in {}:{}: {}", #[[macro-argument,EXPRESSION]], location.file_name(), location.line(), [[macro-argument,MESSAGE]], ##[[macro-argument,__VA_ARGS__]]); \
        } \
    } while (false)
```
Notice that the `__VA_ARGS__` identifier is also implicitly included in the argument list of a variadic macro.

### Annotating the `#define` preprocessor directive

Last up is annotating the `#define` preprocessor directive itself.
We will use the same approach as we used for annotating macro arguments in the section above, explicitly checking for a `#define` token instead of the names of the macro arguments. 
A slight problem, however, is that the `#define` directive is not included in the source range of a macro definition by default.
`MacroInfo::getDefinitionLoc` returns the start of the macro name.

One approach we can use is a helper function of the `SourceLocation` class is `SourceLocation::getLocWithOffset`, which allows you to specify a character offset to the source location.
Instead of providing the location of the macro directly to the `Tokenizer::get_tokens` function on line 16, we can offset it by, for example, 8 (the number of characters in `#define` and a single whitespace separator).
```cpp
// Offset the start location to the left by 8 characters, or the length of "#define "
std::span<const Token> tokens = m_tokenizer->get_tokens(info->getDefinitionLoc().getLocWithOffset(-8), info->getDefinitionEndLoc());
```
The `getLocWithOffset` function handles wrapping offsets across multiple lines, and `get_tokens` function is already set up to handle partial ranges.
This approach works as long as we provide a large enough offset to capture both the `#` and `define` tokens.

However, this solution quickly breaks down.
Consider, for example, a coding style that aligns macro with an arbitrary number of spaces between the `#` and the `define`, or the `define` and the start of the macro definition.
The only restriction that the standard imposes on preprocessor directives is that they must appear on their own line and the `#` must be the first non-whitespace character.
How do we ensure that the offset is enough to capture both the `#` and the `define`?
We can try specifying a larger offset, but the larger this offset is the more tokens we risk pulling in, which begins introducing performance implications.

An alternative (and better) approach is to take advantage of the restriction imposed by the standard.
All we need to do is modify the `get_tokens` function to allow us to retrieve all the tokens on the same line as the start location and ignore the column of the start location.
```cpp
class Tokenizer {
    public:
        explicit Tokenizer(clang::ASTContext* context);
        ~Tokenizer();
        
        [[nodiscard]] std::span<const Token> get_tokens(clang::SourceLocation start, clang::SourceLocation end, bool ignore_columns = false) const;
        [[nodiscard]] std::span<const Token> get_tokens(clang::SourceRange range, bool ignore_columns = false) const;
        
    private:
        void tokenize();
        
        clang::ASTContext* m_context;
        std::vector<Token> m_tokens;
};
```

```cpp added:{13-19,24,38-44,49}
std::span<const Token> Tokenizer::get_tokens(clang::SourceLocation start, clang::SourceLocation end, bool ignore_columns) const {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    unsigned start_line = source_manager.getSpellingLineNumber(start);
    unsigned start_column = source_manager.getSpellingColumnNumber(start);

    // Determine tokens that fall within the range defined by [start:end]
    // Partial tokens (if the range start location falls within the extent of a token) should also be included here

    unsigned offset = m_tokens.size(); // Invalid offset
    for (std::size_t i = 0; i < m_tokens.size(); ++i) {
        const Token& token = m_tokens[i];

        if (ignore_columns) {
            // Skip any tokens that end before the starting line
            if (token.line < start_line) {
                continue;
            }
        }
        else {
            // Skip any tokens that end before the range start line:column
            if (token.line < start_line || (token.line == start_line && (token.column + token.spelling.length()) <= start_column)) {
                continue;
            }
        }


        offset = i;
        break;
    }

    unsigned count = 0;
    unsigned end_line = source_manager.getSpellingLineNumber(end);
    unsigned end_column = source_manager.getSpellingColumnNumber(end);

    for (std::size_t i = offset; i < m_tokens.size(); ++i) {
        const Token& token = m_tokens[i];

        if (ignore_columns) {
            // Skip any tokens that start after the end line
            if (token.line > end_line) {
                break;
            }
        }
        else {
            // Skip any tokens that start after the range end line:column
            if (token.line > end_line || token.line == end_line && token.column > end_column) {
                break;
            }
        }

        ++count;
    }

    // Return non-owning range of tokens
    return { m_tokens.begin() + offset, count };
}
```

The `get_tokens` overload that accepts a `SourceRange` and forwards the start and end `SourceLocation`s simply forwards the `ignore_columns` value as well.
With this new implementation, we can confidently capture just enough tokens to annotate the `#define` preprocessor directive and nothing more.
Furthermore, `get_tokens` automatically removes leading and trailing whitespace and separates the `#` and `define` into two separate tokens, meaning annotating the directive simply means checking if the first token of the specified range is `#` and the second is `define`.
```cpp
void Preprocessor::MacroDefined(const clang::Token& name, const clang::MacroDirective* directive) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    
    // Ensure this macro comes from the 'main' file
    const clang::MacroInfo* info = directive->getMacroInfo();
    clang::SourceLocation location = info->getDefinitionLoc();
    if (source_manager.getFileID(location) != source_manager.getMainFileID()) {
        return;
    }
    
    // Step 1: annotate the name of the macro
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    m_annotator->insert_annotation("macro-name", line, column, name.length());
    
    std::span<const Token> tokens = m_tokenizer->get_tokens(location, info->getDefinitionEndLoc());

    // Steps 2 and 3: annotate macro arguments (definitions and references)
    for (std::size_t i = 0; i < tokens.size(); ++i) {
        const Token& token = tokens[i];
        
        // Step 4: annotate the #define preprocessor directive
        if ((i == 0 && token.spelling == "#") || (i == 1 && token.spelling == "define")) {
            m_annotator->insert_annotation("preprocessor-directive", token.line, token.column, token.spelling.length());
            continue;
        }
        
        for (const clang::IdentifierInfo* argument : info->params()) {
            std::string argument_name = argument->getName().str();
            if (token.spelling == argument_name) {
                // Clang lexer automatically handles comments and strings, so no need to check for invalid here
                m_annotator->insert_annotation("macro-argument", token.line, token.column, argument_name.length());
            }
        }
    }
}
```
Both the `#` and `define` are annotated with the `preprocess-directive` annotation.
```text
[[preprocessor-directive,#]][[preprocessor-directive,define]] [[macro-name,ASSERT]]([[macro-argument,EXPRESSION]], [[macro-argument,MESSAGE]], ...) \
    do { \
        if (!([[macro-argument,EXPRESSION]])) { \
            std::source_location location = std::source_location::current(); \
            utils::logging::error("Assertion '{}' failed in {}:{}: {}", #[[macro-argument,EXPRESSION]], location.file_name(), location.line(), [[macro-argument,MESSAGE]], ##[[macro-argument,__VA_ARGS__]]); \
        } \
    } while (false)
```

## Macro references

Macro invocations are handled by the `MacroExpands` preprocessor hook.
```cpp added:{9-10}
class Preprocessor final : public clang::PPCallbacks {
    public:
        Preprocessor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Preprocessor() override;
        
        // For visiting macro definitions
        void MacroDefined(const clang::Token& name, const clang::MacroDirective* directive) override;
        
        // For visiting macro references
        void MacroExpands(const clang::Token& name, const clang::MacroDefinition& definition, clang::SourceRange range, const clang::MacroArgs* args) override;
        
    private:
        clang::ASTContext* m_context;
        Annotator* m_annotator;
        Tokenizer* m_tokenizer;
};
```
Now that we've established the `ASSERT` macro, it would be useful to annotate references to it as we sprinkle asserts throughout the codebase.
```cpp
#define ASSERT(EXPRESSION, MESSAGE, ...) \
    do { \
        if (!(EXPRESSION)) { \
            std::source_location location = std::source_location::current(); \
            utils::logging::error("Assertion '{}' failed in {}:{}: {}", #EXPRESSION, location.file_name(), location.line(), MESSAGE, ##__VA_ARGS__); \
        } \
    } while (false)

int factorial(int value) {
    ASSERT(value >= 0, "Factorials are only defined for positive integers!");
    
    if (value == 0) {
        return 1;
    }
    
    return value * factorial(value - 1);
}
    
int main() {
    int value = factorial(9); // 362880
    // ...
}
```

The implementation of `MacroExpands` is simple, as everything we need for inserting syntax highlighting annotations is provided to us with the arguments to the function.
```cpp
void Preprocessor::MacroExpands(const clang::Token& name, const clang::MacroDefinition& definition, clang::SourceRange range, const clang::MacroArgs* args) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    
    clang::SourceLocation location = name.getLocation();
    if (!source_manager.isInMainFile(location)) {
        return;
    }
    
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    m_annotator->insert_annotation("macro-name", line, column, name.getLength());
}
```
Note that we check if the invocation of the macro is within the main file, not the definition itself.
This allows us to handle built-in macros, such as those provided from a build system or the command line, without requiring the definition to be present in the file we are annotating.
The `MacroArgs` struct allows for deeper introspection into the structure of the macro, such as if the macro was invoked with variadic arguments (and, if so, how many), or if the macro arguments require further expansion such as for macro dispatching.
This advanced behavior is not necessary for simple syntax highlighting, so we won't be requiring it here.

As with macro definitions, macro references are annotated with the `macro-name` annotation.

## Undefining macros

The `#undef` preprocessor directive is used to "undefine" a macro that was previously defined with `#define`.
Visiting these preprocessor directives requires implementing the `MacroUndefined` hook:
```cpp
class Preprocessor final : public clang::PPCallbacks {
    public:
        Preprocessor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Preprocessor() override;
        
        // For visiting macro definitions
        void MacroDefined(const clang::Token& name, const clang::MacroDirective* directive) override;
        
        // For visiting macro undefinitions
        void MacroUndefined(const clang::Token& name, const clang::MacroDefinition& definition, const clang::MacroDirective* directive) override;
        
        // For visiting macro references
        void MacroExpands(const clang::Token& name, const clang::MacroDefinition& definition, clang::SourceRange range, const clang::MacroArgs* args) override;
        
    private:
        clang::ASTContext* m_context;
        Annotator* m_annotator;
        Tokenizer* m_tokenizer;
};
```
The target of an `#undef` directive must be a macro, meaning that the implementation of this visitor closely mirrors that of `MacroDefined`.
The only difference is that it is perfectly valid for `#undef` directives to reference macros that have not yet been defined (indicated by the `directive` parameter set to null), resulting in the undefinition being a noop.
Luckily, for inserting syntax highlighting annotations, we only need the name and location of the macro, both of which we can get from the `name` parameter directly.
```cpp
void Preprocessor::MacroUndefined(const clang::Token& name, const clang::MacroDefinition& definition, const clang::MacroDirective* directive) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    
    clang::SourceLocation location = name.getLocation();
    if (source_manager.getFileID(location) != source_manager.getMainFileID()) {
        return;
    }
    
    // Annotate the name of the macro
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    m_annotator->insert_annotation("macro-name", line, column, name.getLength());
    
    std::span<const Token> tokens = m_tokenizer->get_tokens(name.getLocation(), name.getEndLoc(), true);
    for (std::size_t i = 0; i < tokens.size(); ++i) {
        const Token& token = tokens[i];
        
        // Annotate the #undef preprocessor directive
        if ((i == 0 && token.spelling == "#") || (i == 1 && token.spelling == "undef")) {
            m_annotator->insert_annotation("preprocessor-directive", token.line, token.column, token.spelling.length());
            continue;
        }
    }
}
```
For annotating the `#undef` preprocessor directive itself, we follow the exact same approach as before for the `#define` directive.

# Conditional compilation directives

Next up on the list are conditional compilation directives: `#if`, `#elif`, `#ifdef`, `#ifndef`, `#else`, `#endif`, used for including or excluding parts of the code based on certain compile-time conditions.
Typically, these are macro definitions, which means the structure of these follows closely to that of the previous section. 


Unfortunately, if the macro is not used in the code snippet, it will be preprocessed out from the rest of the file for the ASTFrontendAction to parse, and the macro body will not contain annotations.
Similar to what we've seen with almost all AST node visitors, the first order of business is to check 
PrismJS actually does this for us, but fortunately one does not affect the other.

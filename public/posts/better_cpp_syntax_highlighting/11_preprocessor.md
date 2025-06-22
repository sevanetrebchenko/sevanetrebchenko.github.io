
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

However, this solution isn't ideal.
Consider, for example, a coding style that aligns macro with an arbitrary number of spaces between the `#` and the `define`, or the `define` and the start of the macro definition.
The only restriction that the standard imposes on preprocessor directives is that they must appear on their own line and the `#` must be the first non-whitespace character.
How do we ensure that the offset is enough to capture both the `#` and the `define`?
We can try specifying a larger offset, but the larger this offset is the more tokens we risk pulling in, which brings performance implications along with it.

An alternative (and better) approach is to take advantage of this restriction imposed by the standard.
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
However, as virtually all preprocessor directives follow this format, we can generalize this logic even further.

The `annotate_directive` function accepts a line containing a preprocessor directive and annotates the first two tokens, which are the `#` and whatever preprocessor directive follows, with the `preprocessor-directive` annotation.
```cpp added:{6}
class Preprocessor final : public clang::PPCallbacks {
    public:
        // ...
        
    private:
        void annotate_directive(clang::SourceLocation location);
        
        clang::ASTContext* m_context;
        Annotator* m_annotator;
        Tokenizer* m_tokenizer;
};
```

```cpp
void Preprocessor::annotate_directive(clang::SourceLocation location) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    if (source_manager.getFileID(location) != source_manager.getMainFileID()) {
        return;
    }
    
    // The standard guarantees that the '#' is the first non-whitespace token on a line containing a preprocessor directive, followed directly by the directive itself
    // Annotating a preprocessor directive without a target (such as a macro) is as simple as annotating the first two tokens of the line as preprocessor directives
    std::span<const Token> tokens = m_tokenizer->get_tokens(location, location, true);
    for (std::size_t i = 0; i < 2; ++i) {
        const Token& token = tokens[i];
        m_annotator->insert_annotation("preprocessor-directive", token.line, token.column, token.spelling.length());
    }
}
```
We will reuse this approach in all of the other visitor functions we implement in this post.
The implementation of the `MacroDefined` hook is as follows: 
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
    m_annotator->insert_annotation("macro-name", line, column, name.getLength());
    
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
    
    // Step 4: annotate '#define' preprocessor directive
    annotate_directive(location);
}
```

```text
[[preprocessor-directive,#]][[preprocessor-directive,define]] [[macro-name,ASSERT]]([[macro-argument,EXPRESSION]], [[macro-argument,MESSAGE]], ...) \
    do { \
        if (!([[macro-argument,EXPRESSION]])) { \
            std::source_location location = std::source_location::current(); \
            utils::logging::error("Assertion '{}' failed in {}:{}: {}", #[[macro-argument,EXPRESSION]], location.file_name(), location.line(), [[macro-argument,MESSAGE]], ##[[macro-argument,__VA_ARGS__]]); \
        } \
    } while (false)
```

An important thing to note here is that this callback will not be invoked for any macro definitions that aren't referenced in the code, and are optimized out entirely.
If you want your macro definitions to be visited, make sure you call them in your code.

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
Now that we've established the `ASSERT` macro, it would be useful to annotate references to it as we sprinkle asserts throughout our hypothetical codebase.
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
```text
[[preprocessor-directive,#]][[preprocessor-directive,define]] [[macro-name,ASSERT]]([[macro-argument,EXPRESSION]], [[macro-argument,MESSAGE]], ...) \
    do { \
        if (!([[macro-argument,EXPRESSION]])) { \
            std::source_location location = std::source_location::current(); \
            utils::logging::error("Assertion '{}' failed in {}:{}: {}", #[[macro-argument,EXPRESSION]], location.file_name(), location.line(), [[macro-argument,MESSAGE]], ##[[macro-argument,__VA_ARGS__]]); \
        } \
    } while (false)

int factorial(int value) {
    [[macro-name,ASSERT]](value >= 0, "Factorials are only defined for positive integers!");
    
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
The only difference is that it is valid for `#undef` directives to reference macros that have not yet been defined (indicated by the `directive` parameter set to null), resulting in the undefinition being a noop.
Luckily, these two things are independent, and for inserting syntax highlighting annotations we only need the name and location of the macro (both of which we can get from the `name` parameter directly).
```cpp
void Preprocessor::MacroUndefined(const clang::Token& name, const clang::MacroDefinition& definition, const clang::MacroDirective* directive) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    
    clang::SourceLocation location = name.getLocation();
    if (source_manager.getFileID(location) != source_manager.getMainFileID()) {
        return;
    }
    
    // Annotate the '#undef' preprocessor directive
    annotate_directive(location);
    
    // Annotate the name of the macro
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    m_annotator->insert_annotation("macro-name", line, column, name.getLength());
}
```
The `#undef` preprocessor directive is annotated with a call to `annotate_directive`.

# Conditional compilation directives

Next up on the list are conditional compilation directives: `#if`, `#elif`, `#ifdef`, `#ifndef`, `#elifdef`, `#elifndef`, `#else`, and `#endif`, used for including or excluding parts of the code based on certain compile-time conditions.
Each directive has a corresponding hook that we need to implement.
```cpp added:{15-23}
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
        
        // For visiting conditional compilation directives
        void If(clang::SourceLocation location, clang::SourceRange range, ConditionValueKind value) override;
        void Elif(clang::SourceLocation location, clang::SourceRange range, ConditionValueKind value, clang::SourceLocation if_location) override;
        void Ifdef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Ifndef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Elifdef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Elifndef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Else(clang::SourceLocation location, clang::SourceLocation if_location) override;
        void Endif(clang::SourceLocation location, clang::SourceLocation if_location) override;
        
    private:
        clang::ASTContext* m_context;
        Annotator* m_annotator;
        Tokenizer* m_tokenizer;
};
```
We can expand the `ASSERT` macro definition so that its substitution is a noop on non-debug builds.
One of the most common ways this is done is scoping the "real" assertion logic within a check that is only active when `NDEBUG` is defined.
```text
#ifndef NDEBUG
    #define ASSERT(EXPRESSION, MESSAGE, ...) \
        do { \
            if (!(EXPRESSION)) { \
                std::source_location location = std::source_location::current(); \
                utils::logging::error("Assertion '{}' failed in {}:{}: {}", #EXPRESSION, location.file_name(), location.line(), MESSAGE, ##__VA_ARGS__); \
            } \
        } while (false)
#else
    #define ASSERT(EXPRESSION, MESSAGE, ...) do { } while (false)
#endif
```
While this example uses only 3 of the 6 conditional compilation directives outlined above.
However, the implementations for these are very similar to the ones discussed in this section, and have been omitted for brevity.
The full implementation can be found [here]();

Any preprocessor directives that don't reference an identifier, such as `#if`, `#else`, `#elif`, and `#endif`, simply become a call to this function.
For example, below is the implementation of the `If` hook:
```cpp
void Preprocessor::If(clang::SourceLocation location, clang::SourceRange, clang::PPCallbacks::ConditionValueKind) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    if (source_manager.getFileID(location) != source_manager.getMainFileID()) {
        return;
    }
    
    // Annotate '#if' preprocessor directive
    annotate_directive(location);
}
```
The implementations for `Elif`, `Else`, and `Endif` are identical and have been omitted for brevity.

Preprocessor directives that reference identifiers, such as `#ifdef`, `#ifndef`, `#elifdef`, and `#elifndef`, follow a similar implementation, but also annotate the identifier being referenced.
The implementation for the `Ifndef` hook is provided below:
```cpp
void Preprocessor::Ifndef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    if (source_manager.getFileID(location) != source_manager.getMainFileID()) {
        return;
    }
    
    // Annotate '#ifndef' preprocessor directive
    annotate_directive(location);
    
    // Annotate macro name
    location = name.getLocation();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    m_annotator->insert_annotation("macro-name", line, column, name.getLength());
}
```
.
The `location` parameter provided to this hook references the location of the preprocessor directive itself, so the location at which to insert the `macro-name` annotation is retrieved directly from the token referencing the identifier.
The implementations for `Ifdef`, `Elifdef`, and `Elifndef` are identical and have been omitted for brevity.

Furthermore, we can also simplify the `MacroUndef` hook to follow this same pattern.
```cpp removed:{16-25}
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
    
    // Annotate the '#undef' preprocessor directive
    annotate_directive(location);
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

After implementing these hooks, we are now able to properly annotate the example from earlier.
```text
[[preprocessor-directive,#]][[preprocessor-directive,ifndef]] [[macro-name,NDEBUG]]
    [[preprocessor-directive,#]][[preprocessor-directive,define]] [[macro-name,ASSERT]]([[macro-argument,EXPRESSION]], [[macro-argument,MESSAGE]], ...) \
        do { \
            if (!([[macro-argument,EXPRESSION]])) { \
                std::source_location location = std::source_location::current(); \
                utils::logging::error("Assertion '{}' failed in {}:{}: {}", #[[macro-argument,EXPRESSION]], location.file_name(), location.line(), [[macro-argument,MESSAGE]], ##[[macro-argument,__VA_ARGS__]]); \
            } \
        } while (false)
[[preprocessor-directive,#]][[preprocessor-directive,else]]
    #define ASSERT(EXPRESSION, MESSAGE, ...) do { } while (false)
[[preprocessor-directive,#]][[preprocessor-directive,endif]]
```
One thing to note here is that it is not (currently) possible to visit an inactive preprocessor branch.
For example, while the top level `#else` statement is visited, the nested `ASSERT` macro definition is not.
As mentioned earlier, there are overrides for visiting inactive `#elifdef` and `#elifndef` defined in the `PPCallbacks` interface, but for some reason this functionality was not extended to `#else`.
Unfortunately, for tokenizing inactive preprocessor branches, all solutions require manual parsing of the tokens from the range.
For simple branches this may not be too bad, but the complexity quickly grows.
A possible solution could generate a meta-header file that includes only the contents within the inactive branch, and programmatically re-run the tool over this file.
This would require, at a minimum, the ability to parse out only the lines from the inactive branch (tokenize until an `#endif` directive, for example), and when generating the file ensuring that any defines are referenced in the code.
As discussed earlier, the preprocessor does not invoke callbacks for any elements that are not directly referenced in the code.
I decided this was out of scope for this project, and any inactive preprocessor branches would have to be manually annotated.
Preprocessor directives as a whole are a pretty niche thing to include in a blog post, so I don't anticipate this being much of a roadblock.
Still, if this becomes a bigger problem down the road, expect another blog post.

## `defined`

The `defined` preprocessor directive is used within `#if` or `#elif` expressions to test whether a macro has been previously defined.
Another way to express the `#elifdef` and `#elifndef` directives, which were introduced in C++23, is by combining the `#elif` directive with `defined`.
`#elifdef` becomes `#elif defined(...) ` and similarly `#elif !defined(...)` for `#elifndef`.

For annotating this directive, we must set up another visitor.
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
        
        // For visiting conditional compilation directives
        void If(clang::SourceLocation location, clang::SourceRange range, ConditionValueKind value) override;
        void Elif(clang::SourceLocation location, clang::SourceRange range, ConditionValueKind value, clang::SourceLocation if_location) override;
        void Ifdef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Ifndef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Elifdef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Elifndef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Else(clang::SourceLocation location, clang::SourceLocation if_location) override;
        void Endif(clang::SourceLocation location, clang::SourceLocation if_location) override;
        
        // For visiting the 'defined' directive
        void Defined(const clang::Token& name, const clang::MacroDefinition& definition, clang::SourceRange range) override;
        
    private:
        clang::ASTContext* m_context;
        Annotator* m_annotator;
        Tokenizer* m_tokenizer;
};
```
```text
#if !defined(NDEBUG)
    #define ASSERT(EXPRESSION, MESSAGE, ...) \
        do { \
            if (!(EXPRESSION)) { \
                std::source_location location = std::source_location::current(); \
                utils::logging::error("Assertion '{}' failed in {}:{}: {}", #EXPRESSION, location.file_name(), location.line(), MESSAGE, ##__VA_ARGS__); \
            } \
        } while (false)
#else
    // ...
#endif
```

The implementation for this visitor is similar to ones we've seen before.
```cpp
void Preprocessor::Defined(const clang::Token& name, const clang::MacroDefinition& definition, clang::SourceRange range) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = name.getLocation();
    if (source_manager.getFileID(location) != source_manager.getMainFileID()) {
        return;
    }
    
    // Annotate macro name
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    m_annotator->insert_annotation("macro-name", line, column, name.getLength());
    
    // Annotate 'defined' preprocessor directive
    std::span<const Token> tokens = m_tokenizer->get_tokens(location, location, true);
    for (const Token& token : tokens) {
        if (token.spelling == "defined") {
            m_annotator->insert_annotation("preprocessor-directive", token.line, token.column, token.spelling.length());
        }
    }
}
```
Unfortunately, there is no way to retrieve the location of the `defined` directive itself, so we must resort to the tokenization approach.
```text
[[preprocessor-directive,#]][[preprocessor-directive,if]] ![[preprocessor-directive,defined]]([[macro-name,NDEBUG]])
    [[preprocessor-directive,#]][[preprocessor-directive,define]] [[macro-name,ASSERT]]([[macro-argument,EXPRESSION]], [[macro-argument,MESSAGE]], ...) \
        do { \
            if (!([[macro-argument,EXPRESSION]])) { \
                std::source_location location = std::source_location::current(); \
                utils::logging::error("Assertion '{}' failed in {}:{}: {}", #[[macro-argument,EXPRESSION]], location.file_name(), location.line(), [[macro-argument,MESSAGE]], ##[[macro-argument,__VA_ARGS__]]); \
            } \
        } while (false)
[[preprocessor-directive,#]][[preprocessor-directive,else]]
    // ...
[[preprocessor-directive,#]][[preprocessor-directive,endif]]
```

## `#include` statements

Next up are `#include` directives.
This directive tells the preprocessor to insert the contents of the referenced file at the point where the directive appears, and is central to any C/C++ program.
Setting up our visitor to handle `#include` directives requires implementing the `InclusionDirective` visitor:
```cpp
class Preprocessor final : public clang::PPCallbacks {
    public:
        Preprocessor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Preprocessor() override;
        
        // For visiting macro definitions
        void MacroDefined(const clang::Token& name, const clang::MacroDirective* directive) override;
        
        // For visiting macro undefinitions
        void MacroUndefined(const clang::Token& name, const clang::MacroDefinition &MD, const clang::MacroDirective* directive) override;
        
        // For visiting macro references
        void MacroExpands(const clang::Token& name, const clang::MacroDefinition& definition, clang::SourceRange range, const clang::MacroArgs* args) override;
        
        // For visiting conditional compilation directives
        void If(clang::SourceLocation location, clang::SourceRange range, ConditionValueKind value) override;
        void Elif(clang::SourceLocation location, clang::SourceRange range, ConditionValueKind value, clang::SourceLocation directive_location) override;
        void Ifdef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Elifdef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Ifndef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Elifndef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Else(clang::SourceLocation location, clang::SourceLocation directive_location) override;
        void Endif(clang::SourceLocation location, clang::SourceLocation directive_location) override;
        
        // For visiting the 'defined' directive
        void Defined(const clang::Token& name, const clang::MacroDefinition& definition, clang::SourceRange range) override;
        
        // For visiting file / module includes
        void InclusionDirective(clang::SourceLocation hash_location, const clang::Token& name, clang::StringRef filename, bool angled,
                                clang::CharSourceRange, clang::OptionalFileEntryRef, clang::StringRef, clang::StringRef, const clang::Module*, bool, clang::SrcMgr::CharacteristicKind) override;
        
    private:
        void annotate_directive(clang::SourceLocation location);
        
        clang::ASTContext* m_context;
        Annotator* m_annotator;
        Tokenizer* m_tokenizer;
};
```
This function accepts a number of parameters as it's set up to handle both `#include` and `#import` directives (for supporting C++20 modules).
We will ignore most of these, as our main goal is inserting annotations for syntax highlighting.
These parameters give insight into the type of include, whether it uses angled brackets or quotes, and the search paths the compiler used to find the file in the file system.

There is a separate `FileNotFound` function that is called when the compiler cannot find a file referenced by an inclusion directive.
We can hook into this if we wanted to underline the missing include statement in red, as is typically done in many IDEs.

```cpp
void Preprocessor::InclusionDirective(clang::SourceLocation hash_location, const clang::Token& name, clang::StringRef filename, bool angled, clang::CharSourceRange, clang::OptionalFileEntryRef, clang::StringRef, clang::StringRef, const clang::Module*, bool, clang::SrcMgr::CharacteristicKind) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = name.getLocation();
    if (source_manager.getFileID(hash_location) != source_manager.getMainFileID()) {
        return;
    }
    
    // Annotate '#include' directive
    annotate_directive(location);
    
    // Annotate file being included
    std::span<const Token> tokens = m_tokenizer->get_tokens(location, location, true);
    for (const Token& token : tokens) {
        if (angled) {
            // Angle brackets are not included in the filename for include statements that use angled brackets (e.g. #include <...>) and must be handled separately
            if (token.spelling == "<" || token.spelling == ">") {
                m_annotator->insert_annotation("string", token.line, token.column, 1);
            }
            else if (token.spelling == filename) {
                m_annotator->insert_annotation("string", token.line, token.column, token.spelling.length());
            }
        }
        else {
            // The filename includes quotes for include statements that use quotes (e.g. #include "...")
            if (token.spelling == ("\"" + filename.str() + "\"")) {
                m_annotator->insert_annotation("string", token.line, token.column, token.spelling.length());
            }
        }
    }
}
```
The most significant difference for this visitor is that the file being included is be annotated as a string (including the enclosing quotes).
One caveat here is that the `filename` parameter contains the name of the included file with quotes for `#include "..."` statements, but omits the angle brackets for `#include <...>` statements, which must be explicitly handled for annotating the filename as a string.

## `#pragma`

`#pragma` preprocessor directives provide compiler-specific instructions, which means they come in many different shapes and forms.
To keep things simple, we will just provide a definition for the generic `PragmaDirective` function, which gets called when the preprocessor encounters **any** `#pragma` directive.
```cpp
class Preprocessor final : public clang::PPCallbacks {
    public:
        Preprocessor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Preprocessor() override;
        
        // For visiting macro definitions
        void MacroDefined(const clang::Token& name, const clang::MacroDirective* directive) override;
        
        // For visiting macro undefinitions
        void MacroUndefined(const clang::Token& name, const clang::MacroDefinition &MD, const clang::MacroDirective* directive) override;
        
        // For visiting macro references
        void MacroExpands(const clang::Token& name, const clang::MacroDefinition& definition, clang::SourceRange range, const clang::MacroArgs* args) override;
        
        // For visiting conditional compilation directives
        void If(clang::SourceLocation location, clang::SourceRange range, ConditionValueKind value) override;
        void Elif(clang::SourceLocation location, clang::SourceRange range, ConditionValueKind value, clang::SourceLocation directive_location) override;
        void Ifdef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Elifdef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Ifndef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Elifndef(clang::SourceLocation location, const clang::Token& name, const clang::MacroDefinition& definition) override;
        void Else(clang::SourceLocation location, clang::SourceLocation directive_location) override;
        void Endif(clang::SourceLocation location, clang::SourceLocation directive_location) override;
        
        // For visiting the 'defined' directive
        void Defined(const clang::Token& name, const clang::MacroDefinition& definition, clang::SourceRange range) override;
        
        // For visiting file / module includes
        void InclusionDirective(clang::SourceLocation hash_location, const clang::Token& name, clang::StringRef filename, bool angled,
                                clang::CharSourceRange, clang::OptionalFileEntryRef, clang::StringRef, clang::StringRef, const clang::Module*, bool, clang::SrcMgr::CharacteristicKind) override;
        
    private:
        void annotate_directive(clang::SourceLocation location);
        
        clang::ASTContext* m_context;
        Annotator* m_annotator;
        Tokenizer* m_tokenizer;
};
```
The implementation of this function only annotates the `#pragma` preprocessor directive using the `annotate_directive` function.
```cpp
void Preprocessor::PragmaDirective(clang::SourceLocation location, clang::PragmaIntroducerKind introducer) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    if (source_manager.getFileID(location) != source_manager.getMainFileID()) {
        return;
    }
    
    // Annotate '#pragma' directive
    annotate_directive(location);
}
```
Any other tokens for the directive will require manual annotation.

Unfortunately, if the macro is not used in the code snippet, it will be preprocessed out from the rest of the file for the ASTFrontendAction to parse, and the macro body will not contain annotations.
Similar to what we've seen with almost all AST node visitors, the first order of business is to check 
PrismJS actually does this for us, but fortunately one does not affect the other.


Part of the reason we added the `Annotator` and `Tokenizer` as member variables of the `ASTFrontendAction` is so that they could be reused in different contexts.
Up until now, we've worked exclusively with nodes of the AST.
However, the AST is generated *after* the preprocessor runs, which means all preprocessor directives and macro definitions have already been resolved and stripped out.

If we want to insert syntax highlighting annotations for these symbols, we need to hook into the compiler *before* the AST is created, during the preprocessing phase.

## Hooking into the Clang preprocessor

Clang's LibTooling API exposes the `PPCallbacks` interface, which allows tools to hook into and interact with the actions of the Clang preprocessor.
This includes macro definitions, include statements, and conditional compilation branches, among others.
It even exposes the evaluated results of certain preprocessor directives.

For example, by overriding `PPCallbacks::PragmaMessage`, an IDE could highlight a `#pragma GCC warning` directive with a squiggly underline.

Just like we did with the `ASTFrontendAction`, we need to implement our own derivative implementation of `PPCallbacks` and override the hooks we are interested in.
There are quite a few directives, many of which are rarely encountered in typical day-to-day use, so we'll focus on the most common ones and leave the rest for later.

Most hooks follow the same structure as the AST visitors we implemented in earlier posts of this series.
The information required for syntax highlighting is usually provided directly.

## Registering `PPCallbacks`

Hooking into the Clang preprocessor is a straightforward addition to our `ASTFrontendAction`.
Here is the `Preprocessor` class:
```cpp title:{preprocessor.hpp} line-numbers:{enabled}
[[keyword,class]] [[class-name,Preprocessor]] [[keyword,final]] : [[keyword,public]] [[namespace-name,clang]]::[[class-name,PPCallbacks]] {
    [[keyword,public]]:
        [[function,Preprocessor]]([[namespace-name,clang]]::[[class-name,ASTContext]]* context, [[class-name,Annotator]]* annotator, [[class-name,Tokenizer]]* tokenizer);
        [[function,~Preprocessor]]() [[keyword,override]];
        
        // Overrides for preprocessor directives go here
        
    [[keyword,private]]:
        [[namespace-name,clang]]::[[class-name,ASTContext]]* [[member-variable,m_context]];
        [[class-name,Annotator]]* [[member-variable,m_annotator]];
        [[class-name,Tokenizer]]* [[member-variable,m_tokenizer]];
};
```
In our `CreateASTConsumer` function (originally implemented as a part of our `ASTFrontendAction`), we register it with the preprocessor using the `addPPCallbacks` function.
```cpp title:{action.hpp} line-numbers:{enabled} added:{3}
[[namespace-name,std]]::[[class-name,unique_ptr]]<[[namespace-name,clang]]::[[class-name,ASTConsumer]]> [[class-name,SyntaxHighlighter]]::[[function,CreateASTConsumer]]([[namespace-name,clang]]::[[class-name,CompilerInstance]]& compiler, [[namespace-name,clang]]::[[class-name,StringRef]] file) {
    [[namespace-name,clang]]::[[class-name,ASTContext]]& context = compiler.[[function,getASTContext]]();
    compiler.[[function,getPreprocessor]]().addPPCallbacks(std::make_unique<[[class-name,Preprocessor]]>([[unary-operator,&]]context, [[unary-operator,&]][[member-variable,m_annotator]], [[member-variable,m_tokenizer]]));
    [[keyword,return]] std::make_unique<[[class-name,Consumer]]>([[unary-operator,&]][[member-variable,m_annotator]], [[member-variable,m_tokenizer]]);
}
```
We also pass in references to the AST context, annotator, and tokenizer so that we can insert syntax highlighting annotations and retrieve tokens across source ranges.
All that's left to do now is implement the visitors.

## Macro definitions

The `#define` preprocessor directive defines macros.
To process them, we override the `MacroDefined` hook:
```cpp title:{preprocessor.hpp}
[[keyword,void]] [[function,MacroDefined]]([[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDirective]]* directive) [[keyword,override]];
```
In this function, we'll annotate four things:
1. The macro name,
2. The macro arguments (if any),
3. References to macro arguments or other macros within the body, 
4. The `#define` directive itself.

Consider the following example:
```text
#include <source_location> // std::source_location
#include "utils/logging.hpp"

#define ASSERT(EXPRESSION, MESSAGE, ...) \
    do { \
        if (!(EXPRESSION)) { \
            std::source_location location = std::source_location::current(); \
            utils::logging::error("Assertion '{}' failed in {}:{}: {}", #EXPRESSION, location.file_name(), location.line(), MESSAGE, ##__VA_ARGS__); \
        } \
    } while (false)
```

Before annotating, we check to make sure the macro comes from the main file.
```cpp line-numbers:{enabled} title:{preprocessor.cpp}
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
Note that this functionality is shared across all visitor implementations in this post.
For future sections, however, it is omitted for brevity.

### Annotating the macro name

The macro name is provided by the `name` parameter.
All we need is its location:
```cpp line-numbers:{enabled} title:{preprocessor.cpp}
[[keyword,void]] [[class-name,Preprocessor]]::[[function,MacroDefined]]([[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDirective]]* directive) {
    [[keyword,const]] [[namespace-name,clang]]::[[class-name,SourceManager]]& source_manager = [[member-variable,m_context]]->[[function,getSourceManager]]();
    
    // Check to ensure this node originates from the file we are annotating
    [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroInfo]]* info = directive->[[function,getMacroInfo]]();
    [[namespace-name,clang]]::[[class-name,SourceLocation]] location = info->[[function,getDefinitionLoc]]();
    [[keyword,if]] (source_manager.[[function,getFileID]](location) [[function-operator,!=]] source_manager.[[function,getMainFileID]]()) {
        [[keyword,return]];
    }
    
    // ...
}
```
Macro definitions are annotated with the `macro-name` annotation.

```text added:{4}
#include <source_location> // std::source_location
#include "utils/logging.hpp"

#define [[macro-name,ASSERT]](EXPRESSION, MESSAGE, ...) \
    do { \
        if (!(EXPRESSION)) { \
            std::source_location location = std::source_location::current(); \
            utils::logging::error("Assertion '{}' failed in {}:{}: {}", #EXPRESSION, location.file_name(), location.line(), MESSAGE, ##__VA_ARGS__); \
        } \
    } while (false)
```

### Annotating macro arguments

For annotating macro arguments, we retrieve the tokens of the macro definition and iterate through them, checking for matches against the names of known macro parameters.
```cpp line-numbers:{enabled} title:{preprocessor.cpp}
[[keyword,void]] [[class-name,Preprocessor]]::[[function,MacroDefined]]([[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDirective]]* directive) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    // Annotate the name of the macro
    // ...
    
    [[keyword,for]] ([[keyword,const]] [[class-name,Token]]& token : [[member-variable,m_tokenizer]]->[[function,get_tokens]](info->[[function,getDefinitionLoc]](), info->[[function,getDefinitionEndLoc]]())) {
        [[keyword,for]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,IdentifierInfo]]* argument : info->[[function,params]]()) {
            [[namespace-name,std]]::[[class-name,string]] argument_name = argument->[[function,getName]]().[[function,str]]();
            [[keyword,if]] (token.[[member-variable,spelling]] [[binary-operator,==]] argument_name) {
                [[member-variable,m_annotator]]->[[function,insert_annotation]]("macro-argument", token.[[member-variable,line]], token.[[member-variable,column]], argument_name.[[function,length]]());
            }
        }
    }
    
    // ...
}
```
Macro arguments are annotated with the `macro-argument` annotation.
```text added:{4,6,8}
#include <source_location> // std::source_location
#include "utils/logging.hpp"

#define ASSERT([[macro-argument,EXPRESSION]], [[macro-argument,MESSAGE]], ...) \
    do { \
        if (!([[macro-argument,EXPRESSION]])) { \
            std::source_location location = std::source_location::current(); \
            utils::logging::error("Assertion '{}' failed in {}:{}: {}", #[[macro-argument,EXPRESSION]], location.file_name(), location.line(), [[macro-argument,MESSAGE]], ##[[macro-argument,__VA_ARGS__]]); \
        } \
    } while (false)
```
Notice that the `__VA_ARGS__` identifier is also implicitly included in the parameter list of a variadic macro definition.

### Annotating the `#define` directive

Now, the tricky part.
`MacroInfo::getDefinitionLoc` gives the location of the macro name, not the `#define` token.
In fact, by default the `#define` directive is not included in the source range of a macro definition at all.

One approach we can use is a helper function of the `SourceLocation` class, `getLocWithOffset`, to offset our location by the number of characters in `#define` and a single whitespace separator in an attempt to reach the start of the `#define` directive.
```cpp
[[namespace-name,std]]::[[class-name,span]]<[[keyword,const]] [[class-name,Token]]> tokens = [[member-variable,m_tokenizer]]->[[member-variable,get_tokens]](start.[[function,getLocWithOffset]]([[unary-operator,-]]8), end);
```
This works as long as we provide a large enough offset to capture both the `#` and `define` tokens.

However, this solution isn't ideal.
Consider, for example, a coding style that aligns macro with an arbitrary number of spaces between the `#` and the `define`, or the `define` and the start of the macro definition.
The only restriction that the standard imposes on preprocessor directives is that they must appear on their own line and the `#` must be the first non-whitespace character.
How do we ensure that the offset is enough to capture both the `#` and the `define`?
We can try specifying a larger offset, but that runs the risk of unnecessary overhead as we'll need to parse more tokens.

A better approach is to take advantage of this restriction imposed by the standard and modify our `Tokenizer::get_tokens` function to optionally ignore column offsets and retrieve tokens from an entire line.
Then, in `annotate_directive`, we simply annotate the first two tokens from the specified line, which are the `#` and the directive itself.
```cpp title:{preprocessor.cpp} line-numbers:{enabled}
[[keyword,void]] [[class-name,Preprocessor]]::[[function,annotate_directive]]([[namespace-name,clang]]::[[class-name,SourceLocation]] location) {
    std::span<[[keyword,const]] Token> tokens = [[member-variable,m_tokenizer]]->[[member-variable,get_tokens]](location, location, [[keyword,true]]);
    [[keyword,for]] ([[keyword,int]] i = 0; i [[binary-operator,<]] 2; [[unary-operator,++]]i) {
        [[keyword,const]] [[class-name,Token]]& token = tokens[[operator,[]]i[[operator,]]];
        [[member-variable,m_annotator]]->[[function,insert_annotation]]("preprocessor-directive", token.[[member-variable,line]], token.[[member-variable,column]], token.[[member-variable,spelling]].[[function,length]]());
    }
}
```
This helper will come in handy for implementing the other visitors.
The last step for `MacroDefined` is to annotate the `#define` directive:
```cpp title:{preprocessor.cpp} line-numbers:{enabled}
[[keyword,void]] [[class-name,Preprocessor]]::[[function,MacroDefined]]([[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDirective]]* directive) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    // Annotate the name of the macro
    // ...
    
    // Annotate macro parameters
    // ...
    
    [[function,annotate_directive]](info->[[function,getDefinitionLoc]]());
}
```
Directives are annotated with the `preprocessor-directive` annotation.
```text added:{4}
#include <source_location> // std::source_location
#include "utils/logging.hpp"

[[preprocessor-directive,#]][[preprocessor-directive,define]] ASSERT(EXPRESSION, MESSAGE, ...) \
    do { \
        if (!(EXPRESSION)) { \
            std::source_location location = std::source_location::current(); \
            utils::logging::error("Assertion '{}' failed in {}:{}: {}", #EXPRESSION, location.file_name(), location.line(), MESSAGE, ##__VA_ARGS__); \
        } \
    } while (false)
```
An important thing to keep in mind is that the `MacroDefined` function will not be invoked for any macro definitions that aren't referenced in the code, as the preprocessor optimizes the macro definition out entirely.

## Macro references

Now that we've implemented the `ASSERT` macro, it would be useful to annotate references to it as we sprinkle asserts throughout our (hypothetical) codebase.
```text
#include <source_location> // std::source_location
#include "utils/logging.hpp"

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

Macro expansions are handled by the `MacroExpands` function:
```cpp title:{preprocessor.hpp}
[[keyword,void]] [[function,MacroExpands]]([[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDefinition]]& definition, [[namespace-name,clang]]::[[class-name,SourceRange]] range, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroArgs]]* args) [[keyword,override]];
```

The implementation is straightforward, as we simply need to annotate the macro name.
```cpp title:{preprocessor.cpp} line-numbers:{enabled}
[[keyword,void]] [[class-name,Preprocessor]]::[[function,MacroExpands]]([[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDefinition]]& definition, [[namespace-name,clang]]::[[class-name,SourceRange]] range, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroArgs]]* args) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    [[namespace-name,clang]]::[[class-name,SourceLocation]] location = name.[[function,getLocation]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);
    
    [[member-variable,m_annotator]]->[[function,insert_annotation]]("macro-name", line, column, name.[[function,getLength]]());
}

```
This applies even if the macro was defined in a different file - we are only checking where it is *used*.
This allows us to handle built-in macros, such as those provided from a build system or the command line, without requiring the definition to be present in the file we are annotating.
The `MacroArgs` struct allows for deeper introspection into the structure of the macro, such as if the macro was invoked with variadic arguments (and, if so, how many), or if the macro arguments require further expansion such as for macro dispatching.
This advanced behavior is not necessary for simple syntax highlighting, so we won't be requiring it here.

As with macro definitions, macro references are also annotated with the `macro-name` annotation.
```text added:{13}
#include <source_location> // std::source_location
#include "utils/logging.hpp"

#define ASSERT(EXPRESSION, MESSAGE, ...) \
    do { \
        if (!(EXPRESSION)) { \
            std::source_location location = std::source_location::current(); \
            utils::logging::error("Assertion '{}' failed in {}:{}: {}", #EXPRESSION, location.file_name(), location.line(), MESSAGE, ##__VA_ARGS__); \
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

For visiting `#undef` directives, we must override the `MacroUndefined` visitor.
```cpp title:{preprocessor.hpp}
[[keyword,void]] [[function,MacroUndefined]]([[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDefinition]]& definition, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDirective]]* directive) [[keyword,override]];
```
This directive may refer to a macro that hasn't been defined (in which case the `directive` pointer is null), but for the purposes of syntax highlighting, we just need the name and location of the macro.
Both of these are retrieved from the `name` parameter directly.
```cpp title:{preprocessor.cpp} line-numbers:{enabled}
[[keyword,void]] [[class-name,Preprocessor]]::[[function,MacroUndefined]]([[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDefinition]]& definition, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDirective]]* directive) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    // Annotate the name of the macro
    [[namespace-name,clang]]::[[class-name,SourceLocation]] location = name.[[function,getLocation]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);
    [[member-variable,m_annotator]]->[[function,insert_annotation]]("macro-name", line, column, name.[[function,getLength]]());
    
    // Annotate the '#undef' preprocessor directive
    [[function,annotate_directive]](location);
}
```
The `#undef` directive itself is annotated with a call to `annotate_directive`.

# Conditional compilation directives

Let's expand the `ASSERT` macro definition so that its substitution is a noop on non-debug builds.
One of the most common ways this is done is scoping the actual assertion logic within a compile-time check that is only active when `NDEBUG` is defined.
```text
#include <source_location> // std::source_location
#include "utils/logging.hpp"

#ifndef NDEBUG
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
Conditional compilation directives include `#if`, `#elif`, `#ifdef`, `#ifndef`, `#elifdef`, `#elifndef`, `#else`, and `#endif`.
Each directive has a corresponding override in the `PPCallbacks` interface:
```cpp title:{preprocessor.hpp}
[[keyword,void]] [[function,If]]([[namespace-name,clang]]::[[class-name,SourceLocation]] location, [[namespace-name,clang]]::[[class-name,SourceRange]] range, [[namespace-name,clang]]::[[class-name,PPCallbacks]]::[[enum-name,ConditionValueKind]] value) [[keyword,override]];
[[keyword,void]] [[function,Elif]]([[namespace-name,clang]]::[[class-name,SourceLocation]] location, [[namespace-name,clang]]::[[class-name,SourceRange]] range, [[namespace-name,clang]]::[[class-name,PPCallbacks]]::[[enum-name,ConditionValueKind]] value, [[namespace-name,clang]]::[[class-name,SourceLocation]] if_location) [[keyword,override]];
[[keyword,void]] [[function,Ifdef]]([[namespace-name,clang]]::[[class-name,SourceLocation]] location, [[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDefinition]]& definition) [[keyword,override]];
[[keyword,void]] [[function,Ifndef]]([[namespace-name,clang]]::[[class-name,SourceLocation]] location, [[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDefinition]]& definition) [[keyword,override]];
[[keyword,void]] [[function,Elifdef]]([[namespace-name,clang]]::[[class-name,SourceLocation]] location, [[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDefinition]]& definition) [[keyword,override]];
[[keyword,void]] [[function,Elifndef]]([[namespace-name,clang]]::[[class-name,SourceLocation]] location, [[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDefinition]]& definition) [[keyword,override]];
[[keyword,void]] [[function,Else]]([[namespace-name,clang]]::[[class-name,SourceLocation]] location, [[namespace-name,clang]]::[[class-name,SourceLocation]] if_location) [[keyword,override]];
[[keyword,void]] [[function,Endif]]([[namespace-name,clang]]::[[class-name,SourceLocation]] location, [[namespace-name,clang]]::[[class-name,SourceLocation]] if_location) [[keyword,override]];
```
Annotating directives like `#if`, `#else`, `#elif`, and `#endif` is simple, as these do not reference other macro identifiers.
We can annotate them with a call to `annotate_directive`.

For identifier-based directives, such as `#ifdef`, `#ifndef`, `#elifdef`, and `#elifndef`, we must also annotate the reference to the macro in the check, as it is not handled by `MacroExpands`.
For example:
```cpp title:{preprocessor.cpp} line-numbers:{enabled}
[[keyword,void]] [[class-name,Preprocessor]]::[[function,Ifndef]]([[namespace-name,clang]]::[[class-name,SourceLocation]] location, [[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDefinition]]& definition) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    // Annotate macro name
    location [[function-operator,=]] name.[[function,getLocation]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);
    [[member-variable,m_annotator]]->[[function,insert_annotation]]("macro-name", line, column, name.[[function,getLength]]());
    
    // Annotate '#ifndef' preprocessor directive
    [[function,annotate_directive]](location);
}
```
The `location` parameter references the location of the preprocessor directive itself, meaning the location at which to insert the `macro-name` annotation for the macro identifier must instead be retrieved from the token that represents it.
This pattern applies to the rest of the visitors for identifier-based conditional compilation directives.

```text added:{4,12,15}
#include <source_location> // std::source_location
#include "utils/logging.hpp"

[[preprocessor-directive,#]][[preprocessor-directive,ifndef]] [[macro-name,NDEBUG]]
    #define ASSERT(EXPRESSION, MESSAGE, ...) \
        do { \
            if (!(EXPRESSION)) { \
                std::source_location location = std::source_location::current(); \
                utils::logging::error("Assertion '{}' failed in {}:{}: {}", #EXPRESSION, location.file_name(), location.line(), MESSAGE, ##__VA_ARGS__); \
            } \
        } while (false)
[[preprocessor-directive,#]][[preprocessor-directive,else]]
    // Inactive branch, no annotations here...
    #define ASSERT(EXPRESSION, MESSAGE, ...) do { } while (false)
[[preprocessor-directive,#]][[preprocessor-directive,endif]]
```

One limitation to note: these visitor functions are not triggered for symbols in inactive branches (such as an `#else` block that gets skipped).
While Clang does support visiting inactive `#elifdef` and `#elifndef` branches, for some reason this functionality was not extended to `#else` blocks.
This means that, at the time of writing this post, annotating their contents is not possible without some extra work.

A possible solution is to programmatically extract the inactive branch and run the annotator on that separately.
However, I decided this was out of scope for this project, and any inactive branches will have to be manually annotated.
Preprocessor directives as a whole are a pretty niche thing to include in a code snippet for a block post, so I don't anticipate this being much of a roadblock.
Still, if this becomes a bigger problem down the road, expect another blog post.

## `defined`

The `defined` operator is used inside `#if` or `#elif` conditions to test whether a macro has been defined.
You've likely seen it written like this:
```cpp
[[preprocessor-directive,#]][[preprocessor-directive,if]] ![[preprocessor-directive,defined]]([[macro-name,NDEBUG]])
```
In fact, the `#ifdef` and `#ifndef` directives are shorthand for `#if defined` and `#if !defined` (respectively), and, with the introduction of C++23, the `#elif defined` and `#elif !defined` constructs were formalized into `#elifdef` and `#elifndef` directives.
However, `defined` is still widely used.

To annotate this directive, we must override the `Defined` visitor:
```cpp title:{preprocessor.hpp}
[[keyword,void]] [[function,Defined]]([[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDefinition]]& definition, [[namespace-name,clang]]::[[class-name,SourceRange]] range) [[keyword,override]];
```
Unfortunately, there is no direct way to get the location of the `defined` keyword itself - only the macro name.
To get around this limitation, we'll just tokenize the line and look for the token manually:
```cpp line-numbers:{enabled} title:{preprocessor.cpp}
[[keyword,void]] [[class-name,Preprocessor]]::[[function,Defined]]([[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[keyword,const]] [[namespace-name,clang]]::[[class-name,MacroDefinition]]& definition, [[namespace-name,clang]]::[[class-name,SourceRange]] range) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    // Annotate macro name
    [[namespace-name,clang]]::[[class-name,SourceLocation]] location = name.[[function,getLocation]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);
    [[member-variable,m_annotator]]->[[function,insert_annotation]]("macro-name", line, column, name.[[function,getLength]]());
    
    // Annotate 'defined' preprocessor directive
    [[namespace-name,std]]::[[class-name,span]]<[[keyword,const]] [[class-name,Token]]> tokens = [[member-variable,m_tokenizer]]->[[function,get_tokens]](location, location, [[keyword,true]]);
    [[keyword,for]] ([[keyword,const]] [[class-name,Token]]& token : tokens) {
        [[keyword,if]] (token.[[member-variable,spelling]] [[binary-operator,==]] "defined") {
            [[member-variable,m_annotator]]->[[function,insert_annotation]]("preprocessor-directive", token.[[member-variable,line]], token.[[member-variable,column]], token.[[member-variable,spelling]].[[function,length]]());
        }
    }
}
```
The tokenization approach is the same as what we used for the `annotate_directive()` function.
Here, however, because we have no guarantee in the position of the token we are searching for, we start from the beginning of the line.
The macro name is annotated in the same way as in the other preprocessor hooks by using the `getLocation()` function from the node.
The `defined` directive is annotated as a `preprocessor-directive`, just as before.

In the case of an `#if defined` directive, the `#if` portion will be picked up by the `Preprocessor::If` preprocessor hook, so it is not annotated here.

With this visitor implemented, we are able to annotate both short and long representations of these conditional directives.
```text added:{4}
#include <source_location> // std::source_location
#include "utils/logging.hpp"

#if ![[preprocessor-directive,defined]]([[macro-name,NDEBUG]])
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

## `#include` statements

Setting up our visitor to handle `#include` directives requires implementing the `InclusionDirective` visitor:
```cpp title:{preprocessor.hpp}
[[keyword,void]] [[function,InclusionDirective]]([[namespace-name,clang]]::[[class-name,SourceLocation]] hash_location,
                        [[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name,
                        [[namespace-name,clang]]::[[class-name,StringRef]] filename,
                        [[keyword,bool]] angled,
                        // Unused parameters...
                        [[namespace-name,clang]]::[[class-name,CharSourceRange]],
                        [[namespace-name,clang]]::[[class-name,OptionalFileEntryRef]],
                        [[namespace-name,clang]]::[[class-name,StringRef]],
                        [[namespace-name,clang]]::[[class-name,StringRef]],
                        [[keyword,const]] [[namespace-name,clang]]::[[class-name,Module]]*,
                        [[keyword,bool]],
                        [[namespace-name,clang]]::[[namespace-name,SrcMgr]]::[[enum-name,CharacteristicKind]]) [[keyword,override]];
};
```
This function is set up to handle both `#include` and `#import` directives (for supporting C++20 modules).
The parameters to this function give insight into the type of include being processed, the search paths the compiler used to find the file, and relevant syntactic information (such as if the filepath is surrounded by angled brackets or quotes).
There is a separate `FileNotFound` function that is invoked when the compiler cannot find a file referenced by an inclusion directive.
We can hook into this if we wanted to underline the missing include statement in red, as is typically done in many IDEs.

However, for the purposes of syntax highlighting, most of these parameters can be ignored.
```cpp line-numbers:{enabled} title:{preprocessor.cpp}
[[keyword,void]] [[class-name,Preprocessor]]::[[function,InclusionDirective]]([[namespace-name,clang]]::[[class-name,SourceLocation]] hash_location, [[keyword,const]] [[namespace-name,clang]]::[[class-name,Token]]& name, [[namespace-name,clang]]::[[class-name,StringRef]] filename, [[keyword,bool]] angled, ...) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    // Annotate file being included
    [[namespace-name,std]]::[[class-name,span]]<[[keyword,const]] [[class-name,Token]]> tokens = [[member-variable,m_tokenizer]]->[[function,get_tokens]](location, location, [[keyword,true]]);
    [[keyword,for]] ([[keyword,const]] [[class-name,Token]]& token : tokens) {
        [[keyword,if]] (angled) {
            // Angle brackets are not included in the filename for include statements that use angled brackets (e.g. #include <...>) and must be handled separately
            [[keyword,if]] (token.[[member-variable,spelling]] [[function-operator,==]] "<" [[binary-operator,||]] token.[[member-variable,spelling]] [[function-operator,==]] ">") {
                [[member-variable,m_annotator]]->[[function,insert_annotation]]("string", token.[[member-variable,line]], token.[[member-variable,column]], 1);
            }
            [[keyword,else]] [[keyword,if]] (token.[[member-variable,spelling]] [[function-operator,==]] filename) {
                [[member-variable,m_annotator]]->[[function,insert_annotation]]("string", token.[[member-variable,line]], token.[[member-variable,column]], token.[[member-variable,spelling]].[[function,length]]());
            }
        }
        [[keyword,else]] {
            // The filename includes quotes for include statements that use quotes (e.g. #include "...")
            [[keyword,if]] (token.[[member-variable,spelling]] [[function-operator,==]] ("\"" [[function-operator,+]] filename.[[function,str]]() [[function-operator,+]] "\"")) {
                [[member-variable,m_annotator]]->[[function,insert_annotation]]("string", token.[[member-variable,line]], token.[[member-variable,column]], token.[[member-variable,spelling]].[[function,length]]());
            }
        }
    }
    
    // Annotate '#include' directive
    [[function,annotate_directive]](location);
}
```
Both the filename and the braces should be annotated with the `string` tag
One small caveat is that the `filename` parameter contains the name of the file being included with quotes when processing `#include "..."` statements, but not when processing `#include <...>` statements.
This must be properly accounted for in order to keep annotations consistent across both types of includes.

As before, annotating the `#include` preprocessor directive is handled using the `annotate_directive` function.

```text added:{1-2}
[[preprocessor-directive,#]][[preprocessor-directive,include]] [[string,<]][[string,source_location]][[string,>]] // std::source_location
[[preprocessor-directive,#]][[preprocessor-directive,include]] [[string,"utils/logging.hpp"]]

#ifndef NDEBUG
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

## `#pragma` directives

`#pragma` directives are used to toggle compiler- or platform-specific features, such as disabling compilation warnings or changing alignment requirements.
```text
#pragma once

#include <source_location> // std::source_location
#include "utils/logging.hpp"

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
Clang's `PPCallbacks` interface provides specialized visitors for various `#pragma` directives, such as `PragmaComment` for `#pragma comment` statements, but the simplest way to support them is to treat all pragmas as generic preprocessor directives and override the `PragmaDirective` visitor, which is invoked whenever the preprocessor encounters *any* `#pragma` directive.
```cpp title:{preprocessor.hpp}
[[keyword,void]] [[function,PragmaDirective]]([[namespace-name,clang]]::[[class-name,SourceLocation]] location, [[namespace-name,clang]]::[[enum-name,PragmaIntroducerKind]] introducer) [[keyword,override]];
```
The implementation of this function is straightforward, as we only need to annotate the `#pragma` preprocessor directive itself:
```cpp title:{preprocessor.hpp} line-numbers:{enabled}
[[keyword,void]] [[class-name,Preprocessor]]::[[function,PragmaDirective]]([[namespace-name,clang]]::[[class-name,SourceLocation]] location, [[namespace-name,clang]]::[[enum-name,PragmaIntroducerKind]] introducer) {
    [[keyword,const]] [[namespace-name,clang]]::[[class-name,SourceManager]]& source_manager = [[member-variable,m_context]]->[[function,getSourceManager]]();
    [[keyword,if]] (source_manager.[[function,getFileID]](location) [[function-operator,!=]] source_manager.[[function,getMainFileID]]()) {
        [[keyword,return]];
    }
    
    // Annotate '#pragma' directive
    [[function,annotate_directive]](location);
}
```
As before, is easily achieved with the `annotate_directive()` function.
Any pragma-specific tokens are purposefully left unmodified due to the wide range of pragmas available.If these require further annotation, it should be done manually.
```text added:{1}
[[preprocessor-directive,#]][[preprocessor-directive,pragma]] once

#include <source_location> // std::source_location
#include "utils/logging.hpp"

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

## Unsupported directives

At the time of writing this post, some preprocessor directives, like `#error` and `#line`, do not have a corresponding visitor in Clang.
- `#error`, which is used to intentionally generate a compiler error, typically to catch unsupported configurations or missing/incorrect conditions during preprocessing
- `#line`, which is used to change the current line number (and optionally file name) reported by the compiler for diagnostic or debug information in generated code

Annotating these would require manual parsing of the source file and annotation based on the format of the directive, similar to the tokenization approach we used throughout this series.

## Styling

The final step is to add definitions for the various CSS styles for the different kinds of preprocessor directives:
```css
.language-cpp .preprocessor-directive {
    color: rgb(187, 181, 41);
}
.language-cpp .macro-name,
.language-cpp .macro-argument {
    color: rgb(149, 144, 51);
}
```

```cpp
[[preprocessor-directive,#]][[preprocessor-directive,pragma]] once

[[preprocessor-directive,#]][[preprocessor-directive,ifndef]] [[macro-name,EXAMPLE_HPP]]
[[preprocessor-directive,#]][[preprocessor-directive,define]] [[macro-name,EXAMPLE_HPP]]

[[preprocessor-directive,#]][[preprocessor-directive,include]] [[string,<]][[string,source_location]][[string,>]] // std::source_location
[[preprocessor-directive,#]][[preprocessor-directive,include]] [[string,"utils/logging.hpp"]]

[[preprocessor-directive,#]][[preprocessor-directive,if]] ![[preprocessor-directive,defined]]([[macro-name,NDEBUG]])
    [[preprocessor-directive,#]][[preprocessor-directive,define]] [[macro-name,ASSERT]]([[macro-argument,EXPRESSION]], [[macro-argument,MESSAGE]], ...) \
        [[keyword,do]] { \
            [[keyword,if]] (!([[macro-argument,EXPRESSION]])) { \
                std::source_location location = std::source_location::current(); \
                utils::logging::error("Assertion '{}' failed in {}:{}: {}", #[[macro-argument,EXPRESSION]], location.file_name(), location.line(), [[macro-argument,MESSAGE]], ##[[macro-argument,__VA_ARGS__]]); \
            } \
        } [[keyword,while]] ([[keyword,false]])
[[preprocessor-directive,#]][[preprocessor-directive,else]]
    // ...
[[preprocessor-directive,#]][[preprocessor-directive,endif]]

[[preprocessor-directive,#]][[preprocessor-directive,endif]] // EXAMPLE_HPP
```

---

In this post, we implemented a way to hook into the Clang preprocessor and set up visitors for common preprocessor directives such as macro definitions, conditional compilation directives, and file includes
In the <LocalLink text={"next post"} to={"Better C++ Syntax Highlighting - Part 10: Keywords"}></LocalLink>, we'll wrap up the project with a discussion on how to annotate C++ language keywords.
Thanks for reading!

So far, our visitors have only processed type declarations.
What about type references?

In the Clang AST, `TypeLoc` nodes represent the location of where a type appears in the source code.
By extending our visitor to handle `TypeLoc` nodes, we can insert annotations for the types referenced in variable declarations, function parameters, template arguments, and more, making it particularly useful for inserting syntax highlighting annotations.
`TypeLoc` nodes also provide access to the corresponding `QualType`, which, if necessary, contains detailed information about the type itself.

In some cases, such as base class inheritance chains (from a previous post), we intentionally skipped over visiting these nodes.
These cases can be handled much more elegantly through `TypeLoc` nodes.
Unlike other AST nodes we have visited previously, `TypeLoc` nodes do not explicitly appear in the AST.
Rather, they serve as meta-nodes that provide information for types.

We can still, however, set up a `TypeLoc` visitor function and handle it like any other AST node:
```cpp line-numbers:{enabled} title:{visitor.hpp} added:{8-9}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // ...
        
        // For visiting type references
        bool VisitTypeLoc(clang::TypeLoc location);
        
        // ...
};
```
As mentioned in the introduction post to this series, `TypeLoc` nodes are a rare exception that get passed by value instead of by pointer.

Consider the following example:
```cpp line-numbers:{enabled}
namespace logging {
    
    struct Message {
        enum class Level {
            DEBUG,
            INFO,
            WARNING,
            ERROR
        };
        
        // ...
    };
    
}

int main() {
    logging::Message::Level level = logging::Message::Level::INFO;
    // ...
}
```
Ideally, we would have annotations that look as follows:

```cpp
[[namespace-name,logging]]::[[class-name,Message]]::[[enum-name,Level]] level = [[namespace-name,logging]]::[[class-name,.Message]]::[[enum-name,Level]]::[[enum-value,INFO]];
```
To implement this, we would need to process two `TypeLoc` nodes: one for the type declaration of `level`, and the other for the value it is being initialized to.

In general, annotating a type consists of two steps.
The first step, which we will talk about in this post, is annotating the reference to the type itself.
The main challenge here is differentiating between what type is being referenced to annotate it correctly.
Remember that enums, for example, are annotated with `enum-name`, while classes and other types are annotated with `class-name`.
We can achieve this by inspecting the properties of the `TypeLoc` node itself.
This represents the end type of the variable itself, the `[[enum-name,Level]]` annotation.

The second challenge is adding annotation to type qualifiers, such as namespaces and other class names.
This represents the `[[namespace-name,logging]]::[[class-name,Message]]` portion of the type declaration, and `[[namespace-name,logging]]::[[class-name,.Message]]::[[enum-name,Level]]` in the initialization.
This functionality extends beyond only `TypeLoc` nodes, and we will visit this in the next post.

## The `TypeLoc` visitor function

We're not actually going to do any annotation in the `VisitTypeLoc` visitor.
Instead, it will be used for identifying which `TypeLoc` nodes we need to visit.
```cpp
#include "visitor.hpp"

bool Visitor::VisitTypeLoc(clang::TypeLoc node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    
    // Skip any external TypeLoc nodes
    clang::SourceLocation location = node.getBeginLoc();
    if (!source_manager.isInMainFile(location)) {
        return true;
    }

    unsigned line = source_manager.getSpellingLineNumber(location);
    
    const clang::Type* type = node.getTypePtr(); // What type this node is
    const clang::QualType qualified = node.getType(); // Fully-qualified type the node references
    
    utils::logging::debug("encountered {} node ({}) on line {}", type->getTypeClassName(), qualified.getAsString(), line);
    return true;
}
```
The Clang AST exposes derivative nodes for accessing references to specific subtypes, with `TypeLoc` being the generic base interface that all other `TypeLoc` nodes derive from.
For example, we can set up a visitor specifically for `RecordTypeLoc` nodes to visit type references to classes, structs, and unions, or a visitor to `EnumTypeLoc` nodes to visit type references to enums.
We can access the derivative node through `TypeLoc::getTypePtr`.
In addition to this, we will log the fully-qualified name of the type being referenced as retrieved from `TypeLoc::getType` so we can start getting an idea of what types are referenced by what type of node.
```text
[DEBUG] encountered FunctionProto node (int (void)) on line 16
[DEBUG] encountered Builtin node (int) on line 16
[DEBUG] encountered Elaborated node (logging::struct Message::Level) on line 17
[DEBUG] encountered Record node (struct logging::Message) on line 17
[DEBUG] encountered Enum node (enum logging::Message::Level) on line 17
[DEBUG] encountered Record node (struct logging::Message) on line 17
[DEBUG] encountered Enum node (enum logging::Message::Level) on line 17
```

there will be some overlap between what we annotate different symbols with, but this should not be a problem as long as we remain consistent with the annotations that are used.
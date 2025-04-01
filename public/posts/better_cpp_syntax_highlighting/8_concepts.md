
## Concepts

With the standardization of C++20 came concepts.

```cpp
#include <concepts> // std::same_as
#include <iterator> // std::begin, std::end

template <typename T>
concept Container = requires(T container, std::size_t index) {
    // Ensure that the container supports the std::begin and std::end methods
    { std::begin(container) } -> std::same_as<decltype(std::end(container))>;
    
    // Ensure that the container iterator can be dereferenced
    { *std::begin(container) };

    // Ensure that the container iterator can be incremented
    { ++std::begin(container) } -> std::same_as<decltype(std::begin(container))>;

    // Ensure that the container has a public 'data' member variable
    { container.data };
    
    // Ensure that the container member functions 'size', 'capacity', and supports the subscript operator []
    { container.size() };
    { container.capacity() };
    { container[index] };
    
    // Ensure that the container defines the necessary types
    { T::value_type };
    // ...
};

template <typename T>
void print(const T& value);

// Concept-constrained function specialization for containers
template <Container T>
void print(const T& container);
```

```text
|-ConceptDecl 0x1cde7835e98 <example.cpp:4:1, line:26:1> line:5:9 Container
| |-TemplateTypeParmDecl 0x1cde7835df0 <line:4:11, col:20> col:20 referenced typename depth 0 index 0 T
| `-RequiresExpr 0x1cde7836f08 <line:5:21, line:26:1> 'bool'
|   |-ParmVarDecl 0x1cde7835ef8 <line:5:30, col:32> col:32 referenced container 'T'
|   |-ParmVarDecl 0x1cde7835fe8 <col:43, col:55> col:55 referenced index 'std::size_t':'unsigned long long'
|   |-CompoundRequirement 0x1cde7836588 dependent
|   | |-CallExpr 0x1cde7836180 <line:7:7, col:27> '<dependent type>'
|   | | |-UnresolvedLookupExpr 0x1cde78360f0 <col:7, col:12> '<overloaded function type>' lvalue (no ADL) = 'begin' 0x1cde6b21cb0 0x1cde6b22798 0x1cde6b22d88 0x1cde6b23fd0 0x1cde6b27f20 0x1cde6b28410
|   | | `-DeclRefExpr 0x1cde7836160 <col:18> 'T' lvalue ParmVar 0x1cde7835ef8 'container' 'T' non_odr_use_unevaluated
|   | `-ConceptSpecializationExpr 0x1cde78364f8 <col:34, col:76> 'bool' Concept 0x1cde6331e50 'same_as'
|   |   |-ImplicitConceptSpecializationDecl 0x1cde7836408 <C:/MSYS2/mingw64/include/c++/14.2.0/concepts:62:13> col:13
|   |   | |-TemplateArgument type 'type-parameter-1-0'
|   |   | | `-TemplateTypeParmType 0x1cde6126380 'type-parameter-1-0' dependent depth 1 index 0
|   |   | `-TemplateArgument type 'decltype(std::end(container))'
|   |   |   `-DecltypeType 0x1cde78362a0 'decltype(std::end(container))' dependent
|   |   |     `-CallExpr 0x1cde7836270 <example.cpp:7:56, col:74> '<dependent type>'
|   |   |       |-UnresolvedLookupExpr 0x1cde78361e0 <col:56, col:61> '<overloaded function type>' lvalue (no ADL) = 'end' 0x1cde6b221a0 0x1cde6b23378 0x1cde6b23968 0x1cde6b24590 0x1cde6b28890 0x1cde6b28d10
|   |   |       `-DeclRefExpr 0x1cde7836250 <col:65> 'T' lvalue ParmVar 0x1cde7835ef8 'container' 'T' non_odr_use_unevaluated
|   |   |-TemplateArgument type 'expr-type':'type-parameter-1-0'
|   |   | `-TemplateTypeParmType 0x1cde7836390 'expr-type' dependent depth 1 index 0
|   |   |   `-TemplateTypeParm 0x1cde7836328 'expr-type'
|   |   `-TemplateArgument <col:47, col:75> type 'decltype(std::end(container))'
|   |     `-DecltypeType 0x1cde78362d0 'decltype(std::end(container))' dependent
|   |       `-CallExpr 0x1cde7836270 <col:56, col:74> '<dependent type>'
|   |         |-UnresolvedLookupExpr 0x1cde78361e0 <col:56, col:61> '<overloaded function type>' lvalue (no ADL) = 'end' 0x1cde6b221a0 0x1cde6b23378 0x1cde6b23968 0x1cde6b24590 0x1cde6b28890 0x1cde6b28d10
|   |         `-DeclRefExpr 0x1cde7836250 <col:65> 'T' lvalue ParmVar 0x1cde7835ef8 'container' 'T' non_odr_use_unevaluated
|   |-CompoundRequirement 0x1cde78366a8 dependent
|   | `-UnaryOperator 0x1cde7836690 <line:10:7, col:28> '<dependent type>' lvalue prefix '*' cannot overflow
|   |   `-CallExpr 0x1cde7836668 <col:8, col:28> '<dependent type>'
|   |     |-UnresolvedLookupExpr 0x1cde78365d8 <col:8, col:13> '<overloaded function type>' lvalue (no ADL) = 'begin' 0x1cde6b21cb0 0x1cde6b22798 0x1cde6b22d88 0x1cde6b23fd0 0x1cde6b27f20 0x1cde6b28410
|   |     `-DeclRefExpr 0x1cde7836648 <col:19> 'T' lvalue ParmVar 0x1cde7835ef8 'container' 'T' non_odr_use_unevaluated
|   |-CompoundRequirement 0x1cde7836b88 dependent
|   | |-UnaryOperator 0x1cde78367b0 <line:13:7, col:29> '<dependent type>' lvalue prefix '++' cannot overflow
|   | | `-CallExpr 0x1cde7836788 <col:9, col:29> '<dependent type>'
|   | |   |-UnresolvedLookupExpr 0x1cde78366f8 <col:9, col:14> '<overloaded function type>' lvalue (no ADL) = 'begin' 0x1cde6b21cb0 0x1cde6b22798 0x1cde6b22d88 0x1cde6b23fd0 0x1cde6b27f20 0x1cde6b28410
|   | |   `-DeclRefExpr 0x1cde7836768 <col:20> 'T' lvalue ParmVar 0x1cde7835ef8 'container' 'T' non_odr_use_unevaluated
|   | `-ConceptSpecializationExpr 0x1cde7836af8 <col:36, col:80> 'bool' Concept 0x1cde6331e50 'same_as'
|   |   |-ImplicitConceptSpecializationDecl 0x1cde7836a08 <C:/MSYS2/mingw64/include/c++/14.2.0/concepts:62:13> col:13
|   |   | |-TemplateArgument type 'type-parameter-1-0'
|   |   | | `-TemplateTypeParmType 0x1cde6126380 'type-parameter-1-0' dependent depth 1 index 0
|   |   | `-TemplateArgument type 'decltype(std::begin(container))'
|   |   |   `-DecltypeType 0x1cde78368a0 'decltype(std::begin(container))' dependent
|   |   |     `-CallExpr 0x1cde7836878 <example.cpp:13:58, col:78> '<dependent type>'
|   |   |       |-UnresolvedLookupExpr 0x1cde78367e8 <col:58, col:63> '<overloaded function type>' lvalue (no ADL) = 'begin' 0x1cde6b21cb0 0x1cde6b22798 0x1cde6b22d88 0x1cde6b23fd0 0x1cde6b27f20 0x1cde6b28410
|   |   |       `-DeclRefExpr 0x1cde7836858 <col:69> 'T' lvalue ParmVar 0x1cde7835ef8 'container' 'T' non_odr_use_unevaluated
|   |   |-TemplateArgument type 'expr-type':'type-parameter-1-0'
|   |   | `-TemplateTypeParmType 0x1cde7836990 'expr-type' dependent depth 1 index 0
|   |   |   `-TemplateTypeParm 0x1cde7836928 'expr-type'
|   |   `-TemplateArgument <col:49, col:79> type 'decltype(std::begin(container))'
|   |     `-DecltypeType 0x1cde78368d0 'decltype(std::begin(container))' dependent
|   |       `-CallExpr 0x1cde7836878 <col:58, col:78> '<dependent type>'
|   |         |-UnresolvedLookupExpr 0x1cde78367e8 <col:58, col:63> '<overloaded function type>' lvalue (no ADL) = 'begin' 0x1cde6b21cb0 0x1cde6b22798 0x1cde6b22d88 0x1cde6b23fd0 0x1cde6b27f20 0x1cde6b28410
|   |         `-DeclRefExpr 0x1cde7836858 <col:69> 'T' lvalue ParmVar 0x1cde7835ef8 'container' 'T' non_odr_use_unevaluated
|   |-CompoundRequirement 0x1cde7836c20 dependent
|   | `-CXXDependentScopeMemberExpr 0x1cde7836bd8 <line:16:7, col:17> '<dependent type>' lvalue .data
|   |   `-DeclRefExpr 0x1cde7836bb8 <col:7> 'T' lvalue ParmVar 0x1cde7835ef8 'container' 'T' non_odr_use_unevaluated
|   |-CompoundRequirement 0x1cde7836cd8 dependent
|   | `-CallExpr 0x1cde7836cb8 <line:19:7, col:22> '<dependent type>'
|   |   `-CXXDependentScopeMemberExpr 0x1cde7836c70 <col:7, col:17> '<dependent type>' lvalue .size
|   |     `-DeclRefExpr 0x1cde7836c50 <col:7> 'T' lvalue ParmVar 0x1cde7835ef8 'container' 'T' non_odr_use_unevaluated
|   |-CompoundRequirement 0x1cde7836d90 dependent
|   | `-CallExpr 0x1cde7836d70 <line:20:7, col:26> '<dependent type>'
|   |   `-CXXDependentScopeMemberExpr 0x1cde7836d28 <col:7, col:17> '<dependent type>' lvalue .capacity
|   |     `-DeclRefExpr 0x1cde7836d08 <col:7> 'T' lvalue ParmVar 0x1cde7835ef8 'container' 'T' non_odr_use_unevaluated
|   |-CompoundRequirement 0x1cde7836e20 dependent
|   | `-ArraySubscriptExpr 0x1cde7836e00 <line:21:7, col:22> '<dependent type>' lvalue
|   |   |-DeclRefExpr 0x1cde7836dc0 <col:7> 'T' lvalue ParmVar 0x1cde7835ef8 'container' 'T' non_odr_use_unevaluated
|   |   `-DeclRefExpr 0x1cde7836de0 <col:17> 'std::size_t':'unsigned long long' lvalue ParmVar 0x1cde7835fe8 'index' 'std::size_t':'unsigned long long' non_odr_use_unevaluated
|   `-CompoundRequirement 0x1cde7836ed8 dependent
|     `-DependentScopeDeclRefExpr 0x1cde7836ea0 <line:24:7, col:10> '<dependent type>' lvalue
|       `-NestedNameSpecifier TypeSpec 'T'
|-FunctionTemplateDecl 0x1cde7837218 <line:28:1, line:29:26> col:6 print
| |-TemplateTypeParmDecl 0x1cde7836f90 <line:28:11, col:20> col:20 referenced typename depth 0 index 0 T
| `-FunctionDecl 0x1cde7837168 <line:29:1, col:26> col:6 print 'void (const T &)'
|   `-ParmVarDecl 0x1cde7837078 <col:12, col:21> col:21 value 'const T &'
`-FunctionTemplateDecl 0x1cde78376f8 <line:32:1, line:33:30> col:6 print
  |-TemplateTypeParmDecl 0x1cde7837318 <line:32:11, col:21> col:21 referenced Concept 0x1cde7835e98 'Container' depth 0 index 0 T
  | `-ConceptSpecializationExpr 0x1cde7837480 <col:11> 'bool' Concept 0x1cde7835e98 'Container'
  |   |-ImplicitConceptSpecializationDecl 0x1cde78373c8 <line:5:9> col:9
  |   | `-TemplateArgument type 'type-parameter-0-0'
  |   |   `-TemplateTypeParmType 0x1cde60f1b50 'type-parameter-0-0' dependent depth 0 index 0
  |   `-TemplateArgument <line:32:21> type 'T':'type-parameter-0-0'
  |     `-TemplateTypeParmType 0x1cde7837380 'T' dependent depth 0 index 0
  |       `-TemplateTypeParm 0x1cde7837318 'T'
  `-FunctionDecl 0x1cde7837648 <line:33:1, col:30> col:6 print 'void (const T &)'
    `-ParmVarDecl 0x1cde7837558 <col:12, col:21> col:21 container 'const T &'
```

Concepts are different from a lot of the other nodes we've visited so far.
In addition to the `ConceptDecl` and `ConceptSpecializationExpr` nodes, which refer to concept definitions and references, there are also context-dependent nodes such as `UnresolvedLookupExpr`, `DependentScopeDeclRefExpr`, and `CXXDependentScopeMemberExpr` that refer to nodes that cannot be fully resolved due to their dependency on an unknown type `T`.
These are typical in template and concept definitions where the compiler cannot determine the declaration to use due to type information being unavailable until instantiation.
For these nodes, despite the full type being unknown, it is still possible to deduce enough information from the AST (for most cases) to apply syntax highlighting.

Not all of these nodes require their own visitor function.
As can be seen from the AST, `UnresolvedLookupExpr` and, in some cases, `DependentScopeDeclRefExpr` nodes, are children of a `CallExpr` node.
For these, we can instead augment the existing `VisitCallExpr` implementation, in a similar approach to what we did earlier with reusing `CXXRecordDecl` for template class definitions.
`ConceptDecl`, `ConceptSpecializationExpr`, and `CXXDependentScopeMemberExpr` nodes require their own visitors, so let's implement those now.

```cpp title:{visitor.hpp} added:{9,14-21}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // For visiting function calls
        // For visiting unresolved (dependent) type expressions
        bool VisitCallExpr(clang::CallExpr* node);
        
        // ...
        
        // For visiting concept declarations / definitions
        bool VisitConceptDecl(clang::ConceptDecl* node);
        
        // For visiting concept constraint expressions
        bool VisitConceptSpecializationExpr(clang::ConceptSpecializationExpr* node);
        
        // For visiting class members of dependent types
        bool VisitCXXDependentScopeMemberExpr(clang::CXXDependentScopeMemberExpr* node);
        
        // ...
};
```

### Concept declarations

Concept declarations are captured by `ConceptDecl` nodes.
```cpp title:{visitor.cpp}
#include "visitor.hpp"

bool Visitor::VisitConceptDecl(clang::ConceptDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    // Skip any concept declarations that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    const std::string& name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("concept", line, column, name.length());
    
    return true;
}
```
Concept definitions are annotated with the `concept` annotation.

### Concept constraint expressions

Concept constraints are captured by `ConceptSpecializationExpr` nodes.
This includes constraints applied to the concept definition itself and also when the concept is used as a constraint in a `constexpr` environment.
```cpp
#include "visitor.hpp"

bool Visitor::VisitConceptSpecializationExpr(clang::ConceptSpecializationExpr* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getConceptNameLoc();
    
    // Skip any concept constraint expressions that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    // Retrieve the name of the concept through the declaration
    const clang::ConceptDecl* decl = node->getNamedConcept();
    const std::string& name = decl->getNameAsString();
    
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("concept", line, column, name.length());
    
    return true;
}
```
The implementation for the `VisitConceptSpecializationExpr` follows closely to that of `VisitConceptDecl`.
The name of the concept is retrieved from the declaration via `ConceptSpecializationExpr::getNamedConcept`.

### Dependent function calls

As can be seen from the AST, `UnresolvedLookupExpr` and, in some cases, `DependentScopeDeclRefExpr` nodes, are children of a `CallExpr` node, which means we can reuse our previous implementation.
```cpp
#include "visitor.hpp"

bool Visitor::VisitCallExpr(clang::CallExpr* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getBeginLoc();
    
    // Skip any function calls that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    // Retrieve the name of the function from the function declaration
    const clang::FunctionDecl* function = clang::dyn_cast<clang::FunctionDecl>(node->getCalleeDecl());
    std::string name = function->getNameAsString();
    
    // Clang does not provide an easy way to retrieve the location of the function name directly
    std::span<const Token> tokens = m_tokenizer->get_tokens(node->getSourceRange());
    for (const Token& token : tokens) {
        if (token.spelling == name) {
            m_annotator->insert_annotation("function", token.line, token.column, name.length());
            break;
        }
    }

    return true;
}
```
However, if we execute the `VisitCallExpr` function as is, we get a segmentation fault.
Why is it, then, that the existing `VisitCallExpr` cannot properly handle these nodes?
The main problem lies in the way the name of the function is retrieved.
For unresolved nodes, `CallExpr::getCalleeDecl` returns `nullptr`, as due to the unknown type of `T` it is ambiguous which declaration the function refers to.

We must process these nodes separately.

Unresolved expressions result from references whose type is ambiguous and could not be resolved.
Good examples of this are the `std::begin` and `std::end` functions - the function used differs based on the type of container `T`.
```cpp added:{12-22,36}
#include "visitor.hpp"

bool Visitor::VisitCallExpr(clang::CallExpr* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = node->getBeginLoc();
    
    // Skip any function calls that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    // In template contexts, CallExpr nodes fail to resolve fully due to their dependency on an unknown type `T`.
    if (const clang::UnresolvedLookupExpr* ule = clang::dyn_cast<clang::UnresolvedLookupExpr>(node->getCallee())) {
        // An example of an UnresolvedLookupExpr is std::begin(T)
        std::string name = ule->getNameInfo().getAsString();
        location = ule->getNameLoc();
        
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);
        
        m_annotator->insert_annotation("function", line, column, name.length());
    }
    else {
        // Retrieve the name of the function from the function declaration
        const clang::FunctionDecl* function = clang::dyn_cast<clang::FunctionDecl>(node->getCalleeDecl());
        std::string name = function->getNameAsString();
        
        // Clang does not provide an easy way to retrieve the location of the function name directly
        std::span<const Token> tokens = m_tokenizer->get_tokens(node->getSourceRange());
        for (const Token& token : tokens) {
            if (token.spelling == name) {
                m_annotator->insert_annotation("function", token.line, token.column, name.length());
                break;
            }
        }
    }

    return true;
}
```
With some dynamic casting, we introduce a separate branch for `UnresolvedLookupExpr` nodes.
The name and location of the function is retrieved with calls to `UnresolvedLookupExpr::getNameInfo` and `UnresolvedLookupExpr::getNameLoc`.
This gives us the location of the function name directly (ignoring any qualifying namespaces and/or class names), meaning we can insert a `function` annotation directly without having to tokenize the range of the whole `CallExpr` node.

`DependentScopeDeclRefExpr` nodes are a bit different.
As can be seen on line 70 of the AST, a `DependentScopeDeclRefExpr` node is not strictly required to be a child of a `CallExpr` node.
This pertains to line 24 of the code block, which enforces a `T::value_type` constraint on the concept.
In this example, however, is still ambiguous what the type of the expression is.
`T::value_type` may either reference a static member variable or a nested type.
Both of these have different annotations for syntax highlighting.
I decided to leave this case unhandled - should the case arise, it will simply require manual annotation.
This also means we don't need to implement another visitor.

For `DependentScopeDeclRefExpr` nodes that are children of a `CallExpr`, we can use a similar approach and augment the `VisitCallExpr` visitor to handle this case specifically.
```cpp added:{23-33}
#include "visitor.hpp"

bool Visitor::VisitCallExpr(clang::CallExpr* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = node->getBeginLoc();
    
    // Skip any function calls that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    // In template contexts, CallExpr nodes fail to resolve fully due to their dependency on an unknown type `T`.
    if (const clang::UnresolvedLookupExpr* ule = clang::dyn_cast<clang::UnresolvedLookupExpr>(node->getCallee())) {
        // An example of an UnresolvedLookupExpr is std::begin(T)
        std::string name = ule->getNameInfo().getAsString();
        location = ule->getNameLoc();
        
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);
        
        m_annotator->insert_annotation("function", line, column, name.length());
    }
    else if (const clang::DependentScopeDeclRefExpr* dre = clang::dyn_cast<clang::DependentScopeDeclRefExpr>(node->getCallee())) {
        // An example of an DependentScopeDeclRefExpr is T::function()
        std::string name = dre->getNameInfo().getAsString();
        location = dre->getLocation();

        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);

        m_annotator->insert_annotation("function", line, column, name.length());
    }
    else {
        // Retrieve the name of the function from the function declaration
        const clang::FunctionDecl* function = clang::dyn_cast<clang::FunctionDecl>(node->getCalleeDecl());
        std::string name = function->getNameAsString();
        
        // Clang does not provide an easy way to retrieve the location of the function name directly
        std::span<const Token> tokens = m_tokenizer->get_tokens(node->getSourceRange());
        for (const Token& token : tokens) {
            if (token.spelling == name) {
                m_annotator->insert_annotation("function", token.line, token.column, name.length());
                break;
            }
        }
    }

    return true;
}
```
The name and location of the function is retrieved with calls to `DependentScopeDeclRefExpr::getNameInfo` and `DependentScopeDeclRefExpr::getLocation`.
`DependentScopeDeclRefExpr` that are not children of `CallExpr` nodes are purposefully left unhandled.

### Dependent member references

The last node for this section is the `CXXDependentScopeMemberExpr`, which represents a member access where the referenced member cannot be fully resolved.
The implementation of the `VisitCXXDependentScopeMemberExpr` visitor follows a similar pattern as before:
```cpp
#include "visitor.hpp"

bool Visitor::VisitCXXDependentScopeMemberExpr(clang::CXXDependentScopeMemberExpr* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = node->getMemberLoc();
    
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    const std::string& name = node->getMemberNameInfo().getAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("member-variable", line, column, name.length());
    
    return true;
}
```

The location of the member variable is retrieved directly by a call to `CXXDependentScopeMemberExpr::getMemberLoc`.
The name of the member is retrieved through `CXXDependentScopeMemberExpr::getMemberNameInfo`.
The member is annotated with the `member-variable` annotation, as before.

Throughout this series, we have only ever annotated the target of a given AST node.
However, it is not uncommon that some these nodes contain qualifiers, which come in the form of namespaces and classes, and can be present on type names, static class member variables, and function calls.
In this post, we will implement a way to annotate these qualifiers and revisit the visitor implementations for these nodes for more comprehensive syntax highlighting.

Let's take a look at a (slightly augmented) example from a previous post in this series.
```text line-numbers:{enabled}
#include <cmath> // std::sqrt

namespace [[namespace-name,math]] {

    namespace [[namespace-name,detail]] {
        // ... 
    }

    struct [[class-name,Vector3]] {
        static const [[class-name,Vector3]] [[member-variable,zero]];
        
        [[function,Vector3]]() : [[member-variable,x]](0.0f), [[member-variable,y]](0.0f), [[member-variable,z]](0.0f) { }
        [[function,Vector3]](float x, float y, float z) : [[member-variable,x]](x), [[member-variable,y]](y), [[member-variable,z]](z) { }
        [[function,~Vector3]]() { }
        
        [[nodiscard]] float [[function,length]]() const {
            return std::[[function,sqrt]]([[member-variable,x]] * [[member-variable,x]] + [[member-variable,y]] * [[member-variable,y]] + [[member-variable,z]] * [[member-variable,z]]);
        }
        
        float [[member-variable,x]];
        float [[member-variable,y]];
        float [[member-variable,z]];
    };
    
    // Const class static members must be initialized out of line
    const [[class-name,Vector3]] Vector3::[[member-variable,zero]] = [[function,Vector3]]();

}

int main() {
    using namespace [[namespace-name,math]]::[[namespace-name,detail]];

    typedef math::Vector3 Color; // Typedef for RGB color support
    Color c = { 255.0f, 165.0f, 0.0f };
    
    // ...
    
    using Position = math::[[class-name,Vector3]];
    Position origin = math::Vector3::[[member-variable,zero]];
    
    // ...
}
```
This example illustrates several cases where qualifiers are missing syntax highlighting annotations:
1. The `sqrt` function call on line 13 is qualified by the `std` namespace,
2. The declaration and out-of-line definition of static `Vector3` class member `zero` on lines 6 and 22 (respectively) is qualified by the `Vector3` type, and
3. The declaration and initialization of the `zero` variable on line 27 is qualified by the `math` namespace and `Vector3` type in the variable's declaration and initializer.

`using namespace` directives are already being handled correctly due to the `extract_namespaces` function implemented for the `UsingDirectiveDecl` visitor from [one of the previous posts in this series]().
In this section, we will augment visitor implementations for the `CallExpr` (function calls), `TypeAliasDecl` (`using` directives), `TypedefDecl` (`typedef` expressions), and `VarDecl` (variable declaration/initialization) nodes to properly handle annotations for all types of qualifiers.

## Annotating qualifiers

To achieve this, we need to extend the `extract_namespaces` function from [one of our previous posts]() to account for classes.
In `extract_namespaces`, we took advantage of the tree-based structure of the AST and "walked" up the declaration hierarchy of a node to visit all parent namespaces that enclose a given `NamespaceDecl` node.
The namespace hierarchy was accessed through the `Decl::getDeclContext` function.
Luckily, extending this function just means adding a check for if a parent node is a class type, meaning that we can keep most of our previous logic intact.

```cpp title:{visitor.hpp} added:{1-21,32} removed:{31} line-numbers:{enabled}
#include <unordered_map> // std::unordered_map

enum class QualifierType {
    Namespace,
    Record
};

class QualifierList {
    public:
        QualifierList();
        ~QualifierList() = default;
        
        void add_namespace(const std::string& name);
        void add_record(const std::string& name);
        
        [[nodiscard]] bool contains(const std::string& name) const;
        [[nodiscard]] QualifierType get_qualifier_type(const std::string& name) const;
        
    private:
        std::unordered_map<std::string, QualifierType> m_qualifiers;
};

class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // ...
        
    private:
        [[nodiscard]] std::unordered_set<std::string> extract_namespaces(const clang::DeclContext* context) const;
        [[nodiscard]] QualifierList extract_qualifiers(const clang::DeclContext* context) const;
        
        // ...
};
```
Since we are no longer handling just namespaces, the name of the function is updated to `extract_qualifiers`.
This function returns a custom `QualifierList` object that allows us to differentiate between the type of qualifier we're dealing with.
It closely mimics the functionality of the existing `unordered_set` implementation, acting as a simple wrapper to simplify the way it is used.
The `QualifierList` implementation is straightforward and is omitted for brevity; its implementation, along with the rest of the project, can be viewed [here]().

In the updated `extract_qualifiers` function implementation, all we need to do is traverse the hierarchy in the exact same way and, in addition to namespaces, keep track of the names of any classes (represented by `CXXRecordDecl` nodes) encountered along the way:
```cpp title:{visitor.cpp}
#include "visitor.hpp"

QualifierList Visitor::extract_qualifiers(const clang::DeclContext* context) {
    QualifierList qualifiers { };
    
    while (context) {
        if (const clang::NamespaceDecl* n = clang::dyn_cast<clang::NamespaceDecl>(context)) {
            qualifiers.add_namespace(n->getNameAsString());
        }
        else if (const clang::CXXRecordDecl* r = clang::dyn_cast<clang::CXXRecordDecl>(context)) {
            qualifiers.add_record(r->getNameAsString());
        }
        
        context = context->getParent();
    }
    
    return qualifiers;
}
```

With this function updated, we must first update our `VisitUsing` functions to annotate qualifiers.

### Namespaces

First up, namespaces:
```cpp line-numbers:{enabled} added:{19,24,30} removed:{18,23,29}
bool Visitor::VisitNamespaceAliasDecl(clang::NamespaceAliasDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = node->getLocation();

    // Skip nodes not in the main file
    if (source_manager.isInMainFile(location)) {
        // Annotate namespace alias
        std::string name = node->getNameAsString();
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);
        
        m_annotator->insert_annotation("namespace-name", line, column, name.length());
        utils::logging::info("namespace alias: {} on line {}, column {}", name, line, column);
        
        // Annotate aliased namespace(s)
        // Generate namespace chain
        const clang::NamedDecl* aliased = node->getAliasedNamespace();
        std::unordered_set<std::string> namespaces = extract_namespaces(aliased->getDeclContext());
        QualifierList qualifiers = extract_qualifiers(aliased->getDeclContext());
        
        // extract_qualifiers checks for NamespaceDecl nodes, but this node is a NamespaceAliasDecl
        // Include this namespace in the namespace chain
        namespaces.insert(aliased->getNameAsString());
        qualifiers.add_namespace(aliased->getNameAsString());
        
        // Tokenize the node range and annotate all tokens containing namespace names
        std::span<const Token> tokens = m_tokenizer->get_tokens(node->getSourceRange());
        for (const Token& token : tokens) {
            if (namespaces.contains(token.spelling)) {
            if (qualifiers.contains(token.spelling) && qualifiers.get_qualifier_type(token.spelling) == QualifierType::Namespace) {
                m_annotator->insert_annotation("namespace-name", token.line, token.column, token.spelling.length());
                utils::logging::info("aliased namespace '{}' on line {}, column {}", token.spelling, token.line, token.column);
            }
        }
    }
    
    return true;
}
```
We don't consider class names as qualifiers here as `NamespaceAliasDecl` nodes represent namespace aliases, which can only contain the names of other namespaces.
For `using` directives, however, we must account for both `using namespace` directives and `using` type aliases:
```cpp line-numbers:{enabled} removed:{12,16,22,35,39,45} added:{13,17,23,36,40,46-48}
bool Visitor::VisitUsingDirectiveDecl(clang::UsingDirectiveDecl* node) {
    return true;
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    if (const clang::NamespaceDecl* n = node->getNominatedNamespace()) {
        // using namespace ...
        std::unordered_set<std::string> namespaces = extract_namespaces(n->getDeclContext());
        QualifierList qualifiers = extract_qualifiers(n->getDeclContext());
        
        // Include the namespace from the UsingDirectiveDecl node in the namespace chain
        namespaces.insert(n->getNameAsString());
        qualifiers.add_namespace(n->getNameAsString());
        
        // Tokenize the node range and annotate all tokens containing namespace names
        std::span<const Token> tokens = m_tokenizer->get_tokens(node->getSourceRange());
        for (const Token& token : tokens) {
            if (namespaces.contains(token.spelling)) {
            if (qualifiers.contains(token.spelling) && qualifiers.get_qualifier_type(token.spelling) == QualifierType::Namespace) {
                m_annotator->insert_annotation("namespace-name", token.line, token.column, token.spelling.length());
            }
        }
    }
    else {
        std::string name = node->getNameAsString();
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);
        
        m_annotator->insert_annotation("class-name", line, column, name.length());
        
        std::unordered_set<std::string> namespaces = extract_namespaces(node->getDeclContext());
        QualifierList qualifiers = extract_qualifiers(n->getDeclContext());
        
        // Include the namespace from the UsingDirectiveDecl node in the namespace chain
        namespaces.insert(node->getNameAsString());
        qualifiers.add_namespace(node->getNameAsString());
        
        // Tokenize the node range and annotate all tokens containing namespace names
        std::span<const Token> tokens = m_tokenizer->get_tokens(node->getSourceRange());
        for (const Token& token : tokens) {
            if (namespaces.contains(token.spelling)) {
            if (qualifiers.contains(token.spelling)) {
                QualifierType type = qualifiers.get_qualifier_type(token.spelling);
                m_annotator->insert_annotation(type == QualifierType::Namespace ? "namespace-name" : "class-name", token.line, token.column, token.spelling.length());
            }
        }
    }
    
    return true;
}
```
`using namespace` directives follow a similar pattern as before, as these nodes can only be qualified by other namespaces.

### Types

However, `using` type aliases may be classified by both classes and namespaces.

### Static class member variables

### Function calls



Throughout this series, we have only ever annotated the target of a given AST node.
However, it is not uncommon that these nodes contain qualifiers.
These qualifiers come in the form of namespaces and other classes, and can be present on type names, global and static class member variables, and function calls.
In this post, we will revisit the visitor implementations for these nodes and add a way to annotate these qualifiers.

## Annotating qualifiers

To achieve this, we can generalize the `extract_namespaces` function from one of our previous posts to also account for classes.
In this function, we took advantage of the tree-based structure of the AST and "walked" up the declaration hierarchy of a node to visit all parent namespaces that enclose a given `NamespaceDecl` node.
The namespace hierarchy was accessed through the `Decl::getDeclContext` function.

To handle classes as well as namespaces, we need to extend this function.
Luckily, we can keep most of our previous logic in place.

```cpp title:{visitor.hpp} added:{1-25,35} removed:{25} line-numbers:{enabled}
struct Qualifier {
    // Represents the type of qualifier this is
    enum class Type {
        Namespace,
        Record
    };
    
    Qualifier(std::string name, Type type);
    ~Qualifier() = default;
    
    bool operator==(const Qualifier& other);
    
    Type type;
    std::string name;
};

// std::hash explicit specialization for Qualifier struct for use in std::unordered_set
namespace std {

    template <>
    struct hash<Qualifier> {
        std::size_t operator()(const Qualifier& qualifier) const {
            // Hash directly by the qualifier name as namespace/class names are guaranteed to be distinct and unique 
            return std::hash<std::string>()(qualifier.name);
        }
    };

}

class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // ...
        
    private:
        [[nodiscard]] std::unordered_set<std::string> extract_namespaces(const clang::DeclContext* context) const;
        [[nodiscard]] std::unordered_set<Qualifier> extract_qualifiers(const clang::DeclContext* context) const;
        
        // ...
};
```
Since we are no longer handling just namespaces, the name of the function is updated to `extract_qualifiers`.
Additionally, we must return a set of `Qualifier` objects to be able to differentiate the type of qualifier we're dealing with.
In the implementation, all we need to do is emplace the correct type:
```cpp title:{visitor.cpp}
#include "visitor.hpp"

std::unordered_set<Qualifier> Visitor::extract_qualifiers(const clang::DeclContext* context) {
    std::unordered_set<Qualifier> qualifiers;
    
    while (context) {
        if (const clang::NamespaceDecl* n = clang::dyn_cast<clang::NamespaceDecl>(context)) {
            qualifiers.emplace(n->getNameAsString(), Qualifier::Type::Namespace);
        }
        else if (const clang::CXXRecordDecl* r = clang::dyn_cast<clang::CXXRecordDecl>(context)) {
            qualifiers.emplace(r->getNameAsString(), Qualifier::Type::Record);
        }
        
        context = context->getParent();
    }
    
    return qualifiers;
}
```
Let's first update the `VisitNamespaceDecl` visitor to fix compilation errors before moving on to new functionality.
```cpp
```

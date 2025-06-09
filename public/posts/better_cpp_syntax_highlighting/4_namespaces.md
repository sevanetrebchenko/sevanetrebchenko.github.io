
## Namespaces

Next up are namespace declarations.
Consider the following example:
```cpp line-numbers:{enabled}
namespace math {
    namespace utility {
        // ...
    }
}

int main() {
    using namespace math;
    namespace utils = math::utility;

    // ...
}
```
With corresponding AST:
```text
|-NamespaceDecl 0x1cce3be79e8 <example.cpp:1:1, line:5:1> line:1:11 math
| `-NamespaceDecl 0x1cce3be7a78 <line:2:5, line:4:5> line:2:15 utility
`-FunctionDecl 0x1cce540bb68 <line:7:1, line:12:1> line:7:5 main 'int ()'
  `-CompoundStmt 0x1cce540bdc0 <col:12, line:12:1>
    |-DeclStmt 0x1cce540bd08 <line:8:5, col:25>
    | `-UsingDirectiveDecl 0x1cce540bcb0 <col:5, col:21> col:21 Namespace 0x1cce3be79e8 'math'
    `-DeclStmt 0x1cce540bda8 <line:9:5, col:36>
      `-NamespaceAliasDecl 0x1cce540bd48 <col:5, col:29> col:15 utils
        `-Namespace 0x1cce3be7a78 'utility'
```

For adding annotations to namespaces, we need to set up visitor functions to process three new kinds of nodes:
- [`NamespaceDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1NamespaceDecl.html), which represent namespace declarations,
- [`NamespaceAliasDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1NamespaceAliasDecl.html), which represent namespace aliases, and
- [`UsingDirectiveDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1UsingDirectiveDecl.html), which represent `using namespace` directives
```cpp line-numbers:{enabled} added:{8-15} title:{visitor.hpp}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // ...
        
        // For visiting namespace declarations
        bool VisitNamespaceDecl(clang::NamespaceDecl* node);
        
        // For visiting namespace alias declarations
        bool VisitNamespaceAliasDecl(clang::NamespaceAliasDecl* node);
        
        // For visiting 'using namespace' directives
        bool VisitUsingDirectiveDecl(clang::UsingDirectiveDecl* node);
        
        // ...
};
```

### Namespace declarations

Namespace declarations are captured by `NamespaceDecl` nodes.
The corresponding `VisitNamespaceDecl` visitor function inserts a `namespace-name` annotation to all namespace declarations from the main file.
```cpp title:{visitor.cpp}
#include "visitor.hpp"

bool Visitor::VisitNamespaceDecl(clang::NamespaceDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    // Skip any namespace declarations that do not come from the main file
    if (source_manager.isInMainFile(location)) {
        const std::string& name = node->getNameAsString();
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);
        
        m_annotator->insert_annotation("namespace-name", line, column, name.length());
    }
    
    return true;
}
```

With the `VisitNamespaceDecl` visitor function implemented, the tool now properly annotates namespace declarations:
```text
namespace [[namespace-name,math]] {
    namespace [[namespace-name,utility]] {
        // ...
    }
}

int main() {
    using namespace math;
    namespace utils = math::utility;

    // ...
}
```

### Namespace aliases

Namespace aliases are captured by `NamespaceAliasDecl` nodes.
In addition to adding a `namespace-name` annotation to the namespace(s) being aliased, we also need to insert an annotation for the alias itself.
```cpp title:{visitor.cpp} line-numbers:{enabled}
#include "visitor.hpp"

bool Visitor::VisitNamespaceAliasDecl(clang::NamespaceAliasDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = node->getLocation();
    
    // Skip any namespace alias declarations that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    // Annotate namespace alias
    std::string name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    m_annotator->insert_annotation("namespace-name", line, column, name.length());
    
    // Annotate aliased namespace(s)
    // Generate namespace chain
    const clang::NamedDecl* aliased = node->getAliasedNamespace();
    std::unordered_set<std::string> namespaces = extract_namespaces(aliased->getDeclContext());
    
    // extract_namespaces checks for NamespaceDecl nodes, but this node is a NamespaceAliasDecl
    // Include it in the namespace chain 
    namespaces.insert(aliased->getNameAsString());
    
    // Tokenize the node range and annotate all tokens containing namespace names
    for (const Token& token : m_tokenizer->get_tokens(node->getSourceRange())) {
        if (namespaces.contains(token.spelling)) {
            m_annotator->insert_annotation("namespace-name", token.line, token.column, token.spelling.length());
        }
    }
    
    return true;
}
```
Annotating the namespace alias is straightforward, as we can directly retrieve the necessary properties from the `NamespaceAliasDecl` node.
However, annotating all namespaces in the aliased namespace chain requires a bit more work.

Every `Decl` node inherits from the [`DeclContext` interface](https://clang.llvm.org/doxygen/classclang_1_1DeclContext.html#details), which provides the `getDeclContext` function (as shown on line 19).
This function allows us to leverage the tree-based structure of the AST and walk up the declaration hierarchy of a node until we reach the top-level `TranslationUnitDecl`.
This is particularly useful in the case of an aliased namespace chain, as it allows us to visit all parent namespaces that enclose a given namespace and capture their names.
The namespace hierarchy chain is accessed through the `DeclContext` of the aliased namespace, which is retrieved via the call to `NamespaceAliasDecl::getAliasedNamespace` on line 20.
For each token contained within the range of the node (retrieved with the `get_tokens` function from earlier), we check if it matches one of the names contained in the namespace hierarchy and insert a `namespace-name` annotation if it does.

This pattern of walking up the AST hierarchy and annotating relevant tokens will be applied across several other visitor function implementations.
The `extract_namespaces` function (line 19) performs this traversal and returns the names of all namespaces.
```cpp title:{visitor.hpp} added:{20} line-numbers:{enabled}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // ...
        
        // For visiting namespace declarations
        bool VisitNamespaceDecl(clang::NamespaceDecl* node);
        
        // For visiting namespace alias declarations
        bool VisitNamespaceAliasDecl(clang::NamespaceAliasDecl* node);
        
        // For visiting 'using namespace' directives
        bool VisitUsingDirectiveDecl(clang::UsingDirectiveDecl* node);
        
        // ...
        
    private:
        [[nodiscard]] std::unordered_set<std::string> extract_namespaces(const clang::DeclContext* context) const;
        
        // ...
};
```
The parent node in the hierarchy is accessed through the `DeclContext::getParent` function.
```cpp title:{visitor.cpp}
#include "visitor.hpp"

std::unordered_set<std::string> Visitor::extract_namespaces(const clang::DeclContext* context) {
    std::unordered_set<std::string> namespaces;
    while (context) {
        if (const clang::NamespaceDecl* n = clang::dyn_cast<clang::NamespaceDecl>(context)) {
            namespaces.insert(n->getNameAsString());
        }
        context = context->getParent();
    }
    return namespaces;
}
```

With the `VisitNamespaceAliasDecl` visitor function implemented, the tool now also properly annotates namespace aliases:
```text
namespace [[namespace-name,math]] {
    namespace [[namespace-name,utility]] {
        // ...
    }
}

int main() {
    using namespace math;
    namespace [[namespace-name,utils]] = [[namespace-name,math]]::[[namespace-name,utility]];

    // ...
}
```

### `using namespace` directives

The final node we are interested in for this section is the `UsingDirectiveDecl` node, which represents `using namespace` directives.
The corresponding `VisitUsingDirectiveDecl` visitor function inserts a `namespace-name` annotation to all namespace names in the nominated namespace chain.
```cpp line-numbers:{enabled}
#include "visitor.hpp"

bool Visitor::VisitUsingDirectiveDecl(clang::UsingDirectiveDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    if (const clang::NamespaceDecl* n = node->getNominatedNamespace()) {
        // using namespace ...
        std::unordered_set<std::string> namespaces = extract_namespaces(n->getDeclContext());
        
        // extract_namespaces checks for NamespaceDecl nodes, but this node is a UsingDirectiveDecl
        // Include this namespace in the namespace chain
        namespaces.insert(n->getNameAsString());
        
        // Tokenize the node range and annotate all tokens containing namespace names
        std::span<const Token> tokens = m_tokenizer->get_tokens(node->getSourceRange());
        for (const Token& token : tokens) {
            if (namespaces.contains(token.spelling)) {
                m_annotator->insert_annotation("namespace-name", token.line, token.column, token.spelling.length());
            }
        }
    }
    
    return true;
}
```
This approach is very similar to that of the `VisitNamespaceAliasDecl` visitor function: for each token contained within the range of the `VisitUsingDirectiveDecl` node, we check if it matches one of the names contained in the namespace hierarchy and insert a `namespace-name` annotation if it does.
The namespace hierarchy chain is accessed through the `DeclContext` of the nominated namespace, which is retrieved via the call to `UsingDirectiveDecl::getNominatedNamespace` on line 11.

With all the visitor functions implemented, the tool now properly annotates all namespace declaration statements:
```text
namespace [[namespace-name,math]] {
    namespace [[namespace-name,utility]] {
        // ...
    }
}

int main() {
    using namespace [[namespace-name,math]];
    namespace [[namespace-name,utils]] = [[namespace-name,math]]::[[namespace-name,utility]];

    // ...
}
```
The final step is to add a definition for the `namespace-name` CSS style:
```css
.language-cpp .namespace-name {
    color: rgb(181, 182, 227);
}
```
```cpp
namespace [[namespace-name,math]] {
    namespace [[namespace-name,utility]] {
        // ...
    }
}

int main() {
    using namespace [[namespace-name,math]];
    namespace [[namespace-name,utils]] = [[namespace-name,math]]::[[namespace-name,utility]];

    // ...
}
```
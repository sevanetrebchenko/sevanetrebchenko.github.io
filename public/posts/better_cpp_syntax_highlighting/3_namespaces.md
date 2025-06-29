
Namespaces are up next.
Their declarations and references appear frequently in C++ code, and Clang exposes several node types for processing them.

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
And corresponding AST:
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

To annotate namespaces, we'll define visitor functions for three new node types:
- [`NamespaceDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1NamespaceDecl.html), for namespace declarations,
- [`NamespaceAliasDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1NamespaceAliasDecl.html), for namespace aliases, and
- [`UsingDirectiveDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1UsingDirectiveDecl.html), for`using namespace` directives.
```cpp
bool VisitNamespaceDecl(clang::NamespaceDecl* node);
bool VisitNamespaceAliasDecl(clang::NamespaceAliasDecl* node);
bool VisitUsingDirectiveDecl(clang::UsingDirectiveDecl* node);
```

### Namespace declarations

`NamespaceDecl` nodes represent standard namespace declarations.
We'll annotate these with a `namespace-name` tag:
```cpp title:{visitor.cpp}
bool Visitor::VisitNamespaceDecl(clang::NamespaceDecl* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    const std::string& name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    m_annotator->insert_annotation("namespace-name", line, column, name.length());

    return true;
}
```
With this visitor implemented, we are now able to properly annotate namespace declarations:
```text added:{1,2}
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

For `NamespaceAliasDecl` nodes, which represent namespace aliases, we annotate both the alias and the referenced namespaces.
First, we annotate the alias itself:
```cpp
std::string name = node->getNameAsString();

clang::SourceLocation location = node->getAliasLoc();
unsigned line = source_manager.getSpellingLineNumber(location);
unsigned column = source_manager.getSpellingColumnNumber(location);

m_annotator->insert_annotation("namespace-name", line, column, name.length());
```
The alias location is retrieved via `getAliasLoc()`.

Next, we annotate the namespace being aliased by accessing its `NamedDecl`.
```cpp
const clang::NamedDecl* aliased = node->getAliasedNamespace();
name = aliased->getNameAsString();

clang::SourceLocation location = node->getTargetNameLoc();
unsigned line = source_manager.getSpellingLineNumber(location);
unsigned column = source_manager.getSpellingColumnNumber(location);

m_annotator->insert_annotation("namespace-name", line, column, name.length());
```
The location of the alias target is retrieved via `getTargetNameLoc()`.
Both instances are annotated as a `namespace-name`.

With this visitor implemented, we can now properly annotate namespace aliases:
```text
namespace math {
    namespace utility {
        // ...
    }
}

int main() {
    using namespace math;
    namespace [[namespace-name,utils]] = math::[[namespace-name,utility]];

    // ...
}
```

### `using namespace` directives

The `UsingDirectiveDecl` node handles `using namespace` directives.
These follow the same pattern as namespace aliases but access the target namespace through `getNominatedNamespace()`:
```cpp
const clang::NamespaceDecl* decl = node->getNominatedNamespace();
std::string name = decl->getNameAsString();

unsigned line = source_manager.getSpellingLineNumber(location);
unsigned column = source_manager.getSpellingColumnNumber(location);

m_annotator->insert_annotation("namespace-name", line, column, name.length());
```
With this visitor implemented, we are able to annotate namespaces in `using namespace` directives:
```text
namespace math {
    namespace utility {
        // ...
    }
}

int main() {
    using namespace [[namespace-name,math]];
    namespace utils = math::utility;

    // ...
}
```

You'll notice that in both examples, qualifiers on namespace aliases and `using namespace` directives (such as `math::utility`) remain unannotated.
We will handle these when we look at generic qualifier processing in a later post in this series.

## Styling 
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
    namespace [[namespace-name,utils]] = math::[[namespace-name,utility]];

    // ...
}
```


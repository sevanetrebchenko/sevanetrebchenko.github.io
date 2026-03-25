
Namespaces are up next.
Their declarations and references appear frequently in C++ code, and Clang exposes several node types for processing them.

Consider the following example:
```cpp
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
```cpp title:{visitor.hpp}
[[keyword,bool]] [[function,VisitNamespaceDecl]]([[namespace-name,clang]]::[[class-name,NamespaceDecl]]* node);
[[keyword,bool]] [[function,VisitNamespaceAliasDecl]]([[namespace-name,clang]]::[[class-name,NamespaceAliasDecl]]* node);
[[keyword,bool]] [[function,VisitUsingDirectiveDecl]]([[namespace-name,clang]]::[[class-name,UsingDirectiveDecl]]* node);
```

## Namespace declarations

`NamespaceDecl` nodes represent standard namespace declarations.
We'll annotate these with a `namespace-name` tag:
```cpp line-numbers;{enabled} title:{visitor.cpp}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitNamespaceDecl]]([[namespace-name,clang]]::[[class-name,NamespaceDecl]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    [[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name = node->[[function,getNameAsString]]();
    
    [[keyword,const]] [[namespace-name,clang]]::[[class-name,SourceLocation]]& source_location = node->[[function,getLocation]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](source_location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](source_location);

    [[member-variable,m_annotator]]->[[function,insert_annotation]]("namespace-name", line, column, name.[[function,length]]());
    [[keyword,return]] [[keyword,true]];
}
```
With this visitor implemented, our tool produces the following output:
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

## Namespace aliases

For `NamespaceAliasDecl` nodes, which represent namespace aliases, we'll annotate both the alias and the referenced namespaces.
First, we annotate the alias:
```cpp title:{visitor.cpp}
[[namespace-name,std]]::[[class-name,string]] name = node->[[function,getNameAsString]]();

[[namespace-name,clang]]::[[class-name,SourceLocation]] location = node->[[function,getAliasLoc]]();
[[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
[[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);

[[member-variable,m_annotator]]->[[function,insert_annotation]]("namespace-name", line, column, name.[[function,length]]());
```
The name and source location of the alias is retrieved from the `NamespaceAliasDecl` node itself.
The location at which to insert annotations is retrieved via `getAliasLoc()`.

Next, we annotate the namespace being aliased:
```cpp title:{visitor.cpp}
[[keyword,const]] [[namespace-name,clang]]::[[class-name,NamedDecl]]* aliased = node->[[function,getAliasedNamespace]]();
[[namespace-name,std]]::[[class-name,string]] name [[function-operator,=]] aliased->[[function,getNameAsString]]();

[[namespace-name,clang]]::[[class-name,SourceLocation]] location [[function-operator,=]] node->[[function,getTargetNameLoc]]();
[[keyword,unsigned]] line [[binary-operator,=]] source_manager.[[function,getSpellingLineNumber]](location);
[[keyword,unsigned]] column [[binary-operator,=]] source_manager.[[function,getSpellingColumnNumber]](location);

[[member-variable,m_annotator]]->[[function,insert_annotation]]("namespace-name", line, column, name.[[function,length]]());
```
As this references an already existing namespace, its name can be retrieved from its declaration using the `getAliasedNamespace()` function.
Its location is retrieved via `getTargetNameLoc()`.

Both the alias and target namespaces are annotated with the `namespace-name` tag.
```text added:{9}
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

## `using namespace` directives

The `UsingDirectiveDecl` node handles `using namespace` directives.
This visitor follows the same pattern as before:
```cpp line-numbers:{enabled} title:{visitor.cpp}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitUsingDirectiveDecl]]([[namespace-name,clang]]::[[class-name,UsingDirectiveDecl]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    [[keyword,const]] [[namespace-name,clang]]::[[class-name,SourceLocation]]& location = node->[[function,getLocation]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);

    [[keyword,const]] [[namespace-name,clang]]::[[class-name,NamespaceDecl]]* n = node->[[function,getNominatedNamespace]]();
    [[namespace-name,std]]::[[class-name,string]] name = n->[[function,getNameAsString]]();

    [[member-variable,m_annotator]]->[[function,insert_annotation]]("namespace-name", line, column, name.[[function,length]]());
    [[keyword,return]] [[keyword,true]];
}
```
The name of the nominated namespace is retrieved from its declaration using `getNominatedNamespace()`, which returns a `NamespaceDecl`.
As before, the namespace name is annotated with the `namespace-name` tag.
```text added:{8}
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

You'll notice that in both examples, qualifiers these directives (such as `math` qualifier on the `utility` namespace) remain unannotated.
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

---

We've added support for annotating namespace declarations, aliases, and `using namespace` directives.
In the <LocalLink text={"next post"} to={"Better C++ Syntax Highlighting - Part 4: Functions"}></LocalLink>, we'll take a closer look at annotating functions declarations, definitions, calls, and operators.
Thanks for reading!



Templates and concepts make up a huge part of modern C++.
In this post, we’ll cover how to annotate template declarations, template parameters, and C++20 concepts.

Consider the following example:
```cpp
template <typename T>
void print(const T& value);

template <typename ...Ts>
void print(const Ts&... values);

template <typename T>
struct Foo {
    // ...
};

template <typename ...Ts>
struct Bar {
    // ...
};
```
And corresponding AST:
```text
|-FunctionTemplateDecl 0x29b40467068 <example.cpp:1:1, line:2:26> col:6 print
| |-TemplateTypeParmDecl 0x29b3eb87268 <line:1:11, col:20> col:20 referenced typename depth 0 index 0 T
| `-FunctionDecl 0x29b40466fb8 <line:2:1, col:26> col:6 print 'void (const T &)'
|   `-ParmVarDecl 0x29b40466e88 <col:12, col:21> col:21 value 'const T &'
|-FunctionTemplateDecl 0x29b40467528 <line:4:1, line:5:31> col:6 print
| |-TemplateTypeParmDecl 0x29b404671a0 <line:4:11, col:23> col:23 referenced typename depth 0 index 0 ... Ts
| `-FunctionDecl 0x29b40467478 <line:5:1, col:31> col:6 print 'void (const Ts &...)'
|   `-ParmVarDecl 0x29b40467350 <col:12, col:25> col:25 values 'const Ts &...' pack
|-ClassTemplateDecl 0x29b40467778 <line:7:1, line:10:1> line:8:8 Foo
| |-TemplateTypeParmDecl 0x29b40467620 <line:7:11, col:20> col:20 typename depth 0 index 0 T
| `-CXXRecordDecl 0x29b404676c8 <line:8:1, line:10:1> line:8:8 struct Foo definition
|   |-DefinitionData empty aggregate standard_layout trivially_copyable pod trivial literal has_constexpr_non_copy_move_ctor can_const_default_init
|   | |-DefaultConstructor exists trivial constexpr needs_implicit defaulted_is_constexpr
|   | |-CopyConstructor simple trivial has_const_param needs_implicit implicit_has_const_param
|   | |-MoveConstructor exists simple trivial needs_implicit
|   | |-CopyAssignment simple trivial has_const_param needs_implicit implicit_has_const_param
|   | |-MoveAssignment exists simple trivial needs_implicit
|   | `-Destructor simple irrelevant trivial constexpr needs_implicit
|   `-CXXRecordDecl 0x29b40467a30 <col:1, col:8> col:8 implicit struct Foo
`-ClassTemplateDecl 0x29b40467c58 <line:12:1, line:15:1> line:13:8 Bar
  |-TemplateTypeParmDecl 0x29b40467af8 <line:12:11, col:23> col:23 typename depth 0 index 0 ... Ts
  `-CXXRecordDecl 0x29b40467ba8 <line:13:1, line:15:1> line:13:8 struct Bar definition
    |-DefinitionData empty aggregate standard_layout trivially_copyable pod trivial literal has_constexpr_non_copy_move_ctor can_const_default_init
    | |-DefaultConstructor exists trivial constexpr needs_implicit defaulted_is_constexpr
    | |-CopyConstructor simple trivial has_const_param needs_implicit implicit_has_const_param
    | |-MoveConstructor exists simple trivial needs_implicit
    | |-CopyAssignment simple trivial has_const_param needs_implicit implicit_has_const_param
    | |-MoveAssignment exists simple trivial needs_implicit
    | `-Destructor simple irrelevant trivial constexpr needs_implicit
    `-CXXRecordDecl 0x29b4045f850 <col:1, col:8> col:8 implicit struct Bar
```

## Template declarations

Template declarations are represented by several node types:
- `ClassTemplateDecl` for primary class templates,
- `ClassTemplatePartialSpecializationDecl` for partial specializations,
- `ClassTemplateSpecializationDecl` for explicit specializations, and
- `TemplateTypeParmDecl` for template parameters

We don’t actually need to define new visitors for the template class declarations themselves.
Each `ClassTemplateDecl`, `ClassTemplatePartialSpecializationDecl`, and `ClassTemplateSpecializationDecl` node contains a nested `CXXRecordDecl` representing the underlying class — which is already handled by our existing `VisitCXXRecordDecl` visitor.

However, we do need to annotate template parameters, which are represented by `TemplateTypeParmDecl` nodes.
The visitor signature looks like this:
```cpp
bool VisitTemplateTypeParmDecl(clang::TemplateTypeParmDecl* node);
```
And implementation:
```cpp
bool Visitor::VisitTemplateTypeParmDecl(clang::TemplateTypeParmDecl* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    const std::string& name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);

    m_annotator->insert_annotation("class-name", line, column, name.length());
    return true;
}
```
Template parameters represent types and are annotated with `class-name`.
This works for both template functions and class declarations:
```cpp
template <typename [[class-name,T]]>
void print(const [[class-name,T]]& value);

template <typename ...[[class-name,Ts]]>
void print(const [[class-name,Ts]]&... values);

template <typename [[class-name,T]]>
struct Foo {
    // ...
};

template <typename ...[[class-name,Ts]]>
struct Bar {
    // ...
};
```

## Concepts
C++20 introduced concepts for constraining template parameters.

Consider the following example:
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
    
    // Ensure that the container has 'size' and 'capacity' member functions
    { container.size() };
    { container.capacity() };
    
    // Ensure that the container defines the necessary types
    { T::value_type };
    
    // ...
};

// Concept-constrained function for containers
template <Container T>
void print(const T& container);
```
And corresponding AST:
```text
|-ConceptDecl 0x1d5da359e88 <example.cpp:4:1, line:26:1> line:5:9 Container
| |-TemplateTypeParmDecl 0x1d5da359de0 <line:4:11, col:20> col:20 referenced typename depth 0 index 0 T
| `-RequiresExpr 0x1d5da35ae68 <line:5:21, line:26:1> 'bool'
|   |-ParmVarDecl 0x1d5da359ee8 <line:5:30, col:32> col:32 referenced container 'T'
|   |-ParmVarDecl 0x1d5da359fd8 <col:43, col:55> col:55 index 'std::size_t':'unsigned long long'
|   |-CompoundRequirement 0x1d5da35a578 dependent
|   | |-CallExpr 0x1d5da35a170 <line:7:7, col:27> '<dependent type>'
|   | | |-UnresolvedLookupExpr 0x1d5da35a0e0 <col:7, col:12> '<overloaded function type>' lvalue (no ADL) = 'begin' 0x1d5d965f2f0 0x1d5d965fdd8 0x1d5d96603c8 0x1d5d9661610 0x1d5d9665560 0x1d5d9665a50
|   | | `-DeclRefExpr 0x1d5da35a150 <col:18> 'T' lvalue ParmVar 0x1d5da359ee8 'container' 'T' non_odr_use_unevaluated
|   | `-ConceptSpecializationExpr 0x1d5da35a4e8 <col:34, col:76> 'bool' Concept 0x1d5d8e9c420 'same_as'
|   |   |-ImplicitConceptSpecializationDecl 0x1d5da35a3f8 <C:/MSYS2/mingw64/include/c++/14.2.0/concepts:62:13> col:13
|   |   | |-TemplateArgument type 'type-parameter-1-0'
|   |   | | `-TemplateTypeParmType 0x1d5d8c93640 'type-parameter-1-0' dependent depth 1 index 0
|   |   | `-TemplateArgument type 'decltype(std::end(container))'
|   |   |   `-DecltypeType 0x1d5da35a290 'decltype(std::end(container))' dependent
|   |   |     `-CallExpr 0x1d5da35a260 <example.cpp:7:56, col:74> '<dependent type>'
|   |   |       |-UnresolvedLookupExpr 0x1d5da35a1d0 <col:56, col:61> '<overloaded function type>' lvalue (no ADL) = 'end' 0x1d5d965f7e0 0x1d5d96609b8 0x1d5d9660fa8 0x1d5d9661bd0 0x1d5d9665ed0 0x1d5d9666350
|   |   |       `-DeclRefExpr 0x1d5da35a240 <col:65> 'T' lvalue ParmVar 0x1d5da359ee8 'container' 'T' non_odr_use_unevaluated
|   |   |-TemplateArgument type 'expr-type':'type-parameter-1-0'
|   |   | `-TemplateTypeParmType 0x1d5da35a380 'expr-type' dependent depth 1 index 0
|   |   |   `-TemplateTypeParm 0x1d5da35a318 'expr-type'
|   |   `-TemplateArgument <col:47, col:75> type 'decltype(std::end(container))'
|   |     `-DecltypeType 0x1d5da35a2c0 'decltype(std::end(container))' dependent
|   |       `-CallExpr 0x1d5da35a260 <col:56, col:74> '<dependent type>'
|   |         |-UnresolvedLookupExpr 0x1d5da35a1d0 <col:56, col:61> '<overloaded function type>' lvalue (no ADL) = 'end' 0x1d5d965f7e0 0x1d5d96609b8 0x1d5d9660fa8 0x1d5d9661bd0 0x1d5d9665ed0 0x1d5d9666350
|   |         `-DeclRefExpr 0x1d5da35a240 <col:65> 'T' lvalue ParmVar 0x1d5da359ee8 'container' 'T' non_odr_use_unevaluated
|   |-CompoundRequirement 0x1d5da35a698 dependent
|   | `-UnaryOperator 0x1d5da35a680 <line:10:7, col:28> '<dependent type>' lvalue prefix '*' cannot overflow
|   |   `-CallExpr 0x1d5da35a658 <col:8, col:28> '<dependent type>'
|   |     |-UnresolvedLookupExpr 0x1d5da35a5c8 <col:8, col:13> '<overloaded function type>' lvalue (no ADL) = 'begin' 0x1d5d965f2f0 0x1d5d965fdd8 0x1d5d96603c8 0x1d5d9661610 0x1d5d9665560 0x1d5d9665a50
|   |     `-DeclRefExpr 0x1d5da35a638 <col:19> 'T' lvalue ParmVar 0x1d5da359ee8 'container' 'T' non_odr_use_unevaluated
|   |-CompoundRequirement 0x1d5da35ab78 dependent
|   | |-UnaryOperator 0x1d5da35a7a0 <line:13:7, col:29> '<dependent type>' lvalue prefix '++' cannot overflow
|   | | `-CallExpr 0x1d5da35a778 <col:9, col:29> '<dependent type>'
|   | |   |-UnresolvedLookupExpr 0x1d5da35a6e8 <col:9, col:14> '<overloaded function type>' lvalue (no ADL) = 'begin' 0x1d5d965f2f0 0x1d5d965fdd8 0x1d5d96603c8 0x1d5d9661610 0x1d5d9665560 0x1d5d9665a50
|   | |   `-DeclRefExpr 0x1d5da35a758 <col:20> 'T' lvalue ParmVar 0x1d5da359ee8 'container' 'T' non_odr_use_unevaluated
|   | `-ConceptSpecializationExpr 0x1d5da35aae8 <col:36, col:80> 'bool' Concept 0x1d5d8e9c420 'same_as'
|   |   |-ImplicitConceptSpecializationDecl 0x1d5da35a9f8 <C:/MSYS2/mingw64/include/c++/14.2.0/concepts:62:13> col:13
|   |   | |-TemplateArgument type 'type-parameter-1-0'
|   |   | | `-TemplateTypeParmType 0x1d5d8c93640 'type-parameter-1-0' dependent depth 1 index 0
|   |   | `-TemplateArgument type 'decltype(std::begin(container))'
|   |   |   `-DecltypeType 0x1d5da35a890 'decltype(std::begin(container))' dependent
|   |   |     `-CallExpr 0x1d5da35a868 <example.cpp:13:58, col:78> '<dependent type>'
|   |   |       |-UnresolvedLookupExpr 0x1d5da35a7d8 <col:58, col:63> '<overloaded function type>' lvalue (no ADL) = 'begin' 0x1d5d965f2f0 0x1d5d965fdd8 0x1d5d96603c8 0x1d5d9661610 0x1d5d9665560 0x1d5d9665a50
|   |   |       `-DeclRefExpr 0x1d5da35a848 <col:69> 'T' lvalue ParmVar 0x1d5da359ee8 'container' 'T' non_odr_use_unevaluated
|   |   |-TemplateArgument type 'expr-type':'type-parameter-1-0'
|   |   | `-TemplateTypeParmType 0x1d5da35a980 'expr-type' dependent depth 1 index 0
|   |   |   `-TemplateTypeParm 0x1d5da35a918 'expr-type'
|   |   `-TemplateArgument <col:49, col:79> type 'decltype(std::begin(container))'
|   |     `-DecltypeType 0x1d5da35a8c0 'decltype(std::begin(container))' dependent
|   |       `-CallExpr 0x1d5da35a868 <col:58, col:78> '<dependent type>'
|   |         |-UnresolvedLookupExpr 0x1d5da35a7d8 <col:58, col:63> '<overloaded function type>' lvalue (no ADL) = 'begin' 0x1d5d965f2f0 0x1d5d965fdd8 0x1d5d96603c8 0x1d5d9661610 0x1d5d9665560 0x1d5d9665a50
|   |         `-DeclRefExpr 0x1d5da35a848 <col:69> 'T' lvalue ParmVar 0x1d5da359ee8 'container' 'T' non_odr_use_unevaluated
|   |-CompoundRequirement 0x1d5da35ac10 dependent
|   | `-CXXDependentScopeMemberExpr 0x1d5da35abc8 <line:16:7, col:17> '<dependent type>' lvalue .data
|   |   `-DeclRefExpr 0x1d5da35aba8 <col:7> 'T' lvalue ParmVar 0x1d5da359ee8 'container' 'T' non_odr_use_unevaluated
|   |-CompoundRequirement 0x1d5da35acc8 dependent
|   | `-CallExpr 0x1d5da35aca8 <line:19:7, col:22> '<dependent type>'
|   |   `-CXXDependentScopeMemberExpr 0x1d5da35ac60 <col:7, col:17> '<dependent type>' lvalue .size
|   |     `-DeclRefExpr 0x1d5da35ac40 <col:7> 'T' lvalue ParmVar 0x1d5da359ee8 'container' 'T' non_odr_use_unevaluated
|   |-CompoundRequirement 0x1d5da35ad80 dependent
|   | `-CallExpr 0x1d5da35ad60 <line:20:7, col:26> '<dependent type>'
|   |   `-CXXDependentScopeMemberExpr 0x1d5da35ad18 <col:7, col:17> '<dependent type>' lvalue .capacity
|   |     `-DeclRefExpr 0x1d5da35acf8 <col:7> 'T' lvalue ParmVar 0x1d5da359ee8 'container' 'T' non_odr_use_unevaluated
|   `-CompoundRequirement 0x1d5da35ae38 dependent
|     `-DependentScopeDeclRefExpr 0x1d5da35ae00 <line:23:7, col:10> '<dependent type>' lvalue
|       `-NestedNameSpecifier TypeSpec 'T'
`-FunctionTemplateDecl 0x1d5da35b2d8 <line:29:1, line:30:30> col:6 print
  |-TemplateTypeParmDecl 0x1d5da35af00 <line:29:11, col:21> col:21 referenced Concept 0x1d5da359e88 'Container' depth 0 index 0 T
  | `-ConceptSpecializationExpr 0x1d5da35b060 <col:11> 'bool' Concept 0x1d5da359e88 'Container'
  |   |-ImplicitConceptSpecializationDecl 0x1d5da35afa8 <line:5:9> col:9
  |   | `-TemplateArgument type 'type-parameter-0-0'
  |   |   `-TemplateTypeParmType 0x1d5d8c63420 'type-parameter-0-0' dependent depth 0 index 0
  |   `-TemplateArgument <line:29:21> type 'T':'type-parameter-0-0'
  |     `-TemplateTypeParmType 0x1d5da35af60 'T' dependent depth 0 index 0
  |       `-TemplateTypeParm 0x1d5da35af00 'T'
  `-FunctionDecl 0x1d5da35b228 <line:30:1, col:30> col:6 print 'void (const T &)'
    `-ParmVarDecl 0x1d5da35b138 <col:12, col:21> col:21 container 'const T &'
```

Concept-related declarations and expressions are represented by several node types:
- `ConceptDecl` for concept definitions, and
- `ConceptSpecializationExpr` for concept constraints used in templates.

We’ll need to annotate both the concept declarations and any uses of concepts as constraints.

## Concepts

Concept declarations are represented by `ConceptDecl` nodes.

We annotate both the concept declarations and any uses of concepts as constraints using the same structure we've seen for other visitors:
```cpp
bool Visitor::VisitConceptDecl(clang::ConceptDecl* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    const std::string& name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("concept", line, column, name.length());
    return true;
}
```
Constraints using concepts are captured by `ConceptSpecializationExpr` nodes:
```cpp
bool Visitor::VisitConceptSpecializationExpr(clang::ConceptSpecializationExpr* node) {
    // ...
    const std::string& name = node->getNamedConcept()->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(node->getConceptNameLoc());
    unsigned column = source_manager.getSpellingColumnNumber(node->getConceptNameLoc());

    m_annotator->insert_annotation("concept", line, column, name.length());
    return true;
}
```
```text
#include <concepts> // std::same_as
#include <iterator> // std::begin, std::end

template <typename T>
concept [[concept,Container]] = requires(T container, std::size_t index) {
    // Ensure that the container supports the std::begin and std::end methods
    { std::begin(container) } -> std::same_as<decltype(std::end(container))>;
    
    // Ensure that the container iterator can be dereferenced
    { *std::begin(container) };

    // Ensure that the container iterator can be incremented
    { ++std::begin(container) } -> std::same_as<decltype(std::begin(container))>;

    // Ensure that the container has a public 'data' member variable
    { container.data };
    
    // Ensure that the container has 'size' and 'capacity' member functions
    { container.size() };
    { container.capacity() };
    
    // Ensure that the container defines the necessary types
    { T::value_type };
    
    // ...
};

// Concept-constrained function specialization for containers
template <[[concept,Container]] T>
void print(const T& container);
```

## Dependent calls and members

In templates and concepts, unresolved expressions cannot always be fully resolved during parsing due to the dependency on an unknown type `T`.
These expressions are represented by:
- `UnresolvedLookupExpr` nodes for ambiguous function calls, and
- `DependentScopeDeclRefExpr` nodes for dependent member calls.

These often appear as child nodes of a `CallExpr`.
For unresolved calls, `getCalleeDecl()` returns `nullptr`, which causes issues with our existing `VisitCallExpr` implementation.
Good examples of this are the `std::begin(...)` and `std::end(...)` functions - the function this call resolves to differs based on the type of container that is passed in.
We can handle these nodes by extending our existing `VisitCallExpr` visitor to explicitly account for these types of expressions.

## Global and static class function calls

Although we can't access the declaration of the function being called, we can still retrieve the name of it if we do a bit of targeted casting of the callee of the node:
```cpp
if (const clang::UnresolvedLookupExpr* ule = clang::dyn_cast<clang::UnresolvedLookupExpr>(node->getCallee())) {
    std::string name = ule->getNameInfo().getAsString();
    
    clang::SourceLocation location = ule->getNameLoc();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("function", line, column, name.length());
}
```
We retrieve the callee with the `getCallee()` function.

Member calls like `T::function()` appear as `DependentScopeDeclRefExpr` nodes.
`DependentScopeDeclRefExpr` represents a qualified reference to a member of a dependent type, where the type of `T` is unknown during parsing.
For example, in templates where `T::value_type` or `T::function()` is written, Clang cannot resolve whether this refers to a type, member, or function until the template is instantiated.

Within a `CallExpr`, however, if the callee is a `DependentScopeDeclRefExpr`, we know it's being invoked as a function, making it safe to annotate:
```cpp
else if (const clang::DependentScopeDeclRefExpr* dre = clang::dyn_cast<clang::DependentScopeDeclRefExpr>(node->getCallee())) {
    std::string name = dre->getNameInfo().getAsString();
    
    clang::SourceLocation location = dre->getLocation();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("function", line, column, name.length());
}
```
`DependentScopeDeclRefExpr` nodes outside of function calls are purposefully left unhandled to avoid ambiguity.
The annotation for a type is different from the annotation for a member.

## Direct member function calls

Function calls made directly through an object or reference, such as `container.size()` or `container.capacity()` from the example above, are represented by `CXXDependentScopeMemberExpr` nodes.
These nodes appear when the compiler cannot resolve the exact type of the object at parse time, but the syntax clearly indicates a member function call.
We annotate these the same way as global or static function calls:
```cpp
else if (const clang::CXXDependentScopeMemberExpr* dsme = clang::dyn_cast<clang::CXXDependentScopeMemberExpr>(node->getCallee())) {
    std::string name = dsme->getMemberNameInfo().getAsString();
    
    clang::SourceLocation location = dsme->getMemberLoc();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("function", line, column, name.length());
}
```
For all other cases, we'll fall back to our existing approach of annotating the function call using token matching.
```text
template <typename T>
concept Container = requires(T container, std::size_t index) {
    // Ensure that the container supports the std::begin and std::end methods
    { std::[[function,begin]](container) } -> std::same_as<decltype(std::[[function,end]](container))>;
    
    // Ensure that the container iterator can be dereferenced
    { *std::[[function,begin]](container) };

    // Ensure that the container iterator can be incremented
    { ++std::[[function,begin]](container) } -> std::same_as<decltype(std::[[function,begin]](container))>;

    // Ensure that the container has a public 'data' member variable
    { container.data };
    
    // Ensure that the container has 'size' and 'capacity' member functions 
    { container.[[function,size]]() };
    { container.[[function,capacity]]() };
    
    // Ensure that the container defines the necessary types
    { T::value_type };
    
    // ...
};

// Concept-constrained function specialization for containers
template <Container T>
void print(const T& container);
```

## Dependent member access

The last node for this section is the `CXXDependentScopeMemberExpr`, which represents a member access where the referenced member cannot be fully resolved.
In the previous section, we annotated this case for `CallExpr` expressions, which represented class member function calls.
A standalone `VisitCXXDependentScopeMemberExpr` visitor catches dependent references to (non-static) class members:
```cpp
bool Visitor::VisitCXXDependentScopeMemberExpr(clang::CXXDependentScopeMemberExpr* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    std::string name = node->getMemberNameInfo().getAsString();
    
    clang::SourceLocation = node->getMemberLoc();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("member-variable", line, column, name.length());
    return true;
}
```
The implementation of this function follows closely with the [`CXXMemberExpr` visitor from an earlier post](), as it represents the same thing except in a type-agnostic context.
Dependent class members are annotated with `member-variable`.
```text
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
    { container.[[member-variable,data]] };
    
    // Ensure that the container has 'size' and 'capacity' member functions
    { container.size() };
    { container.capacity() };
    
    // Ensure that the container defines the necessary types
    { T::value_type };
    
    // ...
};

// Concept-constrained function specialization for containers
template <Container T>
void print(const T& container);
```

## Styling
The final step is to add a definition for the `concept` CSS style:
```css
.language-cpp .concept {
    color: rgb(181, 182, 227);
}
```
The other annotations already have existing CSS style implementations.
```cpp
#include <concepts> // std::same_as
#include <iterator> // std::begin, std::end

template <typename T>
concept [[concept,Container]] = requires(T container, std::size_t index) {
    // Ensure that the container supports the std::begin and std::end methods
    { std::[[function,begin]](container) } -> std::same_as<decltype(std::[[function,end]](container))>;
    
    // Ensure that the container iterator can be dereferenced
    { *std::[[function,begin]](container) };

    // Ensure that the container iterator can be incremented
    { ++std::[[function,begin]](container) } -> std::same_as<decltype(std::[[function,begin]](container))>;

    // Ensure that the container has a public 'data' member variable
    { container.[[member-variable,data]] };
    
    // Ensure that the container has 'size' and 'capacity' member functions
    { container.[[function,size]]() };
    { container.[[function,capacity]]() };
    
    // Ensure that the container defines the necessary types
    { T::value_type };
    
    // ...
};

// Concept-constrained function specialization for containers
template <[[concept,Container]] T>
void print(const T& container);
```
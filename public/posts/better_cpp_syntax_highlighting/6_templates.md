
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
- [`ClassTemplateDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1ClassTemplateDecl.html) for primary class templates,
- [`ClassTemplatePartialSpecializationDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1ClassTemplatePartialSpecializationDecl.html) for partial specializations,
- [`ClassTemplateSpecializationDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1ClassTemplateSpecializationDecl.html) for explicit specializations, and
- [`TemplateTypeParmDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1TemplateTypeParmDecl.html) for template parameters

We don’t actually need to define new visitors for the template class declarations themselves.
Each `ClassTemplateDecl`, `ClassTemplatePartialSpecializationDecl`, and `ClassTemplateSpecializationDecl` node contains a nested `CXXRecordDecl` representing the underlying class.
This is already handled by our existing `VisitCXXRecordDecl` visitor.

However, we do need to annotate template parameters, which are represented by `TemplateTypeParmDecl` nodes.
The visitor signature looks like this:
```cpp title:{visitor.hpp}
[[keyword,bool]] [[function,VisitTemplateTypeParmDecl]]([[namespace-name,clang]]::[[class-name,TemplateTypeParmDecl]]* node);
```
And implementation:
```cpp title:{visitor.hpp} line-numbers:{enabled}
bool Visitor::VisitTemplateTypeParmDecl(clang::TemplateTypeParmDecl* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    const std::string& name = node->getNameAsString();
    
    
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);

    m_annotator->insert_annotation("class-name", line, column, name.length());
    return true;
}

[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitTemplateTypeParmDecl]]([[namespace-name,clang]]::[[class-name,TemplateTypeParmDecl]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...

    [[namespace-name,std]]::[[class-name,string]] name = node->[[function,getNameAsString]]();
    
    [[namespace-name,clang]]::[[class-name,SourceLocation]] location = node->[[function,getLocation]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);

    [[member-variable,m_annotator]]->[[function,insert_annotation]]("class-name", line, column, name.[[function,length]]());
    [[keyword,return]] [[keyword,true]];
}
```
Template parameters represent types and are annotated with `class-name`.
This works for both template functions and class declarations:
```text added"{1,2,4,5,7,12}
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
```text
#include <concepts> // std::same_as
#include <iterator> // std::begin, std::end

template <typename T>
concept Iterable = requires(T container) {
    { std::begin(container) } -> std::same_as<decltype(std::end(container))>;
    { *std::begin(container) };
    { ++std::begin(container) } -> std::same_as<decltype(std::begin(container))&>;
};
    
template <typename T>
concept Container = Iterable<T> && requires(T container, std::size_t index) {
    { container.size() };
    { container.capacity() };
    typename T::value_type;
};

template <Container T>
void print(const T& container) {
    // ...
}
```
And corresponding AST:
```text show-lines:{35}
|-ConceptDecl 0x17064604e98 <src/example.cpp:4:5, line:9:5> line:5:13 Iterable
| |-TemplateTypeParmDecl 0x17064604df0 <line:4:15, col:24> col:24 referenced typename depth 0 index 0 T
| `-RequiresExpr 0x17064605b08 <line:5:24, line:9:5> 'bool'
|   |-ParmVarDecl 0x17064604ef8 <line:5:33, col:35> col:35 referenced container 'T'
|   |-CompoundRequirement 0x17064605478 dependent
|   | |-CallExpr 0x17064605078 <line:6:11, col:31> '<dependent type>'
|   | | |-UnresolvedLookupExpr 0x17064604fe8 <col:11, col:16> '<overloaded function type>' lvalue (no ADL) = 'begin' 0x170639120b0 0x17063912b98 0x17063913188 0x170639143d0 0x17063918320 0x17063918810
|   | | `-DeclRefExpr 0x17064605058 <col:22> 'T' lvalue ParmVar 0x17064604ef8 'container' 'T' non_odr_use_unevaluated
|   | `-ConceptSpecializationExpr 0x170646053e8 <col:38, col:80> 'bool' Concept 0x17063141430 'same_as'
|   |   |-ImplicitConceptSpecializationDecl 0x170646052f8 <C:/MSYS2/mingw64/include/c++/14.2.0/concepts:62:13> col:13
|   |   | |-TemplateArgument type 'type-parameter-1-0'
|   |   | | `-TemplateTypeParmType 0x17062f388a0 'type-parameter-1-0' dependent depth 1 index 0
|   |   | `-TemplateArgument type 'decltype(std::end(container))'
|   |   |   `-DecltypeType 0x17064605190 'decltype(std::end(container))' dependent
|   |   |     `-CallExpr 0x17064605168 <src/example.cpp:6:60, col:78> '<dependent type>'
|   |   |       |-UnresolvedLookupExpr 0x170646050d8 <col:60, col:65> '<overloaded function type>' lvalue (no ADL) = 'end' 0x170639125a0 0x17063913778 0x17063913d68 0x17063914990 0x17063918c90 0x17063919110
|   |   |       `-DeclRefExpr 0x17064605148 <col:69> 'T' lvalue ParmVar 0x17064604ef8 'container' 'T' non_odr_use_unevaluated
|   |   |-TemplateArgument type 'expr-type':'type-parameter-1-0'
|   |   | `-TemplateTypeParmType 0x17064605280 'expr-type' dependent depth 1 index 0
|   |   |   `-TemplateTypeParm 0x17064605218 'expr-type'
|   |   `-TemplateArgument <col:51, col:79> type 'decltype(std::end(container))'
|   |     `-DecltypeType 0x170646051c0 'decltype(std::end(container))' dependent
|   |       `-CallExpr 0x17064605168 <col:60, col:78> '<dependent type>'
|   |         |-UnresolvedLookupExpr 0x170646050d8 <col:60, col:65> '<overloaded function type>' lvalue (no ADL) = 'end' 0x170639125a0 0x17063913778 0x17063913d68 0x17063914990 0x17063918c90 0x17063919110
|   |         `-DeclRefExpr 0x17064605148 <col:69> 'T' lvalue ParmVar 0x17064604ef8 'container' 'T' non_odr_use_unevaluated
|   |-CompoundRequirement 0x17064605598 dependent
|   | `-UnaryOperator 0x17064605580 <line:7:11, col:32> '<dependent type>' lvalue prefix '*' cannot overflow
|   |   `-CallExpr 0x17064605558 <col:12, col:32> '<dependent type>'
|   |     |-UnresolvedLookupExpr 0x170646054c8 <col:12, col:17> '<overloaded function type>' lvalue (no ADL) = 'begin' 0x170639120b0 0x17063912b98 0x17063913188 0x170639143d0 0x17063918320 0x17063918810
|   |     `-DeclRefExpr 0x17064605538 <col:23> 'T' lvalue ParmVar 0x17064604ef8 'container' 'T' non_odr_use_unevaluated
|   `-CompoundRequirement 0x17064605ad8 dependent
|     |-UnaryOperator 0x170646056a0 <line:8:11, col:33> '<dependent type>' lvalue prefix '++' cannot overflow
|     | `-CallExpr 0x17064605678 <col:13, col:33> '<dependent type>'
|     |   |-UnresolvedLookupExpr 0x170646055e8 <col:13, col:18> '<overloaded function type>' lvalue (no ADL) = 'begin' 0x170639120b0 0x17063912b98 0x17063913188 0x170639143d0 0x17063918320 0x17063918810
|     |   `-DeclRefExpr 0x17064605658 <col:24> 'T' lvalue ParmVar 0x17064604ef8 'container' 'T' non_odr_use_unevaluated
|     `-ConceptSpecializationExpr 0x17064605a48 <col:40, col:85> 'bool' Concept 0x17063141430 'same_as'
|       |-ImplicitConceptSpecializationDecl 0x17064605958 <C:/MSYS2/mingw64/include/c++/14.2.0/concepts:62:13> col:13
|       | |-TemplateArgument type 'type-parameter-1-0'
|       | | `-TemplateTypeParmType 0x17062f388a0 'type-parameter-1-0' dependent depth 1 index 0
|       | `-TemplateArgument type 'decltype(std::begin(container)) &'
|       |   `-LValueReferenceType 0x170646057f0 'decltype(std::begin(container)) &' dependent
|       |     `-DecltypeType 0x17064605790 'decltype(std::begin(container))' dependent
|       |       `-CallExpr 0x17064605768 <src/example.cpp:8:62, col:82> '<dependent type>'
|       |         |-UnresolvedLookupExpr 0x170646056d8 <col:62, col:67> '<overloaded function type>' lvalue (no ADL) = 'begin' 0x170639120b0 0x17063912b98 0x17063913188 0x170639143d0 0x17063918320 0x17063918810
|       |         `-DeclRefExpr 0x17064605748 <col:73> 'T' lvalue ParmVar 0x17064604ef8 'container' 'T' non_odr_use_unevaluated
|       |-TemplateArgument type 'expr-type':'type-parameter-1-0'
|       | `-TemplateTypeParmType 0x170646058e0 'expr-type' dependent depth 1 index 0
|       |   `-TemplateTypeParm 0x17064605880 'expr-type'
|       `-TemplateArgument <col:53, col:84> type 'decltype(std::begin(container)) &'
|         `-LValueReferenceType 0x17064605820 'decltype(std::begin(container)) &' dependent
|           `-DecltypeType 0x170646057c0 'decltype(std::begin(container))' dependent
|             `-CallExpr 0x17064605768 <col:62, col:82> '<dependent type>'
|               |-UnresolvedLookupExpr 0x170646056d8 <col:62, col:67> '<overloaded function type>' lvalue (no ADL) = 'begin' 0x170639120b0 0x17063912b98 0x17063913188 0x170639143d0 0x17063918320 0x17063918810
|               `-DeclRefExpr 0x17064605748 <col:73> 'T' lvalue ParmVar 0x17064604ef8 'container' 'T' non_odr_use_unevaluated
|-ConceptDecl 0x17064605c08 <line:11:5, line:16:5> line:12:13 Container
| |-TemplateTypeParmDecl 0x17064605b60 <line:11:15, col:24> col:24 referenced typename depth 0 index 0 T
| `-BinaryOperator 0x170646061c0 <line:12:25, line:16:5> 'bool' '&&'
|   |-ConceptSpecializationExpr 0x17064605d38 <line:12:25, col:35> 'bool' Concept 0x17064604e98 'Iterable'
|   | |-ImplicitConceptSpecializationDecl 0x17064605c80 <line:5:13> col:13
|   | | `-TemplateArgument type 'type-parameter-0-0'
|   | |   `-TemplateTypeParmType 0x17062efba60 'type-parameter-0-0' dependent depth 0 index 0
|   | `-TemplateArgument <line:12:34> type 'T':'type-parameter-0-0'
|   |   `-TemplateTypeParmType 0x17064605bb0 'T' dependent depth 0 index 0
|   |     `-TemplateTypeParm 0x17064605b60 'T'
|   `-RequiresExpr 0x17064606168 <col:40, line:16:5> 'bool'
|     |-ParmVarDecl 0x17064605d78 <line:12:49, col:51> col:51 referenced container 'T'
|     |-ParmVarDecl 0x17064605e68 <col:62, col:74> col:74 index 'std::size_t':'unsigned long long'
|     |-CompoundRequirement 0x17064605fd8 dependent
|     | `-CallExpr 0x17064605fb8 <line:13:11, col:26> '<dependent type>'
|     |   `-CXXDependentScopeMemberExpr 0x17064605f70 <col:11, col:21> '<dependent type>' lvalue .size
|     |     `-DeclRefExpr 0x17064605f50 <col:11> 'T' lvalue ParmVar 0x17064605d78 'container' 'T' non_odr_use_unevaluated
|     |-CompoundRequirement 0x17064606090 dependent
|     | `-CallExpr 0x17064606070 <line:14:11, col:30> '<dependent type>'
|     |   `-CXXDependentScopeMemberExpr 0x17064606028 <col:11, col:21> '<dependent type>' lvalue .capacity
|     |     `-DeclRefExpr 0x17064606008 <col:11> 'T' lvalue ParmVar 0x17064605d78 'container' 'T' non_odr_use_unevaluated
|     `-TypeRequirement 0x17064606150 dependent
|       `-DependentNameType 0x17064606100 'typename T::value_type' dependent
`-FunctionTemplateDecl 0x170646065d8 <line:20:1, line:23:1> line:21:6 print
  |-TemplateTypeParmDecl 0x17064606200 <line:20:11, col:21> col:21 referenced Concept 0x17064605c08 'Container' depth 0 index 0 T
  | `-ConceptSpecializationExpr 0x17064606360 <col:11> 'bool' Concept 0x17064605c08 'Container'
  |   |-ImplicitConceptSpecializationDecl 0x170646062a8 <line:12:13> col:13
  |   | `-TemplateArgument type 'type-parameter-0-0'
  |   |   `-TemplateTypeParmType 0x17062efba60 'type-parameter-0-0' dependent depth 0 index 0
  |   `-TemplateArgument <line:20:21> type 'T':'type-parameter-0-0'
  |     `-TemplateTypeParmType 0x17064606260 'T' dependent depth 0 index 0
  |       `-TemplateTypeParm 0x17064606200 'T'
  `-FunctionDecl 0x17064606528 <line:21:1, line:23:1> line:21:6 print 'void (const T &)'
    |-ParmVarDecl 0x17064606438 <col:12, col:21> col:21 container 'const T &'
    `-CompoundStmt 0x170646066b8 <col:32, line:23:1>
```

Concept-related declarations and expressions are represented by several node types:
- [`ConceptDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1ConceptDecl.html) for concept definitions,
- [`ConceptSpecializationExpr` nodes](https://clang.llvm.org/doxygen/classclang_1_1ConceptSpecializationExpr.html) for concept constraints used in templates, and
- [`RequiresExpr` nodes](https://clang.llvm.org/doxygen/classclang_1_1RequiresExpr.html) for expressing `require`ments in concept definitions.

We’ll need to annotate both the concept declarations and any uses of concepts as constraints within these nodes.

## Concept declarations
Concept declarations are represented by `ConceptDecl` nodes.

We'll annotate concept declarations and any uses of concepts as constraints using the same structure we've seen for other visitors:
```cpp title:{visitor.cpp} line-numbers:{enabled}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitConceptDecl]]([[namespace-name,clang]]::[[class-name,ConceptDecl]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    [[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name = node->[[function,getNameAsString]]();
    
    [[keyword,const]] [[namespace-name,clang]]::[[class-name,SourceLocation]]& location = node->[[function,getLocation]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);

    [[member-variable,m_annotator]]->[[function,insert_annotation]]("concept", line, column, name.[[function,length]]());
    [[keyword,return]] [[keyword,true]];
}
```
Concept declarations are annotated with the `concept` tag:
```text added:{5,12}
#include <concepts> // std::same_as
#include <iterator> // std::begin, std::end

template <typename T>
concept [[concept,Iterable]] = requires(T container) {
    { std::begin(container) } -> std::same_as<decltype(std::end(container))>;
    { *std::begin(container) };
    { ++std::begin(container) } -> std::same_as<decltype(std::begin(container))&>;
};
    
template <typename T>
concept [[concept,Container]] = Iterable<T> && requires(T container, std::size_t index) {
    { container.size() };
    { container.capacity() };
    typename T::value_type;
};

template <Container T>
void print(const T& container) {
    // ...
}
```

## Concept specializations

Constraints on concept definitions are captured by `ConceptSpecializationExpr` nodes.
Examples of these are the `Iterable` requirement on the `Container` concept definition and the `Container` specialization on the `print()` function.
The visitor for this node is straightforward:
```cpp title:{visitor.cpp} line-numbers:{enabled}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitConceptSpecializationExpr]]([[namespace-name,clang]]::[[class-name,ConceptSpecializationExpr]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    [[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name = node->[[function,getNamedConcept]]()->[[function,getNameAsString]]();
    
    [[keyword,const]] [[namespace-name,clang]]::[[class-name,SourceLocation]]& location = node->[[function,getConceptNameLoc]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](node->[[function,getConceptNameLoc]]());
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](node->[[function,getConceptNameLoc]]());

    [[member-variable,m_annotator]]->[[function,insert_annotation]]("concept", line, column, name.[[function,length]]());
    [[keyword,return]] [[keyword,true]];
}
```
The location at which to insert the annotation is retrieved via the handy `getConceptNameLoc()` function.
The name of the concept itself is retrieved from the declaration using `getNamedConcept()`.
As with concept declarations, concepts in specialization expressions are annotated with the `concept` tag:
```text added:{12,18}
#include <concepts> // std::same_as
#include <iterator> // std::begin, std::end

template <typename T>
concept Iterable = requires(T container) {
    { std::begin(container) } -> std::same_as<decltype(std::end(container))>;
    { *std::begin(container) };
    { ++std::begin(container) } -> std::same_as<decltype(std::begin(container))&>;
};
    
template <typename T>
concept Container = [[concept,Iterable]]<T> && requires(T container, std::size_t index) {
    { container.size() };
    { container.capacity() };
    typename T::value_type;
};

template <[[concept,Container]] T>
void print(const T& container) {
    // ...
}
```

## `requires` expressions

For annotating concepts in type constraint expressions, such as the `std::same_as` concept in the above example, we'll need to implement a visitor for `RequiresExpr` nodes:
```cpp title:{visitor.cpp} line-numbers:{enabled}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitRequiresExpr]]([[namespace-name,clang]]::[[class-name,RequiresExpr]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    [[keyword,for]] ([[keyword,const]] [[namespace-name,clang]]::[[namespace-name,concepts]]::[[class-name,Requirement]]* r : node->[[function,getRequirements]]()) {
        [[keyword,if]] ([[keyword,const]] [[namespace-name,clang]]::[[namespace-name,concepts]]::[[class-name,ExprRequirement]]* er = clang::dyn_cast<[[namespace-name,clang]]::[[namespace-name,concepts]]::[[class-name,ExprRequirement]]>(r)) {
            [[keyword,const]] [[namespace-name,clang]]::[[namespace-name,concepts]]::[[class-name,ExprRequirement]]::[[class-name,ReturnTypeRequirement]]& rtr = er->[[function,getReturnTypeRequirement]]();
            [[keyword,if]] (rtr.[[function,isTypeConstraint]]()) {
                [[keyword,const]] [[namespace-name,clang]]::[[class-name,TypeConstraint]]* constraint = rtr.[[function,getTypeConstraint]]();
                [[namespace-name,std]]::[[class-name,string]] name = constraint->[[function,getNamedConcept]]()->[[function,getNameAsString]]();
                
                location [[function-operator,=]] constraint->[[function,getConceptNameLoc]]();
                [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
                [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);
                [[member-variable,m_annotator]]->[[function,insert_annotation]]("concept", line, column, name.[[function,length]]());
            }
        }
    }

    [[keyword,return]] [[keyword,true]];
}
```
These nodes represent the body of a `requires` clause or expression.

This visitor is a bit more involved than others in this section.
We'll use the `getRequirements()` function to iterate over each constraint in the `requires` clause.
For each requirement, we check whether it is an `ExprRequirement`, which is a constraint on an expression that may include a return type requirement.
If the expression includes a type constraint (e.g. `-> std::same_as<decltype(std::end(container))>`) we extract it using `getReturnTypeRequirement().getTypeConstraint()`.
From there, we retrieve the associated concept's name and source location as in the previous section using `getNamedConcept()` and `getConceptNameLoc()`.
Concept references in type constraint expressions are also annotated as `concept`s:
```text added:{6,8}
#include <concepts> // std::same_as
#include <iterator> // std::begin, std::end

template <typename T>
concept Iterable = requires(T container) {
    { std::begin(container) } -> std::[[concept,same_as]]<decltype(std::end(container))>;
    { *std::begin(container) };
    { ++std::begin(container) } -> std::[[concept,same_as]]<decltype(std::begin(container))&>;
};
    
template <typename T>
concept Container = Iterable<T> && requires(T container, std::size_t index) {
    { container.size() };
    { container.capacity() };
    typename T::value_type;
};

template <Container T>
void print(const T& container) {
    // ...
}
```

## Dependent calls and members

In templates and concepts, unresolved expressions cannot always be fully resolved during parsing due to the dependency on an unknown type `T`.
These expressions are represented by:
- [`UnresolvedLookupExpr` nodes](https://clang.llvm.org/doxygen/classclang_1_1UnresolvedLookupExpr.html) for ambiguous function calls, and
- [`DependentScopeDeclRefExpr` nodes](https://clang.llvm.org/doxygen/classclang_1_1DependentScopeDeclRefExpr.html) for dependent member calls.

These often appear as child nodes of a `CallExpr`.
For unresolved calls, `getCalleeDecl()` returns `nullptr`, which causes issues with our existing `VisitCallExpr` implementation.
Good examples of this are the `std::begin(...)` and `std::end(...)` functions - the function this call resolves to differs based on the type of container that is passed in.
We can handle these nodes by extending our existing `VisitCallExpr` visitor to explicitly account for these types of expressions.

We'll start off by doing some dynamic casting to determine the kind of function call being processed:
```cpp title:{visitor.cpp} line-numbers:{enabled} added:{5-9}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitCallExpr]]([[namespace-name,clang]]::[[class-name,CallExpr]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    [[keyword,if]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,UnresolvedLookupExpr]]* ule = [[namespace-name,clang]]::[[function,dyn_cast]]<[[namespace-name,clang]]::[[class-name,UnresolvedLookupExpr]]>(node->[[function,getCallee]]())) {
        [[namespace-name,clang]]::[[class-name,SourceLocation]] location [[function-operator,=]] ule->[[function,getNameLoc]]();
        [[keyword,const]] [[class-name,Token]]& token = *[[member-variable,m_tokenizer]]->[[member-variable,at]](location);
        [[member-variable,m_annotator]]->[[function,insert_annotation]]("function", token.[[member-variable,line]], token.[[member-variable,column]], token.[[member-variable,spelling]].[[function,length]]());
    }
    else {
        [[namespace-name,std]]::[[class-name,span]]<[[keyword,const]] [[class-name,Token]]> tokens = [[member-variable,m_tokenizer]]->[[function,get_tokens]](node->[[function,getSourceRange]]());
        [[keyword,for]] ([[keyword,const]] [[class-name,Token]]& token : tokens) {
            [[keyword,if]] (token.[[member-variable,spelling]] [[binary-operator,==]] name) {
                [[member-variable,m_annotator]]->[[function,insert_annotation]]("function", token.[[member-variable,line]], token.[[member-variable,column]], name.[[function,length]]());
                [[keyword,break]];
            }
        }
    }
    
    return true;
}
```
We retrieve the callee with the `getCallee()` function.
Instead of accessing the name of the function through its declaration, we'll instead annotate just the token at the source location of the call.
For `UnresolvedLookupExpr` nodes, this is done via the `getNameLoc()` function.
Retrieving the name through the function declaration may not always return the same name as the function used at the call site.
The function name for a custom dereference operator, for example, returns `operator*` (and not the expected `*` of the actual call).

Member calls like `T::function()` appear as `DependentScopeDeclRefExpr` nodes.
`DependentScopeDeclRefExpr` represents a qualified reference to a member of a dependent type, where the type of `T` is unknown during parsing.
For example, in templates where `T::value_type` or `T::function()` is written, Clang cannot resolve whether this refers to a type, member, or function until the template is instantiated.

Within a `CallExpr`, however, if the callee is a `DependentScopeDeclRefExpr`, we know it's being invoked as a function, making it safe to annotate:
```cpp title:{visitor.cpp} added:{7-12} line-numbers:{enabled}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitCallExpr]]([[namespace-name,clang]]::[[class-name,CallExpr]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    [[keyword,if]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,UnresolvedLookupExpr]]* ule = [[namespace-name,clang]]::[[function,dyn_cast]]<[[namespace-name,clang]]::[[class-name,UnresolvedLookupExpr]]>(node->[[function,getCallee]]())) {
        // ...
    }
    [[keyword,else]] [[keyword,if]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,DependentScopeDeclRefExpr]]* dre = [[namespace-name,clang]]::[[function,dyn_cast]]<[[namespace-name,clang]]::[[class-name,DependentScopeDeclRefExpr]]>(node->[[function,getCallee]]())) {
        [[namespace-name,clang]]::[[class-name,SourceLocation]] location [[function-operator,=]] dre->[[function,getLocation]]();
        [[keyword,const]] [[class-name,Token]]& token = *[[member-variable,m_tokenizer]]->[[member-variable,at]](location);
        [[member-variable,m_annotator]]->[[function,insert_annotation]]("function", token.[[member-variable,line]], token.[[member-variable,column]], token.[[member-variable,spelling]].[[function,length]]());
    }
    else {
        // ...
    }
    
    return true;
}
```
We'll use a similar approach here and annotate just the token at the call location.
`DependentScopeDeclRefExpr` nodes outside of function calls are purposefully left unhandled to avoid ambiguity.
The annotation for a type is different from the annotation for a member.

## Direct member function calls

Function calls made directly through an object or reference, such as `container.size()` or `container.capacity()` from the example above, are represented by `CXXDependentScopeMemberExpr` nodes.
These nodes appear when the compiler cannot resolve the exact type of the object at parse time, but the syntax clearly indicates a member function call.
We annotate these the same way as in the earlier sections:
```cpp title:{visitor.cpp} added:{11-15} line-numbers:{enabled}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitCallExpr]]([[namespace-name,clang]]::[[class-name,CallExpr]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    [[keyword,if]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,UnresolvedLookupExpr]]* ule = [[namespace-name,clang]]::[[function,dyn_cast]]<[[namespace-name,clang]]::[[class-name,UnresolvedLookupExpr]]>(node->[[function,getCallee]]())) {
        // ...
    }
    [[keyword,else]] [[keyword,if]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,DependentScopeDeclRefExpr]]* dre = [[namespace-name,clang]]::[[function,dyn_cast]]<[[namespace-name,clang]]::[[class-name,DependentScopeDeclRefExpr]]>(node->[[function,getCallee]]())) {
        // ...
    }
    [[keyword,else]] [[keyword,if]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,CXXDependentScopeMemberExpr]]* dsme = clang::dyn_cast<[[namespace-name,clang]]::[[class-name,CXXDependentScopeMemberExpr]]>(node->[[function,getCallee]]())) {
        [[namespace-name,clang]]::[[class-name,SourceLocation]] location [[function-operator,=]] dsme->[[function,getMemberLoc]]();
        [[keyword,const]] [[class-name,Token]]& token = *[[member-variable,m_tokenizer]]->[[member-variable,at]](location);
        [[member-variable,m_annotator]]->[[function,insert_annotation]]("function", token.[[member-variable,line]], token.[[member-variable,column]], token.[[member-variable,spelling]].[[function,length]]());
    }
    else {
        // ...
    }
    
    return true;
}
```
The source location of the call is retrieved using the `getMemberLoc()` function.
For all other cases, we'll fall back to our existing approach of annotating the function call using token matching.

As before, functions are annotated with the `function` tag:
```text added:{6-8,13,14}
#include <concepts> // std::same_as
#include <iterator> // std::begin, std::end

template <typename T>
concept Iterable = requires(T container) {
    { std::[[function,begin]](container) } -> std::same_as<decltype(std::[[function,end]](container))>;
    { *std::[[function,begin]](container) };
    { ++std::[[function,begin]](container) } -> std::same_as<decltype(std::[[function,begin]](container))&>;
};
    
template <typename T>
concept Container = Iterable<T> && requires(T container, std::size_t index) {
    { container.[[function,size]]() };
    { container.[[function,capacity]]() };
    typename T::value_type;
};

template <Container T>
void print(const T& container) {
    // ...
}
```

## Dependent member access

The last node for this section is the `CXXDependentScopeMemberExpr`, which represents a member access where the referenced member cannot be fully resolved.
In the previous section, we annotated this case for `CallExpr` expressions, which represented class member function calls.
A standalone `VisitCXXDependentScopeMemberExpr` visitor catches dependent references to (non-static) class members:
```cpp title:{visitor.cpp} line-numbers:{enabled}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitCXXDependentScopeMemberExpr]]([[namespace-name,clang]]::[[class-name,CXXDependentScopeMemberExpr]]* node) {
    [[keyword,const]] [[namespace-name,clang]]::[[class-name,SourceManager]]& source_manager = [[member-variable,m_context]]->[[function,getSourceManager]]();
    [[namespace-name,clang]]::[[class-name,SourceLocation]] location = node->[[function,getMemberLoc]]();
    
    [[keyword,if]] ([[unary-operator,!]]source_manager.[[function,isInMainFile]](location)) {
        [[keyword,return]] [[keyword,true]];
    }
    
    [[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name = node->[[function,getMemberNameInfo]]().[[function,getAsString]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);
    
    [[member-variable,m_annotator]]->[[function,insert_annotation]]("member-variable", line, column, name.[[function,length]]());
    [[keyword,return]] [[keyword,true]];
}
```
The implementation of this function follows closely with the [`CXXMemberExpr` visitor from an earlier post](), as it represents the same thing except in a type-agnostic context.
Dependent class members are annotated with `member-variable`.

For the sake of this example, let's add a requirement that our `Container` needs to have a public `data` member:
```text added:{15}
#include <concepts> // std::same_as
#include <iterator> // std::begin, std::end

template <typename T>
concept Iterable = requires(T container) {
    { std::begin(container) } -> std::same_as<decltype(std::end(container))>;
    { *std::begin(container) };
    { ++std::begin(container) } -> std::same_as<decltype(std::begin(container))&>;
};
    
template <typename T>
concept Container = Iterable<T> && requires(T container, std::size_t index) {
    { container.size() };
    { container.capacity() };
    { container.[[member-variable,data]] };
    typename T::value_type;
};

template <Container T>
void print(const T& container) {
    // ...
}
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
    typename T::value_type;
    
    // ...
};

// Concept-constrained function specialization for containers
template <[[concept,Container]] T>
void print(const T& container);
```

---

In addition to annotating template classes, functions, and parameters, we've added support for annotating concept definitions, specializations, and references to functions and concepts in `requires` clauses.
In the [next post](), we'll implement adding annotations for type references in variable declarations, function parameters and return values, template arguments, and more.
Thanks for reading!
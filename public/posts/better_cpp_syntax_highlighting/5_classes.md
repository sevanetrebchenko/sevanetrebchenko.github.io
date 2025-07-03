
Classes introduce significantly more complexity than enums or namespaces, but the same core principles apply.
Consider the following example:
```cpp
#include <cmath> // std::sqrt

struct Vector3 {
    static const Vector3 zero;

    Vector3() : x(0.0f), y(0.0f), z(0.0f) { }
    Vector3(float x, float y, float z) : x(x), y(y), z(z) { }
    ~Vector3() { }
    
    [[nodiscard]] float length() const {
        return std::sqrt(x * x + y * y + z * z);
    }
    
    float x;
    float y;
    float z;
};

// Const static class members must be initialized out of line
const Vector3 Vector3::zero = Vector3();

int main() {
    Vector3 zero = Vector3::zero;
    // ...
}
```
And corresponding AST:
```text show-lines:{20} 
|-CXXRecordDecl 0x25279df1b98 <example.cpp:3:1, line:17:1> line:3:8 referenced struct Vector3 definition
| |-DefinitionData standard_layout has_user_declared_ctor can_const_default_init
| | |-DefaultConstructor exists non_trivial user_provided defaulted_is_constexpr
| | |-CopyConstructor simple trivial has_const_param implicit_has_const_param
| | |-MoveConstructor
| | |-CopyAssignment simple trivial has_const_param needs_implicit implicit_has_const_param
| | |-MoveAssignment
| | `-Destructor non_trivial user_declared
| |-CXXRecordDecl 0x25279df1cd0 <col:1, col:8> col:8 implicit referenced struct Vector3
| |-VarDecl 0x25279df1dc8 <line:4:5, col:26> col:26 used zero 'const Vector3' static destroyed
| |-CXXConstructorDecl 0x25279df1ec0 <line:6:5, col:45> col:5 used Vector3 'void ()' implicit-inline
| | |-CXXCtorInitializer Field 0x25279df2610 'x' 'float'
| | | `-FloatingLiteral 0x25279df2740 <col:19> 'float' 0.000000e+00
| | |-CXXCtorInitializer Field 0x25279df2680 'y' 'float'
| | | `-FloatingLiteral 0x25279df27a0 <col:28> 'float' 0.000000e+00
| | |-CXXCtorInitializer Field 0x25279df26f0 'z' 'float'
| | | `-FloatingLiteral 0x25279df2800 <col:37> 'float' 0.000000e+00
| | `-CompoundStmt 0x25279df2878 <col:43, col:45>
| |-CXXConstructorDecl 0x25279df21f8 <line:7:5, col:61> col:5 Vector3 'void (float, float, float)' implicit-inline
| | |-ParmVarDecl 0x25279df1fa8 <col:13, col:19> col:19 used x 'float'
| | |-ParmVarDecl 0x25279df2030 <col:22, col:28> col:28 used y 'float'
| | |-ParmVarDecl 0x25279df20b8 <col:31, col:37> col:37 used z 'float'
| | |-CXXCtorInitializer Field 0x25279df2610 'x' 'float'
| | | `-ImplicitCastExpr 0x25279df28c8 <col:44> 'float' <LValueToRValue>
| | |   `-DeclRefExpr 0x25279df2888 <col:44> 'float' lvalue ParmVar 0x25279df1fa8 'x' 'float'
| | |-CXXCtorInitializer Field 0x25279df2680 'y' 'float'
| | | `-ImplicitCastExpr 0x25279df2940 <col:50> 'float' <LValueToRValue>
| | |   `-DeclRefExpr 0x25279df2900 <col:50> 'float' lvalue ParmVar 0x25279df2030 'y' 'float'
| | |-CXXCtorInitializer Field 0x25279df26f0 'z' 'float'
| | | `-ImplicitCastExpr 0x25279df29b8 <col:56> 'float' <LValueToRValue>
| | |   `-DeclRefExpr 0x25279df2978 <col:56> 'float' lvalue ParmVar 0x25279df20b8 'z' 'float'
| | `-CompoundStmt 0x25279df2a08 <col:59, col:61>
| |-CXXDestructorDecl 0x25279df2338 <line:8:5, col:18> col:5 used ~Vector3 'void () noexcept' implicit-inline
| | `-CompoundStmt 0x25279df2a18 <col:16, col:18>
| |-CXXMethodDecl 0x25279df24d0 <line:10:19, line:12:5> line:10:25 length 'float () const' implicit-inline
| | |-CompoundStmt 0x25279df32d8 <col:40, line:12:5>
| | | `-ReturnStmt 0x25279df32c8 <line:11:9, col:47>
| | |   `-CallExpr 0x25279df32a0 <col:16, col:47> 'float'
| | |     |-ImplicitCastExpr 0x25279df3288 <col:16, col:21> 'float (*)(float)' <FunctionToPointerDecay>
| | |     | `-DeclRefExpr 0x25279df3258 <col:16, col:21> 'float (float)' lvalue Function 0x2527950b3a0 'sqrt' 'float (float)'
| | |     |   `-NestedNameSpecifier Namespace 0x25279dc2dd0 'std'
| | |     `-BinaryOperator 0x25279df2d50 <col:26, col:46> 'float' '+'
| | |       |-BinaryOperator 0x25279df2c60 <col:26, col:38> 'float' '+'
| | |       | |-BinaryOperator 0x25279df2b70 <col:26, col:30> 'float' '*'
| | |       | | |-ImplicitCastExpr 0x25279df2b40 <col:26> 'float' <LValueToRValue>
| | |       | | | `-MemberExpr 0x25279df2ad0 <col:26> 'const float' lvalue ->x 0x25279df2610
| | |       | | |   `-CXXThisExpr 0x25279df2ac0 <col:26> 'const Vector3 *' implicit this
| | |       | | `-ImplicitCastExpr 0x25279df2b58 <col:30> 'float' <LValueToRValue>
| | |       | |   `-MemberExpr 0x25279df2b10 <col:30> 'const float' lvalue ->x 0x25279df2610
| | |       | |     `-CXXThisExpr 0x25279df2b00 <col:30> 'const Vector3 *' implicit this
| | |       | `-BinaryOperator 0x25279df2c40 <col:34, col:38> 'float' '*'
| | |       |   |-ImplicitCastExpr 0x25279df2c10 <col:34> 'float' <LValueToRValue>
| | |       |   | `-MemberExpr 0x25279df2ba0 <col:34> 'const float' lvalue ->y 0x25279df2680
| | |       |   |   `-CXXThisExpr 0x25279df2b90 <col:34> 'const Vector3 *' implicit this
| | |       |   `-ImplicitCastExpr 0x25279df2c28 <col:38> 'float' <LValueToRValue>
| | |       |     `-MemberExpr 0x25279df2be0 <col:38> 'const float' lvalue ->y 0x25279df2680
| | |       |       `-CXXThisExpr 0x25279df2bd0 <col:38> 'const Vector3 *' implicit this
| | |       `-BinaryOperator 0x25279df2d30 <col:42, col:46> 'float' '*'
| | |         |-ImplicitCastExpr 0x25279df2d00 <col:42> 'float' <LValueToRValue>
| | |         | `-MemberExpr 0x25279df2c90 <col:42> 'const float' lvalue ->z 0x25279df26f0
| | |         |   `-CXXThisExpr 0x25279df2c80 <col:42> 'const Vector3 *' implicit this
| | |         `-ImplicitCastExpr 0x25279df2d18 <col:46> 'float' <LValueToRValue>
| | |           `-MemberExpr 0x25279df2cd0 <col:46> 'const float' lvalue ->z 0x25279df26f0
| | |             `-CXXThisExpr 0x25279df2cc0 <col:46> 'const Vector3 *' implicit this
| | `-WarnUnusedResultAttr 0x25279df2578 <line:10:7> nodiscard ""
| |-FieldDecl 0x25279df2610 <line:14:5, col:11> col:11 referenced x 'float'
| |-FieldDecl 0x25279df2680 <line:15:5, col:11> col:11 referenced y 'float'
| |-FieldDecl 0x25279df26f0 <line:16:5, col:11> col:11 referenced z 'float'
| `-CXXConstructorDecl 0x25279df3468 <line:3:8> col:8 implicit used constexpr Vector3 'void (const Vector3 &) noexcept' inline default trivial
|   |-ParmVarDecl 0x25279df35a8 <col:8> col:8 used 'const Vector3 &'
|   |-CXXCtorInitializer Field 0x25279df2610 'x' 'float'
|   | `-ImplicitCastExpr 0x25279df3b10 <col:8> 'float' <LValueToRValue>
|   |   `-MemberExpr 0x25279df3ae0 <col:8> 'const float' lvalue .x 0x25279df2610
|   |     `-DeclRefExpr 0x25279df3aa8 <col:8> 'const Vector3' lvalue ParmVar 0x25279df35a8 depth 0 index 0 'const Vector3 &'
|   |-CXXCtorInitializer Field 0x25279df2680 'y' 'float'
|   | `-ImplicitCastExpr 0x25279df3b98 <col:8> 'float' <LValueToRValue>
|   |   `-MemberExpr 0x25279df3b68 <col:8> 'const float' lvalue .y 0x25279df2680
|   |     `-DeclRefExpr 0x25279df3b48 <col:8> 'const Vector3' lvalue ParmVar 0x25279df35a8 depth 0 index 0 'const Vector3 &'
|   |-CXXCtorInitializer Field 0x25279df26f0 'z' 'float'
|   | `-ImplicitCastExpr 0x25279df3c20 <col:8> 'float' <LValueToRValue>
|   |   `-MemberExpr 0x25279df3bf0 <col:8> 'const float' lvalue .z 0x25279df26f0
|   |     `-DeclRefExpr 0x25279df3bd0 <col:8> 'const Vector3' lvalue ParmVar 0x25279df35a8 depth 0 index 0 'const Vector3 &'
|   `-CompoundStmt 0x25279df3c70 <col:8>
|-VarDecl 0x25279df3330 parent 0x25279df1b98 prev 0x25279df1dc8 <line:20:1, col:39> col:24 used zero 'const Vector3' cinit destroyed
| |-NestedNameSpecifier TypeSpec 'Vector3'
| `-ExprWithCleanups 0x25279df37d8 <col:31, col:39> 'const Vector3'
|   `-ImplicitCastExpr 0x25279df37c0 <col:31, col:39> 'const Vector3' <NoOp>
|     `-CXXBindTemporaryExpr 0x25279df37a0 <col:31, col:39> 'Vector3' (CXXTemporary 0x25279df37a0)
|       `-CXXTemporaryObjectExpr 0x25279df3768 <col:31, col:39> 'Vector3' 'void ()'
`-FunctionDecl 0x25279df3868 <line:22:1, line:25:1> line:22:5 main 'int ()'
  `-CompoundStmt 0x25279df3ce0 <col:12, line:25:1>
    `-DeclStmt 0x25279df3cc8 <line:23:5, col:33>
      `-VarDecl 0x25279df3940 <col:5, col:29> col:13 zero 'Vector3' cinit destroyed
        `-CXXConstructExpr 0x25279df3c80 <col:20, col:29> 'Vector3' 'void (const Vector3 &) noexcept'
          `-DeclRefExpr 0x25279df39e0 <col:20, col:29> 'const Vector3' lvalue Var 0x25279df3330 'zero' 'const Vector3'
            `-NestedNameSpecifier TypeSpec 'Vector3'
```

Classes involve multiple interconnected AST node types, each representing different aspects of the class definition and usage.
The nodes we'll encounter in this section include:
- `CXXRecordDecl` for class, struct, and union declarations
- `CXXConstructorDecl` and `CXXDestructorDecl` for constructors and destructors
- `CXXCtorInitializer` for elements in constructor initializer lists
- `CXXMethodDecl` for class member function declarations
- `FieldDecl` for class member variable declarations
- `MemberExpr` for expressions that reference member variables
- `VarDecl` for static member declarations and out-of-line definitions
- `DeclRefExpr` for references to static member functions

We'll need to extend our visitor with several new visitor functions to handle these node types:
```cpp
bool VisitCXXRecordDecl(clang::CXXRecordDecl* node);
bool VisitCXXConstructorDecl(clang::CXXConstructorDecl* node);
bool VisitCXXDestructorDecl(clang::CXXDestructorDecl* node);
bool VisitFieldDecl(clang::FieldDecl* node);
bool VisitMemberExpr(clang::MemberExpr* node);
```

## Class definitions

Declarations of classes, structs, and unions are represented by `CXXRecordDEecl` nodes.
The implementation of this visitor follows the same pattern we've seen before:
```cpp
bool Visitor::VisitCXXRecordDecl(clang::CXXRecordDecl* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    const std::string& name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    // Avoid annotating unnamed (anonymous) record types
    if (!node->isAnonymousStructOrUnion() && !name.empty()) {
        m_annotator->insert_annotation("class-name", line, column, name.length());
    }
    
    return true;
}
```
Clang provides the `isAnonymousStructOrUnion()` check to help us exclude anonymous classes from being annotated.
This removes faulty `[[class-name,]]struct { ... }` annotations that would have otherwise been inserted.

With this visitor implemented, the tool properly annotates class, struct, and union declarations.
This inserts a `class-name` annotation for each type definition:
```text added:{3}
#include <cmath> // std::sqrt

struct [[class-name,Vector3]] {
    static const Vector3 zero;

    Vector3() : x(0.0f), y(0.0f), z(0.0f) { }
    Vector3(float x, float y, float z) : x(x), y(y), z(z) { }
    ~Vector3() { }
    
    [[nodiscard]] float length() const {
        return std::sqrt(x * x + y * y + z * z);
    }
    
    float x;
    float y;
    float z;
};

// Const static class members must be initialized out of line
const Vector3 Vector3::zero = Vector3();

int main() {
    Vector3 zero = Vector3::zero;
    // ...
}
```

### Member variable declarations

Member variable declarations like the `x`, `y`, and `z` fields of our `Vector3` class are represented by `FieldDecl` nodes.
The implementation is similar to our previous visitors:
```cpp title:{visitor.cpp}
bool Visitor::VisitFieldDecl(clang::FieldDecl* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    const std::string& name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("member-variable", line, column, name.length());
    return true;
}
```
With this visitor in place, a `member-variable` annotation is inserted for each member variable declaration.
```text added:{12-14}
#include <cmath> // std::sqrt

struct Vector3 {
    static const Vector3 zero;

    Vector3() : x(0.0f), y(0.0f), z(0.0f) { }
    Vector3(float x, float y, float z) : x(x), y(y), z(z) { }
    ~Vector3() { }
    
    [[nodiscard]] float length() const {
        return std::sqrt(x * x + y * y + z * z);
    }
    
    float [[member-variable,x]];
    float [[member-variable,y]];
    float [[member-variable,z]];
};

// Const static class members must be initialized out of line
const Vector3 Vector3::zero = Vector3();

int main() {
    Vector3 zero = Vector3::zero;
    // ...
}
```

### Member variable references

The `x`, `y`, and `z` references inside the `length()` function are captured as `MemberExpr` nodes.
Similar to member variable declarations, these identifiers benefit significantly from semantic highlighting as they're often indistinguishable from local variables or function parameters without additional context.

We can retrieve the name of the member from the underlying declaration:
```cpp
const clang::ValueDecl* member = node->getMemberDecl();
const std::string& name = member->getNameAsString();
```
We get the declaration through `getMemberDecl()` and extract its name using `getNameAsString()`.
The `getMemberLoc()` function returns the location of the member name, accounting for access operators like `.` and `->`.
```cpp
m_annotator->insert_annotation("member-variable", line, column, name.length());
```
References to member variables are also annotated with the `member-variable` annotation.
```text modified:{9}
#include <cmath> // std::sqrt

struct Vector3 {
    static const Vector3 zero;

    Vector3() : x(0.0f), y(0.0f), z(0.0f) { }
    Vector3(float x, float y, float z) : x(x), y(y), z(z) { }
    ~Vector3() { }
    
    [[nodiscard]] float length() const {
        return std::sqrt([[member-variable,x]] * [[member-variable,x]] + [[member-variable,y]] * [[member-variable,y]] + [[member-variable,z]] * [[member-variable,z]]);
    }
    
    float x;
    float y;
    float z;
};

// Const static class members must be initialized out of line
const Vector3 Vector3::zero = Vector3();

int main() {
    Vector3 zero = Vector3::zero;
    // ...
}
```

## Constructors and initializer lists

Not all references to member variables are handled by the `VisitMemberExpr` function - the `x`, `y`, and `z` references in the constructor initializer list remain unhandled.
This happens because initializer list entries are represented by `CXXCtorInitializer` nodes and not `MemberExpr`.
However, `CXXCtorInitializer` isn't a node that we can visit directly through the usual traversal of the AST.
Instead, we need to access initializers as children of the parent `CXXConstructorDecl` node, which represents the constructor definition.

In our `VisitCXXConstructorDecl` visitor, initializers can be iterated over using the `inits()` function:
```cpp
// Skip compiler-generated constructors
if (node->isImplicit()) {
    return true;
}

for (const clang::CXXCtorInitializer* initializer : node->inits()) {
    location = initializer->getSourceLocation();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    if (initializer->isBaseInitializer()) {
        // Base class initialization is handled separately
        continue;
    }
    
    std::string name = initializer->getMember()->getNameAsString();
    m_annotator->insert_annotation("member-variable", line, column, name.length());
}
```
The `isImplicit()` check is crucial here - compiler-generated constructors don't exist in our source code, so attempting to annotate them will fail.
We also skip base class initializers (for now), since those require different handling that we'll address when annotating references to types.

The name of the member variable is retrieved from its declaration, accessed by the `getMember()` function.
As before, initializers for member variables are annotated with `member-variable`.

Because constructors were already processed in the `FunctionDecl` visitor, we don't need to do any additional annotation here.

With this visitor implemented, here is what our example now looks like:
```text added:{4,5}
#include <cmath> // std::sqrt

struct Vector3 {
    static const Vector3 zero;

    Vector3() : [[member-variable,x]](0.0f), [[member-variable,y]](0.0f), [[member-variable,z]](0.0f) { }
    Vector3(float x, float y, float z) : [[member-variable,x]](x), [[member-variable,y]](y), [[member-variable,z]](z) { }
    ~Vector3() { }
    
    [[nodiscard]] float length() const {
        return std::sqrt(x * x + y * y + z * z);
    }
    
    float x;
    float y;
    float z;
};

// Const static class members must be initialized out of line
const Vector3 Vector3::zero = Vector3();

int main() {
    Vector3 zero = Vector3::zero;
    // ...
}
```

## Static class members

Static class members present a unique challenge for syntax highlighting - they are declared within the class but often require separate definitions outside of it.
Both scenarios are captured by `VarDecl` nodes, but we need to distinguish them from regular variable declarations.

Let's augment our existing `VisitVarDecl` implementation from a previous post to handle static class members: 
```cpp
bool Visitor::VisitVarDecl(clang::VarDecl* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...

    const std::string& name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    if (node->isStaticDataMember()) {
        m_annotator->insert_annotation("member-variable", line, column, name.length());
    }
    
    if (node->isDirectInit()) {
        // Direct (functional) initialization should not be annotated as a function call
        m_annotator->insert_annotation("plain", line, column, name.length());
    }

    return true;
}
```
Static class members are annotated with `member-variable`, just as instance member variables.
The `isStaticDataMember()` check ensures that we only apply the annotation to static class member declarations.
With this visitor implemented, here is what our example now looks like:
```text added:{4,20}
#include <cmath> // std::sqrt

struct Vector3 {
    static const Vector3 [[member-variable,zero]];

    Vector3() : x(0.0f), y(0.0f), z(0.0f) { }
    Vector3(float x, float y, float z) : x(x), y(y), z(z) { }
    ~Vector3() { }
    
    [[nodiscard]] float length() const {
        return std::sqrt(x * x + y * y + z * z);
    }
    
    float x;
    float y;
    float z;
};

// Const static class members must be initialized out of line
const Vector3 Vector3::zero = Vector3();

int main() {
    Vector3 zero = Vector3::zero;
    // ...
}
```

## Static class member references

Similar to enumeration values from an earlier post, references to static class members are captured by `DeclRefExpr` nodes.
Let's augment our existing `VisitDeclRefExpr` visitor to also handle static class members:

References to static class members are caught under `DeclRefExpr` nodes.
We have an existing definition for this visitor from when we annotated enum constants:
```cpp added:{11-12,18-21}
bool Visitor::VisitDeclRefExpr(clang::DeclRefExpr* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    if (clang::ValueDecl* decl = node->getDecl()) {
        const std::string& name = decl->getNameAsString();

        bool is_member_variable = decl->isCXXClassMember();
        bool is_static = !decl->isCXXInstanceMember();

        if (const clang::EnumConstantDecl* ec = clang::dyn_cast<clang::EnumConstantDecl>(decl)) {
            // Found a reference to an enum constant
            m_annotator->insert_annotation("enum-value", line, column, name.length());
        }
        else if (is_member_variable && is_static && !decl->isFunctionOrFunctionTemplate()) {
            // Found reference to static class member variable
            m_annotator->insert_annotation("member-variable", line, column, name.length());
        }
    }
    
    return true;
}
```
As before, we retrieve information about the underlying declaration with `getDecl()`.
With a combination of the `isCXXClassMember()`, `isCXXInstanceMember()`, and `isFunctionOrFunctionTemplate()` checks, we can isolate only references to static members variables.
As before, these are annotated with the `member-variable` tag.

```text added:{20,23}
#include <cmath> // std::sqrt

struct Vector3 {
    static const Vector3 zero;

    Vector3() : x(0.0f), y(0.0f), z(0.0f) { }
    Vector3(float x, float y, float z) : x(x), y(y), z(z) { }
    ~Vector3() { }
    
    [[nodiscard]] float length() const {
        return std::sqrt(x * x + y * y + z * z);
    }
    
    float x;
    float y;
    float z;
};

// Const static class members must be initialized out of line
const Vector3 Vector3::[[member-variable,zero]] = Vector3();

int main() {
    Vector3 zero = Vector3::[[member-variable,zero]];
    // ...
}
```

## Temporary objects

The final node type we need to handle is `CXXTemporaryObjectExpr`, which represents the construction of temporary object.
In the example we've been using throughout this post, this applies to the definition of the `Vector3::zero` static class member.

Generally speaking, these nodes appear in a variety of contexts, such as:
- Direct temporary construction
```cpp
Vector3 v = Vector3(...);
```
- Passing a temporary as a function argument
```cpp
foo(Vector3(...));
```
- Returning a temporary from a function
```cpp
return Vector3(...);
```
Despite appearing as constructor calls, all of these are represented by `CXXTemporaryObjectExpr` nodes and do not generate `CallExpr` nodes as one might expect.
Without a dedicated visitor, references to these constructors would go unannotated.

The implementation of the `VisitCXXTemporaryObjectExpr` visitor is straightforward:
```cpp
bool Visitor::VisitCXXTemporaryObjectExpr(clang::CXXTemporaryObjectExpr* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...

    if (clang::CXXConstructorDecl* constructor = node->getConstructor()) {
        std::string name = constructor->getNameAsString();
        
        for (const Token& token : m_tokenizer->get_tokens(node->getSourceRange())) {
            if (token.spelling == name && !node->isListInitialization()) {
                m_annotator->insert_annotation("function", token.line, token.column, token.spelling.length());
            }
        }
    }
    
    return true;
}
```
We retrieve the type name of the object being constructed from the `CXXConstructorDecl` associated with the expression.
As with other function calls, constructor calls are annotated using the `function` tag.
The `isListInitialization()` check ensures we skip brace-initialized constructors like `Vector3 { }`, as those should instead be annotated as types.
We'll handle this in a later post.

With this visitor in place, temporary constructor calls are properly annotated:
```text added:{20,23}
#include <cmath> // std::sqrt

struct Vector3 {
    static const Vector3 zero;

    Vector3() : x(0.0f), y(0.0f), z(0.0f) { }
    Vector3(float x, float y, float z) : x(x), y(y), z(z) { }
    ~Vector3() { }
    
    [[nodiscard]] float length() const {
        return std::sqrt(x * x + y * y + z * z);
    }
    
    float x;
    float y;
    float z;
};

// Const static class members must be initialized out of line
const Vector3 Vector3::zero = [[function,Vector3]]();

int main() {
    Vector3 zero = Vector3::zero;
    // ...
}
```

## Styling
The final step is to add a definition for the `member-variable` CSS style:
```css
.language-cpp .member-variable {
    color: rgb(152, 118, 170);
}
```

```cpp
#include <cmath> // std::sqrt

struct Vector3 {
    static const Vector3 [[member-variable,zero]];
    
    Vector3() : [[member-variable,x]](0.0f), [[member-variable,y]](0.0f), [[member-variable,z]](0.0f) { }
    Vector3(float x, float y, float z) : [[member-variable,x]](x), [[member-variable,y]](y), [[member-variable,z]](z) { }
    ~Vector3() { }
    
    [[nodiscard]] float length() const {
        return std::sqrt([[member-variable,x]] * [[member-variable,x]] + [[member-variable,y]] * [[member-variable,y]] + [[member-variable,z]] * [[member-variable,z]]);
    }
    
    float [[member-variable,x]];
    float [[member-variable,y]];
    float [[member-variable,z]];
};

// Const class static members must be initialized out of line
const Vector3 Vector3::[[member-variable,zero]] = Vector3();

int main() {
    Vector3 zero = Vector3::[[member-variable,zero]];
    // ...
}
```

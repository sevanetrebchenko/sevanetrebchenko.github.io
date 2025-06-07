
## Classes

Let's start moving into some more complex cases.

```cpp
#include <cmath> // std::sqrt

struct Vector3 {
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

// ...
```

```text
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

There are a lot of moving parts when it comes to annotating classes.
Let's break down some of the nodes we will visit in this section:
- `CXXRecordDecl`, which represents declarations of structs, unions, and classes,
- `CXXConstructorDecl` and `CXXDestructorDecl`, which represents class constructors and destructors, respectively,
- `CXXCtorInitializer`, which represents an element from a constructor initializer list,
- `CXXMethodDecl`, which represents class member functions,
- `FieldDecl`, which represents declarations of class member variables,
- `MemberExpr`, which represents expressions that reference class member variables,
- `VarDecl`, which represents static class member declarations and out of line definitions, and
- `DeclRefExpr`, which represents references to static class member variables

Of course, we need to set up a few new visitor functions:
```cpp title:{visitor.hpp} added:{9,14-30}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // ...
        
        // For visiting references to enum constants
        // For visiting references to static class member variable
        bool VisitDeclRefExpr(clang::DeclRefExpr* node);
        
        // ...
        
        // For visiting class declarations
        bool VisitCXXRecordDecl(clang::CXXRecordDecl* node);
        
        // For visiting class constructors
        bool VisitCXXConstructorDecl(clang::CXXConstructorDecl* node);
        
        // For visiting class destructors
        bool VisitCXXDestructorDecl(clang::CXXDestructorDecl* node);
        
        // For visiting class member variables
        bool VisitFieldDecl(clang::FieldDecl* node);
        
        // For visiting references to class member variables (within class member functions)
        bool VisitMemberExpr(clang::MemberExpr* node);
        
        // For visiting static class member variable declarations / definitions
        bool VisitVarDecl(clang::VarDecl* node);
        
        // ...
};
```

### Class definitions

Class definitions are captured by `CXXRecordDecl` nodes.
Setting up a visitor function for this node is optional, as PrismJS is accurately able to capture these symbols.
```cpp title:{visitor.cpp}
#include "visitor.hpp"

bool Visitor::VisitCXXRecordDecl(clang::CXXRecordDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    
    clang::SourceLocation location = node->getLocation();
    if (source_manager.isInMainFile(location)) {
        const std::string& name = node->getNameAsString();
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);
        
        if (!name.empty()) {
            m_annotator->insert_annotation("class-name", line, column, name.length());
        }
    }
    
    return true;
}
```
This function follows the same pattern as we've seen before.
A `class-name` annotation is inserted for each class declaration.

```text added:{3}
#include <cmath> // std::sqrt

struct [[class-name,Vector3]] {
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
```

### Member variable declarations

Next up are class member variable declarations, which are captured by `FieldDecl` nodes.
```cpp title:{visitor.cpp}
#include "visitor.hpp"

bool Visitor::VisitFieldDecl(clang::FieldDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    // Skip nodes not in the main file
    if (source_manager.isInMainFile(location)) {
        const std::string& name = node->getNameAsString();
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);
        
        m_annotator->insert_annotation("member-variable", line, column, name.length());
    }
    
    return true;
}
```
The `member-variable` annotation is inserted for member variable definitions.

```text added:{12-14}
#include <cmath> // std::sqrt

struct [[class-name,Vector3]] {
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
```

### Member variable references

References to member variables are captured by `MemberExpr` nodes.
```cpp title:{visitor.cpp}
#include "visitor.hpp"

bool Visitor::VisitMemberExpr(clang::MemberExpr* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = node->getMemberLoc();
    
    // Skip any references to class member variables that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
        
    const clang::ValueDecl* member = node->getMemberDecl();
    std::string name = member->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(source_location);
    unsigned column = source_manager.getSpellingColumnNumber(source_location);
    
    if (name.empty()) {
        // Empty variable names reference anonymous types and should be skipped
        return true;
    }
    
    m_annotator->insert_annotation("member-variable", line, column, name.length());
    return true;
}
```
Most of the implementation of this visitor function follows the same patterns we've seen before, with two exceptions.
For one, the source location is retrieved using the `MemberExpr::getMemberLoc` helper function, which returns the location of the member taking into account any access operators.
For example, an access like `obj.m_member` or `obj->m_member` returns the location of `m_member`.
Second, we get the name of the member from its declaration as returned by `MemberExpr::getMemberDecl`.
This is used to ensure that the annotation is applied to only the length of the member variable.

```text modified:{9}
#include <cmath> // std::sqrt

struct [[class-name,Vector3]] {
    Vector3() : x(0.0f), y(0.0f), z(0.0f) { }
    Vector3(float x, float y, float z) : x(x), y(y), z(z) { }
    ~Vector3() { }
    
    [[nodiscard]] float length() const {
        return std::sqrt([[member-variable,x]] * [[member-variable,x]] + [[member-variable,y]] * [[member-variable,y]] + [[member-variable,z]] * [[member-variable,z]]);
    }
    
    float [[member-variable,x]];
    float [[member-variable,y]];
    float [[member-variable,z]];
};
```

### Constructors and initializer lists
Despite annotating references to member variables with the `VisitMemberExpr` function, you'll notice that references to the `x`, `y`, and `z` member variables in the constructor initializer list have not been annotated.
This is due to the fact that these nodes are represented by `CXXCtorInitializer` nodes, and not `MemberExpr`.
Furthermore, this is actually not a valid node that we can visit with a visitor function and AST traversal.
Instead, constructor member initializer lists must be accessed as children of the `CXXConstructorDecl` node, which we have a visitor function for:
```cpp title:{visitor.cpp} line-numbers:{enabled}
#include "visitor.hpp"

bool Visitor::VisitCXXConstructorDecl(clang::CXXConstructorDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = node->getBeginLoc();
    
    // Skip any class constructors that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    // Skip implicit constructors
    if (node->isImplicit()) {
        return true;
    }
        
    // Insert annotations for all member variables in the constructor initializer list
    for (const clang::CXXCtorInitializer* initializer : node->inits()) {
        location = initializer->getSourceLocation();
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);
        
        if (initializer->isBaseInitializer()) {
            // Base class initialization
            // Annotation is handled elsewhere
            continue;
        }
        
        std::string name = initializer->getMember()->getNameAsString();
        m_annotator->insert_annotation("member-variable", line, column, name.length());
    }
    
    return true;
}
```
Once we verify that the input node references a symbol
Depending on whether we enabled traversal of implicit constructors and destructors with `shouldVisitImplicitCode`, this is where we can see this.
Functions generated by the compiler are not present in the file we passed to the tool, meaning we should skip these definitions to avoid inserting annotations for tokens that don't exist.

This visitor function iterates over all initializers in the constructor initializer list and adds a `member-variable` annotation.
Once again, we retrieve the name of the member using its declaration as returned by `CXXCtorInitializer::getMember`.
This is used to ensure that the annotation is applied to only the length of the member variable.

One important thing to note is that base class initializers also get captured by the `CXXCtorInitializer` node.
For now, we skip these with a `CXXCtorInitializer::isBaseInitializer` check on line 23 - we will revisit this later when we add annotations for classes.

```text added:{4,5}
#include <cmath> // std::sqrt

struct [[class-name,Vector3]] {
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
```
For now, there is nothing to do in the destructor visitor.

### Static class members
Both static class member declarations and out-of-line definitions are captured by `VarDecl` nodes:
```cpp title:{visitor.cpp}
#include "visitor.hpp"

bool Visitor::VisitVarDecl(clang::VarDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    // Skip any VarDecl nodes that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    const std::string& name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    if (node->isStaticDataMember()) {
        // Check VarDecl::hasDefinition to only visit static class member variables that have definitions
        // Otherwise, statics that are not constexpr must be defined outside the class
        // An exception to this is if VarDecl::hasConstantInitialization, in which case the declaration and definition are on the same line
        // Example: static const int a = 42;
        // For the purposes of syntax highlighting, however, both declarations and definitions are visited, so the distinction between the two does not mean much here
        m_annotator->insert_annotation("member-variable", line, column, name.length());
    }

    return true;
}
```
`VarDecl` nodes capture more than static class member variables.
We can easily make sure we are processing static member variables with the `VarDecl::isStaticDataMember` check.
This function visits both declarations and definitions outside the class (for non-`constexpr` static class members).

Static member variables are highlighted as member variables with the `member-variable` annotation.

```text added:{4,20}
#include <cmath> // std::sqrt

struct [[class-name,Vector3]] {
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
    Vector3 zero = Vector3::zero;
    // ...
}
```

### Static class member references
References to static class members are caught under `DeclRefExpr` nodes.
We have seen this node before when annotating enum constants, so we will be augmenting the visitor function to also account for static member variables.
```cpp title:{visitor.cpp} added:{18,19,25-28}
#include "visitor.hpp"

bool Visitor::VisitDeclRefExpr(clang::DeclRefExpr* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    // Skip any DeclRefExpr nodes that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }

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
This function now also checks if a `DeclRefExpr` node references a class member (`DeclRefExpr::isCXXClassMember`) that is static (not an instance member, `DeclRefExpr::isCXXInstanceMember`) and *not* a function (`DeclRefExpr::isFunctionOrFunctionTemplate`).
If all checks pass, the node is confirmed to reference a static class member and is annotated as a `member-variable`.

```text added:{23}
#include <cmath> // std::sqrt

struct [[class-name,Vector3]] {
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

## Unions

As mentioned earlier, `CXXRecordDecl` nodes also capture unions.
This allows us to reuse the same visitor logic for annotating union names and members, just as we did for classes and structs.
```cpp
union Constant {
    bool b;
    char c;
    int i;
    float f;
    double d;
};

int main() {
    Constant c { };
    c.i = 4;
    // ...
    
    c.d = 3.14;
    // ...
}
```

Looking at the generated AST for this code snippet, we see that all relevant nodes already have corresponding visitor implementations.
```text
|-CXXRecordDecl 0x1e1093079e8 <example.cpp:1:1, line:7:1> line:1:7 referenced union Constant definition
| |-DefinitionData pass_in_registers aggregate standard_layout trivially_copyable pod trivial literal has_constexpr_non_copy_move_ctor has_variant_members
| | |-DefaultConstructor exists trivial constexpr needs_implicit defaulted_is_constexpr
| | |-CopyConstructor simple trivial has_const_param needs_implicit implicit_has_const_param
| | |-MoveConstructor exists simple trivial needs_implicit
| | |-CopyAssignment simple trivial has_const_param needs_implicit implicit_has_const_param
| | |-MoveAssignment exists simple trivial needs_implicit
| | `-Destructor simple irrelevant trivial constexpr needs_implicit
| |-CXXRecordDecl 0x1e10ab28758 <col:1, col:7> col:7 implicit union Constant
| |-FieldDecl 0x1e10ab28818 <line:2:5, col:10> col:10 b 'bool'
| |-FieldDecl 0x1e10ab28880 <line:3:5, col:10> col:10 c 'char'
| |-FieldDecl 0x1e10ab288f0 <line:4:5, col:9> col:9 referenced i 'int'
| |-FieldDecl 0x1e10ab28960 <line:5:5, col:11> col:11 f 'float'
| `-FieldDecl 0x1e10ab289d0 <line:6:5, col:12> col:12 referenced d 'double'
`-FunctionDecl 0x1e10ab28aa0 <line:9:1, line:16:1> line:9:5 main 'int ()'
  `-CompoundStmt 0x1e10ab28f70 <col:12, line:16:1>
    |-DeclStmt 0x1e10ab28d50 <line:10:5, col:19>
    | `-VarDecl 0x1e10ab28c38 <col:5, col:18> col:14 used c 'Constant' listinit
    |   `-InitListExpr 0x1e10ab28ce0 <col:16, col:18> 'Constant' field Field 0x1e10ab28818 'b' 'bool'
    |-BinaryOperator 0x1e10ab28dd8 <line:11:5, col:11> 'int' lvalue '='
    | |-MemberExpr 0x1e10ab28d88 <col:5, col:7> 'int' lvalue .i 0x1e10ab288f0
    | | `-DeclRefExpr 0x1e10ab28d68 <col:5> 'Constant' lvalue Var 0x1e10ab28c38 'c' 'Constant'
    | `-IntegerLiteral 0x1e10ab28db8 <col:11> 'int' 4
    `-BinaryOperator 0x1e10ab28f50 <line:14:5, col:11> 'double' lvalue '='
      |-MemberExpr 0x1e10ab28f00 <col:5, col:7> 'double' lvalue .d 0x1e10ab289d0
      | `-DeclRefExpr 0x1e10ab28ee0 <col:5> 'Constant' lvalue Var 0x1e10ab28c38 'c' 'Constant'
      `-FloatingLiteral 0x1e10ab28f30 <col:11> 'double' 3.140000e+00
```

However, we must take care to exclude anonymous unions and structs from being annotated.
Fortunately, Clang provides a built-in check via `CXXRecordDecl::isAnonymousStructOrUnion` that we can use for this purpose:
```cpp
bool Visitor::VisitCXXRecordDecl(clang::CXXRecordDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    
    clang::SourceLocation location = node->getLocation();
    if (source_manager.isInMainFile(location)) {
        const std::string& name = node->getNameAsString();
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);
        
        // Avoid annotating unnamed (anonymous) record types
        if (!node->isAnonymousStructOrUnion() && !name.empty()) {
            m_annotator->insert_annotation("class-name", line, column, name.length());
        }
    }
    
    return true;
}
```
This removes faulty `[[class-name,]]union { ... }` annotations that would have otherwise been added before anonymous struct and union declarations.
Declarations and references to union members are handled without any additional modifications by the `VisitFieldDecl` and `VisitMemberExpr` visitor functions.

```cpp
union [[class-name,Constant]] {
    bool [[member-variable,b]];
    char [[member-variable,c]];
    int [[member-variable,i]];
    float [[member-variable,f]];
    double [[member-variable,d]];
};

int main() {
    Constant c { };
    c.[[member-variable,i]] = 4;
    // ...
    
    c.[[member-variable,d]] = 3.14;
    // ...
}
```
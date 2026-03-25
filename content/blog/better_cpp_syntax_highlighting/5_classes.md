
Classes introduce significantly more complexity than enums, namespaces, or functions, but the same core principles apply.
Consider the following example:
```cpp line-numbers:{enabled}
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
```text show-lines:{20} line-numbers:{enabled}
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
- [`CXXRecordDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1CXXRecordDecl.html) for class, struct, and union declarations
- [`CXXConstructorDecl`](https://clang.llvm.org/doxygen/classclang_1_1CXXConstructorDecl.html) and [`CXXDestructorDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1CXXDestructorDecl.html) for constructors and destructors
- [`CXXCtorInitializer` nodes](https://clang.llvm.org/doxygen/classclang_1_1CXXCtorInitializer.html) for elements in constructor initializer lists
- [`CXXMethodDecl`](https://clang.llvm.org/doxygen/classclang_1_1CXXMethodDecl.html) for class member function declarations
- [`FieldDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1FieldDecl.html) for class member variable declarations
- [`MemberExpr`](https://clang.llvm.org/doxygen/classclang_1_1MemberExpr.html) for expressions that reference member variables
- [`VarDecl`](https://clang.llvm.org/doxygen/classclang_1_1ValueDecl.html) for static member declarations and out-of-line definitions
- [`DeclRefExpr`](https://clang.llvm.org/doxygen/classclang_1_1DeclRefExpr.html) for references to static member functions

We'll need to extend our visitor with several new visitor functions to handle these node types:
```cpp title:{visitor.hpp}
[[keyword,bool]] [[function,VisitCXXRecordDecl]]([[namespace-name,clang]]::[[class-name,CXXRecordDecl]]* node);
[[keyword,bool]] [[function,VisitCXXConstructorDecl]]([[namespace-name,clang]]::[[class-name,CXXConstructorDecl]]* node);
[[keyword,bool]] [[function,VisitCXXDestructorDecl]]([[namespace-name,clang]]::[[class-name,CXXDestructorDecl]]* node);
[[keyword,bool]] [[function,VisitFieldDecl]]([[namespace-name,clang]]::[[class-name,FieldDecl]]* node);
[[keyword,bool]] [[function,VisitMemberExpr]]([[namespace-name,clang]]::[[class-name,MemberExpr]]* node);
```

## Class definitions

Declarations of classes, structs, and unions are represented by `CXXRecordDecl` nodes.
The implementation of this visitor follows the same pattern we've seen before:
```cpp title:{visitor.cpp} line-numbers:{enabled}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitCXXRecordDecl]]([[namespace-name,clang]]::[[class-name,CXXRecordDecl]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...

    [[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name = node->[[function,getNameAsString]]();

	[[namespace-name,clang]]::[[class-name,SourceLocation]] location = node->[[function,getLocation]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);

    [[keyword,if]] ([[unary-operator,!]]node->[[function,isAnonymousStructOrUnion]]() [[binary-operator,&&]] [[unary-operator,!]]name.[[function,empty]]()) {
        [[member-variable,m_annotator]]->[[function,insert_annotation]]("class-name", line, column, name.[[function,length]]());
    }

    [[keyword,return]] [[keyword,true]];
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

const Vector3 Vector3::zero = Vector3();

int main() {
    Vector3 zero = Vector3::zero;
    // ...
}
```

### Member variable declarations

Member variable declarations like the `x`, `y`, and `z` fields of our `Vector3` class are represented by `FieldDecl` nodes.
The implementation is similar to our previous visitors:
```cpp title:{visitor.cpp} line-numbers:{enabled}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitFieldDecl]]([[namespace-name,clang]]::[[class-name,FieldDecl]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    [[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name = node->[[function,getNameAsString]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](source_location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](source_location);

    [[member-variable,m_annotator]]->[[function,insert_annotation]]("member-variable", line, column, name.[[function,length]]());
    [[keyword,return]] [[keyword,true]];
}
```
With this visitor in place, a `member-variable` annotation is inserted for each member variable declaration.
```text added:{14-16}
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

const Vector3 Vector3::zero = Vector3();

int main() {
    Vector3 zero = Vector3::zero;
    // ...
}
```

### Member variable references

The `x`, `y`, and `z` references inside the `length()` function are captured as `MemberExpr` nodes.
Similar to member variable declarations, these identifiers benefit significantly from semantic highlighting as they're often indistinguishable from local variables or function parameters without additional context.

```cpp title:{visitor.cpp} line-numbers:{enabled}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitMemberExpr]]([[namespace-name,clang]]::[[class-name,MemberExpr]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...

    [[keyword,const]] [[namespace-name,clang]]::[[class-name,ValueDecl]]* member = node->[[function,getMemberDecl]]();
    [[namespace-name,std]]::[[class-name,string]] name = member->[[function,getNameAsString]]();

    [[namespace-name,clang]]::[[class-name,SourceLocation]] location  = node->[[function,getMemberLoc]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);

    [[member-variable,m_annotator]]->[[function,insert_annotation]]("member-variable", line, column, name.[[function,length]]());
    [[keyword,return]] [[keyword,true]];
}
```
The name of the member is retrieved from the underlying declaration using `getMemberDecl()`.
The `getMemberLoc()` function returns the location of the member name, accounting for access operators like `.` and `->`.

References to member variables are annotated with the `member-variable` annotation.
```text added:{11}
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

const Vector3 Vector3::zero = Vector3();

int main() {
    Vector3 zero = Vector3::zero;
    // ...
}
```

## Constructors and initializer lists

Not all references to member variables are handled by the `VisitMemberExpr` function - the `x`, `y`, and `z` references in the constructor initializer list remain unhandled.
This happens because initializer list entries are represented by `CXXCtorInitializer` nodes, and not `MemberExpr`.
However, `CXXCtorInitializer` isn't a node that we can visit directly through the usual traversal of the AST.
Instead, we need to access initializers as children of the parent `CXXConstructorDecl` node, which represents a constructor definition.
```cpp title:{visitor.cpp} line-numbers:{enabled}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitCXXConstructorDecl]]([[namespace-name,clang]]::[[class-name,CXXConstructorDecl]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...

    // Skip implicit constructors
    [[keyword,if]] (node->[[function,isImplicit]]()) {
        [[keyword,return]] [[keyword,true]];
    }

    [[keyword,for]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,CXXCtorInitializer]]* initializer : node->[[function,inits]]()) {
        location [[function-operator,=]] initializer->[[function,getSourceLocation]]();
        [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
        [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);

        [[keyword,if]] (initializer->[[function,isMemberInitializer]]()) {
            [[namespace-name,clang]]::[[class-name,FieldDecl]]* member = initializer->[[function,getMember]]();
            [[namespace-name,std]]::[[class-name,string]] name = member->[[function,getNameAsString]]();
            [[member-variable,m_annotator]]->[[function,insert_annotation]]("member-variable", line, column, name.[[function,length]]());
        }
    }

    [[keyword,return]] [[keyword,true]];
}
```
The `isImplicit()` check is crucial here - compiler-generated constructors don't exist in our source code, so attempting to annotate them will fail.
We also skip base class initializers (for now), since those require different handling that we'll address when annotating references to types.

Individual initializer expressions can be iterated over using the `inits()` function:
The name of the member variable is retrieved from its declaration using `getMember()`.
As before, initializers for member variables are annotated with `member-variable`.

This approach works well for typical class members, but fails to deal with anonymous structs or unions.
Consider an improvement made to the `Vector3` class to allow for representing RGB colors:
```text
#include <cmath> // std::sqrt

struct Vector3 {
    static const Vector3 zero;

    Vector3() : x(0.0f), y(0.0f), z(0.0f) { }
    Vector3(float x, float y, float z) : x(x), y(y), z(z) { }
    ~Vector3() { }
    
    [[nodiscard]] float length() const {
        return std::sqrt(x * x + y * y + z * z);
    }
    
    union {
        // For access as coordinates
        struct {
            float x;
            float y;
            float z;
        };
        
        // For access as color components
        struct {
            float r;
            float g;
            float b;
        };
    };
};

const Vector3 Vector3::zero = Vector3();

int main() {
    Vector3 zero = Vector3::zero;
    // ...
}
```
In this case, members get *promoted* as part of the `Vector3` definition.
However, `getMember()` returns null for member variables that originate as members of an anonymous type.
To get around this, we'll introduce a new `collect_members()` function that collects the names of all available members of a class:
```cpp title:{visitor.cpp} line-numbers:{enabled}
[[keyword,void]] [[function,collect_members]]([[keyword,const]] [[namespace-name,clang]]::[[class-name,CXXRecordDecl]]* record, [[namespace-name,std]]::[[class-name,unordered_set]]<[[namespace-name,std]::[[class-name,string]]>& members) {
    [[keyword,if]] ([[unary-operator,!]]record) {
        [[keyword,return]];
    }

    [[keyword,for]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,FieldDecl]]* field : record->[[function,fields]]()) {
        [[keyword,if]] (field->[[function,isAnonymousStructOrUnion]]()) {
            [[keyword,const]] [[namespace-name,clang]]::[[class-name,CXXRecordDecl]]* nested = field->[[function,getType]]()[[function-operator,->]][[function,getAsCXXRecordDecl]]();
            [[function,collect_members]](nested, members);
        }
        [[keyword,else]] {
            members.[[function,insert]](field->[[function,getNameAsString]]());
        }
    }
}
```
This function recurses over all nested type definitions, gathering both explicit members and those implicitly promoted through anonymous structs or unions.
We'll update `VisitCXXConstructorDecl` to use this when annotating member initializers:
```cpp title:{visitor.cpp} line-numbers:{enabled} added:{10-22,34-39}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitCXXConstructorDecl]]([[namespace-name,clang]]::[[class-name,CXXConstructorDecl]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...

    // Skip implicit constructors
    [[keyword,if]] (node->[[function,isImplicit]]()) {
        [[keyword,return]] [[keyword,true]];
    }

    [[namespace-name,clang]]::[[class-name,DeclContext]]* context = node->[[function,getDeclContext]]();
    [[keyword,while]] (context [[binary-operator,&&]] [[unary-operator,!]][[namespace-name,clang]]::[function,dyn_cast]]<[[namespace-name,clang]]::[[class-name,CXXRecordDecl]]>(context)) {
        context [[binary-operator,=]] context->[[function,getParent]]();
    }

    [[keyword,if]] ([[unary-operator,!]]context) {
        // Unable to find enclosing class declaration
        [[keyword,return]] [[keyword,true]];
    }

    [[namespace-name,clang]]::[[class-name,CXXRecordDecl]]* parent = [[namespace-name,clang]]::[function,dyn_cast]]<[[namespace-name,clang]]::[[class-name,CXXRecordDecl]]>(context);
    [[namespace-name,std]]::[[class-name,unordered_set]]<[[namespace-name,std]::[[class-name,string]]> members;
    [[function,collect_members]](parent, members);

    [[keyword,for]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,CXXCtorInitializer]]* initializer : node->[[function,inits]]()) {
        location [[function-operator,=]] initializer->[[function,getSourceLocation]]();
        [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
        [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);

        [[keyword,if]] (initializer->[[function,isMemberInitializer]]()) {
            [[namespace-name,clang]]::[[class-name,FieldDecl]]* member = initializer->[[function,getMember]]();
            [[namespace-name,std]]::[[class-name,string]] name = member->[[function,getNameAsString]]();
            [[member-variable,m_annotator]]->[[function,insert_annotation]]("member-variable", line, column, name.[[function,length]]());
        }
        [[keyword,else]] [[keyword,if]] (initializer->[[function,isIndirectMemberInitializer]]()) {
            [[namespace-name,std]]::[[class-name,string]] name = [[member-variable,m_tokenizer]]->[[function,get_tokens]](initializer->[[function,getSourceRange]]())[0].[[member-variable,spelling]];
            [[keyword,if]] (members.[[function,contains]](name)) {
                [[member-variable,m_annotator]]->[[function,insert_annotation]]("member-variable", line, column, name.[[function,length]]());
            }
        }
    }

    [[keyword,return]] [[keyword,true]];
}
```
The `collect_members()` function is called with the declaration of the enclosing class.
This is retrieved by walking up the declaration hierarchy of a given AST node, accessed through the node's `DeclContext` chain.
The next parent is accessed through the `getParent()` function.
Initializers for members that originate from an anonymous context are identified with the `isIndirectMemberInitializer()` check.
Instead of `getMember()`, we'll retrieve the name of the member through direct tokenization, taking advantage of the fact that the first token in the initializer's source range will always be the name of the member being initialized.

Annotating the name of the constructor was already done in the `FunctionDecl` visitor, so we don't need to do any additional processing here.

With this visitor implemented, both direct member initializations and promoted member initializations are properly annotated in constructor initializer lists:
```text added:{6,7}
#include <cmath> // std::sqrt

struct Vector3 {
    static const Vector3 zero;

    Vector3() : [[member-variable,x]](0.0f), [[member-variable,y]](0.0f), [[member-variable,z]](0.0f) { }
    Vector3(float x, float y, float z) : [[member-variable,x]](x), [[member-variable,y]](y), [[member-variable,z]](z) { }
    ~Vector3() { }
    
    [[nodiscard]] float length() const {
        return std::sqrt(x * x + y * y + z * z);
    }
    
    union {
        // For access as coordinates
        struct {
            float x;
            float y;
            float z;
        };
        
        // For access as color components
        struct {
            float r;
            float g;
            float b;
        };
    };
};

const Vector3 Vector3::zero = Vector3();

int main() {
    Vector3 zero = Vector3::zero;
    // ...
}
```

## Static class member declarations

Static class members present a unique challenge for syntax highlighting - they are declared within the class but often require separate definitions outside of it.
Both scenarios are captured by `VarDecl` nodes, but we need to distinguish them from regular variable declarations.

Let's augment our existing `VisitVarDecl` implementation from a previous post to handle static class members: 
```cpp title:{visitor.cpp} line-numbers:{enabled}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitVarDecl]]([[namespace-name,clang]]::[[class-name,VarDecl]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    [[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name = node->[[function,getNameAsString]]();
    
    [[namespace-name,clang]]::[[class-name,SourceLocation]] location = node->[[function,getLocation]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);

    [[keyword,if]] (node->[[function,isStaticDataMember]]()) {
        [[member-variable,m_annotator]]->[[function,insert_annotation]]("member-variable", line, column, name.[[function,length]]());
    }
    [[keyword,else]] [[keyword,if]] (node->[[function,isDirectInit]]()) {
        [[member-variable,m_annotator]]->[[function,insert_annotation]]("plain", line, column, name.[[function,length]]());
    }

    [[keyword,return]] [[keyword,true]];
}
```
Static class members are annotated with `member-variable`, just as instance member variables.
The `isStaticDataMember()` check ensures that we only apply the annotation to static class member declarations.
With this visitor implemented, here is what our example now looks like:
```text added:{4}
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
```cpp added:{11-12,17-19} title:{visitor.cpp} line-numbers:{enabled}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitDeclRefExpr]]([[namespace-name,clang]]::[[class-name,DeclRefExpr]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...

    [[keyword,const]] [[namespace-name,clang]]::[[class-name,SourceLocation]]& location = node->[[function,getLocation]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);

    [[keyword,if]] ([[namespace-name,clang]]::[[class-name,ValueDecl]]* decl = node->[[function,getDecl]]()) {
        [[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name = decl->[[function,getNameAsString]]();
        [[keyword,bool]] is_member_variable = decl->[[function,isCXXClassMember]]();
        [[keyword,bool]] is_static = [[unary-operator,!]]decl->[[function,isCXXInstanceMember]]();

        [[keyword,if]] ([[keyword,const]] [[namespace-name,clang]]::[[class-name,EnumConstantDecl]]* ec = clang::dyn_cast<[[namespace-name,clang]]::[[class-name,EnumConstantDecl]]>(decl)) {
            [[member-variable,m_annotator]]->[[function,insert_annotation]]("enum-value", line, column, name.[[function,length]]());
        }
        [[keyword,else]] [[keyword,if]] (is_member_variable [[binary-operator,&&]] is_static [[binary-operator,&&]] [[unary-operator,!]]decl->[[function,isFunctionOrFunctionTemplate]]()) {
            [[member-variable,m_annotator]]->[[function,insert_annotation]]("member-variable", line, column, name.[[function,length]]());
        }
    }

    [[keyword,return]] [[keyword,true]];
}
```
As before, we retrieve information about the underlying declaration with `getDecl()`.
With a combination of the `isCXXClassMember()`, `isCXXInstanceMember()`, and `isFunctionOrFunctionTemplate()` checks, we can isolate only references to static members variables.
As before, these are annotated with the `member-variable` tag.

This logic needs to come *after* the check for enum constants to avoid annotating unscoped enum members as member variables.

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

The final node type we need to handle is `CXXTemporaryObjectExpr`, which represents the construction of temporary objects.
In the example we've been using throughout this post, this applies to the definition of the `Vector3::zero` static class member.

Generally speaking, these nodes appear in a variety of contexts, such as:
- Direct temporary construction
```cpp
[[class-name,Vector3]] v = [[class-name,Vector3]](...);
```
- Passing a temporary as a function argument
```cpp
[[function,foo]]([[class-name,Vector3]](...));
```
- Returning a temporary from a function
```cpp
[[keyword,return]] [[class-name,Vector3]](...);
```
Despite appearing as constructor calls, all of these are represented by `CXXTemporaryObjectExpr` nodes and do not generate `CallExpr` nodes as one might expect.
Without a dedicated visitor, references to these constructors would go unannotated.

The implementation of the `VisitCXXTemporaryObjectExpr` visitor is straightforward:
```cpp title:{visitor.cpp} line-numbers:{enabled}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitCXXTemporaryObjectExpr]]([[namespace-name,clang]]::[[class-name,CXXTemporaryObjectExpr]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    [[keyword,if]] ([[namespace-name,clang]]::[[class-name,CXXConstructorDecl]]* constructor = node->[[function,getConstructor]]()) {
        [[keyword,for]] ([[keyword,const]] Token& token : m_tokenizer->get_tokens(node->getSourceRange())) {
            [[keyword,if]] (token.[[member-variable,spelling] [[binary-operator,==]] constructor->[[function,getNameAsString]]() [[binary-operator,&&]] [[unary-operator,!]]node->[[functionisListInitialization()) {
                m_annotator->insert_annotation("function", token.[[member-variable,line]], token.[[member-variable,column]], token.[[member-variable,spelling]].[[function,length]]());
            }
        }

        [[function,visit_qualifiers]](constructor->[[function,getDeclContext]](), node->[[function,getSourceRange]]());
    }

    [[keyword,return]] [[keyword,true]];
}
```
We retrieve the type name of the object being constructed from the `CXXConstructorDecl` associated with the expression.
As with other function calls, constructor calls are annotated using the `function` tag.
The `isListInitialization()` check ensures we skip brace-initialized constructors like `Vector3 { }`, as those should instead be annotated as types.
We'll handle this in a later post.

With this visitor in place, temporary constructor calls are properly annotated:
```text added:{20}
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
The final step is to add definitions for the `class-name` and `member-variable` CSS styles:
```css
.language-cpp .member-variable {
    color: rgb(152, 118, 170);
}
.language-cpp .class-name {
    color: rgb(181, 182, 227);
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
const Vector3 Vector3::[[member-variable,zero]] = [[function,Vector3]]();

int main() {
    Vector3 zero = Vector3::[[member-variable,zero]];
    // ...
}
```

## Type aliases

Type aliases are loosely coupled with classes, so we'll cover them in this section.
`typedef` declarations are represented by `TypedefDecl` nodes, while `using` declarations are represented by `TypeAliasDecl` nodes.
Functionally, both constructs serve the same purpose: defining an alias for an existing type.

For example, we can extend our example from earlier even further and allow our users to reference members of the `Vector3` struct through different type aliases altogether:
```text
struct Vector3 {
    Vector3() : x(0.0f), y(0.0f), z(0.0f) { }
    Vector3(float x, float y, float z) : x(x), y(y), z(z) { }
    ~Vector3() { }
    
    union {
        // For access as coordinates
        struct {
            float x;
            float y;
            float z;
        };
        
        // For access as color components
        struct {
            float r;
            float g;
            float b;
        };
    };
};

// Type aliases
typedef Vector3 Color;
using Position = Vector3;
```

Although `typedef` and `using` are represented by different AST nodes, both are annotated in the same way.
For this reason, only the implementation of `VisitTypedefDecl` is shown below:
```cpp title:{visitor.cpp} line-numbers:{enabled}
[[keyword,bool]] [[class-name,Visitor]]::[[function,VisitTypedefDecl]]([[namespace-name,clang]]::[[class-name,TypedefDecl]]* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...

    [[keyword,const]] [[namespace-name,std]]::[[class-name,string]]& name = node->[[function,getNameAsString]]();
    
    [[keyword,const]] [[namespace-name,clang]]::[[class-name,SourceLocation]]& location = node->[[function,getLocation]]();
    [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
    [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);

    [[member-variable,m_annotator]]->[[function,insert_annotation]]("class-name", line, column, name.[[function,length]]());
    [[keyword,return]] [[keyword,true]];
}
```
Type aliases are annotated with the `class-name` tag.
The implementation of `VisitTypeAliasDecl` is identical and omitted for brevity, but can be found [here](https://github.com/sevanetrebchenko/syntax-highlighter/blob/master/src/visitor.cpp).

With both visitors implemented, `typedef` and `using` declarations are properly annotated:
```text added:{24,25}
struct Vector3 {
    Vector3() : x(0.0f), y(0.0f), z(0.0f) { }
    Vector3(float x, float y, float z) : x(x), y(y), z(z) { }
    ~Vector3() { }
    
    union {
        // For access as coordinates
        struct {
            float x;
            float y;
            float z;
        };
        
        // For access as color components
        struct {
            float r;
            float g;
            float b;
        };
    };
};

// Type aliases
typedef Vector3 [[class-name,Color]];
using [[class-name,Position]] = Vector3;
```

---

We've added support for annotating class declarations, static and class member variable declarations and references, constructor initializer lists, and type aliases.
In the <LocalLink text={"next post"} to={"Better C++ Syntax Highlighting - Part 6: Templates"}></LocalLink>, we'll take a closer look at annotating classes, functions, and parameters in template contexts.
We will also revisit some of our existing visitors and add support for C++20 concepts.

Thanks for reading!
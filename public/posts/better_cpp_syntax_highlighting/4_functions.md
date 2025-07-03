
Functions are next on our list.
Their declarations, definitions, and calls appear throughout C++ code, and Clang provides a rich set of node types for processing them.

Consider the following example:
```cpp
#include <cstring> // std::strcmp
#include <string> // std::string, std::string_literals
#include <chrono> // std::chrono::duration, std::chrono_literals

template <typename T>
bool equal(T a, T b) {
    return a == b;
}

// Template specialization
template <>
bool equal(const char* a, const char* b) {
    if (!a || !b) {
        return false;
    }
    
    return std::strcmp(a, b) == 0;
}

namespace math {

    struct Point {
        static float distance(const Point& a, const Point& b);
        
        float x;
        float y;
    };
    
    // Operator overload
    bool operator==(const Point& a, const Point& b);
    
}

int main() {
    math::Point p1(1.2f, 3.4f);
    math::Point p2(5.6f, 7.8f);
    
    if (p1 != p2 && math::Point::distance(p1, p2) < 5.0f) {
        // ...
    }
    
    int value = 42;
    int* ptr = &value;

    (*ptr)++;
    *ptr += -4 * (1 + 3) / (9 - 5) % 2;
    
    bool eq = equal("apple", "banana");
    
    // Literal operators
    using namespace std::string_literals;
    std::string str = "Hello, world!"s;
    
    using namespace std::chrono_literals;
    std::chrono::duration timeout = 200ms;
    
    // ...
}
```
And corresponding AST:
```text show-lines:{20} line-numbers:{enabled}
|-FunctionTemplateDecl 0x16 1eb8f3ed8 <example.cpp:5:1, line:8:1> line:6:6 equal
| |-TemplateTypeParmDecl 0x161eb8f3be0 <line:5:11, col:20> col:20 referenced typename depth 0 index 0 T
| |-FunctionDecl 0x161eb8f3e28 <line:6:1, line:8:1> line:6:6 equal 'bool (T, T)'
| | |-ParmVarDecl 0x161eb8f3c98 <col:12, col:14> col:14 referenced a 'T'
| | |-ParmVarDecl 0x161eb8f3d18 <col:17, col:19> col:19 referenced b 'T'
| | `-CompoundStmt 0x161eb8f4030 <col:22, line:8:1>
| |   `-ReturnStmt 0x161eb8f4020 <line:7:5, col:17>
| |     `-BinaryOperator 0x161eb8f4000 <col:12, col:17> '<dependent type>' '=='
| |       |-DeclRefExpr 0x161eb8f3fc0 <col:12> 'T' lvalue ParmVar 0x161eb8f3c98 'a' 'T'
| |       `-DeclRefExpr 0x161eb8f3fe0 <col:17> 'T' lvalue ParmVar 0x161eb8f3d18 'b' 'T'
| `-Function 0x161eb8f4218 'equal' 'bool (const char *, const char *)'
|-FunctionDecl 0x161eb8f4218 prev 0x161eb8f4508 <line:11:1, line:18:1> line:12:6 used equal 'bool (const char *, const char *)' explicit_specialization
| |-TemplateArgument type 'const char *'
| | `-PointerType 0x161e66277e0 'const char *'
| |   `-QualType 0x161e6626c21 'const char' const
| |     `-BuiltinType 0x161e6626c20 'char'
| |-ParmVarDecl 0x161eb8f4080 <col:12, col:24> col:24 used a 'const char *'
| |-ParmVarDecl 0x161eb8f4108 <col:27, col:39> col:39 used b 'const char *'
| `-CompoundStmt 0x161eb8f4988 <col:42, line:18:1>
|   |-IfStmt 0x161eb8f47a0 <line:13:5, line:15:5>
|   | |-BinaryOperator 0x161eb8f4748 <line:13:9, col:16> 'bool' '||'
|   | | |-UnaryOperator 0x161eb8f46c8 <col:9, col:10> 'bool' prefix '!' cannot overflow
|   | | | `-ImplicitCastExpr 0x161eb8f46b0 <col:10> 'bool' <PointerToBoolean>
|   | | |   `-ImplicitCastExpr 0x161eb8f4698 <col:10> 'const char *' <LValueToRValue>
|   | | |     `-DeclRefExpr 0x161eb8f4678 <col:10> 'const char *' lvalue ParmVar 0x161eb8f4080 'a' 'const char *'
|   | | `-UnaryOperator 0x161eb8f4730 <col:15, col:16> 'bool' prefix '!' cannot overflow
|   | |   `-ImplicitCastExpr 0x161eb8f4718 <col:16> 'bool' <PointerToBoolean>
|   | |     `-ImplicitCastExpr 0x161eb8f4700 <col:16> 'const char *' <LValueToRValue>
|   | |       `-DeclRefExpr 0x161eb8f46e0 <col:16> 'const char *' lvalue ParmVar 0x161eb8f4108 'b' 'const char *'
|   | `-CompoundStmt 0x161eb8f4788 <col:19, line:15:5>
|   |   `-ReturnStmt 0x161eb8f4778 <line:14:9, col:16>
|   |     `-CXXBoolLiteralExpr 0x161eb8f4768 <col:16> 'bool' false
|   `-ReturnStmt 0x161eb8f4978 <line:17:5, col:33>
|     `-BinaryOperator 0x161eb8f4958 <col:12, col:33> 'bool' '=='
|       |-CallExpr 0x161eb8f48d8 <col:12, col:28> 'int'
|       | |-ImplicitCastExpr 0x161eb8f48c0 <col:12, col:17> 'int (*)(const char *, const char *) __attribute__((cdecl))' <FunctionToPointerDecay>
|       | | `-DeclRefExpr 0x161eb8f47e0 <col:12, col:17> 'int (const char *, const char *) __attribute__((cdecl))':'int (const char *, const char *)' lvalue Function 0x161e7eb7858 'strcmp' 'int (const char *, const char *) __attribute__((cdecl))':'int (const char *, const char *)' (UsingShadow 0x161e7f02f10 'strcmp')
|       | |   `-NestedNameSpecifier Namespace 0x161eb61b1d8 'std'
|       | |-ImplicitCastExpr 0x161eb8f4908 <col:24> 'const char *' <LValueToRValue>
|       | | `-DeclRefExpr 0x161eb8f4818 <col:24> 'const char *' lvalue ParmVar 0x161eb8f4080 'a' 'const char *'
|       | `-ImplicitCastExpr 0x161eb8f4920 <col:27> 'const char *' <LValueToRValue>
|       |   `-DeclRefExpr 0x161eb8f4838 <col:27> 'const char *' lvalue ParmVar 0x161eb8f4108 'b' 'const char *'
|       `-IntegerLiteral 0x161eb8f4938 <col:33> 'int' 0
|-NamespaceDecl 0x161eb8f49b0 <line:20:1, line:33:1> line:20:11 math
| |-CXXRecordDecl 0x161eb8f4a40 <line:22:5, line:27:5> line:22:12 referenced struct Point definition
| | |-DefinitionData pass_in_registers aggregate standard_layout trivially_copyable pod trivial literal has_constexpr_non_copy_move_ctor
| | | |-DefaultConstructor exists trivial constexpr defaulted_is_constexpr
| | | |-CopyConstructor simple trivial has_const_param implicit_has_const_param
| | | |-MoveConstructor exists simple trivial
| | | |-CopyAssignment simple trivial has_const_param needs_implicit implicit_has_const_param
| | | |-MoveAssignment exists simple trivial needs_implicit
| | | `-Destructor simple irrelevant trivial constexpr needs_implicit
| | |-CXXRecordDecl 0x161eb8f4b80 <col:5, col:12> col:12 implicit referenced struct Point
| | |-CXXMethodDecl 0x161eb8f4ef0 <line:23:9, col:61> col:22 used distance 'float (const Point &, const Point &)' static
| | | |-ParmVarDecl 0x161eb8f4ce0 <col:31, col:44> col:44 a 'const Point &'
| | | `-ParmVarDecl 0x161eb8f4d68 <col:47, col:60> col:60 b 'const Point &'
| | |-FieldDecl 0x161eb8f4fe0 <line:25:9, col:15> col:15 x 'float'
| | |-FieldDecl 0x161eb8f5050 <line:26:9, col:15> col:15 y 'float'
| | |-CXXConstructorDecl 0x161eb8f5850 <line:22:12> col:12 implicit constexpr Point 'void ()' inline default trivial noexcept-unevaluated 0x161eb8f5850
| | |-CXXConstructorDecl 0x161eb8f5940 <col:12> col:12 implicit constexpr Point 'void (const Point &)' inline default trivial noexcept-unevaluated 0x161eb8f5940
| | | `-ParmVarDecl 0x161eb8f5a78 <col:12> col:12 'const Point &'
| | `-CXXConstructorDecl 0x161eb8f5b68 <col:12> col:12 implicit constexpr Point 'void (Point &&)' inline default trivial noexcept-unevaluated 0x161eb8f5b68
| |   `-ParmVarDecl 0x161eb8f5ca8 <col:12> col:12 'Point &&'
| |-FunctionDecl 0x161eb8f52b8 <line:30:5, col:51> col:10 operator== 'bool (const Point &, const Point &)'
| | |-ParmVarDecl 0x161eb8f50d8 <col:21, col:34> col:34 a 'const Point &'
| | `-ParmVarDecl 0x161eb8f5160 <col:37, col:50> col:50 b 'const Point &'
| `-FunctionDecl 0x161eb8f5500 <line:31:5, col:51> col:10 used operator!= 'bool (const Point &, const Point &)'
|   |-ParmVarDecl 0x161eb8f53a8 <col:21, col:34> col:34 a 'const Point &'
|   `-ParmVarDecl 0x161eb8f5430 <col:37, col:50> col:50 b 'const Point &'
`-FunctionDecl 0x161eb8f5600 <line:35:1, line:59:1> line:35:5 main 'int ()'
  `-CompoundStmt 0x161eb9020c0 <col:12, line:59:1>
    |-DeclStmt 0x161eb8f5d80 <line:36:5, col:31>
    | `-VarDecl 0x161eb8f5760 <col:5, col:30> col:17 used p1 'math::Point' parenlistinit
    |   `-CXXParenListInitExpr 0x161eb8f5d28 <col:19, col:30> 'math::Point'
    |     |-FloatingLiteral 0x161eb8f57c8 <col:20> 'float' 1.200000e+00
    |     `-FloatingLiteral 0x161eb8f57e8 <col:26> 'float' 3.400000e+00
    |-DeclStmt 0x161eb8f5f10 <line:37:5, col:31>
    | `-VarDecl 0x161eb8f5de8 <col:5, col:30> col:17 used p2 'math::Point' parenlistinit
    |   `-CXXParenListInitExpr 0x161eb8f5eb8 <col:19, col:30> 'math::Point'
    |     |-FloatingLiteral 0x161eb8f5e50 <col:20> 'float' 5.600000e+00
    |     `-FloatingLiteral 0x161eb8f5e70 <col:26> 'float' 7.800000e+00
    |-IfStmt 0x161eb8f6358 <line:39:5, line:41:5>
    | |-BinaryOperator 0x161eb8f6328 <line:39:9, col:53> 'bool' '&&'
    | | |-CXXOperatorCallExpr 0x161eb8f6038 <col:9, col:15> 'bool' '!=' adl
    | | | |-ImplicitCastExpr 0x161eb8f6020 <col:12> 'bool (*)(const Point &, const Point &)' <FunctionToPointerDecay>
    | | | | `-DeclRefExpr 0x161eb8f5f98 <col:12> 'bool (const Point &, const Point &)' lvalue Function 0x161eb8f5500 'operator!=' 'bool (const Point &, const Point &)'
    | | | |-ImplicitCastExpr 0x161eb8f5f68 <col:9> 'const Point':'const math::Point' lvalue <NoOp>
    | | | | `-DeclRefExpr 0x161eb8f5f28 <col:9> 'math::Point' lvalue Var 0x161eb8f5760 'p1' 'math::Point'
    | | | `-ImplicitCastExpr 0x161eb8f5f80 <col:15> 'const Point':'const math::Point' lvalue <NoOp>
    | | |   `-DeclRefExpr 0x161eb8f5f48 <col:15> 'math::Point' lvalue Var 0x161eb8f5de8 'p2' 'math::Point'
    | | `-BinaryOperator 0x161eb8f6308 <col:21, col:53> 'bool' '<'
    | |   |-CallExpr 0x161eb8f6288 <col:21, col:49> 'float'
    | |   | |-ImplicitCastExpr 0x161eb8f6270 <col:21, col:34> 'float (*)(const Point &, const Point &)' <FunctionToPointerDecay>
    | |   | | `-DeclRefExpr 0x161eb8f61a0 <col:21, col:34> 'float (const Point &, const Point &)' lvalue CXXMethod 0x161eb8f4ef0 'distance' 'float (const Point &, const Point &)'
    | |   | |   `-NestedNameSpecifier TypeSpec 'math::Point'
    | |   | |     `-NestedNameSpecifier Namespace 0x161eb8f49b0 'math'
    | |   | |-ImplicitCastExpr 0x161eb8f62b8 <col:43> 'const Point':'const math::Point' lvalue <NoOp>
    | |   | | `-DeclRefExpr 0x161eb8f61d0 <col:43> 'math::Point' lvalue Var 0x161eb8f5760 'p1' 'math::Point'
    | |   | `-ImplicitCastExpr 0x161eb8f62d0 <col:47> 'const Point':'const math::Point' lvalue <NoOp>
    | |   |   `-DeclRefExpr 0x161eb8f61f0 <col:47> 'math::Point' lvalue Var 0x161eb8f5de8 'p2' 'math::Point'
    | |   `-FloatingLiteral 0x161eb8f62e8 <col:53> 'float' 5.000000e+00
    | `-CompoundStmt 0x161eb8f6348 <col:59, line:41:5>
    |-DeclStmt 0x161eb8f6438 <line:43:5, col:19>
    | `-VarDecl 0x161eb8f6398 <col:5, col:17> col:9 used value 'int' cinit
    |   `-IntegerLiteral 0x161eb8f6400 <col:17> 'int' 42
    |-DeclStmt 0x161eb8f6528 <line:44:5, col:22>
    | `-VarDecl 0x161eb8f6470 <col:5, col:17> col:10 used ptr 'int *' cinit
    |   `-UnaryOperator 0x161eb8f64f8 <col:16, col:17> 'int *' prefix '&' cannot overflow
    |     `-DeclRefExpr 0x161eb8f64d8 <col:17> 'int' lvalue Var 0x161eb8f6398 'value' 'int'
    |-UnaryOperator 0x161eb8f65b0 <line:46:5, col:11> 'int' postfix '++'
    | `-ParenExpr 0x161eb8f6590 <col:5, col:10> 'int' lvalue
    |   `-UnaryOperator 0x161eb8f6578 <col:6, col:7> 'int' lvalue prefix '*' cannot overflow
    |     `-ImplicitCastExpr 0x161eb8f6560 <col:7> 'int *' <LValueToRValue>
    |       `-DeclRefExpr 0x161eb8f6540 <col:7> 'int *' lvalue Var 0x161eb8f6470 'ptr' 'int *'
    |-CompoundAssignOperator 0x161eb8f67d0 <line:47:5, col:38> 'int' lvalue '+=' ComputeLHSTy='int' ComputeResultTy='int'
    | |-UnaryOperator 0x161eb8f6600 <col:5, col:6> 'int' lvalue prefix '*' cannot overflow
    | | `-ImplicitCastExpr 0x161eb8f65e8 <col:6> 'int *' <LValueToRValue>
    | |   `-DeclRefExpr 0x161eb8f65c8 <col:6> 'int *' lvalue Var 0x161eb8f6470 'ptr' 'int *'
    | `-BinaryOperator 0x161eb8f67b0 <col:13, col:38> 'int' '%'
    |   |-BinaryOperator 0x161eb8f6770 <col:13, col:34> 'int' '/'
    |   | |-BinaryOperator 0x161eb8f66d0 <col:13, col:24> 'int' '*'
    |   | | |-UnaryOperator 0x161eb8f6638 <col:13, col:14> 'int' prefix '-'
    |   | | | `-IntegerLiteral 0x161eb8f6618 <col:14> 'int' 4
    |   | | `-ParenExpr 0x161eb8f66b0 <col:18, col:24> 'int'
    |   | |   `-BinaryOperator 0x161eb8f6690 <col:19, col:23> 'int' '+'
    |   | |     |-IntegerLiteral 0x161eb8f6650 <col:19> 'int' 1
    |   | |     `-IntegerLiteral 0x161eb8f6670 <col:23> 'int' 3
    |   | `-ParenExpr 0x161eb8f6750 <col:28, col:34> 'int'
    |   |   `-BinaryOperator 0x161eb8f6730 <col:29, col:33> 'int' '-'
    |   |     |-IntegerLiteral 0x161eb8f66f0 <col:29> 'int' 9
    |   |     `-IntegerLiteral 0x161eb8f6710 <col:33> 'int' 5
    |   `-IntegerLiteral 0x161eb8f6790 <col:38> 'int' 2
    |-DeclStmt 0x161eb8f6a50 <line:49:5, col:39>
    | `-VarDecl 0x161eb8f6818 <col:5, col:38> col:10 eq 'bool' cinit
    |   `-CallExpr 0x161eb8f69d8 <col:15, col:38> 'bool'
    |     |-ImplicitCastExpr 0x161eb8f69c0 <col:15> 'bool (*)(const char *, const char *)' <FunctionToPointerDecay>
    |     | `-DeclRefExpr 0x161eb8f6960 <col:15> 'bool (const char *, const char *)' lvalue Function 0x161eb8f4218 'equal' 'bool (const char *, const char *)' (FunctionTemplate 0x161eb8f3ed8 'equal')
    |     |-ImplicitCastExpr 0x161eb8f6a08 <col:21> 'const char *' <ArrayToPointerDecay>
    |     | `-StringLiteral 0x161eb8f68c8 <col:21> 'const char[6]' lvalue "apple"
    |     `-ImplicitCastExpr 0x161eb8f6a20 <col:30> 'const char *' <ArrayToPointerDecay>
    |       `-StringLiteral 0x161eb8f68e8 <col:30> 'const char[7]' lvalue "banana"
    |-DeclStmt 0x161eb8f6ad0 <line:52:5, col:41>
    | `-UsingDirectiveDecl 0x161eb8f6a78 <col:5, col:26> col:26 Namespace 0x161e90c30c0 'string_literals'
    |-DeclStmt 0x161eb8f6de0 <line:53:5, col:39>
    | `-VarDecl 0x161eb8f6b70 <col:5, col:23> col:17 str 'std::string':'std::basic_string<char>' cinit destroyed
    |   `-ExprWithCleanups 0x161eb8f6d30 <col:23> 'basic_string<char>':'std::basic_string<char>'
    |     `-CXXBindTemporaryExpr 0x161eb8f6d10 <col:23> 'basic_string<char>':'std::basic_string<char>' (CXXTemporary 0x161eb8f6d10)
    |       `-UserDefinedLiteral 0x161eb8f6cd0 <col:23> 'basic_string<char>':'std::basic_string<char>'
    |         |-ImplicitCastExpr 0x161eb8f6ca0 <col:38> 'basic_string<char> (*)(const char *, size_t)' <FunctionToPointerDecay>
    |         | `-DeclRefExpr 0x161eb8f6c20 <col:38> 'basic_string<char> (const char *, size_t)' lvalue Function 0x161e90c35a8 'operator""s' 'basic_string<char> (const char *, size_t)'
    |         |-ImplicitCastExpr 0x161eb8f6cb8 <col:23> 'const char *' <ArrayToPointerDecay>
    |         | `-StringLiteral 0x161eb8f6bd8 <col:23> 'const char[14]' lvalue "Hello, world!"
    |         `-IntegerLiteral 0x161eb8f6c00 <col:23> 'unsigned long long' 13
    |-DeclStmt 0x161eb8f6e60 <line:55:5, col:41>
    | `-UsingDirectiveDecl 0x161eb8f6e08 <col:5, col:26> col:26 Namespace 0x161e95d9f98 'chrono_literals'
    `-DeclStmt 0x161eb9020a8 <line:56:5, col:42>
      `-VarDecl 0x161eb8f6f98 <col:5, col:37> col:27 timeout 'std::chrono::duration<long long, ratio<1, 1000>>':'std::chrono::duration<long long, std::ratio<1, 1000>>' cinit
        `-UserDefinedLiteral 0x161eb8fdab8 <col:37> 'chrono::milliseconds':'std::chrono::duration<long long, std::ratio<1, 1000>>'
          `-ImplicitCastExpr 0x161eb8fdaa0 <col:40> 'chrono::milliseconds (*)()' <FunctionToPointerDecay>
            `-DeclRefExpr 0x161eb8f7438 <col:40> 'chrono::milliseconds ()' lvalue Function 0x161eb8f7340 'operator""ms' 'chrono::milliseconds ()'
```

The process of annotating functions and operators is a lot more involved than previous node types we've seen, so let's establish some success criteria before getting started:
1. Function names (regular and template) should be annotated with `function` - this includes the `equal` template function declarations on line 6 and 12, its use on line 49, the `distance` static class member function on line 23 and use on line 39, and the `main` function definition on line 26.
2. Unary operators (lines 13, 43, and 46) should be annotated with `unary-operator`.
3. Binary operators (lines 7, 17, and 38) should be annotated with `binary-operator`.
4. Compound assignment operators like `+=` on line 38 should also use `binary-operator`.
5.  Overloaded operator declarations and definitions, such as `operator==` on lines 30-31 and its use on line 39, should be annotated with `function-operator`.
6. [User-defined literal operators](https://en.cppreference.com/w/cpp/language/user_literal) like the `s` operator on line 53 and `ms` operator on line 56 should match their underlying parameter type.
7. Variable declarations using functional-style initialization (`p1` and `p2` on lines 36 and 37) should remain as plain tokens.

To annotate functions and operators, we'll define visitor functions for eight new node types:
- [`FunctionDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1FunctionDecl.html), for regular function declarations and definitions,
- [`FunctionTemplateDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1FunctionTemplateDecl.html), for template function declarations and definitions,
- [`UnaryOperator` nodes](https://clang.llvm.org/doxygen/classclang_1_1UnaryOperator.html), for unary operators,
- [`BinaryOperator` nodes](https://clang.llvm.org/doxygen/classclang_1_1BinaryOperator.html), for binary operators,
- [`CallExpr` nodes](https://clang.llvm.org/doxygen/classclang_1_1CallExpr.html), for function calls,
- [`CXXOperatorCallExpr` nodes](https://clang.llvm.org/doxygen/classclang_1_1CXXOperatorCallExpr.html), for overloaded operator calls,
- [`CompoundAssignOperator` nodes](https://clang.llvm.org/doxygen/classclang_1_1CompoundAssignOperator.html), for compound assignment operators, and
- [`UserDefinedLiteral` nodes](https://clang.llvm.org/doxygen/classclang_1_1UserDefinedLiteral.html), for user-defined [literal operators](https://en.cppreference.com/w/cpp/language/user_literal).

```cpp
bool VisitFunctionDecl(clang::FunctionDecl* node);
bool VisitFunctionTemplateDecl(clang::FunctionTemplateDecl* node);
bool VisitUnaryOperator(clang::UnaryOperator* node);
bool VisitBinaryOperator(clang::BinaryOperator* node);
bool VisitCallExpr(clang::CallExpr* node);
bool VisitCXXOperatorCallExpr(clang::CXXOperatorCallExpr* node);
bool VisitCompoundAssignOperator(clang::CompoundAssignOperator* node);
bool VisitUserDefinedLiteral(clang::UserDefinedLiteral* node);
};
```

## Function declarations

`FunctionDecl` nodes represent standard function declarations and definitions.
We'll annotate these with a `function` tag, with special handling for overloaded operators.

We start with the standard checks to ensure we're processing nodes from the main file:
```cpp
bool Visitor::VisitFunctionDecl(clang::FunctionDecl* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    // Skip implicit declarations, such as those for static class functions
    if (node->isImplicit()) {
        return true;
    }
```
The implicit declaration check prevents annotating compiler-generated placeholder declarations.
Without this check, annotations for static member functions appear in the wrong location.

For overloaded operators, we need special handling to annotate only the operator symbol, since `operator` should be highlighted as a language keyword:
```cpp
std::string name = node->getNameAsString();
unsigned line = source_manager.getSpellingLineNumber(location);
unsigned column = source_manager.getSpellingColumnNumber(location);

if (node->isOverloadedOperator()) {
    name = name.substr(8); // Skip 'operator' keyword
    m_annotator->insert_annotation("function-operator", line, column + 8, name.length());
}
else {
    m_annotator->insert_annotation("function", line, column, name.length());
}
```
We use `isOverloadedOperator()` to detect operator functions and skip the first 8 characters (`operator`) when inserting the annotation.
We will revisit highlighting keywords in a later post in this series.

Note that `CXXMethodDecl` nodes (class member functions) also get annotated by this visitor, since they derive from `FunctionDecl`.
This includes static class functions, constructors, and destructors.
Similarly, template function declarations are also visited because each `FunctionTemplateDecl` contains a child `FunctionDecl` node representing the actual function.

With this visitor implemented, we can now properly annotate function declarations and definitions:
```text added:{6,12,23,30,31,35}
template <typename T>
bool [[function,equal]](T a, T b) {
    // ...
}

// Template specialization
template <>
bool [[function,equal]](const char* a, const char* b) {
    // ...
}

namespace math {

    struct Point {
        static float [[function,distance]](const Point& a, const Point& b);
        
        float x;
        float y;
    };
    
    // Operator overloads
    bool operator[[function-operator,==]](const Point& a, const Point& b);
    bool operator[[function-operator,!=]](const Point& a, const Point& b);
    
}

int [[function,main]]() {
    // ...
}
```

### Function calls

`CallExpr` nodes represent function calls.
As before, we'll annotate the function name of each call with the `function` tag.

We can retrieve the function name from the underlying declaration:
```cpp
const clang::FunctionDecl* function = clang::dyn_cast<clang::FunctionDecl>(node->getCalleeDecl());
std::string name = function->getNameAsString();
```
We get the function declaration through `getCalleeDecl()` and extract its name using `getNameAsString()`.
Unlike other AST nodes, `CallExpr` does not provide direct access to the function name's location in the source.
The `getBeginLoc()` function returns the location of the fully-qualified function call, including any namespace and/or class qualifiers.
```cpp
// This approach won't work for qualified calls like math::Point::distance()
clang::SourceLocation location = node->getBeginLoc(); // Points to 'math', not 'distance'
```
Instead, we tokenize the function call's source range and annotate only the token matching the function's name:
```cpp
for (const Token& token : m_tokenizer->get_tokens(node->getSourceRange())) {
    if (token.spelling == name) {
        m_annotator->insert_annotation("function", token.line, token.column, name.length());
        break;
    }
}
```
This approach elegantly handles arbitrarily qualified function calls.
```text added:{17,39,49}
// Template specialization
template <>
bool equal(const char* a, const char* b) {
    if (!a || !b) {
        return false;
    }
    
    return std::[[function,strcmp]](a, b) == 0;
}

int main() {
    if (p1 != p2 && math::Point::[[function,distance]](p1, p2) < 5.0f) {
        // ...
    }
    
    // ...
    
    bool eq = [[function,equal]]("apple", "banana");
    
    // ...
}
```

### Built-in operators

Unary, binary, and compound assignment operators are captured under `UnaryOperator`, `BinaryOperator`, and `CompoundAssignOperator` nodes respectively.
All three follow the same implementation pattern, so we'll focus on unary operators as an example.
```cpp
bool Visitor::VisitUnaryOperator(clang::UnaryOperator* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    const std::string& name = clang::UnaryOperator::getOpcodeStr(node->getOpcode()).str();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("unary-operator", line, column, name.length());
    return true;
}
```
Unlike other nodes, operator nodes provide direct access to the operator's location through `getOperatorLoc()`.
We retrieve the operator symbol using the static `getOpcodeStr()` function.
The implementations of `VisitBinaryOperator` and `VisitCompoundAssignOperator` follow the same pattern, using their respective `getOpcodeStr()` functions.
Unary operators are annotated with `unary-operator`, while binary and compound assignment operators with `binary-operator`.

Another type of built-in operator is the array subscript operator, represented by the `ArraySubscriptExpr` AST node.
Handling this requires setting up a dedicated visitor, as these nodes are not visited by other operator visitors.
```cpp
bool Visitor::VisitArraySubscriptExpr(clang::ArraySubscriptExpr* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    for (const Token& token : m_tokenizer->get_tokens(node->getSourceRange())) {
        if (token.spelling == "[" || token.spelling == "]") {
            m_annotator->insert_annotation("operator", token.line, token.column, 1);
        }
    }
    
    return true;
}
```
Unlike most other operators, Clang does not provide a direct way of retrieving the locations of both the opening and closing brackets.
Functions like `getExprLoc()` only return the location of the expression the operator is applied to, and not the operator symbols themselves.
To work around this, we simply tokenize the source range of the node and manually annotate both the `[` and `]` tokens as operators.

### Overloaded operators

`CXXOperatorCallExpr` nodes represent calls to overloaded operators.
The implementation largely follows the same structure as built-in operators:
Overloaded operators are captured under `CXXOperatorCallExpr` nodes:
```cpp
bool Visitor::VisitCXXOperatorCallExpr(clang::CXXOperatorCallExpr* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    const std::string& op = clang::getOperatorSpelling(node->getOperator());
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    if (op == "[]") {
        // Special handling for array subscript operator
        for (const Token& token : m_tokenizer->get_tokens(node->getSourceRange())) {
            if (token.spelling == "[" || token.spelling == "]") {
                m_annotator->insert_annotation("function-operator", token.line, token.column, 1);
            }
        }
    }
    else {
        m_annotator->insert_annotation("function-operator", line, column, op.length());
    }
    
    return true;
}
```
We use `getOperatorSpelling()` to retrieve the operator symbol and annotate it with `function-operator` to match our handling of overloaded operator declarations from earlier.

Overloaded array subscript operators are handled separately from other overloaded operators, as these require two annotations instead of one.
Similar to what we did when annotating `ArraySubscriptExpr` nodes in the previous section, we tokenize the source range of the function call and manually annotate both the `[` and `]` tokens with the `function-operator` tag.

Note that overloaded operators in template contexts (particularly with fold expressions) can introduce challenges for annotation due to ambiguity around operator resolution.
One possible solution is to iterate through the tokens of a template function definition and annotate those that match operator spellings.
However, this is difficult to automate, as C++ provides a lot of flexibility when it comes to defining custom operator types.
Because of this, I decided to leave the annotation process for these to be manual.
I prefer this approach, as I don't use many fold expression in my code.

```text
template <typename T>
bool equal(T a, T b) {
    return a [[binary-operator,==]] b;
}

// Template specialization
template <>
bool equal(const char* a, const char* b) {
    if ([[unary-operator,!]]a [[binary-operator,||]] [[unary-operator,!]]b) {
        return false;
    }
    
    return std::strcmp(a, b) [[binary-operator,==]] 0;
}

int main() {
    // ...
    
    if (p1 [[function-operator,!=]] p2 [[binary-operator,&&]] math::Point::function,distance(p1, p2) [[binary-operator,<]] 5.0f) {
        // ...
    }
    
    int value = 42;
    int* ptr = [[unary-operator,&]]value;

    ([[unary-operator,*]]ptr)[[unary-operator,++]];
    [[unary-operator,*]]ptr [[binary-operator,+=]] [[unary-operator,-]]4 [[binary-operator,*]] (1 [[binary-operator,+]] 3) [[binary-operator,/]] (9 [[binary-operator,-]] 5) [[binary-operator,%]] 2;
    
    // ...
}
```

### User-defined literal operators

`UserDefinedLiteral` nodes represent user-defined literal operators.
We'll annotate these to match the type of literal they're applied to.

Unlike built-in operators, we need to retrieve the operator name from the function declaration:
```cpp
const clang::FunctionDecl* function = clang::dyn_cast<clang::FunctionDecl>(node->getCalleeDecl());
std::string name = function->getNameAsString();
name = name.substr(10); // Skip 'operator""' prefix
```
We get the function declaration through `getCalleeDecl()` and strip the `operator""` prefix to get the actual suffix used in the code.
For the annotation type, the annotation of the operator should match the underlying literal type.
Rather than relying on `getLiteralOperatorKind()` (which can be misleading for template-based operators), we parse the token directly:
```cpp
for (const Token& token : m_tokenizer->get_tokens(node->getSourceRange())) {
    std::size_t position = token.spelling.find(name);
    if (position != std::string::npos) {
        bool is_string_type = token.spelling.find('\'') != std::string::npos || token.spelling.find('"') != std::string::npos;
        const char* annotation = is_string_type ? "string" : "number";
        
        m_annotator->insert_annotation(annotation, token.line, token.column + position, name.length());
    }
}
```
We can do this because literal operators can only be applied to integer, floating-point, character, and string literals.
If the token containing our operator suffix contains quotations marks, the operator is annotated as a `string` - otherwise, we know the operator is a `number`.

An alternative approach uses the `getLiteralOperatorKind()` function, which returns a category corresponding to the function signature of the operator according to the [specification](https://en.cppreference.com/w/cpp/language/user_literal.html):
```cpp
unsigned line = source_manager.getSpellingLineNumber(location);
unsigned column = source_manager.getSpellingColumnNumber(location);

std::string annotation;
switch (node->getLiteralOperatorKind()) {
    case clang::UserDefinedLiteral::LOK_Raw:  // C-style string
    case clang::UserDefinedLiteral::LOK_Template:  // Template parameter pack of characters (numeric literal operator template)
    case clang::UserDefinedLiteral::LOK_String:  // C-style string and length
    case clang::UserDefinedLiteral::LOK_Character:
        annotation = "string";
        break;
        
    case clang::UserDefinedLiteral::LOK_Integer:
    case clang::UserDefinedLiteral::LOK_Floating:
        annotation = "number";
        break;
}

m_annotator->insert_annotation(annotation, line, column, name.length());
```
However, this approach has some unexpected drawbacks.
For example, the C++ `std::chrono` library does not provide an overload to resolve `200ms` into a function that accepts an integer.
Instead, the following overload is called (accepting a variadic list of characters as the digits of the number):
```cpp title:{chrono.h}
// Literal suffix for durations of type `std::chrono::milliseconds`
template <char... _Digits>
constexpr chrono::milliseconds
operator""ms() {
    // ...
}
```
Why is this implemented in such a way? Well, I'm not sure.
Using this approach categorizes `200ms` as a string of characters, incorrectly marking the `ms` as a `string` instead of a `number`.

```text added:{53,56}
int main() {
    // ...
        
    // Literal operators
    using namespace std::string_literals;
    std::string str = "Hello, world!"[[string,s]];
    
    using namespace std::chrono_literals;
    std::chrono::duration timeout = 200[[number,ms]];
    
    // ...
}
```

### Functional-style variable declarations

In most other syntax highlighters, variable declarations using functional-style initialization are incorrectly highlighted as function calls.
This likely occurs because functions are identified based on the presence of parentheses.

We can fix this by implementing a `VarDecl` visitor, which represents variable declarations and definitions.
```cpp title:{visitor.cpp} added:{24-27}
bool Visitor::VisitVarDecl(clang::VarDecl* node) {
    // Check to ensure this node originates from the file we are annotating
    // ...
    
    const std::string& name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    if (node->isDirectInit()) {
        // Direct (functional) initialization should not be annotated as a function call
        m_annotator->insert_annotation("plain", line, column, name.length());
    }

    return true;
}
```
The key is the `isDirectInit()` check, which helps identify variables using functional-style initialization. 
We annotate these as `plain` tokens to prevent them from being highlighted as function calls.

With this visitor implemented, functional-style variable declarations are properly handled:
```text
int main() {
    math::Point [[plain,p1]](1.2f, 3.4f);
    math::Point [[plain,p2]](5.6f, 7.8f);
    
    // ...
}
```

## Styling
The final step is to add definitions for the various CSS styles for the different kinds of function annotations:
The `plain` CSS style is language-agnostic, and provides the default style to use for tokens in code blocks.
```css
.language-cpp .function {
    color: rgb(255, 198, 109);
}
.language-cpp .unary-operator,
.language-cpp .binary-operator,
.language-cpp .function-operator {
    color: rgb(95, 140, 138);
}
.language-cpp .char,
.language-cpp .string {
    color: rgb(106, 171, 115);
}
.language-cpp .number {
    color: rgb(42, 172, 184);
}
```

```cpp
#include <cstring> // std::strcmp
#include <string> // std::string, std::string_literals
#include <chrono> // std::chrono::duration, std::chrono_literals

template <typename T>
bool [[function,equal]](T a, T b) {
    return a [[binary-operator,==]] b;
}

// Template specialization
template <>
bool [[function,equal]](const char* a, const char* b) {
    if ([[unary-operator,!]]a [[binary-operator,||]] [[unary-operator,!]]b) {
        return false;
    }
    
    return std::[[function,strcmp]](a, b) [[binary-operator,==]] 0;
}

namespace math {

    struct Point {
        static float [[function,distance]](const Point& a, const Point& b);
        
        float x;
        float y;
    };
    
    // Operator overloads
    bool operator[[function-operator,==]](const Point& a, const Point& b);
    bool operator[[function-operator,!=]](const Point& a, const Point& b);
    
}

int [[function,main]]() {
    math::Point [[plain,p1]](1.2f, 3.4f);
    math::Point [[plain,p2]](5.6f, 7.8f);
    
    if (p1 [[function-operator,!=]] p2 [[binary-operator,&&]] math::Point::[[function,distance]](p1, p2) [[binary-operator,<]] 5.0f) {
        // ...
    }
    
    int value = 42;
    int* ptr = [[unary-operator,&]]value;

    ([[unary-operator,*]]ptr)[[unary-operator,++]];
    [[unary-operator,*]]ptr [[binary-operator,+=]] [[unary-operator,-]]4 [[binary-operator,*]] (1 [[binary-operator,+]] 3) [[binary-operator,/]] (9 [[binary-operator,-]] 5) [[binary-operator,%]] 2;
    
    bool eq = [[function,equal]]("apple", "banana");
    
    // Literal operators
    using namespace std::string_literals;
    std::string str = "Hello, world!"[[string,s]];
    
    using namespace std::chrono_literals;
    std::chrono::duration timeout = 200[[number,ms]];
    
    // ...
}
```
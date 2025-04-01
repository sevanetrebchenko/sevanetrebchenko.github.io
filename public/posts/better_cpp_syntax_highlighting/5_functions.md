## Functions

In this section, we will discuss the implementation details for annotating regular functions.
As before, below is a focused example showcasing some of the target language features we will build proper syntax highlighting for in this section.
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
The AST for this example is as follows:
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

The process of annotating regular functions (no class member functions) is a lot more involved, so let's specify some success criteria before getting started.
1. The names of regular and template functions, such as the `equal` template function declarations on lines 6 and 12 and use on line 49, the distance static class function on line 23 and use on line 39, and the `main` function definition on line 26 should be annotated with the `function` annotation.
2. Unary operators, such as on lines 13, 43, and 46, should be annotated with the `unary-operator` annotation.
3. Binary operators, such as on lines 7, 17, and 38, should be annotated with the `binary-operator` annotation.
4. Compound assignment operators, such as the `+=` on line 38, should also be annotated with the `binary-operator` annotation
5. Declarations and definitions of overloaded operators, such as the declaration of `operator==` on lines 30-31 and use on line 39, should be annotated with the `function-operator` annotation.
6. Annotations for [user-defined literal operators](https://en.cppreference.com/w/cpp/language/user_literal), such the `s` operator on line 53 and the `ms` operator on line 56, should match the underlying parameter type.
7. Variable declarations using functional-style initialization, such as `p1` and `p2` on lines 36 and 37, should instead be highlighted as plain tokens.

For adding annotations to functions, we need to set up visitor functions to process several new kinds of nodes:
- [`FunctionDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1FunctionDecl.html), which represent regular function declarations / definitions,
- [`FunctionTemplateDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1FunctionTemplateDecl.html), which represent template function declarations / definitions,
- [`UnaryOperator` nodes](https://clang.llvm.org/doxygen/classclang_1_1FunctionTemplateDecl.html), which represent unary operators,
- [`BinaryOperator` nodes](https://clang.llvm.org/doxygen/classclang_1_1FunctionTemplateDecl.html), which represent binary operators,
- [`CallExpr` nodes](https://clang.llvm.org/doxygen/classclang_1_1CallExpr.html), which represent function calls,
- [`CXXOperatorCallExpr` nodes](https://clang.llvm.org/doxygen/classclang_1_1FunctionTemplateDecl.html), which represent overloaded operator calls,
- [`CompoundAssignOperator` nodes](https://clang.llvm.org/doxygen/classclang_1_1FunctionTemplateDecl.html), which represent compound assignment operators, and
- [`UserDefinedLiteral` nodes](), which represent user-defined [literal operators](https://en.cppreference.com/w/cpp/language/user_literal)

```cpp title:{visitor.hpp} added:{8-30}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // ...
        
        // For visiting function declarations / definitions
        bool VisitFunctionDecl(clang::FunctionDecl* node);
        
        // For visiting template function declarations / definitions
        bool VisitFunctionTemplateDecl(clang::FunctionTemplateDecl* node);
        
        // For visiting unary operators
        bool VisitUnaryOperator(clang::UnaryOperator* node);
        
        // For visiting binary operators
        bool VisitBinaryOperator(clang::BinaryOperator* node);
        
        // For visiting function calls
        bool VisitCallExpr(clang::CallExpr* node);

        // For visiting overloaded operator calls
        bool VisitCXXOperatorCallExpr(clang::CXXOperatorCallExpr* node);
        
        // For visiting compound assignment operator calls
        bool VisitCompoundAssignOperator(clang::CompoundAssignOperator* node);
        
        // For visiting user-defined literal operators
        bool VisitUserDefinedLiteral(clang::UserDefinedLiteral* node);
        
        // ...
};
```

## Function declarations

Function declarations are captured under `FunctionDecl` nodes:
```cpp title:{visitor.hpp} line-numbers:{enabled}
#include "visitor.hpp"

bool Visitor::VisitFunctionDecl(clang::FunctionDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = node->getLocation();
    
    // Skip any function declarations / definitions that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    // Skip implicit declarations, such as those for static class functions
    if (node->isImplicit()) {
        return true;
    }
    
    std::string name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    // Annotate only the operator for overloaded operators ('operator' should be highlighted as a language keyword)
    if (name.starts_with("operator")) {
        name = name.substr(8); // Skip 'operator' keyword
        m_annotator->insert_annotation("function-operator", line, column + 8, name.length());
    }
    else {
        m_annotator->insert_annotation("function", line, column, name.length());
    }
    
    return true;
}
```
Running this function on the example code block from earlier yields the following result:
```text added:{6,12,23,30,31,35}
#include <cstring> // std::strcmp
#include <string> // std::string, std::string_literals
#include <chrono> // std::chrono::duration, std::chrono_literals

template <typename T>
bool [[function,equal]](T a, T b) {
    return a == b;
}

// Template specialization
template <>
bool [[function,equal]](const char* a, const char* b) {
    if (!a || !b) {
        return false;
    }
    
    return std::strcmp(a, b) == 0;
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

Keen observers will notice two things:
1. Despite appearing as a `CXXMethodDecl` in the AST, the `distance` class member function declaration is also annotated by this visitor. This is because `CXXMethodDecl` nodes derive from `FunctionDecl`, marking them eligible for being visited by `VisitFunctionDecl`. Note that this behavior extends to non-static class functions, constructors, and destructors.
2. Function templates are annotated by this visitor. While `FunctionTemplateDecl` nodes do not derive from `FunctionDecl`, each `FunctionTemplateDecl` node in the AST contains a child `FunctionDecl` representing the function declaration / definition itself.

For annotating the names of function declarations and definitions, it would seem the `FunctionDecl` visitor is all we need.
However, we will still implement a visitor function for `FunctionTemplateDecl` nodes, and revisit it later.
For now, the implementation of the `VisitFunctionTemplateDecl` visitor is identical to `VisitFunctionDecl` and is omitted for brevity.

In regard to `CXXMethodDecl` nodes, the `VisitCXXMethodDecl` visitor function is skipped entirely - for this syntax highlighting solution, class functions, including class constructors and destructors, should be highlighted the same as regular functions.
However, as can be seen on line 53, static class functions introduce an implicit `CXXRecordDecl` node, which is inserted while Clang is generating the AST.
This is an implicit generation since the `Point` class is not fully parsed, and acts like a placeholder so that Clang can recognize it as a valid type, and gets linked to the actual definition later.
Weirdly, this `CXXRecordDecl` is treated as a `FunctionDecl` node in the above visitor implementation, meaning the `Point` struct declaration is annotated as a `function`.
There are two ways we can solve this problem.
When parsing class names, we can overwrite any annotations, which will forcefully overwrite the `function` annotation with `class-name`.
Alternatively, we can check and early-out if we detect an implicit definition.
I opted for this option, as then the function visitor is self-contained and does not depend on the existence of another visitor to work properly and not annotate incorrect symbols.
The logic for this can be seen on lines 12-15 of the `VisitFunctionDecl` implementation.

Finally, the logic for annotating declarations / definitions for overloaded operators is modified slightly to only annotate the operator itself, as the leading `operator` should instead be highlighted as a keyword.
This is done by checking the name of the function being processed begins with the "operator" keyword and adjusting offsets accordingly.
These functions are also annotated with the `function-operator` annotation.

### Function calls

Function calls are captured under `CallExpr` nodes.
```cpp
#include "visitor.hpp"

bool Visitor::VisitCallExpr(clang::CallExpr* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getBeginLoc();
    
    // Skip any function calls that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    // Retrieve the name of the function from the function declaration
    const clang::FunctionDecl* function = clang::dyn_cast<clang::FunctionDecl>(node->getCalleeDecl());
    std::string name = function->getNameAsString();
    
    // Clang does not provide an easy way to retrieve the location of the function name directly
    std::span<const Token> tokens = m_tokenizer->get_tokens(node->getSourceRange());
    for (const Token& token : tokens) {
        if (token.spelling == name) {
            m_annotator->insert_annotation("function", token.line, token.column, name.length());
            break;
        }
    }

    return true;
}
```
The name of the function is retrieved from the function declaration.

Unlike other AST nodes, the `CallExpr` node does not provide a way to retrieve the location of the start of the function call.
We can use `CallExpr::getBeginLoc`, but this does not account for any qualifiers on the function call, such as namespaces or classes (in the case of a call to a static class function).
However, since we know the name of the function, we can simply tokenize the source range of the `CallExpr` node and annotate the token that contains the name of the function with the `function` annotation.

```text added:{17,39,49}
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
    math::Point p1(1.2f, 3.4f);
    math::Point p2(5.6f, 7.8f);
    
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
    std::string str = "Hello, world!"s;
    
    using namespace std::chrono_literals;
    std::chrono::duration timeout = 200ms;
    
    // ...
}
```

### Built-in operators

Unary, binary, and compound assignment operators are captured under the `UnaryOperator`, `BinaryOperator`, and `CompoundAssignOperator` nodes.
Unary operators are annotated with the `unary-operator` annotation, while binary and compound assignment operators are annotated with the `binary-operator` annotation.

```cpp title:{visitor.cpp}
#include "visitor.hpp"

bool Visitor::VisitUnaryOperator(clang::UnaryOperator* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = node->getOperatorLoc();
    
    // Skip any unary operator nodes that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    const std::string& name = clang::UnaryOperator::getOpcodeStr(node->getOpcode()).str();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("unary-operator", line, column, name.length());
    
    return true;
}
```
The implementation of this function is largely the same for all 3 node types.
Each node has a corresponding `getOperatorLoc` member function, which retrieves the source location of the operator.
The operator itself is retrieved by a call to a static class function `getOpcodeStr`, depending on the type of node being processed.
For example, this is `BinaryOperator::getOpcodeStr` for binary operator nodes, and `CompoundAssignOperator::getOpcodeStr` for compound assignment operators.
As such, the implementations of these functions have been omitted for brevity.

### Overloaded operators

Overloaded operators are captured under `CXXOperatorCallExpr` nodes:
```cpp title:{visitor.cpp}
#include "visitor.hpp"

bool Visitor::VisitCXXOperatorCallExpr(clang::CXXOperatorCallExpr* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = node->getOperatorLoc();
    
    // Skip overloaded operators that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    const std::string& op = clang::getOperatorSpelling(node->getOperator());
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("function-operator", line, column, op.length());
    return true;
}
```

The implementation of this visitor is very similar to the other operator visitors.
The operator itself is retrieved by a call to the `getOperatorSpelling` function, and is annotated with the `function-operator` annotation to match the logic above for overloaded operator declarations / definitions.

Unfortunately, due to the difficulties involved in variadic template functions and fold expressions, overloaded operators are difficult to annotate in these environments.
This is primarily due to the ambiguity around operator resolution in template function definitions.
One possible solution is to iterate through the tokens of a template function definition and annotate those that match operator spellings.
However, this is difficult to automate, as C++ provides a lot of flexibility when it comes to defining custom operator types.
Because of this, I decided to leave the annotation process for these to be manual, as I don't personally use many fold expression in my code.

```text added:{7,13,17,39,44,46,47}
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
    
    return std::strcmp(a, b) [[binary-operator,==]] 0;
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
    math::Point p1(1.2f, 3.4f);
    math::Point p2(5.6f, 7.8f);
    
    if (p1 [[function-operator,!=]] p2 [[binary-operator,&&]] math::Point::distance(p1, p2) [[binary-operator,<]] 5.0f) {
        // ...
    }
    
    int value = 42;
    int* ptr = [[unary-operator,&]]value;

    ([[unary-operator,*]]ptr)[[unary-operator,++]];
    [[unary-operator,*]]ptr [[binary-operator,+=]] [[unary-operator,-]]4 [[binary-operator,*]] (1 [[binary-operator,+]] 3) [[binary-operator,/]] (9 [[binary-operator,-]] 5) [[binary-operator,%]] 2;
    
    bool eq = equal("apple", "banana");
    
    // Literal operators
    using namespace std::string_literals;
    std::string str = "Hello, world!"s;
    
    using namespace std::chrono_literals;
    std::chrono::duration timeout = 200ms;
    
    // ...
}
```

### User-defined literal operators

User-defined literal operators are captured under `UserDefinedLiteral` nodes:
```cpp
#include "visitor.hpp"

bool Visitor::VisitUserDefinedLiteral(clang::UserDefinedLiteral* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = node->getUDSuffixLoc();
    
    // Skip any literal operators that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    // Retrieve the name of the literal operator from the function declaration
    const clang::FunctionDecl* function = clang::dyn_cast<clang::FunctionDecl>(node->getCalleeDecl());
    std::string name = function->getNameAsString();
    name = name.substr(10); // Skip 'operator""' prefix
    
    std::span<const Token> tokens = m_tokenizer->get_tokens(node->getSourceRange());
    
    // Literal operators can only be applied on string or number (integer / floating point) types
    // This also determines what annotation should be applied to the operator
    // An alternative approach here would be to use UserDefineLiteral::getLiteralOperatorKind
    for (const Token& token : tokens) {
        std::size_t position = token.spelling.find(name);
        if (position != std::string::npos) {
            bool is_string_type = token.spelling.find('\'') != std::string::npos || token.spelling.find('"') != std::string::npos;
            const char* annotation = is_string_type ? "string" : "number";
            
            m_annotator->insert_annotation(annotation, token.line, token.column + position, name.length());
        }
    }
    
    return true;
}
```
Similar to the approach taken in the `VisitCallExpr` visitor function, the `UserDefinedLiteral` AST node does not provide a way to retrieve the name of the operator, so it must be gotten from the declaration of the function.
I wanted the annotation of the operator to match the type of symbol it is applied to.
From the C++ specification, literal operators are only able to be applied to string and number types.
This is encapsulated in the `UserDefinedLiteral` node, and can be retrieved by a call to `UserDefinedLiteral::getLiteralOperatorKind`.
Below is a sample approach that can be taken to use this functionality:
```cpp
bool Visitor::VisitUserDefinedLiteral(clang::UserDefinedLiteral* node) {
    // ...
    
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    const char* annotation;
    switch (node->getLiteralOperatorKind()) {
        // Accepts a C-style string (const char*)
        case clang::UserDefinedLiteral::LOK_Raw:
        
        // Accepts a template parameter pack of characters
        case clang::UserDefinedLiteral::LOK_Template:
        
        // Accepts a C-style string and length (const char*, std::size_t)
        case clang::UserDefinedLiteral::LOK_String:
        
        // Accepts a character (char)
        case clang::UserDefinedLiteral::LOK_Character:
            annotation = "string";
            break;
            
        // Accepts an integer type (unsigned long long)
        case clang::UserDefinedLiteral::LOK_Integer:
        
        // Accepts a floating type (long double)
        case clang::UserDefinedLiteral::LOK_Floating:
            annotation = "number";
            break;
    }
    
    m_annotator->insert_annotation(annotation, line, column, name.length());
    return true;
}
```

However, I opted for a different approach.
For the sample code snippet above, the C++ `std::chrono` library does not provide an overload to resolve `200ms` into a function that accepts an integer.
Instead, the following is called:
```cpp title:{chrono.h}
/// Literal suffix for durations of type `std::chrono::milliseconds`
template <char... _Digits>
constexpr chrono::milliseconds
operator""ms() {
    return __check_overflow<chrono::milliseconds, _Digits...>();
}
```
There is also an overload that accepts a `long double`.
For this reason, the logic above processed `200ms` as a literal of characters, marking the `ms` as a `string` instead of a number.
I was not able to determine a workaround for this, so I used a different approach.
The standard dictates that there must not be a space between the target and literal suffix.
We can use this to our advantage by manually determining what the type of the target is.
If the token containing the suffix contains quotations (single or double, both are annotated with `string`), the suffix should also be marked as a string.
Otherwise, the target is a number (integer or floating point), and the suffix is annotated with `number` instead.
This logic can be seen on lines 22-30 of the `VisitUserDefinedLiteral` visitor function.

```text added:{53,56}
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
    math::Point p1(1.2f, 3.4f);
    math::Point p2(5.6f, 7.8f);
    
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

### Functional-style variable declarations
As mentioned in the beginning of the section, variable declarations using direct or functional-style initialization are incorrectly highlighted as function calls.
This likely occurs because Prism identifies functions based on the presence of parentheses `()`.
Luckily, this is a simple fix:
```cpp title:{visitor.cpp} added:{24-27}
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
    else if (node->isDirectInit()) {
        // Direct (functional) initialization should not be annotated as a function call
        m_annotator->insert_annotation("plain", line, column, name.length());
    }

    return true;
}
```
With the help of the `VarDecl::isDirectInit` check, we can annotate variables with direct initializers as `plain` tokens.
```text added:{36,37}
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
The `plain` CSS style is language-agnostic, and provides the default style to use for code block tokens.

After defining some new CSS styles, we have a robust solution for proper syntax highlighting of function calls.
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
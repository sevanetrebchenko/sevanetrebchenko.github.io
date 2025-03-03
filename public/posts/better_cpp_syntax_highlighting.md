
*Reader beware: this post is actively being worked on!*



I created this blog to have a place to discuss interesting problems I encounter while working on my personal projects.
Many of these projects, particularly those focused on computer graphics, are written in C++.

One problem I wanted to tackle was syntax highlighting, as I often use code snippets in my explanations and wanted them to be easily readable.
Initially, I integrated [PrismJS](https://prismjs.com/) - a popular library for syntax highlighting in browsers - into my Markdown renderer.
However, I quickly discovered that PrismJS struggles with properly highlighting C++ code.

Consider the following example, which showcases a variety of C++20 features I commonly use.
Syntax highlighting is handled exclusively by PrismJS:
```cpp line-numbers:{enabled}
#include <stdexcept> // std::runtime_error, std::out_of_range
#include <vector> // std::vector
#include <string> // std::string, std::to_string
#include <ctime> // std::tm, std::time_t, std::time, std::localtime
#include <sstream> // std::stringstream
#include <iostream> // std::cout
#include <cmath> // std::sqrt
#include <concepts> // std::input_or_output_iterator, std::sentinel_for,
                    // std::incrementable, std::same_as, std::convertible_to
#include <chrono> // std::chrono::high_resolution_clock

#define ASSERT(EXPRESSION, MESSAGE)        \
    if (!(EXPRESSION)) {                   \
        throw std::runtime_error(MESSAGE); \
    }

namespace utility {
    
    template <typename ...Ts>
    [[nodiscard]] std::string concat(const Ts&... args) {
        std::stringstream ss;
        (ss << ... << args);
        return ss.str();
    }
    
    template <typename T>
    concept Container = requires(T container) {
        // 1. container must have valid begin() / end()
        { std::begin(container) } -> std::input_or_output_iterator;
        { std::end(container) } -> std::sentinel_for<decltype(std::begin(container))>;
    
        // 2. container iterator must support equality comparison and be incrementable
        { std::begin(container) } -> std::incrementable;
    
        // 3. container iterator must be dereferenceable
        { *std::begin(container) } -> std::same_as<typename T::value_type&>;
        
        // Optional checks for other common container properties
        // { container.empty() } -> std::convertible_to<bool>;
        // { container.size() } -> std::convertible_to<std::size_t>;
        // { container.clear() };
    };
    
    template <Container C>
    [[nodiscard]] std::string to_string(const C& container) {
        std::stringstream ss;
        ss << "[ ";
        
        typename C::const_iterator end = std::end(container);
        for (typename C::const_iterator iter = std::begin(container); iter != end; ++iter) {
            ss << *iter;
            if (iter + 1 != end) {
                ss << ", ";
            }
        }
        
        ss << " ]";
        return ss.str();
    }
    
    enum class Month : unsigned {
        January = 1,
        February,
        March,
        April,
        May,
        June,
        July,
        August,
        September,
        October,
        November,
        December
    };
    
    std::string to_string(Month month) {
        static const std::string names[12] = {
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        };
        
        // Month indices start with 1
        return names[static_cast<std::underlying_type<Month>::type>(month) - 1];
    }
    
}

namespace math {

    struct Vector3 {
        // Constants
        static const Vector3 zero;
        static const Vector3 up;
        static const Vector3 forward;
    
        Vector3() : x(0.0f), y(0.0f), z(0.0f) {
        }
    
        Vector3(float value) : x(value), y(value), z(value) {
        }
    
        Vector3(float x, float y, float z) : x(x), y(y), z(z) {
        }
        
        ~Vector3() = default;
    
        Vector3 operator+(const Vector3& other) const {
            return { x + other.x, y + other.y, z + other.z };
        }
    
        Vector3 operator-(const Vector3& other) const {
            return { x - other.x, y - other.y, z - other.z };
        }
    
        Vector3 operator*(float s) const {
            return { x * s, y * s, z * s };
        }
    
        Vector3 operator/(float s) const {
            return { x / s, y / s, z / s };
        }
    
        float operator[](std::size_t index) const {
            // Temporarily cast away the const qualifier to avoid duplicating logic
            // Safe as non-const Vector3::operator[] does not modify the value
            return const_cast<Vector3*>(this)->operator[](index);
        }
        
        float& operator[](std::size_t index) {
            if (index == 0) {
                return x;
            }
            else if (index == 1) {
                return y;
            }
            else if (index == 2) {
                return z;
            }
            else {
                throw std::out_of_range("index provided to Vector3::operator[] is out of bounds");
            }
        }
    
        // Returns the magnitude of the vector
        float length() const {
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

    // Const class static members must be initialized out of line
    const Vector3 Vector3::zero = Vector3();
    
    // Depends on your coordinate system
    const Vector3 Vector3::up = Vector3(0.0f, 1.0f, 0.0f);
    const Vector3 Vector3::forward = Vector3(0.0f, 0.0f, -1.0f);
    
    
    // Stream insertion operator
    std::ostream& operator<<(std::ostream& os, const Vector3& vec) {
        os << "(" << vec.x << ", " << vec.y << ", " << vec.z << ")";
        return os;
    }

    // Dot product
    float dot(Vector3 a, Vector3 b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }
    
    // Cross product
    Vector3 cross(Vector3 a, Vector3 b) {
        return {
            a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x
        };
    }
    
    // Returns a unit vector oriented in the same direction as 'v'
    Vector3 normalize(const Vector3& v) {
        float length = v.length();
        ASSERT(length > 0.0f, "Vector3::normalize() called on vector of zero length");
        return v / length;
    }

}

int main() {
    std::string str;


    // Prints "Hello, world!"
    str = utility::concat("Hello", ",", " ", "world", "!");
    std::cout << str << '\n';


    // Prints "[ 0, 1, 2, 3, 4, 5 ]"
    std::vector<int> vec = { 0, 1, 2, 3, 4, 5 };
    str = utility::to_string(vec);
    std::cout << str << '\n';


    using namespace std::chrono;
    time_point now = system_clock::now();
    
    time_t time = system_clock::to_time_t(now);
    tm local = *localtime(&time);

    // Extract date
    int year = 1900 + local.tm_year;
    utility::Month month = static_cast<utility::Month>(1 + local.tm_mon);
    int day = local.tm_mday;
    
    std::string suffix;
    switch (day) {
        case 1:
        case 21:
        case 31:
            suffix = "st";
            break;
        case 2:
        case 22:
            suffix = "nd";
            break;
        case 3:
        case 23:
            suffix = "rd";
            break;
        default:
            suffix = "th";
            break;
    }

    // Print date
    str = utility::concat("Today is ", utility::to_string(month), " ", day, suffix, ", ", year);
    std::cout << str << '\n';

    duration current_time = now.time_since_epoch();
    hours h = duration_cast<hours>(current_time) % 24h;
    minutes m = duration_cast<minutes>(current_time) % 60min;
    seconds s = duration_cast<seconds>(current_time) % 60s;

    int hour = h.count();
    suffix = hour >= 12 ? "PM" : "AM";
    if (hour == 0) {
        // 12:00AM
        hour = 12;
    }
    else if (hour > 12) {
        hour -= 12;
    }
    
    std::cout << "The current time is: " << hour << ':'
              << std::setw(2) << std::setfill('0') << m.count() << ':'
              << std::setw(2) << std::setfill('0') << s.count()
              << ' ' << suffix << '\n';
    
    
    // Determine the orthonormal basis for the given forward vector (assuming (0, 1, 0) is up)
    math::Vector3 up = math::Vector3::up;
    math::Vector3 forward = math::normalize(math::Vector3(0.75f, 0.12f, 3.49f)); // Arbitrary
    math::Vector3 right = math::cross(forward, up);
    
    str = utility::concat("The cross product of vectors ", up, " and ", forward, " is ", right);
    std::cout << str << '\n';
    
    
    using Color = math::Vector3;
    Color color = Color { 253, 164, 15 };

    str = utility::concat("My favorite color is: ", color);
    std::cout << str << '\n';
    
    
    return 0;
}
```

Unfortunately, there are several issues with the syntax highlighting. 

- **Macros**: References to preprocessor definitions are incorrectly highlighted as function calls. 
An example of this can be seen with the `ASSERT` macro on line 197.

- **User-defined types**: Only declarations of custom types are recognized as classes.
Subsequent uses are treated as plain tokens.
Examples of this can be seen with the `Container` concept on line 27, the `Month` enum on line 61, and the `Vector3` struct on line 90.
This issue also extends to standard library types.

- **Enums**: Enum values, such as the month names in the `Month` enum on line 61, are highlighted as plain tokens.

- **Class member variables**: Class member declarations and references in function bodies are all highlighted as plain tokens. 
It is difficult to tell whether a variable in a class member function references a local variable or a class member.

6. **Casts**: C++-style casts such as `static_cast` on lines 83 and 226 and `const_cast` on line 126, are incorrectly highlighted as function calls.
- **Namespaces**: Namespace declarations, such as the `utility` namespace on line 17 or the `math` namespace on line 88, as well as any namespace-qualified types or functions, are all highlighted as plain tokens.
6. **Templates**: Template type names are highlighted as plain tokens, and template angle brackets are treated as operators rather than delimiters.

The list goes on.


PrismJS breaks the source code into tokens based on a set of predefined grammar rules specific to each language.
These rules are essentially regular expressions that identify different types of elements in the code, such as keywords, strings, numbers, comments, etc.
Once the source code is parsed into tokens, each token is tagged with a set of CSS classes that are then used to apply styling.

Due to the complexity of C++ syntax, however, such an approach is not feasible.
It is perfectly valid, for example, for a variable to have the same name as a class (given the class definition is properly scoped):
```cpp line-numbers:{enabled}
namespace detail {

    struct MyClass { 
        ...
    };

}

int main() {
    detail::MyClass MyClass { };
    ...
}
```
If we extend `PrismJS` to highlight *all* tokens that match class names, we may accidentally end up highlighting more than necessary.
While this example may be contrived, it sheds light on the main underlying problem: it is difficult to reason about the structure of the code by only looking at individual tokens.
What if we want to extract member variables of a given class?
How do we distinguish between local variables and class members?
What about types that we don't have definitions for, such as those included from third-party dependencies or the standard library?
Approaches like using regular expressions or manual scope tracking quickly grow convoluted, posing a challenge from standpoints in both readability and long-term maintenance.

It makes sense, therefore, that PrismJS skips most this complexity and only annotates tokens it is confidently able to identify. 

## Abstract Syntax Trees

A more effective approach would be to parse the [Abstract Syntax Tree (AST)](https://en.wikipedia.org/wiki/Abstract_syntax_tree) and add custom annotations to tokens based on the exposed symbols.
Abstract syntax trees are data structures that are widely used by compilers to represent the structure of the source code of a program.
We can view the AST of a given file with Clang by running the following command:
```text
clang -Xclang -ast-dump -fsyntax-only -std=c++20 example.cpp
```
To better understand the structure of an AST, let's take a look at (a simplified version of) the one generated for the code snippet at the start of this post:
```json
TranslationUnitDecl 0x18b64668268 <<invalid sloc>> <invalid sloc>

// namespace utility { ... }
|-NamespaceDecl 0x18b6997f0d0 <example.cpp:17:1, line:86:1> line:17:11 utility

// template <typename ...Ts>
// [[nodiscard]] std::string concat(const Ts&... args) { ... }
| |-FunctionTemplateDecl 0x18b6997f4c8 <line:19:5, line:24:5> line:20:31 concat

// template <typename T>
// concept Container = requires(T container) { ... }
| |-ConceptDecl 0x18b69980e30 <line:26:5, line:42:5> line:27:13 Container

// template <Container C>
// [[nodiscard]] std::string to_string(const C& container) { ... }
| |-FunctionTemplateDecl 0x18b699812f8 <line:44:5, line:59:5> line:45:31 to_string

// enum class Month : unsigned { ... };
| |-EnumDecl 0x18b69985f10 <line:61:5, line:74:5> line:61:16 referenced class Month 'unsigned int'


// namespace math { ... }
|-NamespaceDecl 0x18b69990960 <line:88:1, line:201:1> line:88:11 math

// struct Vector3 { ... };
| |-CXXRecordDecl 0x18b699909f0 <line:90:5, line:164:5> line:90:12 referenced struct Vector3 definition

// static const Vector3 zero;
| | |-VarDecl 0x18b69990c28 <line:92:9, col:30> col:30 zero 'const Vector3':'const math::Vector3' static

// static const Vector3 up;
| | |-VarDecl 0x18b69990cc0 <line:93:9, col:30> col:30 used up 'const Vector3':'const math::Vector3' static

// static const Vector3 forward;
| | |-VarDecl 0x18b69990d58 <line:94:9, col:30> col:30 forward 'const Vector3':'const math::Vector3' static

// Vector3::Vector3() { ... }
| | |-CXXConstructorDecl 0x18b69990e50 <line:96:9, line:97:9> line:96:9 used Vector3 'void ()' implicit-inline

// Vector3::Vector3(float value) { ... }
| | |-CXXConstructorDecl 0x18b69991028 <line:99:9, line:100:9> line:99:9 Vector3 'void (float)' implicit-inline

// Vector3::Vector3(float x, float y, float z) { ... }
| | |-CXXConstructorDecl 0x18b69991378 <line:102:9, line:103:9> line:102:9 used Vector3 'void (float, float, float)' implicit-inline

// Vector3::~Vector3() = default;
| | |-CXXDestructorDecl 0x18b699914b8 <line:105:9, col:28> col:9 referenced constexpr ~Vector3 'void () noexcept' default trivial implicit-inline

// Vector3 Vector3::operator+(const Vector3& other) const { ... }
| | |-CXXMethodDecl 0x18b699917a8 <line:107:9, line:109:9> line:107:17 operator+ 'Vector3 (const Vector3 &) const' implicit-inline

// Vector3 Vector3::operator-(const Vector3& other) const { ... }
| | |-CXXMethodDecl 0x18b69991940 <line:111:9, line:113:9> line:111:17 operator- 'Vector3 (const Vector3 &) const' implicit-inline

// Vector3 Vector3::operator*(float s) const { ... }
| | |-CXXMethodDecl 0x18b69991b58 <line:115:9, line:117:9> line:115:17 operator* 'Vector3 (float) const' implicit-inline

// Vector3 Vector3::operator/(float s) const { ... }
| | |-CXXMethodDecl 0x18b69991cf0 <line:119:9, line:121:9> line:119:17 used operator/ 'Vector3 (float) const' implicit-inline

// float Vector3::operator[](std::size_t index) const { ... }
| | |-CXXMethodDecl 0x18b69991f80 <line:123:9, line:127:9> line:123:15 operator[] 'float (std::size_t) const' implicit-inline

// float& Vector3::operator[](std::size_t index) { ... }
| | |-CXXMethodDecl 0x18b699921d0 <line:129:9, line:142:9> line:129:16 used operator[] 'float &(std::size_t)' implicit-inline

// float Vector3::length() const { ... }
| | |-CXXMethodDecl 0x18b69992340 <line:145:9, line:147:9> line:145:15 used length 'float () const' implicit-inline
        
| | |-CXXRecordDecl 0x18b69992408 <line:149:9, line:163:9> line:149:9 union definition

// struct {
//     float x;
//     float y;
//     float z;
// };
| | | |-CXXRecordDecl 0x18b69992540 <line:151:13, line:155:13> line:151:13 struct definition
| | | | |-FieldDecl 0x18b69992698 <line:152:17, col:23> col:23 referenced x 'float'
| | | | |-FieldDecl 0x18b69992708 <line:153:17, col:23> col:23 referenced y 'float'
| | | | |-FieldDecl 0x18b69992778 <line:154:17, col:23> col:23 referenced z 'float'

// struct {
//     float r;
//     float g;
//     float b;
// };
| | | |-CXXRecordDecl 0x18b699929b8 <line:158:13, line:162:13> line:158:13 struct definition
| | | | |-FieldDecl 0x18b69992b08 <line:159:17, col:23> col:23 r 'float'
| | | | |-FieldDecl 0x18b69992b78 <line:160:17, col:23> col:23 g 'float'
| | | | |-FieldDecl 0x18b69992be8 <line:161:17, col:23> col:23 b 'float'

// const Vector3 Vector3::zero = Vector3();
| |-VarDecl 0x18b699973c0 parent 0x18b699909f0 prev 0x18b69990c28 <line:167:5, col:43> col:28 zero 'const Vector3':'const math::Vector3' cinit

// const Vector3 Vector3::up = Vector3(0.0f, 1.0f, 0.0f);
| |-VarDecl 0x18b69997690 parent 0x18b699909f0 prev 0x18b69990cc0 <line:170:5, col:57> col:28 used up 'const Vector3':'const math::Vector3' cinit

// const Vector3 Vector3::forward = Vector3(0.0f, 0.0f, -1.0f);
| |-VarDecl 0x18b69997890 parent 0x18b699909f0 prev 0x18b69990d58 <line:171:5, col:63> col:28 forward 'const Vector3':'const math::Vector3' cinit

// std::ostream& operator<<(std::ostream& os, const Vector3& vec) { ... }
| |-FunctionDecl 0x18b69997d70 <line:175:5, line:178:5> line:175:19 used operator<< 'std::ostream &(std::ostream &, const Vector3 &)'

// float dot(Vector3 a, Vector3 b) { ... }
| |-FunctionDecl 0x18b6999eef0 <line:181:5, line:183:5> line:181:11 dot 'float (Vector3, Vector3)'

// Vector3 cross(Vector3 a, Vector3 b) { ... }
| |-FunctionDecl 0x18b6999f758 <line:186:5, line:192:5> line:186:13 used cross 'Vector3 (Vector3, Vector3)'

// Vector3 normalize(const Vector3& v) { ... }
| `-FunctionDecl 0x18b699a0518 <line:195:5, line:199:5> line:195:13 used normalize 'Vector3 (const Vector3 &)'

// int main() { ... }
`-FunctionDecl 0x18b699a0bd0 <line:203:1, line:291:1> line:203:5 main 'int ()'
```

The root of the AST is always the translation unit, which represents the entire compiled C++ file.
Symbols from standard library headers are omitted for brevity - including all expands the AST to 561,445 lines, out of which only 1,758 (~0.3%) are relevant to the example.
Note that only the top-level nodes are included, with comments indicating which elements these nodes reference in the code.
Most child nodes, corresponding to function parameters, call expressions, variable declarations, and other statements within the function body itself, have been omitted for clarity purposes.
Don't worry, we will revisit these later.

Clang's AST nodes model a class hierarchy, with most nodes deriving from three fundamental types:
1. [`Stmt` nodes](https://clang.llvm.org/doxygen/classclang_1_1Stmt.html), which represent control flow statements such as conditionals (`if`, `switch/case`), loops (`while`, `do/while`, `for`, range-based `for`), jumps (`return`, `break`, `continue`, `goto`), `try/catch` statements for exception handling, coroutines, and inline assembly
2. [`Decl` nodes](https://clang.llvm.org/doxygen/classclang_1_1Decl.html), which represent declarations of `struct/class` types, functions (including function templates and specializations), namespaces, concepts, module `import/export` statements, and
3. [`Expr` nodes](https://clang.llvm.org/doxygen/classclang_1_1Expr.html), which represent expressions such as function calls, type casts, binary and unary operators, initializers, literals, conditional expressions, lambdas, array subscripts, and class member accesses

Each AST node provides the source location and extent of the element they reference, as well as additional details depending on the specific type of node being processed.
For example, a [`FunctionDecl` node](https://clang.llvm.org/doxygen/classclang_1_1FunctionDecl.html), which represents a function declaration or definition, exposes various properties such as the function's name, return type information, references to parameters (if any, each represented by a `ParmVarDecl` node), and (of course) whether the referenced function is a definition or declaration.
Additionally, it allows for checking:
- Function attributes, such as `[[noreturn]]` and `[[nodiscard]]`
- Whether the function is explicitly marked as `static`, `constexpr`, `consteval`, `virtual` (including pure virtual), and/or `inline`
- Whether the function is explicitly (or implicitly) `default`ed or `delete`d
- Function exception specification (`throw(...)/nothrow`, `noexcept`, etc.)
- Language linkage, or whether the function is nested within a C++ `extern "C"` or `extern "C++"` linkage
- Whether the function is variadic
- Whether the function represents a C++ overloaded operator, or a template (and, if so, what kind)
- Whether it is a class member function defined out-of-line
- And more!

This example merely scratches the surface. 
At the time of writing this post, there are over 300 different node types - the highly detailed and verbose nature of the Clang AST allows for extensive introspection into the structure of a C++ program.

I wanted to leverage the Clang AST to address the limitations of `PrismJS` and build a more robust and comprehensive syntax highlighting solution.
For a given code snippet, my program generates and traverses the AST to identify various nodes and adds inline annotations based on the type of node being parsed.
Before being rendered by the Markdown frontend, these annotations are extracted out and used to apply styling, similar to how `PrismJS` works.

## Clang's LibTooling API

Now that we are familiar with the structure of an AST, how do we traverse the one generated by Clang?
While the process is a bit convoluted, we can set this up using Clang's [`LibTooling` library](https://clang.llvm.org/docs/LibTooling.html).

### Creating a `ASTFrontendAction`

Tools built with `LibTooling` interact with Clang and LLVM by running `FrontendAction`s over code.
One such interface, `ASTFrontendAction`, provides an easy way to traverse the AST of a given translation unit.
During traversal, we can extract relevant information about the AST nodes we care about and use it to add annotations for syntax highlighting.

Let's start by defining our `ASTFrontendAction`:
```cpp line-numbers:{enabled}
#include <clang/Frontend/CompilerInstance.h>
#include <clang/Frontend/FrontendAction.h>

struct [[class-name,SyntaxHighlighter]] final [[plain,:]] public [[namespace-name,clang]]::[[class-name,ASTFrontendAction]] {
    [[namespace-name,std]]::[[class-name,unique_ptr]][[plain,<]][[namespace-name,clang]]::[[class-name,ASTConsumer]][[plain,>]] CreateASTConsumer([[namespace-name,clang]]::[[class-name,CompilerInstance]][[plain,&]] compiler, [[namespace-name,clang]]::[[class-name,StringRef]] file) override;
};
```

### Creating an `ASTConsumer`

The `ASTFrontendAction` interface requires implementing the `CreateASTConsumer` function, which returns an `ASTConsumer` instance.
As the name suggests, the `ASTConsumer` is responsible for consuming (processing) the AST.

Our `ASTConsumer` is defined as follows:
```cpp line-numbers:{enabled}
#include <clang/Frontend/CompilerInstance.h>
#include <clang/AST/ASTConsumer.h>
#include <string> // std::string

class Parser final : public clang::ASTConsumer {
    public:
        explicit Parser(clang::CompilerInstance& compiler, clang::StringRef filepath);
        ~Parser() override;
        
    private:
        void HandleTranslationUnit(clang::ASTContext& context) override;
        
        clang::ASTContext* m_context;
        std::string m_filepath;
};
```

The `ASTConsumer` interface provides multiple entry points for traversal, but for our use case only `HandleTranslationUnit` is necessary.
This function is called by the `ASTFrontendAction` with an `ASTContext` for the translation unit of the file being processed.

The `ASTContext` is essential for retrieving semantic information about the nodes of an AST.
It provides access to type details, declaration contexts, and utility classes like `SourceManager`, which maps nodes back to their source locations (as AST nodes do not store this information directly).
As we will see, this information is crucial for inserting syntax highlighting annotations in the correct locations.

We simply instantiate and return an instance of our `ASTConsumer` from the `CreateASTConsumer` function of the `ASTFrontendAction`.
```cpp line-numbers:{enabled}
#include "action.hpp"
#include "parser.hpp"

[[namespace-name,std]]::[[class-name,unique_ptr]][[plain,<]][[namespace-name,clang]]::[[class-name,ASTConsumer]][[plain,>]] [[class-name,SyntaxHighlighter]]::CreateASTConsumer([[namespace-name,clang]]::[[class-name,CompilerInstance]][[plain,&]] compiler, [[namespace-name,clang]]::[[class-name,StringRef]] file) {
    return [[namespace-name,std]]::[[function,make_unique]][[plain,<]][[class-name,Parser]][[plain,>]](compiler, file.str());
}
```

### Creating a `RecursiveASTVisitor`

The final missing piece is the [`RecursiveASTVisitor`](https://clang.llvm.org/doxygen/classclang_1_1RecursiveASTVisitor.html), which handles visiting individual AST nodes.
It provides `Visit{NodeType}` visitor hooks for most AST node types.
Here are a few examples of `Visit` function declarations for common AST nodes:
```cpp line-numbers:{enabled}
bool VisitNamespaceDecl([[namespace-name,clang]]::[[class-name,NamespaceDecl]][[plain,*]] node); // For visiting namespaces
bool VisitFunctionDecl([[namespace-name,clang]]::[[class-name,FunctionDecl]][[plain,*]] node); // For visiting functions
bool VisitCXXRecordDecl([[namespace-name,clang]]::[[class-name,CXXRecordDecl]][[plain,*]] node); // For visiting C++ classes
// etc.
```
The main exception to this pattern are `TypeLoc` nodes, which are passed by value instead of by pointer.
The return value determines whether traversal of the AST should continue.
By default, the implementation simply returns `true`, making it perfectly safe to omit `Visit` function definitions of any node types we are not interested in processing.

Our `RecursiveASTVisitor` is defined as follows:
```cpp line-numbers:{enabled}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Parser* parser);
        ~Visitor();
        
        // Visitor definitions here...
        
    private:
        clang::ASTContext* m_context;
        Parser* m_parser;
};
```
It takes in the `ASTContext` from the `ASTConsumer` for retrieving node source locations, and the `Parser` for adding annotations.
We will explore the visitor function implementations in more detail later on.

The traversal of the AST is kicked off in `HandleTranslationUnit` from our `ASTConsumer`.
By calling `TraverseDecl` with the root `TranslationUnitDecl` node (obtained from the `ASTContext`), we can traverse the entire AST:
```cpp line-numbers:{enabled}
void [[class-name,Parser]]::HandleTranslationUnit([[namespace-name,clang]]::[[class-name,ASTContext]][[plain,&]] context) {
    [[class-name,Visitor]] visitor { &context, this };
    visitor.TraverseDecl(context.getTranslationUnitDecl());
}
```

#### Configuring the traversal behavior (optional)

The `RecursiveASTVisitor` also provides functions to control the behavior of the traversal itself.
For example, overriding `shouldTraversePostOrder` to return `true` switches the traversal from the default preorder to postorder.
```cpp line-numbers:{enabled} added:{6-9}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Parser* parser);
        ~Visitor();
        
        bool shouldTraversePostOrder() const {
            // Configure the visitor to perform a postorder traversal of the AST
            return true;
        }
        
    private:
        // ...
};
```
Other functions modify traversal behavior in different ways.
For example, `shouldVisitTemplateInstantiations` enables visiting template instantiations, while `shouldVisitImplicitCode` allows traversal of implicit constructors and destructors generated by the compiler.

### Putting it all together

Finally, we invoke the tool using `runToolOnCodeWithArgs`, specifying the `ASTFrontendAction`, source code, and any additional [command line arguments](https://clang.llvm.org/docs/ClangCommandLineReference.html):
```cpp line-numbers:{enabled}
#include "action.hpp"

#include <clang/Tooling/Tooling.h>

#include <string> // std::string
#include <vector> // std::vector
#include <fstream> // std::ifstream
#include <memory> // std::make_unique

int main(int argc, char[[plain,*]] argv[]) {
    // ...
    
    // Read file contents
    [[namespace-name,std]]::[[class-name,ifstream]] file(argv[[operator,[]]1[[operator,]]]);
    if (!file.is_open()) {
        // ... 
        return 1;
    }
    [[namespace-name,std]]::[[class-name,string]] source { [[namespace-name,std]]::[[class-name,istreambuf_iterator]][[plain,<]]char[[plain,>]](file), [[namespace-name,std]]::[[class-name,istreambuf_iterator]][[plain,<]]char[[plain,>]]() };
    
    [[namespace-name,std]]::[[class-name,vector]][[plain,<]][[namespace-name,std]]::[[class-name,string]][[plain,>]] compilation_flags {
        "-std=c++20",
        "-fsyntax-only", // Included by default
        
        // Project include directories, additional compilation flags, etc.
    };
        
    // runToolOnCodeWithArgs returns 'true' if the tool was successfully executed
    return ![[namespace-name,clang]]::[[namespace-name,tooling]]::runToolOnCodeWithArgs([[namespace-name,std]]::make_unique[[plain,<]][[class-name,SyntaxHighlighter]][[plain,>]](), source, compilation_flags);
}
```

## Inserting annotations
One of the other responsibilities of our `ASTConsumer` is inserting syntax highlighting annotations into the source code.
Before kicking off AST traversal in `HandleTranslationUnit`, we must perform some additional setup.

### Tokenization
The contents of the source file are tokenized and stored in memory.

```cpp line-numbers:{enabled} added:{6-9,18,22} title:{parser.hpp}
#include <clang/Frontend/CompilerInstance.h> // clang::CompilerInstance
#include <clang/AST/ASTConsumer.h> // clang::ASTConsumer
#include <string> // std::string
#include <vector> // std::vector

struct Token {
    clang::SourceLocation location;
    std::string spelling;
};

class Parser final : public clang::ASTConsumer {
    public:
        explicit Parser(clang::CompilerInstance& compiler, clang::StringRef filepath);
        ~Parser() override;
        
    private:
        void HandleTranslationUnit(clang::ASTContext& context) override;
        void tokenize();
        
        clang::ASTContext* m_context;
        std::string m_filepath;
        std::vector<std::vector<Token>> m_tokens;
};
```
We can leverage Clang's `Lexer` class from the LibTooling API to handle tokenization.
The `Lexer` provides an API to process an input text buffer into a sequence of tokens based on a set of predetermined C/C++ language rules.
These tokens are grouped by line and stored in `m_tokens`.

Why? In some cases, determining the exact location of a symbol is not always straightforward.
While we usually know what we are looking for, the corresponding AST node does not always provide a direct way to retrieve it.
Fortunately, every token returned by `Lexer::LexFromRawLexer` has an associated `SourceLocation`.
This represents the column and line number of the token within the source file.
Additionally, AST nodes often include a way to retrieve the range of the node - spanning from a start to an end `SourceLocation` - which helps us narrow down our search.
By storing tokens in a structured manner, we can efficiently retrieve those that fall within the given `SourceRange` of an AST node without having to traverse every token of the file.
We can then check against the spelling of the token until we find one that matches the symbol we are looking for.
We will see this approach in action in some of our visitor functions.

Tokenization is handled by the `tokenize` function:
```cpp line-numbers:{enabled} title:{parser.cpp}
void Parser::tokenize() {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    
    clang::FileID file = source_manager.getMainFileID();
    clang::SourceLocation file_start = source_manager.getLocForStartOfFile(file);
    clang::LangOptions options = m_context->getLangOpts();
    
    clang::StringRef source = source_manager.getBufferData(file);
    clang::Lexer lexer(file_start, options, source.begin(), source.begin(), source.end());
    
    // Configure lexer behavior
    // ... 
    
    // Tokens are grouped by line
    std::size_t num_lines = source.count('\n') + 1;
    m_tokens.resize(num_lines);

    // Tokenize
    clang::Token token;
    clang::SourceLocation location;
    while (true) {
        lexer.LexFromRawLexer(token);
        if (token.is(clang::tok::eof)) {
            // Done processing source file (reached EOF token)
            break;
        }
        
        location = token.getLocation();
        unsigned line = source_manager.getSpellingLineNumber(location);

        m_tokens[line].emplace_back(Token {
            .location = location,
            .spelling = clang::Lexer::getSpelling(token, source_manager, options)
        });
    }
}
```
Tokens are retrieved using `LexFromRawLexer` and converted into lightweight `Token` instances, which only store their `SourceLocation` and spelling.
Since lexing happens after preprocessing, preprocessor directives, whitespace tokens, and comments are already removed.
However, this behavior can be modified before lexing occurs.

Other properties, such as the source file to process and [C/C++ language options](https://clang.llvm.org/doxygen/LangOptions_8h_source.html), are specified on initialization and cannot be changed later.
To keep things simple, these are retrieved directly from the `ASTContext`, which is configured by the arguments passed to `runToolOnCodeWithArgs`.

### Tokenization
We can leverage the `Lexer` class from Clang's LibTooling API to achieve this.
The `Lexer` is a utility class that converts a text buffer into a stream of tokens.
Lexing happens 
By default, whitespace tokens, comments, and p are parsed out.



This process consists of two major steps.
First, the input file must be tokenized.

## Enums
Enums are a great starting point as their declaration is simple and usage is straightforward.
Consider the following example:
```cpp line-numbers:{enabled}
enum class Level {
    Debug = 0,
    Info,
    Warning,
    Error,
    Fatal = Error,
};

void log_message(Level level, const char* message);

int main() {
    log_message(Level::Error, "something bad happened");
    // ...
}
```
The AST for this code snippet looks as follows:
```text
TranslationUnitDecl 0x1b640a48268 <<invalid sloc>> <invalid sloc>
|-EnumDecl 0x1b640a490d8 <.\example.cpp:1:1, line:7:1> line:1:12 referenced class Level 'int'
| |-EnumConstantDecl 0x1b640a491f8 <line:2:5, col:13> col:5 Debug 'Level'
| | `-ConstantExpr 0x1b640a491d0 <col:13> 'int'
| |   |-value: Int 0
| |   `-IntegerLiteral 0x1b640a491b0 <col:13> 'int' 0
| |-EnumConstantDecl 0x1b642245648 <line:3:5> col:5 Info 'Level'
| |-EnumConstantDecl 0x1b6422456a8 <line:4:5> col:5 Warning 'Level'
| |-EnumConstantDecl 0x1b642245708 <line:5:5> col:5 referenced Error 'Level'
| `-EnumConstantDecl 0x1b6422457a8 <line:6:5, col:13> col:5 Fatal 'Level'
|   `-ConstantExpr 0x1b642245780 <col:13> 'int'
|     |-value: Int 3
|     `-DeclRefExpr 0x1b642245760 <col:13> 'int' EnumConstant 0x1b642245708 'Error' 'Level'
|-FunctionDecl 0x1b642245a28 <line:9:1, col:50> col:6 used log_message 'void (Level, const char *)'
| |-ParmVarDecl 0x1b642245848 <col:18, col:24> col:24 level 'Level'
| `-ParmVarDecl 0x1b6422458d0 <col:31, col:43> col:43 message 'const char *'
`-FunctionDecl 0x1b642245bb0 <line:11:1, line:14:1> line:11:5 main 'int ()'
  `-CompoundStmt 0x1b642245ee0 <col:12, line:14:1>
    `-CallExpr 0x1b642245e98 <line:12:5, col:55> 'void'
      |-ImplicitCastExpr 0x1b642245e80 <col:5> 'void (*)(Level, const char *)' <FunctionToPointerDecay>
      | `-DeclRefExpr 0x1b642245e00 <col:5> 'void (Level, const char *)' lvalue Function 0x1b642245a28 'log_message' 'void (Level, const char *)'
      |-DeclRefExpr 0x1b642245d40 <col:17, col:24> 'Level' EnumConstant 0x1b642245708 'Error' 'Level'
      | `-NestedNameSpecifier TypeSpec 'Level'
      `-ImplicitCastExpr 0x1b642245ec8 <col:31> 'const char *' <ArrayToPointerDecay>
        `-StringLiteral 0x1b642245dd0 <col:31> 'const char[23]' lvalue "something bad happened"
```
Enums are represented by two node types: `EnumDecl`, which corresponds to the enum declaration, and `EnumConstantDecl`, which represents the enum values.
We can infer that the `Level` enum is declared as an enum class, and that the underlying type is defaulted to an int.
If we had explicitly specified the underlying type, such as a `unsigned char` or `std::uint8_t` for a more compact representation, this would have also been reflected in the AST.

References to enum values are captured under a [`DeclRefExpr` node](https://clang.llvm.org/doxygen/classclang_1_1DeclRefExpr.html#details).
These nodes capture expressions that reference previously declared variables, functions, classes, and enums. 

### Enum Declarations
With our AST visitor configured, we can set up functions to visit `EnumDecl` and `EnumConstantDecl` nodes:
```cpp
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    // For visiting enum declarations
    bool VisitEnumDecl(clang::EnumDecl* node);
    bool VisitEnumConstantDecl(clang::EnumConstantDecl* node);
    // ...
};
```

The process for visiting AST nodes is largely the same.



## Preprocessor Directives

## Keywords





[Many IDEs also use this for syntax highlighting](https://clangd.llvm.org/).

There are many issues with this
Notice that PrismJS only applies syntax highlighting to the declaration of `MyStruct` on line 2. 
Subsequent uses, such as the one on line 9, are treated as plain tokens.
Without additional context, it is unclear how the `MyStruct` variable should be highlighted when using a tokenization approach
This likely stems from the difficulty of distinguishing whether a token represents a class name or a variable.
As shown above, it's perfectly valid to have a variable with the same name as a class (provided the class is properly scoped).


A similar issue arises with syntax highlighting for class members and static member variables.
While tokenization or regular expressions can provide a partially working solution, they fall short when parsing definitions of class member variables and inline member functions.
For example, one possible "solution" could be to annotate any tokens following a class access operator (`.` or `->`) as class members.

However, this solution quickly breaks down.
What about inline member function definitions, where the access operator `this->` isn't required (such as the `length` function on line 10)?
Or constructors, where parameters and class members may share the same name but should not be annotated as the same type?
Furthermore, a distinction needs be made for function calls, which use a similar syntax to member access but should be annotated differently.
A regular expression to capture all of these cases would already be needlessly complex.

## Contextualized Tokenization

A more effective approach would be to parse the **A**bstract **S**yntax **T**ree (AST) that is generated during compilation and add annotations to tokens based on the exposed symbols.
The Clang C/C++ compiler exposes [`libclang`](https://clang.llvm.org/doxygen/group__CINDEX.html), an API for parsing and traversing ASTs (which conveniently means I don't need to go through the trouble of [writing one from scratch]()).
Many IDEs also use this for syntax highlighting.

To better understand the structure of an AST, let's examine the one generated for the code snippet above.
We can do this by specifying the `-Xclang -ast-dump=json` flags during compilation:

The top-level node is always the translation unit, which serves as the root of the AST and represents the entire compiled C++ file.
In the JSON snippet above, only the first level of symbols is shown, with symbols from the `<cmath>` header omitted entirely for brevity.
Including all symbols expands the AST to 248,249 lines, out of which only 2,586 (~1%) are relevant to this example: 1,894 for `Vector3` and 692 for `dot`.

As expected, there are two nodes: a `CXXRecordDecl` node representing the definition of the `Vector3` struct and a `FunctionDecl` node representing the definition of the `dot` function.
The `inner` element of each node contains a list of its child nodes.
For the `Vector3` definition, this list includes:
1. A `CXXConstructorDecl` node for the constructor,
2. `CXXMethodDecl` nodes for the `length` and `normalize` member functions, and
3. `FieldDecl` nodes for the `x`, `y`, and `z` class member variables

Depending on their specific structure, each of these nodes may also contain child nodes of their own, highlighting the hierarchical tree structure of ASTs.
Below is a (greatly simplified) view of the full AST for the code snippet above, displaying the kind and name, and extent of each node:
Most node kinds are self-explanatory, except for two: `CompoundStmt` and `UnexposedRef`. Here is a brief overview of what these nodes represent:
- `CompoundStmt`: This node corresponds the body of a function, containing all symbols within the function body in its `inner` element.
- `UnexposedRef`: This node appears when an expression cannot be directly classified, is incomplete, or lacks enough context for precise classification by Clang.

For the purposes of this project, these nodes can safely be ignored. 
References to `CompoundStmt` and `UnexposedRef` nodes in the AST above were retained to maintain consistency, but all relevant information for syntax highlighting can be extracted from their children.
 
## Python

Below is a sample C++ code snippet showcasing a variety of language features.
Syntax highlighting is handled exclusively by PrismJS.

```cpp

#include <stdexcept> // std::runtime_error, std::out_of_range
#include <vector> // std::vector
#include <string> // std::string, std::to_string
#include <ctime> // std::tm, std::time_t, std::time, std::localtime
#include <sstream> // std::stringstream
#include <iostream> // std::cout
#include <cmath> // std::sqrt
#include <concepts> // std::input_or_output_iterator, std::sentinel_for,
                    // std::incrementable, std::same_as, std::convertible_to
#include <chrono> // std::chrono::high_resolution_clock

#define ASSERT(EXPRESSION, MESSAGE)        \
    if ([[operator,!]](EXPRESSION)) {                   \
        throw std::[[class-name,runtime_error]](MESSAGE); \
    }

namespace [[namespace-name,utility]] {

    template <typename ...[[class-name,Ts]]>
    [[nodiscard]] [[namespace-name,std]]::[[class-name,string]] concat(const [[class-name,Ts]][[plain,&]]... args) {
        [[namespace-name,std]]::[[class-name,stringstream]] ss;
        (ss [[operator,<<]] ... [[operator,<<]] args);
        return ss.str();
    }

    template <typename [[class-name,T]]>
    concept Container = requires([[class-name,T]] container) {
        // 1. container must have valid begin() / end()
        { [[namespace-name,std]]::begin(container) } -> [[namespace-name,std]]::[[concept,input_or_output_iterator]];
        { [[namespace-name,std]]::end(container) } -> [[namespace-name,std]]::[[concept,sentinel_for]]<decltype([[namespace-name,std]]::begin(container))>;
    
        // 2. container iterator must support equality comparison and be incrementable
        { [[namespace-name,std]]::begin(container) } -> [[namespace-name,std]]::[[concept,incrementable]];
    
        // 3. container iterator must be dereferenceable
        { [[operator,*]][[namespace-name,std]]::begin(container) } -> [[namespace-name,std]]::[[concept,same_as]]<typename [[class-name,T]]::[[class-name,value_type]][[plain,&]]>;
        
        // Optional checks for other common container properties
        // { container.empty() } -> std::convertible_to<bool>;
        // { container.size() } -> std::convertible_to<std::size_t>;
        // { container.clear() };
    };
    
    template <[[concept,Container]] [[class-name,C]]>
    [[nodiscard]] [[namespace-name,std]]::[[class-name,string]] to_string(const [[class-name,C]][[plain,&]] container) {
        [[namespace-name,std]]::[[class-name,stringstream]] ss;
        ss [[operator,<<]] "[ ";
        
        typename [[class-name,C]]::[[class-name,const_iterator]] end = [[namespace-name,std]]::end(container);
        for (typename [[class-name,C]]::[[class-name,const_iterator]] iter = [[namespace-name,std]]::begin(container); iter [[operator,!]]= end; [[operator,++]]iter) {
            ss [[operator,<<]] [[operator,*]]iter;
            if (iter [[operator,+]] 1 [[operator,!]]= end) {
                ss [[operator,<<]] ", ";
            }
        }
        
        ss [[operator,<<]] " ]";
        return ss.str();
    }
    
    enum class [[enum-name,Month]] : unsigned {
        [[enum-value,January]] = 1,
        [[enum-value,February]],
        [[enum-value,March]],
        [[enum-value,April]],
        [[enum-value,May]],
        [[enum-value,June]],
        [[enum-value,July]],
        [[enum-value,August]],
        [[enum-value,September]],
        [[enum-value,October]],
        [[enum-value,November]],
        [[enum-value,December]]
    };
    
    [[namespace-name,std]]::[[class-name,string]] to_string([[class-name,Month]] month) {
        static const [[namespace-name,std]]::[[class-name,string]] names[12] = {
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        };
        
        // Month indices start with 1
        return names[static_cast<[[namespace-name,std]]::[[class-name,underlying_type]]<[[class-name,Month]]>::[[class-name,type]]>(month) - 1];
    }
    
}

namespace [[namespace-name,math]] {

    struct Vector3 {
        // Constants
        static const [[class-name,Vector3]] [[member-variable,zero]];
        static const [[class-name,Vector3]] [[member-variable,up]];
        static const [[class-name,Vector3]] [[member-variable,forward]];
    
        Vector3() : [[member-variable,x]](0.0f), [[member-variable,y]](0.0f), [[member-variable,z]](0.0f) {
        }
    
        Vector3(float value) : [[member-variable,x]](value), [[member-variable,y]](value), [[member-variable,z]](value) {
        }
    
        Vector3(float x, float y, float z) : [[member-variable,x]](x), [[member-variable,y]](y), [[member-variable,z]](z) {
        }
        
        ~[[class-name,Vector3]]() = default;
    
        [[class-name,Vector3]] operator[[operator,+]](const [[class-name,Vector3]][[plain,&]] other) const {
            return { [[member-variable,x]] + other.[[member-variable,x]], [[member-variable,y]] + other.[[member-variable,y]], [[member-variable,z]] + other.[[member-variable,z]] };
        }
    
        [[class-name,Vector3]] operator[[operator,-]](const [[class-name,Vector3]][[plain,&]] other) const {
            return { [[member-variable,x]] - other.[[member-variable,x]], [[member-variable,y]] - other.[[member-variable,y]], [[member-variable,z]] - other.[[member-variable,z]] };
        }
    
        [[class-name,Vector3]] operator[[operator,*]](float s) const {
            return { [[member-variable,x]] * s, [[member-variable,y]] * s, [[member-variable,z]] * s };
        }
    
        [[class-name,Vector3]] operator[[operator,/]](float s) const {
            return { [[member-variable,x]] / s, [[member-variable,y]] / s, [[member-variable,z]] / s };
        }
    
        float operator[[operator,[]]]([[namespace-name,std]]::[[class-name,size_t]] index) const {
            // Temporarily cast away the const qualifier to avoid duplicating logic
            // Safe as non-const Vector3::operator[] does not modify the value
            return const_cast<[[class-name,Vector3]]*>(this)->operator[[operator,[]]](index);
        }
        
        float[[plain,&]] operator[[operator,[]]]([[namespace-name,std]]::[[class-name,size_t]] index) {
            if (index == 0) {
                return [[member-variable,x]];
            }
            else if (index == 1) {
                return [[member-variable,y]];
            }
            else if (index == 2) {
                return [[member-variable,z]];
            }
            else {
                throw [[namespace-name,std]]::[[class-name,out_of_range]]("index provided to Vector3::operator[] is out of bounds");
            }
        }
    
        // Returns the magnitude of the vector
        float length() const {
            return [[namespace-name,std]]::sqrt([[member-variable,x]] * [[member-variable,x]] + [[member-variable,y]] * [[member-variable,y]] + [[member-variable,z]] * [[member-variable,z]]);
        }
        
        [[member-variable,]]union {
            // For access as coordinates
            [[member-variable,]]struct {
                float [[member-variable,x]];
                float [[member-variable,y]];
                float [[member-variable,z]];
            };
            
            // For access as color components
            [[member-variable,]]struct {
                float [[member-variable,r]];
                float [[member-variable,g]];
                float [[member-variable,b]];
            };
        };
    };

    // Const class static members must be initialized out of line
    const [[class-name,Vector3]] [[class-name,Vector3]]::[[member-variable,zero]] = [[class-name,Vector3]]();
    
    // Depends on your coordinate system
    const [[class-name,Vector3]] [[class-name,Vector3]]::[[member-variable,up]] = [[class-name,Vector3]](0.0f, 1.0f, 0.0f);
    const [[class-name,Vector3]] [[class-name,Vector3]]::[[member-variable,forward]] = [[class-name,Vector3]](0.0f, 0.0f, [[operator,-]]1.0f);
    
    
    // Stream insertion operator
    [[namespace-name,std]]::[[class-name,ostream]][[plain,&]] operator<<([[namespace-name,std]]::[[class-name,ostream]][[plain,&]] os, const [[class-name,Vector3]][[plain,&]] vec) {
        os [[operator,<<]] "(" [[operator,<<]] vec.[[member-variable,x]] [[operator,<<]] ", " [[operator,<<]] vec.[[member-variable,y]] [[operator,<<]] ", " [[operator,<<]] vec.[[member-variable,z]] [[operator,<<]] ")";
        return os;
    }

    // Dot product
    float dot([[class-name,Vector3]] a, [[class-name,Vector3]] b) {
        return a.[[member-variable,x]] * b.[[member-variable,x]] + a.[[member-variable,y]] * b.[[member-variable,y]] + a.[[member-variable,z]] * b.[[member-variable,z]];
    }
    
    // Cross product
    [[class-name,Vector3]] cross([[class-name,Vector3]] a, [[class-name,Vector3]] b) {
        return {
            a.[[member-variable,y]] * b.[[member-variable,z]] - a.[[member-variable,z]] * b.[[member-variable,y]],
            a.[[member-variable,z]] * b.[[member-variable,x]] - a.[[member-variable,x]] * b.[[member-variable,z]],
            a.[[member-variable,x]] * b.[[member-variable,y]] - a.[[member-variable,y]] * b.[[member-variable,x]]
        };
    }
    
    // Returns a unit vector oriented in the same direction as 'v'
    [[class-name,Vector3]] normalize(const [[class-name,Vector3]][[plain,&]] v) {
        float length = v.length();
        ASSERT(length > 0.0f, "Vector3::normalize() called on vector of zero length");
        return v [[operator,/]] length;
    }

}

int main() {
    [[namespace-name,std]]::[[class-name,string]] str;


    // Prints "Hello, world!"
    str [[operator,=]] [[namespace-name,utility]]::concat("Hello", ",", " ", "world", "!");
    [[namespace-name,std]]::[[class-name,cout]] [[operator,<<]] str [[operator,<<]] '\n';


    // Prints "[ 0, 1, 2, 3, 4, 5 ]"
    [[namespace-name,std]]::[[class-name,vector]]<int> vec = { 0, 1, 2, 3, 4, 5 };
    str [[operator,=]] [[namespace-name,utility]]::to_string(vec);
    [[namespace-name,std]]::[[class-name,cout]] [[operator,<<]] str [[operator,<<]] '\n';


    // Prints today's date
    // For C++20 and above, use std::system_clock::now() and std::year_month_day
    [[namespace-name,std]]::[[class-name,time_t]] t = time(nullptr);
    [[namespace-name,std]]::[[class-name,tm]]* local = localtime([[operator,&]]t);

    int year = 1900 + local->[[member-variable,tm_year]];
    [[namespace-name,utility]]::[[class-name,Month]] month = static_cast<[[namespace-name,utility]]::[[class-name,Month]]>(1 + local->[[member-variable,tm_mon]]);
    int day = local->[[member-variable,tm_mday]];
    
    [[namespace-name,std]]::[[class-name,string]] suffix;
    switch (day) {
        case 1:
            suffix [[operator,=]] "st";
            break;
        case 2:
            suffix [[operator,=]] "nd";
            break;
        case 3:
            suffix [[operator,=]] "rd";
            break;
        default:
            suffix [[operator,=]] "th";
            break;
    }

    str [[operator,=]] [[namespace-name,utility]]::concat("Today is ", [[namespace-name,utility]]::to_string(month), " ", day, suffix, ", ", year);
    [[namespace-name,std]]::[[class-name,cout]] [[operator,<<]] str [[operator,<<]] '\n';

    
    // Determine the orthonormal basis for the given forward vector (assuming (0, 1, 0) is up)
    [[namespace-name,math]]::[[class-name,Vector3]] up = [[namespace-name,math]]::[[class-name,Vector3]]::[[member-variable,up]];
    [[namespace-name,math]]::[[class-name,Vector3]] forward = [[namespace-name,math]]::normalize([[namespace-name,math]]::[[class-name,Vector3]](0.75f, 0.12f, 3.49f)); // Arbitrary
    [[namespace-name,math]]::[[class-name,Vector3]] right = [[namespace-name,math]]::cross(forward, up);
    
    str [[operator,=]] [[namespace-name,utility]]::concat("The cross product of vectors ", up, " and ", forward, " is ", right);
    [[namespace-name,std]]::[[class-name,cout]] [[operator,<<]] str [[operator,<<]] '\n';
    
    [[namespace-name,std]]::[[namespace-name,chrono]]::[[class-name,time_point]] now = [[namespace-name,std]]::[[namespace-name,chrono]]::[[class-name,high_resolution_clock]]::now();
    
    using namespace [[namespace-name,utility]];
    
    using [[class-name,VecVec]] = [[namespace-name,std]]::[[class-name,vector]]<[[namespace-name,math]]::[[class-name,Vector3]]>;
    using [[class-name,Integer]] = int;
    typedef int [[class-name,MyInteger]];
    
    return 0;
}

```

Several areas of the current syntax highlighting are either incorrect or could be improved.
The solution I developed involves adding extra annotations to the source code to give the rendering engine hints on what color to highlight tokens with.

Let's start simple and gradually build up more complex cases.

### Keywords
Prism is generally pretty accurate when annotating keywords.
However, it struggles with C++ style casts: 
```cpp
// static_cast: for type conversions between related types
int i = 42;
double d = static_cast<double>(i);

// reinterpret_cast: for (re)interpreting the low-level bitwise representation as a different type
const char* cc = reinterpret_cast<const char*>(&i);

// const_cast: for adding / removing the const qualifier from a variable
char* c = const_cast<char*>(cc);

// dynamic_cast: for traversing up / down class hierarchies
struct [[class-name,Base]] { };
struct [[class-name,Derived]] : public [[class-name,Base]] { };

[[class-name,Base]]* b = new [[class-name,Derived]]();
[[class-name,Derived]]* d = dynamic_cast<[[class-name,Derived]]*>(b);
```
These tokens are highlighted as functions, when they should be highlighted as language keywords.
This likely occurs because Prism identifies functions based on the presence of parentheses `()`.
As C++ style casts are always followed by parentheses, which enclose the expression being cast, Prism misinterprets these tokens and automatically annotates them as names of functions.

One viable solution would be to use a regular expression to match directly against C++ style casts:
```cpp
\[[plain,b]](const_cast|dynamic_cast|reinterpret_cast|static_cast)\b
```
The regular expression would need to be modified to ignore keywords within comments and strings, to ensure that only keywords in the code are highlighted.

Fortunately, the use of regular expressions can be avoided altogether.
With the help of the `CXTokenKind` enum, annotating keywords becomes a matter of iterating over a cursor's tokens and filtering those identified by Clang's lexer as having the `CXToken_Keyword` kind.
```cpp line-numbers:{enable}
[[keyword,void]] parse_keywords() {
    // Use a stack for a DFS traversal of the AST
    [[namespace-name,std]]::[[class-name,stack]]<[[class-name,CXCursor]]> cursors;
    [[member-variable,]]cursors.push(clang_getTranslationUnitCursor([[member-variable,m_translation_unit]]));
    
    [[keyword,while]] (![[member-variable,]]cursors.empty()) {
        [[class-name,CXCursor]] cursor = [[member-variable,]]cursors.top();
        [[member-variable,]]cursors.pop();

        [[class-name,CXSourceLocation]] location = clang_getCursorLocation(cursor);

        // Retrieve the filepath in which this cursor is defined
        [[class-name,CXFile]] file;
        clang_getSpellingLocation(location, &file, [[keyword,nullptr]], [[keyword,nullptr]], [[keyword,nullptr]]);
        [[class-name,String]] filepath = clang_getFileName(file);
        [[keyword,if]] (filepath != [[member-variable,m_filepath]]) {
            // There is no point in annotating tokens for cursors that come from included files,
            // so skip these entirely
            [[keyword,continue]];
        }

        [[class-name,CXSourceRange]] extent = clang_getCursorExtent(cursor);

        // Retrieve tokens for this cursor
        [[keyword,unsigned]] num_tokens;
        [[class-name,CXToken]]* tokens;
        clang_tokenize([[member-variable,m_translation_unit]], extent, &tokens, &num_tokens);
        
        [[keyword,for]] ([[keyword,unsigned]] i = 0; i < num_tokens; ++i) {
            [[keyword,const]] [[class-name,CXToken]]& token = tokens[i];
            [[class-name,CXTokenKind]] kind = clang_getTokenKind(tokens[i]);
            [[class-name,String]] name = clang_getTokenSpelling([[member-variable,m_translation_unit]], token);
            
            // Retrieve the source location of the token
            [[class-name,CXSourceLocation]] location = clang_getTokenLocation([[member-variable,m_translation_unit]], token);
            [[keyword,unsigned]] line, column, offset;
            clang_getSpellingLocation(location, &file, &line, &column, &offset);

            [[keyword,if]] (kind == CXToken_Keyword) {
                // Found a language keyword
                add_annotation("keyword", line, column, name.length());
            }
        }
        
        // Cleanup
        clang_disposeTokens([[member-variable,m_translation_unit]], tokens, num_tokens);
        
        // Visit children
        clang_visitChildren(cursor, 
            []([[class-name,CXCursor]] child, [[class-name,CXCursor]] /* parent */, [[class-name,CXClientData]] user_data) -> [[class-name,CXChildVisitResult]] {
                [[keyword,static_cast]]<[[namespace-name,std]]::[[class-name,stack]]<[[class-name,CXCursor]]>*>(user_data)->push(child);
                [[keyword,return]] [[enum-value,CXChildVisit_Continue]];
            }, &cursors);
    }
}
```

### Namespaces

By default, namespace declarations (including `using namespace`) and aliases are not annotated.
```cpp
namespace math {
    struct [[class-name,Vector3]] {
        float x;
        float y;
        float z;
    };
}

namespace inner {
    namespace detail {
    }
}

int main() {
    using namespace inner::detail;
    ...
    
    math::[[class-name,Vector3]] up { 0.0f, 1.0f, 0.0f };
}
```
However, annotating namespace names is similar to annotating keywords.
Instead of iterating over each cursor's tokens, namespaces can be identified by iterating directly over the cursors themselves.

```cpp
[[keyword,void]] parse_namespaces() {
    [[namespace-name,std]]::[[class-name,stack]]<[[class-name,CXCursor]]> cursors;
    cursors.push(clang_getTranslationUnitCursor(m_translation_unit));
    
    [[keyword,while]] (!cursors.empty()) {
        [[class-name,CXCursor]] cursor = cursors.top();
        cursors.pop();
        
        // Retrieve the filepath in which this cursor is defined
        [[class-name,CXFile]] file;
        clang_getSpellingLocation(location, &file, [[keyword,nullptr]], [[keyword,nullptr]], [[keyword,nullptr]]);
        [[class-name,String]] filepath = clang_getFileName(file);
        [[keyword,if]] (filepath != [[member-variable,m_filepath]]) {
            // There is no point in annotating tokens for cursors that come from included files,
            // so skip these entirely
            [[keyword,continue]];
        }

        [[class-name,CXCursorKind]] kind = clang_getCursorKind(cursor);
        
        [[keyword,if]] (kind == [[enum-value,CXCursor_Namespace]] ||
            kind == [[enum-value,CXCursor_NamespaceAlias]] ||
            kind == [[enum-value,CXCursor_NamespaceRef]]) {
            [[class-name,CXSourceLocation]] location = clang_getCursorLocation(cursor);
            [[class-name,CXFile]] file;
            [[keyword,unsigned]] line, column, offset;
            clang_getSpellingLocation(location, &file, &line, &column, &offset);
            
            [[class-name,String]] name = clang_getCursorSpelling(cursor);
            
            // Do not annotate tokens that are outside the file being parsed (header)
            [[class-name,String]] filepath = clang_getFileName(file);
            [[keyword,if]] (filepath == [[member-variable,m_filepath]]) {
                add_annotation("namespace-name", line, column, name.length());
            }
        }
        
        // Visit children
        clang_visitChildren(cursor, 
            []([[class-name,CXCursor]] child, [[class-name,CXCursor]] /* parent */, [[class-name,CXClientData]] user_data) -> [[class-name,CXChildVisitResult]] {
                [[keyword,static_cast]]<[[namespace-name,std]]::[[class-name,stack]]<[[class-name,CXCursor]]>*>(user_data)->push(child);
                [[keyword,return]] [[enum-value,CXChildVisit_Continue]];
            }, &cursors);
    }
}
```
### Enums

### Unions

### Classes

Ironically, a lot of the code written for this post is not written in C++, meaning I must resort to sample C++ code for showcasing the custom functionality. When/if a better solution for some of the more complex use cases comes out

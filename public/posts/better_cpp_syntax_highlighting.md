
*Reader beware: this post is actively being worked on!*



I created this blog to have a place to discuss interesting problems I encounter while working on my personal projects.
Many of these projects, particularly those focused on computer graphics, are written in C++.

One problem I wanted to tackle was syntax highlighting, as I often use code snippets in my explanations and wanted them to be easily readable.
Initially, I integrated [PrismJS](https://prismjs.com/) - a popular library for syntax highlighting in browsers - into my Markdown renderer.
However, I quickly discovered that PrismJS struggles with properly highlighting C++ code.

Consider the following example, which showcases a variety of C++20 features I commonly use.
Syntax highlighting is handled exclusively by PrismJS:
```cpp line-numbers:{enabled} show-lines:{20}
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
    Color color(253, 164, 15);

    str = utility::concat("My favorite color is: ", color);
    std::cout << str << '\n';
    
    
    return 0;
}
```
Unfortunately, there are several issues with the syntax highlighting. 

- **User-defined types**: Only declarations of custom types are recognized as classes, with subsequent uses treated as plain tokens.
Examples of are the `Container` concept on line 27 and the `Vector3` struct on line 90.
This also extends to type aliases, such as `Color` on line 283, and all standard library types. 

- **Enums**: As with user-defined types, only declarations of enums are highlighted properly.
An example of this is the definition of the `Month` enum on line 61.
Enum values, such as the month names in the `Month` enum definition, are also highlighted as plain tokens.

- **Class member variables**: Class member declarations and references in member function bodies are highlighted as plain tokens.
Examples of this can be seen with references to `x`, `y`, and `z` member variables throughout the definition of the `Vector3` class.

- **Functions**: Preprocessor definitions, constructors, and C++-style casts are incorrectly highlighted as function calls.
Examples of this are the use of the `ASSERT` macro on line 197, the `Color` constructor on line 284, and uses of C++-style casts `static_cast` and `const_cast` on lines 83 and 226 and line 126, respectively.

- **Namespaces**: Namespace declarations, as well as namespace qualifiers on types and functions, are highlighted as plain tokens.
Examples of this are definitions of the `utility` namespace on line 17 or the `math` namespace on line 88, as well as the `std` qualifier on standard library types.
This also extends to `using namespace` declarations and namespace aliases, such as `using namespace std::chrono` on line 218.

- **Templates**: As with user-defined types, type names in template definitions, specializations, and instantiations are highlighted as plain tokens.
This extends to C++20 concepts, such as the `Container` concept on line 27.

- **Operators**: Certain characters are highlighted as operators.
For example, lvalue and rvalue references are highlighted as the address-of operator, pointers as the multiplication operator, and template angle brackets as comparison operators.

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

While this example may be contrived, it sheds light on the fundamental issue of syntax highlighting with `PrismJS`: it is difficult to reason about the structure of the code by only looking at individual tokens.
I believe this to be the reason for the issues pointed out above.
Syntax highlighting for C++ requires additional context.
Even tokens with the same spelling may need to be highlighted differently based on the context they appear in.
What if we want to extract member variables of a given class?
How do we distinguish between local variables and class members?
What about types that we don't have definitions for, such as those included from third-party dependencies or the standard library?
Approaches like using regular expressions or rule-based syntax highlighting quickly grow convoluted, posing a challenge from standpoints in both readability and long-term maintenance.

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

class Consumer final : public clang::ASTConsumer {
    public:
        explicit Consumer(clang::CompilerInstance& compiler, clang::StringRef filepath);
        ~Consumer() override;
        
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
    return ![[namespace-name,clang]]::[[namespace-name,tooling]]::runToolOnCodeWithArgs([[namespace-name,std]]::make_unique[[plain,<]][[class-name,SyntaxHighlighter]][[plain,>]](), source, compilation_flags, filepath);
}
```

### Inserting annotations

One of the other responsibilities of our `ASTConsumer` is adding syntax highlighting annotations to the source code.
An annotation follows the structure: `[[{AnnotationType},{Tokens}]]`, where `AnnotationType` determines the CSS class applied to one or more `Tokens`.
The annotations are embedded directly into the source code and later extracted from code blocks by a custom Markdown renderer, which applies CSS styles to transform them into styled elements.

Annotations provide hints to the Markdown renderer on how to apply syntax highlighting to symbols `PrismJS` cannot accurately identify.
For example, the following snippet demonstrates a few common C++ annotation types: `namespace-name` for namespaces, `class-name` for classes, and `function` for functions.
```text
namespace [[namespace-name,math]] {
    struct [[class-name,Vector3]] {
        // ... 
    };
    
    float [[function,dot]](const [[class-name,Vector3]]& a, const [[class-name,Vector3]]& b) {
        // ... 
    }
}
```
These annotations exist only in the Markdown source.
When processed, they are removed, and the enclosed tokens are assigned the corresponding CSS styles.
For the purposes of syntax highlighting, these styles simply correspond to the color these elements should have:
```css
.language-cpp .function {
    color: rgb(255, 198, 109);
}

.language-cpp .class-name,
.language-cpp .namespace-name {
    color: rgb(181, 182, 227);
}
```
As we traverse the AST, we will define additional annotation types as needed.
It follows that there should be a corresponding CSS style for every annotation type.

If you are interested, I've written a [short post]() about how this is implemented in the renderer (the same one being used for this post!).

#### The `Annotator`
All logic for inserting annotations is contained within the `Annotator` class:
```cpp line-numbers:{enabled} title:{annotator.hpp}
#include <unordered_map> // std::unordered_map
#include <vector> // std::vector
#include <string> // std::string

struct [[class-name,Annotation]] {
    [[function,Annotation]](const char[[punctuation,*]] name, unsigned start, unsigned length);
    [[punctuation,~]][[function,Annotation]]();

    const char[[punctuation,*]] [[member-variable,name]];
    unsigned [[member-variable,start]];
    unsigned [[member-variable,length]];
};

class [[class-name,Annotator]] {
    public[[punctuation,:]]
        explicit [[function,Annotator]]([[namespace-name,std]]::[[class-name,string]] file);
        [[punctuation,~]][[function,Annotator]]();
    
        void insert_annotation(const char[[punctuation,*]] name, unsigned line, unsigned column, unsigned length, bool overwrite = false);
        void annotate();

    private[[punctuation,:]]
        [[namespace-name,std]]::[[class-name,string]] [[member-variable,m_file]];
        [[namespace-name,std]]::[[class-name,unordered_map]][[punctuation,<]]unsigned, [[namespace-name,std]]::[[class-name,vector]][[punctuation,<]][[class-name,Annotation]][[punctuation,>]][[punctuation,>]] [[member-variable,m_annotations]];
};
```
This class stores annotations in the `m_annotations` map, which associates a line number to a list of annotations for that line.

The `insert_annotation` function simply registers a new `Annotation` with the given name and source location.
Annotations cannot be overwritten unless `overwrite` flag is explicitly specified - two annotations cannot correspond to the same token, as it would create ambiguity regarding which CSS style should be applied.
```cpp line-numbers:{enabled} title:{annotator.cpp}
#include "annotator.hpp"

void [[class-name,Annotator]]::[[function,insert_annotation]](const char[[punctuation,*]] name, unsigned line, unsigned column, unsigned length, bool overwrite) {
    // Do not add duplicate annotations of the same name at the same location
    // Note: line and column numbers returned from Clang's AST start with 1
    for ([[class-name,Annotation]][[punctuation,&]] annotation [[punctuation,:]] [[member-variable,m_annotations]][[operator,[]]line - 1[[operator,]]]) {
        if (annotation.[[member-variable,start]] == (column - 1)) {
            if (overwrite) {
                annotation.[[member-variable,name]] = name;
                annotation.[[member-variable,length]] = length;
            }

            return;
        }
    }

    [[member-variable,m_annotations]][[operator,[]]line - 1[[operator,]]].[[function,emplace_back]](name, column - 1, length);
}
```

After AST traversal is complete, the final annotated source file is generated by a call to `annotate`.
```cpp title:{annotator.cpp}
#include "annotator.hpp"

void [[class-name,Annotator]]::[[function,annotate]]() {
    // Read source file contents
    [[namespace-name,std]]::[[class-name,vector]][[punctuation,<]][[namespace-name,std]]::[[class-name,string]][[punctuation,>]] lines = [[function,read]]([[member-variable,m_file]]);

    for (auto[[punctuation,&]] [line, annotations] [[punctuation,:]] [[member-variable,m_annotations]]) {
        // Insert annotations in reverse order so that positions of subsequent annotation are not affected
        [[namespace-name,std]]::[[function,sort]](annotations.[[function,begin]](), annotations.[[function,end]](), [](const [[class-name,Annotation]][[punctuation,&]] a, const [[class-name,Annotation]][[punctuation,&]] b) -> bool {
            return a.[[member-variable,start]] < b.[[member-variable,start]];
        });

        // Precompute the final length of the string

        // Insert annotations
        for (const [[class-name,Annotation]][[punctuation,&]] annotation [[punctuation,:]] annotations) {
            [[namespace-name,std]]::[[class-name,string]] src = lines[[operator,[]]line[[operator,]]].[[function,substr]](annotation.[[member-variable,start]], annotation.[[member-variable,length]]);

            // Annotation format: [[{AnnotationType},{Tokens}]]
            lines[[operator,[]]line[[operator,]]].[[function,replace]](annotation.[[member-variable,start]], annotation.[[member-variable,length]], [[namespace-name,utils]]::[[function,format]]("[[{},{}]]", annotation.[[member-variable,name]], src));
        }
    }

    // Write modified output file contents
    [[function,write]]("result.txt", lines);
}
```
Before being inserted, all annotations for a line are sorted by their location in **reverse order**.
Since the children of an AST node are not guaranteed to be on the same level of the AST, determining the order (and location) of annotations for these nodes is not straightforward.
Additionally, adding an annotation modifies the length of the line, which shifts the positions of any annotations that follow.
Sorting the annotations beforehand removes the need to adjust offsets after each insertion.

Once the annotations are inserted, the modified file is written out and saved to disk.
The generated code snippet can now be embedded directly into a Markdown source file, where annotations will be processed by the renderer for syntax highlighting.

### Tokenization

With the logic to insert annotations into the source code implemented, the next task is to implement a way to retrieve a subset of tokens that are contained within a `SourceRange`.
Why?
In some cases, determining the exact location of a symbol is not always straightforward.
In general, while we usually know what symbol(s) we are looking for, the corresponding AST node does not always provide a direct way to retrieve their location(s).
It does, however, include a way to retrieve the range of the node - spanning from a start to an end `SourceLocation` - which greatly helps us narrow down our search.
By tokenizing the source file and storing tokens in a structured manner, we can efficiently retrieve those that fall within the given `SourceRange` of an AST node without having to traverse every token of the file every time.
We can then check against the spelling of the token until we find one that matches that of the symbol we are looking for.

For example, a `CallExpr` node only provides the location of the corresponding function invocation.
If we want to annotate any namespace qualifiers on the function call, such as the `std` in `std::sort`, one possible workaround is to tokenize the node's `SourceRange` and compare the tokens against the namespace names extracted from the function's *declaration*.
We will explore this in greater detail when we look at visitor function implementations.

Tokenization is handled by the `Tokenizer` class.
```cpp line-numbers:{enabled} title:{tokenizer.hpp}
#include <clang/Frontend/CompilerInstance.h> // clang::CompilerInstance
#include <clang/AST/ASTConsumer.h> // clang::ASTConsumer
#include <string> // std::string
#include <vector> // std::vector

struct Token {
    Token(std::string spelling, unsigned line, unsigned column);
    ~Token();
    
    std::string spelling;
    unsigned line;
    unsigned column;
};

class Tokenizer {
    public:
        explicit Tokenizer(clang::ASTContext* context);
        ~Tokenizer();
        
        [[nodiscard]] std::span<const Token> get_tokens(clang::SourceLocation start, clang::SourceLocation end) const;
        [[nodiscard]] std::span<const Token> get_tokens(clang::SourceRange range) const;
        
    private:
        void tokenize();
        
        clang::ASTContext* m_context;
        std::vector<Token> m_tokens;
};
```
We can leverage Clang's `Lexer` class from the LibTooling API to handle tokenization.
The `Lexer` provides an API to process an input text buffer into a sequence of tokens based on a set of predetermined C/C++ language rules.
Raw tokens for the code snippet are stored contiguously in `m_tokens`, allowing the `get_tokens` functions to return a non-owning `std::span` instead of copying token data into a separate buffer.
This helps avoid unnecessary allocations and provides a significant boost to performance, as the `get_tokens` functions are called frequently during the traversal of the AST, 

Tokenization is handled by the `tokenize` function:
```cpp line-numbers:{enabled} title:{tokenizer.cpp}
void Tokenizer::tokenize() {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    
    clang::FileID file = source_manager.getMainFileID();
    clang::SourceLocation file_start = source_manager.getLocForStartOfFile(file);
    clang::LangOptions options = m_context->getLangOpts();
    
    clang::StringRef source = source_manager.getBufferData(file);
    clang::Lexer lexer(file_start, options, source.begin(), source.begin(), source.end());

    // Tokenize the entire file
    clang::Token token;
    while (true) {
        lexer.LexFromRawLexer(token);
        if (token.is(clang::tok::eof)) {
            break;
        }
        
        clang::SourceLocation location = token.getLocation();
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);

        m_tokens.emplace_back(clang::Lexer::getSpelling(token, source_manager, options), line, column);
    }
}
```
The heavy lifting in this function is done by `Lexer::LexFromRawLexer`, which returns the next token from the input buffer.
Tokens are converted into lightweight `Token` instances and stored in `m_tokens`.

Since lexing happens after preprocessing, any whitespace tokens and comments are already removed.
If desired, this behavior can be modified before lexing occurs: the `SetKeepWhitespaceMode` and `SetCommentRetentionState` functions from the `Lexer` enable the tokenization of whitespace and comments, respectively.
Other properties, such as the source file to process and [C/C++ language options](https://clang.llvm.org/doxygen/LangOptions_8h_source.html), are specified on initialization and cannot be changed later.
To keep things simple, these are retrieved directly from the `ASTContext`, which is configured by the arguments passed to `runToolOnCodeWithArgs`.

Now that the source file has been tokenized, let's turn our attention to `get_tokens`.
There are two version of this function: one takes a `start` and `end` `SourceLocation`, while the other accepts a `SourceRange`.
This is done purely for convenience: internally, the `SourceRange` overload forwards the call to the other version, passing the start and end locations extracted using `getBegin()` and `getEnd()`, respectively.
```cpp line-numbers:{enabled} title:{tokenizer.cpp}
std::span<const Token> Tokenizer::get_tokens(clang::SourceRange range) const {
    return get_tokens(range.getBegin(), range.getEnd());
}
```

A key consideration when retrieving tokens is that the provided range may span multiple lines.
A good example of this is a `FunctionDecl` node, which represents a multi-line function definition.
```cpp line-numbers:{enabled} title:{tokenizer.cpp}
std::span<const Token> Tokenizer::get_tokens(clang::SourceLocation start, clang::SourceLocation end) const {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    unsigned start_line = source_manager.getSpellingLineNumber(start);
    unsigned start_column = source_manager.getSpellingColumnNumber(start);

    // Determine tokens that fall within the range defined by [start:end]
    // Partial tokens (if the range start location falls within the extent of a token) should also be included here

    unsigned offset = m_tokens.size(); // Invalid offset
    for (std::size_t i = 0; i < m_tokens.size(); ++i) {
        const Token& token = m_tokens[i];

        // Skip any tokens that end before the range start line:column
        if (token.line < start_line || (token.line == start_line && (token.column + token.spelling.length()) <= start_column)) {
            continue;
        }

        offset = i;
        break;
    }

    unsigned count = 0;
    unsigned end_line = source_manager.getSpellingLineNumber(end);
    unsigned end_column = source_manager.getSpellingColumnNumber(end);

    for (std::size_t i = offset; i < m_tokens.size(); ++i) {
        const Token& token = m_tokens[i];

        // Skip any tokens that start after the range end line:column
        if (token.line > end_line || token.line == end_line && token.column > end_column) {
            break;
        }

        ++count;
    }

    // Return non-owning range of tokens
    return { m_tokens.begin() + offset, count };
}
```
The main challenge of `get_tokens` is properly accounting for partial tokens - those that overlap the range specified by `start` and `end` - in the result.
The function begins by locating the first token that starts at or after `start`.
It then iterates through the tokens until it encounters one that begins after `end`, keeping track of all the tokens in between (those within the range).
The resulting `std::span` contains a view of all tokens that overlap the given range.
If `start` or `end` does not align with a token boundary, any tokens that straddle the range - either starting before but extending past `start`, or starting before but continuing past `end` - are also included.

The `Annotator` and `Tokenizer` are added as member variables of the `ASTFrontendAction` class.

#### A more efficient approach

The current annotation approach offers several optimization opportunities.
Since annotations are inserted sequentially, we risk incurring unnecessary overhead due to repeated reallocations, especially for lines with a large number of annotations.
Given that the annotation format is already defined, we can precompute the final length of each line (including all annotations) and pre-allocate the necessary space upfront.
This allows us to copy characters directly into the string while formatting each annotation as it is encountered, reducing memory overhead and improving runtime efficiency.
```cpp line-numbers:{enabled} title:{annotator.cpp}
#include "annotator.hpp"

std::vector<std::string> read(const std::string& filename);
void write(const std::string& filename, const std::vector<std::string>& lines);

void Annotator::annotate() {
    // Read source file contents
    std::vector<std::string> lines = read(m_file);
    
    for (auto& [line, annotations] : m_annotations) {
        // Sort annotations in reverse order so that inserting an annotation does not affect the positions of subsequent annotations
        std::sort(annotations.begin(), annotations.end(), [](const Annotation& a, const Annotation& b) -> bool {
            return a.start < b.start;
        });
        
        const std::string& src = lines[line];
        
        // Precompute the final length of the string
        std::size_t length = src.length();
        for (const Annotation& annotation : annotations) {
            // Annotation format: [[{AnnotationType},{Tokens}]]
            // '[[' + {AnnotationType} + ',' + {Tokens} + ']]'
            length += 2 + strlen(annotation.name) + 1 + annotation.length + 2;
        }

        // Preallocate result string
        std::string result;
        result.reserve(length);
        
        std::size_t position = 0;
        for (const Annotation& annotation : annotations) {
            // Copy the part before the annotation
            result.append(src, position, annotation.start - position);
            
            // Insert annotation
            result.append("[[");
            result.append(annotation.name);
            result.append(",");
            result.append(src, annotation.start, annotation.length);
            result.append("]]");
    
            // Move offset past annotation
            position = annotation.start + annotation.length;
        }
    
        // Copy any trailing characters after the last annotation
        result.append(src, position, src.length() - position);
        
        lines[line] = result;
    }

    // Write modified output file contents
    write("result.txt", lines);
}
```
The `read` function loads the file’s contents into memory as individual lines, while `write` saves the modified contents back to disk.
The implementation of these functions is straightforward and omitted from the code snippet for brevity.

But why stop there?
If we can precompute the final length of each line, we can just as easily determine the final length of the entire file.
By doing so, we only need to allocate memory once, further reducing memory overhead and allowing us to write the entire file in a single operation rather than line by line.

Additionally, we can optimize how annotations are stored to improve memory usage and cache efficiency.
Instead of sorting the annotations in each line individually, we sort the entire `m_annotations` structure at once - reducing the number of calls to `std::sort` from one per line to just one for the entire file.

To achieve this, we need to change the way annotations are represented.
Instead of using a `std::unordered_map`, we'll use an `std::vector` to store annotations contiguously in memory.
While this change removes the ability to do direct line-based lookups, this was only useful for knowing which line an annotation belongs to.
Rather than tracking annotations by line and column, we can compute and store each annotation’s offset within the file directly.

Below is the new interface for our `Annotator`:
```cpp line-numbers:{enabled} added:{23,24,27} modified:{6,10,28} removed:{2} title:{annotator.hpp}
#include <string> // std::string
#include <unordered_map> // std::unordered_map
#include <vector> // std::vector

struct Annotation {
    Annotation(const char* name, unsigned offset, unsigned length);
    ~Annotation();
    
    const char* name;
    unsigned offset;
    unsigned length;
};

class Annotator {
    public:
        explicit Annotator(std::string file);
        ~Annotator();
        
        void insert_annotation(const char* name, unsigned line, unsigned column, unsigned length, bool overwrite = false);
        void annotate();
        
    private:
        void compute_line_lengths();
        [[nodiscard]] std::size_t compute_offset(unsigned line, unsigned column) const;
    
        std::string m_file;
        std::vector<unsigned> m_line_lengths;
        std::vector<Annotation> m_annotations;
};
```
To compute the offset given a line and column number, we need to keep track of the lengths of each line.
This is achieved by iterating through the file and calculating the length of each line:
```cpp line-numbers:{enabled} title:{annotator.cpp}
#include "annotator.hpp"

// Returns a string containing the contents of the file
std::string read(const std::string& filename);

Annotator::Annotator(const std::string& file) {
    // Read source file contents
    m_file = read(file);
    compute_line_lengths();
}

void Annotator::compute_line_lengths() {
    std::size_t start = 0;

    // Traverse through the string and count lengths of lines separated by newlines
    for (std::size_t i = 0; i < m_file.size(); ++i) {
        if (m_file[i] == '\n') {
            // Include newline character in line length calculation
            // Note: automatically accounts for the carriage return (\r) character on Windows
            m_line_lengths.push_back(i - start + 1);
            start = i + 1;
        }
    }

    // Add any trailing characters (if the file does not end in a newline)
    if (start < m_file.size()) {
        m_line_lengths.push_back(m_file.size() - start);
    }
}
```
Once we have this information, we can determine the offset of an annotation by summing the lengths of all preceding lines and adding the column index within the target line.
```cpp line-numbers:{enabled} title:{annotator.cpp}
#include "annotator.hpp"

std::size_t Annotator::compute_offset(unsigned line, unsigned column) {
    std::size_t offset = 0;
    for (std::size_t i = 0; i < line; ++i) {
        // m_line_lengths[i] stores the length of line i (newline included)
        offset += m_line_lengths[i];
    }
    return offset + column;
}
```

The `insert_annotation` implementation is updated to compute the offset instead of relying on the annotation's line and column directly:
```cpp line-numbers:{enabled} added:{4} modified:{7-8,18} title:{annotator.cpp}
#include "annotator.hpp"

void Annotator::insert_annotation(const char* name, unsigned line, unsigned column, unsigned length, bool overwrite) {
    std::size_t offset = compute_offset(line, column);
    
    // Do not add duplicate annotations of the same name at the same location
    for (Annotation& annotation : m_annotations) {
        if (annotation.offset == offset) {
            if (overwrite) {
                annotation.name = name;
                annotation.length = length;
            }
            
            return;
        }
    }
    
    m_annotations.emplace_back(name, offset, length);
}
```

Finally, we integrate all these optimizations into the `annotate` function:
```cpp line-numbers:{enabled} title:{annotator.cpp}
#include "annotator.hpp"

std::string read(const std::string& filename);
void write(const std::string& filename, const std::string& contents);

void Annotator::annotate() {
    // Read source file contents
    std::string src = read(m_file);
    
    // Sort annotations in reverse order so that inserting an annotation does not affect the positions of subsequent annotations
    std::sort(m_annotations.begin(), m_annotations.end(), [](const Annotation& a, const Annotation& b) -> bool {
        return a.offset < b.offset;
    });
    
    // Precompute the final length of the file
    std::size_t length = src.length();
    for (const Annotation& annotation : m_annotations) {
        // Annotation format: [[{AnnotationType},{Tokens}]]
        // '[[' + {AnnotationType} + ',' + {Tokens} + ']]'
        length += 2 + strlen(annotation.name) + 1 + annotation.length + 2;
    }
    
    // Preallocate string
    std::string result;
    result.reserve(length);
        
    std::size_t position = 0;
    for (const Annotation& annotation : m_annotations) {
        // Copy the part before the annotation
        result.append(src, position, annotation.offset - position);
        
        // Insert annotation
        result.append("[[");
        result.append(annotation.name);
        result.append(",");
        result.append(src, annotation.offset, annotation.length);
        result.append("]]");

        // Move offset into 'src'
        position = annotation.offset + annotation.length;
    }

    // Copy the remaining part of the line
    result.append(src, position, src.length() - position);

    // Write modified output file contents
    write("result.txt", result);
}
```
Note that the `read` and `write` functions have been updated to operate directly on the file's contents, rather than handling it as a collection of individual lines.

Below is a comparison of the performance of the initial implementation against the optimized version, evaluating the effectiveness of the optimizations made in this section.
This test was run on the code snippet at the beginning of this post, which contains approximately 300 annotations.

Without optimizations:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`annotate`: ~1.113 milliseconds  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;tool: ~1,224 milliseconds

With optimizations:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`annotate`: ~0.475 milliseconds  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;tool: ~1.146 seconds

Performance measurements were collected using a simple timestamping approach with `std::chrono::high_resolution_clock`.
This method was chosen because many Windows profilers require debug information in PDB files, which are not generated when building with Clang/MSYS2/MinGW.
Even with the `-g` compilation flag specified, profilers output raw memory addresses instead of function names, making it difficult to associate symbols with their corresponding functions.
While this is not the most precise method, it effectively illustrates the differences in performance for this section.

With optimizations included, the runtime of `annotate` has been reduced by approximately 57.4%, leading to an overall tool runtime reduction of 6.4%.
As expected, the overall runtime of the tool did not decrease significantly as most of the remaining time being spent in visitor functions and AST traversal.

With all of these prerequisite components implemented, let's (finally) take a look at some visitor function implementations. 

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

### Enum Declarations

Enums are represented by two node types: `EnumDecl`, which corresponds to the enum declaration, and `EnumConstantDecl`, which represents the enum values.
From the `EnumDecl` node, we can infer that the `Level` enum is declared as an enum class, and that the underlying type is defaulted to an int.
If we had explicitly specified the underlying type, such as a `unsigned char` or `std::uint8_t` for a more compact representation, this would have also been reflected in the AST.

Let's set up visitor functions to inspect `EnumDecl` and `EnumConstantDecl` nodes:
```cpp line-numbers:{enabled} title:{visitor.hpp} added:{9-10}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // ...
        
        // For visiting enum declarations
        bool VisitEnumDecl(clang::EnumDecl* node);
        bool VisitEnumConstantDecl(clang::EnumConstantDecl* node);
        
        // ...
};
```

The implementation of these functions is relatively straightforward.
```cpp line-numbers:{enabled} title:{visitor.cpp}
#include "visitor.hpp"

bool Visitor::VisitEnumDecl(clang::EnumDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    // Skip any enum definitions that do not come from the main file
    if (source_manager.isInMainFile(location)) {
        const std::string& name = node->getNameAsString();
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);
        
        m_annotator->insert_annotation("enum-name", line, column, name.length());
    }

    return true;
}
```
An `enum-name` annotation is inserted for every `enum` declaration.

The return value of a visitor function indicates whether we want AST traversal to continue.
Since we are interested in traversing all the nodes of the AST, this will always be `true`.

As mentioned earlier, the `SourceManager` class maps AST nodes back to their source locations within the translation unit.
The `source_manager.isInMainFile(location)` check ensures that the node originates from the "main" file we are annotating - the one provided to `runToolOnCodeWithArgs`.
This prevents annotations from being applied to external headers, and is a recurring pattern in every visitor function.

The implementation of `VisitEnumConstantDecl` is nearly identical, except that it inserts an `enum-value` annotation instead of `enum-name`.
```cpp line-numbers:{enabled} title:{visitor.cpp}
#include "visitor.hpp"

bool Visitor::VisitEnumConstantDecl(clang::EnumConstantDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    // Skip any enum constant definitions that do not come from the main file
    if (source_manager.isInMainFile(location)) {
        const std::string& name = node->getNameAsString();
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);
        
        m_annotator->insert_annotation("enum-value", line, column, name.length());
    }
    
    return true;
}
```

With these two functions implemented, the tool produces the following output:
```text line-numbers:{enabled}
enum class [[enum-name,Level]] {
    [[enum-value,Debug]] = 0,
    [[enum-value,Info]],
    [[enum-value,Warning]],
    [[enum-value,Error]],
    [[enum-value,Fatal]] = Error,
};

void log_message(Level level, const char* message);

int main() {
    log_message(Level::Error, "something bad happened");
    // ...
}
```
This is not yet complete.
We will handle references to user-defined types, such as `Level` on lines 9 and 12, in a separate visitor function.
The reference to `Error` on line 12, however, is still missing an `enum-value` annotation.
As this is not a declaration, handling this will require a new visitor function.

### Enum References

References to enum values are captured by a [`DeclRefExpr` node](https://clang.llvm.org/doxygen/classclang_1_1DeclRefExpr.html#details).
These nodes capture expressions that refer to previously declared variables, functions, and types.

We can see this in following line from the AST above, which references the `DeclRefExpr` node on columns 17-24 of line 12 and corresponds to the `Error` enum constant within the call to `log_message`:
```json
// log_message(...)
CallExpr 0x1b642245e98 <line:12:5, col:55> 'void'
    // Level::Error
    DeclRefExpr 0x1b642245d40 <col:17, col:24> 'Level' EnumConstant 0x1b642245708 'Error' 'Level'
    // ...
```

For capturing nodes of this type, we need to set up a new visitor function:
```cpp line-numbers:{enabled} title:{visitor.hpp} added:{13}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // ...
        
        // For visiting enum declarations
        bool VisitEnumDecl(clang::EnumDecl* node);
        bool VisitEnumConstantDecl(clang::EnumConstantDecl* node);
        
        // For visiting references to enum constants
        bool VisitDeclRefExpr(clang::DeclRefExpr* node);
        
        // ...
};
```
The implementation of `VisitDeclRefExpr` is very similar to the `VisitEnumDecl` and `VisitEnumConstantDecl` visitor functions from earlier:
```cpp
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

        if (const clang::EnumConstantDecl* ec = clang::dyn_cast<clang::EnumConstantDecl>(decl)) {
            // Found a reference to an enum constant
            m_annotator->insert_annotation("enum-value", line, column, name.length());
        }
    }
    
    return true;
}
```
Most of the information we need is retrieved from the *declaration* of the underlying symbol, as it contains details about the type, value, and other attributes of the expression.
Other information, such as the source location in the file, is retrieved directly from the `DeclRefExpr` node, as our focus now is to annotate references rather and not declarations (which have already been handled above).
This is a common pattern that will be applied across several visitor function implementations.
If the declaration we are inspecting refers to a `EnumConstantDecl` node, we have found a reference to an enum constant and insert the `enum-value` annotation.

`DeclRefExpr` nodes reference more than just enum constants, and we will revisit this visitor function later to handle additional cases.

With the `VisitDeclRefExpr` visitor function implemented, the tool now properly annotates references to enum constants, in addition to enum declarations.
```text line-numbers:{enabled} added:{6,12}
enum class [[enum-name,Level]] {
    [[enum-value,Debug]] = 0,
    [[enum-value,Info]],
    [[enum-value,Warning]],
    [[enum-value,Error]],
    [[enum-value,Fatal]] = [[enum-value,Error]],
};

void log_message(Level level, const char* message);

int main() {
    log_message(Level::[[enum-value,Error]], "something bad happened");
    // ...
}
```
The final step is to add definitions for the `enum-name` and `enum-value` CSS styles:
```css
.language-cpp .enum-name {
    color: rgb(181, 182, 227);
}
.language-cpp .enum-value {
    color: rgb(199, 125, 187);
}
```
```cpp
enum class [[enum-name,Level]] {
    [[enum-value,Debug]] = 0,
    [[enum-value,Info]],
    [[enum-value,Warning]],
    [[enum-value,Error]],
    [[enum-value,Fatal]] = [[enum-value,Error]],
};

void log_message(Level level, const char* message);

int main() {
    log_message(Level::[[enum-value,Error]], "something bad happened");
    // ...
}
```

## Namespaces

Next up are namespace declarations.
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
With corresponding AST:
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

For adding annotations to namespaces, we need to set up visitor functions to process three new kinds of nodes:
- [`NamespaceDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1NamespaceDecl.html), which represent namespace declarations,
- [`NamespaceAliasDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1NamespaceAliasDecl.html), which represent namespace aliases, and
- [`UsingDirectiveDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1UsingDirectiveDecl.html), which represent `using namespace` directives
```cpp line-numbers:{enabled} added:{8-15} title:{visitor.hpp}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // ...
        
        // For visiting namespace declarations
        bool VisitNamespaceDecl(clang::NamespaceDecl* node);
        
        // For visiting namespace alias declarations
        bool VisitNamespaceAliasDecl(clang::NamespaceAliasDecl* node);
        
        // For visiting 'using namespace' directives
        bool VisitUsingDirectiveDecl(clang::UsingDirectiveDecl* node);
        
        // ...
};
```

### Namespace declarations

Namespace declarations are captured by `NamespaceDecl` nodes.
The corresponding `VisitNamespaceDecl` visitor function inserts a `namespace-name` annotation to all namespace declarations from the main file.
```cpp title:{visitor.cpp}
#include "visitor.hpp"

bool Visitor::VisitNamespaceDecl(clang::NamespaceDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    // Skip any namespace declarations that do not come from the main file
    if (source_manager.isInMainFile(location)) {
        const std::string& name = node->getNameAsString();
        unsigned line = source_manager.getSpellingLineNumber(location);
        unsigned column = source_manager.getSpellingColumnNumber(location);
        
        m_annotator->insert_annotation("namespace-name", line, column, name.length());
    }
    
    return true;
}
```

With the `VisitNamespaceDecl` visitor function implemented, the tool now properly annotates namespace declarations:
```text
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

Namespace aliases are captured by `NamespaceAliasDecl` nodes.
In addition to adding a `namespace-name` annotation to the namespace(s) being aliased, we also need to insert an annotation for the alias itself.
```cpp title:{visitor.cpp} line-numbers:{enabled}
#include "visitor.hpp"

bool Visitor::VisitNamespaceAliasDecl(clang::NamespaceAliasDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = node->getLocation();
    
    // Skip any namespace alias declarations that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    // Annotate namespace alias
    std::string name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    m_annotator->insert_annotation("namespace-name", line, column, name.length());
    
    // Annotate aliased namespace(s)
    // Generate namespace chain
    const clang::NamedDecl* aliased = node->getAliasedNamespace();
    std::unordered_set<std::string> namespaces = extract_namespaces(aliased->getDeclContext());
    
    // extract_namespaces checks for NamespaceDecl nodes, but this node is a NamespaceAliasDecl
    // Include it in the namespace chain 
    namespaces.insert(aliased->getNameAsString());
    
    // Tokenize the node range and annotate all tokens containing namespace names
    for (const Token& token : m_tokenizer->get_tokens(node->getSourceRange())) {
        if (namespaces.contains(token.spelling)) {
            m_annotator->insert_annotation("namespace-name", token.line, token.column, token.spelling.length());
        }
    }
    
    return true;
}
```
Annotating the namespace alias is straightforward, as we can directly retrieve the necessary properties from the `NamespaceAliasDecl` node.
However, annotating all namespaces in the aliased namespace chain requires a bit more work.

Every `Decl` node inherits from the [`DeclContext` interface](https://clang.llvm.org/doxygen/classclang_1_1DeclContext.html#details), which provides the `getDeclContext` function (as shown on line 19).
This function allows us to leverage the tree-based structure of the AST and walk up the declaration hierarchy of a node until we reach the top-level `TranslationUnitDecl`.
This is particularly useful in the case of an aliased namespace chain, as it allows us to visit all parent namespaces that enclose a given namespace and capture their names.
The namespace hierarchy chain is accessed through the `DeclContext` of the aliased namespace, which is retrieved via the call to `NamespaceAliasDecl::getAliasedNamespace` on line 20.
For each token contained within the range of the node (retrieved with the `get_tokens` function from earlier), we check if it matches one of the names contained in the namespace hierarchy and insert a `namespace-name` annotation if it does.

This pattern of walking up the AST hierarchy and annotating relevant tokens will be applied across several other visitor function implementations.
The `extract_namespaces` function (line 19) performs this traversal and returns the names of all namespaces.
```cpp title:{visitor.hpp} added:{20} line-numbers:{enabled}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // ...
        
        // For visiting namespace declarations
        bool VisitNamespaceDecl(clang::NamespaceDecl* node);
        
        // For visiting namespace alias declarations
        bool VisitNamespaceAliasDecl(clang::NamespaceAliasDecl* node);
        
        // For visiting 'using namespace' directives
        bool VisitUsingDirectiveDecl(clang::UsingDirectiveDecl* node);
        
        // ...
        
    private:
        [[nodiscard]] std::unordered_set<std::string> extract_namespaces(const clang::DeclContext* context) const;
        
        // ...
};
```
The parent node in the hierarchy is accessed through the `DeclContext::getParent` function.
```cpp title:{visitor.cpp}
#include "visitor.hpp"

std::unordered_set<std::string> Visitor::extract_namespaces(const clang::DeclContext* context) {
    std::unordered_set<std::string> namespaces;
    while (context) {
        if (const clang::NamespaceDecl* n = clang::dyn_cast<clang::NamespaceDecl>(context)) {
            namespaces.insert(n->getNameAsString());
        }
        context = context->getParent();
    }
    return namespaces;
}
```

With the `VisitNamespaceAliasDecl` visitor function implemented, the tool now also properly annotates namespace aliases:
```text
namespace [[namespace-name,math]] {
    namespace [[namespace-name,utility]] {
        // ...
    }
}

int main() {
    using namespace math;
    namespace [[namespace-name,utils]] = [[namespace-name,math]]::[[namespace-name,utility]];

    // ...
}
```

### `using namespace` directives

The final node we are interested in for this section is the `UsingDirectiveDecl` node, which represents `using namespace` directives.
The corresponding `VisitUsingDirectiveDecl` visitor function inserts a `namespace-name` annotation to all namespace names in the nominated namespace chain.
```cpp line-numbers:{enabled}
#include "visitor.hpp"

bool Visitor::VisitUsingDirectiveDecl(clang::UsingDirectiveDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    const clang::SourceLocation& location = node->getLocation();
    
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    if (const clang::NamespaceDecl* n = node->getNominatedNamespace()) {
        std::unordered_set<std::string> namespaces = extract_namespaces(n->getDeclContext());
        
        // extract_namespaces checks for NamespaceDecl nodes, but this node is a UsingDirectiveDecl
        // Include it in the namespace chain 
        namespaces.insert(n->getNameAsString());
        
        // Tokenize the node range and annotate all tokens containing namespace names
        std::span<const Token> tokens = m_tokenizer->get_tokens(node->getSourceRange());
        for (const Token& token : tokens) {
            if (namespaces.contains(token.spelling)) {
                m_annotator->insert_annotation("namespace-name", token.line, token.column, token.spelling.length());
            }
        }
    }
    
    return true;
}
```
This approach is very similar to that of the `VisitNamespaceAliasDecl` visitor function: for each token contained within the range of the `VisitUsingDirectiveDecl` node, we check if it matches one of the names contained in the namespace hierarchy and insert a `namespace-name` annotation if it does.
The namespace hierarchy chain is accessed through the `DeclContext` of the nominated namespace, which is retrieved via the call to `UsingDirectiveDecl::getNominatedNamespace` on line 11.

With all the visitor functions implemented, the tool now properly annotates all namespace declaration statements:
```text
namespace [[namespace-name,math]] {
    namespace [[namespace-name,utility]] {
        // ...
    }
}

int main() {
    using namespace [[namespace-name,math]];
    namespace [[namespace-name,utils]] = [[namespace-name,math]]::[[namespace-name,utility]];

    // ...
}
```
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
    namespace [[namespace-name,utils]] = [[namespace-name,math]]::[[namespace-name,utility]];

    // ...
}
```

## Functions

```cpp
#include <cstring> // std::strcmp

template <typename T>
bool equal(T a, T b) {
    return a == b;
}

// Template specialization
template <>
bool equal(const char* a, const char* b) {
    return std::strcmp(a, b) == 0;
}

int main() {
    bool eq = equal("apple", "banana"); // false
    
    // ...
}
```
The AST for this example is as follows:
```text
|-FunctionTemplateDecl 0x1f2ac42b8f8 <example.cpp:4:1, line:7:1> line:5:6 equal
| |-TemplateTypeParmDecl 0x1f2ac42b5b8 <line:4:11, col:20> col:20 referenced typename depth 0 index 0 T
| |-FunctionDecl 0x1f2ac42b848 <line:5:1, line:7:1> line:5:6 equal 'bool (T, T)'
| | |-ParmVarDecl 0x1f2ac42b678 <col:12, col:14> col:14 referenced a 'T'
| | |-ParmVarDecl 0x1f2ac42b6f8 <col:17, col:19> col:19 referenced b 'T'
| | `-CompoundStmt 0x1f2ac42ba50 <col:22, line:7:1>
| |   `-ReturnStmt 0x1f2ac42ba40 <line:6:5, col:17>
| |     `-BinaryOperator 0x1f2ac42ba20 <col:12, col:17> '<dependent type>' '=='
| |       |-DeclRefExpr 0x1f2ac42b9e0 <col:12> 'T' lvalue ParmVar 0x1f2ac42b678 'a' 'T'
| |       `-DeclRefExpr 0x1f2ac42ba00 <col:17> 'T' lvalue ParmVar 0x1f2ac42b6f8 'b' 'T'
| `-Function 0x1f2ac42bc38 'equal' 'bool (const char *, const char *)'
|-FunctionDecl 0x1f2ac42bc38 prev 0x1f2ac42bf28 <line:10:1, line:13:1> line:11:6 used equal 'bool (const char *, const char *)' explicit_specialization
| |-TemplateArgument type 'const char *'
| | `-PointerType 0x1f2aab477e0 'const char *'
| |   `-QualType 0x1f2aab46c21 'const char' const
| |     `-BuiltinType 0x1f2aab46c20 'char'
| |-ParmVarDecl 0x1f2ac42baa0 <col:12, col:24> col:24 used a 'const char *'
| |-ParmVarDecl 0x1f2ac42bb28 <col:27, col:39> col:39 used b 'const char *'
| `-CompoundStmt 0x1f2ac42c278 <col:42, line:13:1>
|   `-ReturnStmt 0x1f2ac42c268 <line:12:5, col:33>
|     `-BinaryOperator 0x1f2ac42c248 <col:12, col:33> 'bool' '=='
|       |-CallExpr 0x1f2ac42c1c8 <col:12, col:28> 'int'
|       | |-ImplicitCastExpr 0x1f2ac42c1b0 <col:12, col:17> 'int (*)(const char *, const char *) __attribute__((cdecl))' <FunctionToPointerDecay>
|       | | `-DeclRefExpr 0x1f2ac42c0d0 <col:12, col:17> 'int (const char *, const char *) __attribute__((cdecl))':'int (const char *, const char *)' lvalue Function 0x1f2ac3db588 'strcmp' 'int (const char *, const char *) __attribute__((cdecl))':'int (const char *, const char *)' (UsingShadow 0x1f2ac422d20 'strcmp')
|       | |   `-NestedNameSpecifier Namespace 0x1f2ac4258b8 'std'
|       | |-ImplicitCastExpr 0x1f2ac42c1f8 <col:24> 'const char *' <LValueToRValue>
|       | | `-DeclRefExpr 0x1f2ac42c108 <col:24> 'const char *' lvalue ParmVar 0x1f2ac42baa0 'a' 'const char *'
|       | `-ImplicitCastExpr 0x1f2ac42c210 <col:27> 'const char *' <LValueToRValue>
|       |   `-DeclRefExpr 0x1f2ac42c128 <col:27> 'const char *' lvalue ParmVar 0x1f2ac42bb28 'b' 'const char *'
|       `-IntegerLiteral 0x1f2ac42c228 <col:33> 'int' 0
`-FunctionDecl 0x1f2ac42c420 <line:15:1, line:19:1> line:15:5 main 'int ()'
  `-CompoundStmt 0x1f2ac42c868 <col:12, line:19:1>
    `-DeclStmt 0x1f2ac42c850 <line:16:5, col:39>
      `-VarDecl 0x1f2ac42c4f8 <col:5, col:38> col:10 eq 'bool' cinit
        `-CallExpr 0x1f2ac42c7d8 <col:15, col:38> 'bool'
          |-ImplicitCastExpr 0x1f2ac42c7c0 <col:15> 'bool (*)(const char *, const char *)' <FunctionToPointerDecay>
          | `-DeclRefExpr 0x1f2ac42c768 <col:15> 'bool (const char *, const char *)' lvalue Function 0x1f2ac42bc38 'equal' 'bool (const char *, const char *)' (FunctionTemplate 0x1f2ac42b8f8 'equal')
          |-ImplicitCastExpr 0x1f2ac42c808 <col:21> 'const char *' <ArrayToPointerDecay>
          | `-StringLiteral 0x1f2ac42c610 <col:21> 'const char[6]' lvalue "apple"
          `-ImplicitCastExpr 0x1f2ac42c820 <col:30> 'const char *' <ArrayToPointerDecay>
            `-StringLiteral 0x1f2ac42c690 <col:30> 'const char[7]' lvalue "banana"
```
For adding annotations to functions, we need to set up visitor functions to process two new kinds of nodes:
- [`FunctionDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1FunctionDecl.html), which represent regular function declarations / definitions,
- [`FunctionTemplateDecl` nodes](https://clang.llvm.org/doxygen/classclang_1_1FunctionTemplateDecl.html), which represent template function declarations / definitions, and
- [`CallExpr` nodes](https://clang.llvm.org/doxygen/classclang_1_1CallExpr.html), which represent function calls

```cpp title:{visitor.hpp} added:{8-15}
class Visitor final : public clang::RecursiveASTVisitor<Visitor> {
    public:
        explicit Visitor(clang::ASTContext* context, Annotator* annotator, Tokenizer* tokenizer);
        ~Visitor();
        
        // ...
        
        // For visiting function declarations / definitions
        bool VisitFunctionDecl(clang::NamespaceDecl* node);
        
        // For visiting template function declarations / definitions
        bool VisitFunctionTemplateDecl(clang::FunctionTemplateDecl* node);
        
        // For visiting function calls
        bool VisitCallExpr(clang::CallExpr* node);
        
        // ...
};
```

Keen observers will notice that each `FunctionTemplateDecl` node in the above AST references a child `FunctionDecl`, which represents the function declaration itself.
This means that for annotating function names, we don't actually need the visitor function for the `FunctionTemplateDecl` node, as we can easily visit both template and non-template functions with the same `FunctionDecl` visitor.
However, we will still implement a visitor function for `FunctionTemplateDecl` nodes, for reasons we will see later.

## Function declarations
Function declarations are captured under `FunctionDecl` nodes:
```cpp title:{visitor.hpp}
#include "visitor.hpp"

bool Visitor::VisitFunctionDecl(clang::FunctionDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = node->getLocation();
    
    // Skip any function declarations / definitions that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    const std::string name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("function", line, column, name.length());
    
    return true;
}
```
For now, the implementation of the `VisitFunctionTemplateDecl` visitor is the same and is omitted for brevity.
As expected, this visitor annotates both regular and template functions, including specializations.
```text
#include <cstring> // std::strcmp

template <typename T>
bool [[function,equal]](T a, T b) {
    return a == b;
}

// Template specialization
template <>
bool [[function,equal]](const char* a, const char* b) {
    return std::strcmp(a, b) == 0;
}

int [[function,main]]() {
    bool eq = equal("apple", "banana"); // false
    
    // ...
}
```

### Function calls

Function calls are captured under `CallExpr` nodes.

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
- `CXXRecordDecl`, which represents declarations of classes,
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
        
        m_annotator->insert_annotation("class-name", line, column, name.length());
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
For now, we skip these with a `CXXCtorInitializer::isBaseInitializer` check on line 23 - we will revisit this later when we add annotations for functions.

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

### Class functions + operators

## Templates + concepts

modify call expr

You'll notice that template classes were not omitted.
Templates, specializations, and concepts use different nodes.

## Preprocessor Directives

## Keywords

## Punctuation





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

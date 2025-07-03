
I created this blog to have a place to discuss interesting problems I encounter while working on my personal projects.
Many of these projects, particularly those focused on computer graphics, are written in C++.

One problem I wanted to tackle was syntax highlighting, as I often use code snippets in my explanations and wanted them to be easily readable.
Initially, I integrated [PrismJS](https://prismjs.com/) - a popular library for syntax highlighting in browsers - into my Markdown renderer.
However, I quickly discovered that PrismJS struggles with properly highlighting C++ code.

Consider the following example, which showcases a variety of C++20 features I commonly use.
Syntax highlighting is handled exclusively by PrismJS:
```cpp line-numbers:{enabled} show-lines:{30}
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
```cpp
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
I believe this to be the fundamental reason for the issues pointed out above.
Syntax highlighting for C++ simply requires more context.
What if we want to extract member variables of a given class?
How do we distinguish between local variables and class members?
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
```json show-lines:{30}
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

### Creating an `ASTFrontendAction`

Tools built with `LibTooling` interact with Clang and LLVM by running `FrontendAction`s over code.
One such interface, `ASTFrontendAction`, provides an easy way to traverse the AST of a given translation unit.
During traversal, we can extract relevant information about the AST nodes we care about and use it to add annotations for syntax highlighting.

Let's start by defining our `ASTFrontendAction`:
```cpp line-numbers:{enabled} title:{action.hpp}
[[keyword,class]] [[class-name,SyntaxHighlighter]] [[keyword,final]] : [[keyword,public]] [[namespace-name,clang]]::[[class-name,ASTFrontendAction]] {
    [[keyword,public]]:
        [[namespace-name,std]]::[[class-name,unique_ptr]]<[[namespace-name,clang]]::[[class-name,ASTConsumer]]> [[function,CreateASTConsumer]]([[namespace-name,clang]]::[[class-name,CompilerInstance]]& compiler,
                                                              [[namespace-name,clang]]::[[class-name,StringRef]] file) [[keyword,override]];
        // ...
};
```

### Creating an `ASTConsumer`

The `ASTFrontendAction` interface requires implementing the `CreateASTConsumer()` function, which returns an `ASTConsumer` instance.
As the name suggests, the `ASTConsumer` is responsible for consuming (processing) the AST.

Our `ASTConsumer` is defined as follows:
```cpp line-numbers:{enabled} title:{consumer.hpp}
[[keyword,class]] [[class-name,Consumer]] [[keyword,final]] : [[keyword,public]] [[namespace-name,clang]]::[[class-name,ASTConsumer]] {
    [[keyword,public]]:
        [[function,Consumer]]();
        [[function,~Consumer]]() [[keyword,override]];
    
    [[keyword,private]]:
        [[keyword,void]] [[function,HandleTranslationUnit]]([[namespace-name,clang]]::[[class-name,ASTContext]]& context) [[keyword,override]];
};
```

The `ASTConsumer` interface provides multiple entry points for traversal, but for our use case only `HandleTranslationUnit()` is necessary.
This function is called by the `ASTFrontendAction` with an `ASTContext` for the translation unit of the file being processed.

The `ASTContext` is essential for retrieving semantic information about the nodes of an AST.
It provides access to type details, declaration contexts, and utility classes like `SourceManager`, which maps nodes back to their source locations (as AST nodes do not store this information directly).
As we will see, this information is crucial for inserting syntax highlighting annotations in the correct locations.

We simply instantiate and return an instance of our `ASTConsumer` from the `CreateASTConsumer()` function of the `ASTFrontendAction`.
```cpp line-numbers:{enabled} title:{action.cpp}
[[namespace-name,std]]::[[class-name,unique_ptr]]<[[namespace-name,clang]]::[[class-name,ASTConsumer]]> [[class-name,SyntaxHighlighter]]::[[function,CreateASTConsumer]]([[namespace-name,clang]]::[[class-name,CompilerInstance]]& compiler, [[namespace-name,clang]]::[[class-name,StringRef]] file) {
    [[namespace-name,clang]]::[[class-name,ASTContext]]& context = compiler.[[function,getASTContext]]();
    [[keyword,return]] [[namespace-name,std]]::[[function,make_unique]]<[[class-name,Consumer]]>([[unary-operator,&]]m_annotator, m_tokenizer);
}
```

### Creating a `RecursiveASTVisitor`

The final missing piece is the [`RecursiveASTVisitor`](https://clang.llvm.org/doxygen/classclang_1_1RecursiveASTVisitor.html), which handles visiting individual AST nodes.
It provides `Visit{NodeType}` visitor hooks for most AST node types.
Here are a few examples of visitor function declarations for common AST nodes:
```cpp
[[keyword,bool]] [[function,VisitNamespaceDecl]]([[namespace-name,clang]]::[[class-name,NamespaceDecl]]* node); // For visiting namespaces
[[keyword,bool]] [[function,VisitFunctionDecl]]([[namespace-name,clang]]::[[class-name,FunctionDecl]]* node); // For visiting functions
[[keyword,bool]] [[function,VisitCXXRecordDecl]]([[namespace-name,clang]]::[[class-name,CXXRecordDecl]]* node); // For visiting C++ class, struct, and union types
// etc.
```
The main exception to this pattern are `TypeLoc` nodes, which are passed by value instead of by pointer.
The return value determines whether traversal of the AST should continue.
By default, the implementation simply returns `true`, making it perfectly safe to omit `Visit` function definitions of any node types we are not interested in processing.

Our `RecursiveASTVisitor` is defined as follows:
```cpp line-numbers:{enabled} title:{visitor.hpp}
[[keyword,class]] [[class-name,Visitor]] [[keyword,final]] : [[keyword,public]] [[namespace-name,clang]]::[[class-name,RecursiveASTVisitor]]<[[class-name,Visitor]]> {
    [[keyword,public]]:
        [[keyword,explicit]] [[function,Visitor]]([[namespace-name,clang]]::[[class-name,ASTContext]]* context);
        [[function,~Visitor]]();
        
        // Visitor definitions here...
        
    [[keyword,private]]:
        [[namespace-name,clang]]::[[class-name,ASTContext]]* [[member-variable,m_context]];
};
```
It takes in the `ASTContext` from the `ASTConsumer` for retrieving node source locations during traversal.
We will explore concrete visitor function implementations in more detail later on.

The traversal of the AST is kicked off in `HandleTranslationUnit()` from our `ASTConsumer`.
By calling `TraverseDecl` with the root `TranslationUnitDecl` node (obtained from the `ASTContext`), we can traverse the entire AST:
```cpp line-numbers:{enabled} title:{consumer.cpp}
[[keyword,void]] [[class-name,Consumer]]::[[function,HandleTranslationUnit]]([[namespace-name,clang]]::[[class-name,ASTContext]]& context) {
    // Traverse all the nodes in the translation unit using the C++ API, starting from the root
    [[class-name,Visitor]] visitor { [[unary-operator,&]]context };
    visitor.[[function,TraverseDecl]](context.[[function,getTranslationUnitDecl]]());
}
```

#### Configuring the traversal behavior (optional)

The `RecursiveASTVisitor` also provides functions to control the behavior of the traversal itself.
For example, overriding `shouldTraversePostOrder()` to return `true` switches the traversal from the default preorder to postorder.
```cpp line-numbers:{enabled} added:{6-9}
[[keyword,class]] [[class-name,Visitor]] [[keyword,final]] : [[keyword,public]] [[namespace-name,clang]]::[[class-name,RecursiveASTVisitor]]<[[class-name,Visitor]]> {
    [[keyword,public]]:
        [[keyword,explicit]] [[function,Visitor]]([[namespace-name,clang]]::[[class-name,ASTContext]]* context);
        [[function,~Visitor]]();
        
        [[keyword,bool]] [[function,shouldTraversePostOrder]]() [[keyword,const]] {
            // Configure the visitor to perform a postorder traversal of the AST
            [[keyword,return]] [[keyword,true]];
        }
        
    [[keyword,private]]:
        [[namespace-name,clang]]::[[class-name,ASTContext]]* [[member-variable,m_context]];
};
```
Other functions modify traversal behavior in different ways.
For example, `shouldVisitTemplateInstantiations()` enables visiting template instantiations, while `shouldVisitImplicitCode()` allows traversal of implicit constructors and destructors generated by the compiler.

### Putting it all together

Finally, we invoke the tool using `runToolOnCodeWithArgs()`, specifying the `ASTFrontendAction`, source code, and any additional [command line arguments](https://clang.llvm.org/docs/ClangCommandLineReference.html):
```cpp line-numbers:{enabled}
[[keyword,int]] [[function,main]]([[keyword,int]] argc, [[keyword,char]]* argv[]) {
    [[keyword,if]] (argc [[binary-operator,<]] 2) {
        [[namespace-name,utils]]::[[namespace-name,logging]]::[[function,error]]("no input file provided");
        [[keyword,return]] 1;
    }
    
    [[keyword,const]] [[keyword,char]]* filepath = argv[[operator,[]]1[[operator,]]];
    
    // Read file contents
    [[namespace-name,std]]::[[class-name,ifstream]] [[plain,file]](filepath);
    [[keyword,if]] ([[unary-operator,!]]file.[[function,is_open]]()) {
        [[namespace-name,utils]]::[[namespace-name,logging]]::[[function,error]]("failed to open file {}", filepath);
        [[keyword,return]] 1;
    }
    
    [[namespace-name,std]]::[[class-name,string]] content { [[namespace-name,std]]::[[class-name,istreambuf_iterator]]<[[keyword,char]]>(file), [[namespace-name,std]]::[[class-name,istreambuf_iterator]]<[[keyword,char]]>() };
    
    [[namespace-name,std]]::[[class-name,vector]]<[[namespace-name,std]]::[[class-name,string]]> compilation_flags {
        "-std=c++20",
        "-fsyntax-only", // Included by default
        
        // Project include directories, additional compilation flags, etc.
        // ...
    };
    
    // runToolOnCodeWithArgs returns 'true' if the tool was successfully executed
    [[keyword,return]] ![[namespace-name,clang]]::[[namespace-name,tooling]]::[[function,runToolOnCodeWithArgs]]([[namespace-name,std]]::[[function,make_unique]]<[[class-name,SyntaxHighlighter]]>(content), content, compilation_flags, filepath);
}
```

## Inserting annotations

One of the other responsibilities of our `ASTConsumer` is adding syntax highlighting annotations to the source code.
An annotation follows the structure: `[[{AnnotationType},{Tokens}]]`, where `AnnotationType` determines the CSS class applied to one or more `Tokens`.
The annotations are embedded directly into the source code and later extracted from code blocks by a custom Markdown renderer, which applies CSS styles to transform them into styled elements.

Annotations provide hints to the Markdown renderer on how to apply syntax highlighting to symbols `PrismJS` cannot accurately identify.
For example, the following snippet demonstrates a few common C++ annotation types: `namespace-name` for namespaces, `class-name` for classes, and `function` for functions.
```text
[[keyword,namespace]] [[namespace-name,math]] {
    [[keyword,struct]] [[class-name,Vector3]] {
        // ... 
    };
    
    [[keyword,float]] [[function,dot]]([[keyword,const]] [[class-name,Vector3]]& a, [[keyword,const]] [[class-name,Vector3]]& b) {
        // ... 
    }
}
```
These annotations exist only in the Markdown source.
When processed by the website frontend, they are removed, and the enclosed tokens are assigned the corresponding CSS styles.
For the purposes of syntax highlighting, these styles simply correspond to the color these elements should have:
```css
.language-cpp .function {
    color: rgb(255, 198, 109);
}

.language-cpp .keyword {
  color: rgb(206, 136, 70);
}

.language-cpp .class-name,
.language-cpp .namespace-name {
    color: rgb(181, 182, 227);
}
```
As we traverse the AST, we will define additional annotation types as needed.
It follows that there should be a corresponding CSS style for every annotation type.

If you are interested, I've written a [short post]() about how this is implemented in the renderer itself (the same one being used for this post!).

### The `Annotator`
All logic for inserting annotations is handled by the `Annotator` class:
```cpp line-numbers:{enabled} title:{annotator.hpp}
[[keyword,struct]] [[class-name,Annotation]] {
    [[function,Annotation]]([[keyword,const]] [[keyword,char]]* name, [[keyword,unsigned]] offset, [[keyword,unsigned]] length);
    [[function,~Annotation]]();
    
    [[keyword,const]] [[keyword,char]]* [[member-variable,name]];
    [[keyword,unsigned]] [[member-variable,offset]];
    [[keyword,unsigned]] [[member-variable,length]];
};

[[keyword,class]] [[class-name,Annotator]] {
    [[keyword,public]]:
        [[keyword,explicit]] [[function,Annotator]]([[namespace-name,std]]::[[class-name,string]] source);
        [[function,~Annotator]]();
        
        [[keyword,void]] [[function,insert_annotation]]([[keyword,const]] [[keyword,char]]* name, [[keyword,unsigned]] line, [[keyword,unsigned]] column, [[keyword,unsigned]] length, [[keyword,bool]] overwrite = [[keyword,false]]);
        [[keyword,void]] [[function,annotate]]();
        
    [[keyword,private]]:
        [[keyword,void]] [[function,compute_line_lengths]]();
        [[nodiscard]] [[namespace-name,std]]::[[class-name,size_t]] [[function,compute_offset]]([[keyword,unsigned]] line, [[keyword,unsigned]] column) [[keyword,const]];
    
        [[namespace-name,std]]::[[class-name,string]] [[member-variable,m_source]];
        [[namespace-name,std]]::[[class-name,vector]]<[[keyword,unsigned]]> [[member-variable,m_line_lengths]];
        [[namespace-name,std]]::[[class-name,vector]]<[[class-name,Annotation]]> [[member-variable,m_annotations]];
};
```
Annotations are registered through `insert_annotation()` and stored in the `m_annotations` vector.
Annotations typically correspond to unique tokens in the source file.
The `insert_annotation()` function calculates the character offset in the file for the given source location using `compute_offset()` and appends the annotation.
```cpp line-numbers:{enabled} title:{annotator.cpp}
[[keyword,void]] [[class-name,Annotator]]::[[function,insert_annotation]]([[keyword,const]] [[keyword,char]]* name, [[keyword,unsigned]] line, [[keyword,unsigned]] column, [[keyword,unsigned]] length, [[keyword,bool]] overwrite) {
    [[namespace-name,std]]::[[class-name,size_t]] offset = [[function,compute_offset]](line, column);
    
    // Do not add duplicate annotations of the same name at the same location
    [[keyword,for]] ([[class-name,Annotation]]& annotation : [[member-variable,m_annotations]]) {
        [[keyword,if]] (annotation.[[member-variable,offset]] == offset) {
            [[keyword,if]] (overwrite) {
                annotation.[[member-variable,name]] = name;
                annotation.[[member-variable,length]] = length;
            }
            
            [[keyword,return]];
        }
        [[keyword,else]] [[keyword,if]] (offset > annotation.[[member-variable,offset]] && offset < annotation.[[member-variable,offset]] + annotation.[[member-variable,length]]) {
            [[namespace-name,utils]]::[[namespace-name,logging]]::[[function,error]]("Inserting annotation in the middle of another annotation");
            [[keyword,return]];
        }
    }
    
    [[member-variable,m_annotations]].emplace_back(name, offset, length);
}
```
The `overwrite` flag allows for existing annotations to be overwritten when necessary.
Multiple annotations cannot correspond to the same token as it would create ambiguity regarding which CSS style should be applied.
Partial overlaps - where an annotation would sit inside another - are rejected entirely to preserve correctness.
This is a rare condition, and typically indicates a problem with the code that's calling `insert_annotation()`.

The `compute_offset()` function calculates the absolute character position for a given line and column:
```cpp line-numbers:{enabled} title:{annotator.cpp}
[[namespace-name,std]]::[[class-name,size_t]] [[class-name,Annotator]]::[[function,compute_offset]]([[keyword,unsigned]] line, [[keyword,unsigned]] column) [[keyword,const]] {
    [[namespace-name,std]]::[[class-name,size_t]] offset = 0;
    [[keyword,for]] ([[namespace-name,std]]::[[class-name,size_t]] i = 0; i [[binary-operator,<]] (line [[binary-operator,-]] 1); [[unary-operator,++]]i) {
        offset += [[member-variable,m_line_lengths]][[operator,[]]i[[operator,]]];
    }
    [[keyword,return]] offset [[binary-operator,+]] (column [[binary-operator,-]] 1);
}
```
To support this, the length of each line (including newline characters) is precomputed during initialization:
```cpp line-numbers:{enabled} title:{annotator.cpp}
[[class-name,Annotator]]::[[function,Annotator]]([[namespace-name,std]]::[[class-name,string]] source) : [[member-variable,m_source]](std::move(source)) {
    [[function,compute_line_lengths]]();
}

[[keyword,void]] [[class-name,Annotator]]::[[function,compute_line_lengths]]() {
    [[namespace-name,std]]::[[class-name,size_t]] start = 0;

    // Traverse through the string and count lengths of lines separated by newlines
    [[keyword,for]] ([[namespace-name,std]]::[[class-name,size_t]] i = 0; i [[binary-operator,<]] [[member-variable,m_source]].[[function,size]](); [[unary-operator,++]]i) {
        [[keyword,if]] (m_source[i] == '\n') {
            [[member-variable,m_line_lengths]].push_back(i [[binary-operator,-]] start [[binary-operator,+]] 1);
            start [[binary-operator,=]] i [[binary-operator,+]] 1;
        }
    }

    // Add any trailing characters (if the file does not end in a newline)
    [[keyword,if]] (start [[binary-operator,<]] [[member-variable,m_source]].[[function,size]]()) {
        [[member-variable,m_line_lengths]].[[function,push_back]]([[member-variable,m_source]].[[function,size]]() [[binary-operator,-]] start);
    }
}
```
Newlines and carriage returns are included in the line lengths to ensure offsets remain accurate across different platforms.

### The `annotate()` function

After AST traversal is complete, a call to `annotate()` generates the final annotated file.
The full source for this function can be viewed [here]().

The first step is to sort the annotations by their offsets:
```cpp title:{annotator.cpp}
[[namespace-name,std]]::[[function,sort]]([[member-variable,m_annotations]].[[function,begin]](), [[member-variable,m_annotations]].[[function,end]](), []([[keyword,const]] [[class-name,Annotation]]& a, [[keyword,const]] [[class-name,Annotation]]& b) -> [[keyword,bool]] {
    [[keyword,return]] a.[[member-variable,offset]] < b.[[member-variable,offset]];
});
```
Since nodes in the AST are not guaranteed to be visited in the same order as their counterparts appear in the code, annotations are typically added to the `Annotator` out of order.

To avoid expensive reallocations, the final length of the file (including all annotations) is precomputed and allocated at once:
```cpp title:{annotator.cpp}
[[namespace-name,std]]::[[class-name,size_t]] length = [[member-variable,m_source]].length();
[[keyword,for]] ([[keyword,const]] [[class-name,Annotation]]& annotation : [[member-variable,m_annotations]]) {
    // Annotation format: [[{AnnotationType},{Tokens}]]
    // '[[' + {AnnotationType} + ',' + {Tokens} + ']]'
    length [[binary-operator,+=]] 2 [[binary-operator,+]] [[function,strlen]](annotation.[[member-variable,name]]) [[binary-operator,+]] 1 [[binary-operator,+]] annotation.[[member-variable,length]] [[binary-operator,+]] 2;
}

[[namespace-name,std]]::[[class-name,string]] file;
file.[[function,reserve]](length);
```
This takes advantage of the fact that annotations follow a consistent pattern when inserted into the file: `[[{AnnotationType},{Tokens}]]`, and is efficient because it avoids reallocating the file as the contents grow in size.

Annotations are then inserted sequentially:
```cpp title:{annotator.cpp}
[[namespace-name,std]]::[[class-name,size_t]] position = 0;
[[keyword,for]] ([[keyword,const]] [[class-name,Annotation]]& annotation : [[member-variable,m_annotations]]) {
    // Copy the part before the annotation
    file.[[function,append]]([[member-variable,m_source]], position, annotation.[[member-variable,offset]] [[binary-operator,-]] position);
    
    // Insert annotation
    file.[[function,append]]("[[");
    file.[[function,append]](annotation.[[member-variable,name]]);
    file.[[function,append]](",");
    file.[[function,append]]([[member-variable,m_source]], annotation.[[member-variable,offset]], annotation.[[member-variable,length]]);
    file.[[function,append]]("]]");

    // Move offset into 'src'
    position = annotation.[[member-variable,offset]] [[binary-operator,+]] annotation.[[member-variable,length]];
}

// Copy the remaining part of the line
file.[[function,append]]([[member-variable,m_source]], position, [[member-variable,m_source]].[[function,length]]() [[binary-operator,-]] position);
```
The annotated file is then written out and saved to disk.
The generated code snippet can now be embedded directly into a Markdown source file, where annotations will be processed by the renderer for syntax highlighting.

### Tokenization

With the logic to insert annotations into the source code implemented, the next task is to implement a way to retrieve a subset of tokens that are contained within a `SourceRange`.
Why?
In some cases, determining the exact location of a symbol is not always straightforward.
In general, while we usually know what symbol(s) we are looking for, the corresponding AST node does not always provide a direct way to retrieve their location(s).
It does, however, include a way to retrieve the range of the node - spanning from a start to an end `SourceLocation` - which greatly helps us narrow down our search.
By tokenizing the source file and storing tokens in a structured manner, we can efficiently retrieve those that fall within the given `SourceRange` of an AST node without having to traverse every token of the file.
We can then check against the spelling of the token until we find one that matches that of the symbol we are looking for.

For example, a `CallExpr` node only provides the location of the corresponding function invocation.
If we want to annotate any namespace qualifiers on the function call, such as the `std` in `std::sort`, one possible workaround is to tokenize the node's `SourceRange` and compare the tokens against the namespace names extracted from the function's *declaration*.
We will explore this in greater detail when we look at visitor function implementations.

Tokenization is handled by the `Tokenizer` class.
```cpp line-numbers:{enabled} title:{tokenizer.hpp}
[[keyword,struct]] [[class-name,Token]] {
    [[function,Token]]([[namespace-name,std]]::[[class-name,string]] spelling, [[keyword,unsigned]] line, [[keyword,unsigned]] column);
    [[function,~Token]]();
    
    [[namespace-name,std]]::[[class-name,string]] [[member-variable,spelling]];
    [[keyword,unsigned]] [[member-variable,line]];
    [[keyword,unsigned]] [[member-variable,column]];
};

[[keyword,class]] [[class-name,Tokenizer]] {
    [[keyword,public]]:
        [[keyword,explicit]] [[function,Tokenizer]]([[namespace-name,clang]]::[[class-name,ASTContext]]* context);
        [[function,~Tokenizer]]();
        
        [[nodiscard]] [[namespace-name,std]]::[[class-name,span]]<[[keyword,const]] Token> [[function,get_tokens]]([[namespace-name,clang]]::[[class-name,SourceLocation]] start, [[namespace-name,clang]]::[[class-name,SourceLocation]] end) [[keyword,const]];
        [[nodiscard]] [[namespace-name,std]]::[[class-name,span]]<[[keyword,const]] Token> [[function,get_tokens]]([[namespace-name,clang]]::[[class-name,SourceRange]] range) [[keyword,const]];
        
    [[keyword,private]]:
        [[keyword,void]] [[function,tokenize]]();
        
        [[namespace-name,clang]]::[[class-name,ASTContext]]* [[member-variable,m_context]];
        [[namespace-name,std]]::[[class-name,vector]]<[[class-name,Token]]> [[member-variable,m_tokens]];
};
```
We can leverage Clang's `Lexer` class from the LibTooling API to handle tokenization.
The `Lexer` provides an API to process an input text buffer into a sequence of tokens based on a set of predetermined C/C++ language rules.
Raw tokens for the code snippet are stored contiguously in `m_tokens`, allowing the `get_tokens()` functions to return a non-owning `std::span` instead of copying token data into a separate buffer.
This helps avoid unnecessary allocations and provides a significant boost to performance, as the `get_tokens()` functions are called frequently during the traversal of the AST,

Tokenization is handled by the `tokenize` function:
```cpp line-numbers:{enabled} title:{tokenizer.cpp}
[[keyword,void]] [[class-name,Tokenizer]]::[[function,tokenize]]() {
    [[keyword,const]] [[namespace-name,clang]]::[[class-name,SourceManager]]& source_manager = [[member-variable,m_context]]->[[function,getSourceManager]]();
    
    [[namespace-name,clang]]::[[class-name,FileID]] file = source_manager.[[function,getMainFileID]]();
    [[namespace-name,clang]]::[[class-name,SourceLocation]] file_start = source_manager.[[function,getLocForStartOfFile]](file);
    [[namespace-name,clang]]::[[class-name,LangOptions]] options = [[member-variable,m_context]]->[[function,getLangOpts]]();
    
    [[namespace-name,clang]]::[[class-name,StringRef]] source = source_manager.[[function,getBufferData]](file);

    // Tokenize with raw lexer
    [[namespace-name,clang]]::[[class-name,Lexer]] [[plain,lexer]] { file_start, options, source.[[function,begin]](), source.[[function,begin]](), source.[[function,end]]() };
    [[namespace-name,clang]]::[[class-name,Token]] [[plain,token]];
    [[keyword,while]] ([[keyword,true]]) {
        lexer.[[function,LexFromRawLexer]](token);
        [[keyword,if]] (token.[[function,is]]([[namespace-name,clang]]::[[namespace-name,tok]]::[[enum-value,eof]])) {
            [[keyword,break]];
        }
        
        [[namespace-name,clang]]::[[class-name,SourceLocation]] location = token.[[function,getLocation]]();
        [[namespace-name,std]]::[[class-name,string]] spelling = [[namespace-name,clang]]::[[class-name,Lexer]]::[[function,getSpelling]](token, source_manager, options);
        [[keyword,unsigned]] line = source_manager.[[function,getSpellingLineNumber]](location);
        [[keyword,unsigned]] column = source_manager.[[function,getSpellingColumnNumber]](location);
        
        [[member-variable,m_tokens]].[[function,emplace_back]](spelling, line, column, keywords.[[function,contains]](spelling));
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
[[namespace-name,std]]::[[class-name,span]]<[[keyword,const]] Token> [[class-name,Tokenizer]]::[[function,get_tokens]]([[namespace-name,clang]]::[[class-name,SourceRange]] range) [[keyword,const]] {
    [[keyword,return]] [[function,get_tokens]](range.[[function,getBegin]](), range.[[function,getEnd]]());
}
```

A key consideration when retrieving tokens is that the provided range may span multiple lines.
A good example of this is a `FunctionDecl` node, which represents a multi-line function definition.
```cpp line-numbers:{enabled} title:{tokenizer.cpp}
[[namespace-name,std]]::[[class-name,span]]<[[keyword,const]] Token> [[class-name,Tokenizer]]::[[function,get_tokens]]([[namespace-name,clang]]::[[class-name,SourceLocation]] start, [[namespace-name,clang]]::[[class-name,SourceLocation]] end) [[keyword,const]] {
    [[keyword,const]] [[namespace-name,clang]]::[[class-name,SourceManager]]& source_manager = [[member-variable,m_context]]->[[function,getSourceManager]]();
    [[keyword,unsigned]] start_line = source_manager.[[function,getSpellingLineNumber]](start);
    [[keyword,unsigned]] start_column = source_manager.[[function,getSpellingColumnNumber]](start);

    // Determine tokens that fall within the range defined by [start:end]
    // Partial tokens (if the range start location falls within the extent of a token) should also be included here

    [[keyword,unsigned]] offset = [[member-variable,m_tokens]].[[function,size]](); // Invalid offset
    [[keyword,for]] ([[namespace-name,std]]::[[class-name,size_t]] i = 0; i [[binary-operator,<]] [[member-variable,m_tokens]].[[function,size]](); [[unary-operator,++]]i) {
        [[keyword,const]] [[class-name,Token]]& token = [[member-variable,m_tokens]][[function-operator,[]]i[[function-operator,]]];

        // Skip any tokens that end before the range start line:column
        [[keyword,if]] (token.[[member-variable,line]] [[binary-operator,<]] start_line [[binary-operator,||]] (token.[[member-variable,line]] [[binary-operator,==]] start_line [[binary-operator,&&]] (token.[[member-variable,column]] [[binary-operator,+]] token.[[member-variable,spelling]].[[function,length]]()) [[binary-operator,<=]] start_column)) {
            [[keyword,continue]];
        }

        offset [[binary-operator,=]] i;
        [[keyword,break]];
    }

    [[keyword,unsigned]] count = 0;
    [[keyword,unsigned]] end_line = source_manager.[[function,getSpellingLineNumber]](end);
    [[keyword,unsigned]] end_column = source_manager.[[function,getSpellingColumnNumber]](end);

    [[keyword,for]] ([[namespace-name,std]]::[[class-name,size_t]] i = offset; i [[binary-operator,<]] [[member-variable,m_tokens]].[[function,size]](); [[unary-operator,++]]i) {
        [[keyword,const]] [[class-name,Token]]& token = [[member-variable,m_tokens]][[function-operator,[]]i[[function-operator,]]];

        // Skip any tokens that start after the range end line:column
        [[keyword,if]] (token.[[member-variable,line]] [[binary-operator,>]] end_line [[binary-operator,||]] token.[[member-variable,line]] [[binary-operator,==]] end_line [[binary-operator,&&]] token.[[member-variable,column]] [[binary-operator,>]] end_column) {
            [[keyword,break]];
        }

        [[unary-operator,++]]count;
    }

    // Return non-owning range of tokens
    [[keyword,return]] { [[member-variable,m_tokens]].[[function,begin]]() [[function-operator,+]] offset, count };
}
```
The main challenge of `get_tokens()` is properly accounting for partial tokens - those that overlap the range specified by `start` and `end` - in the result.
The function begins by locating the first token that starts at or after `start`.
It then iterates through the tokens until it encounters one that begins after `end`, keeping track of all the tokens in between (those within the range).
The resulting `std::span` contains a view of all tokens that overlap the given range.
If `start` or `end` does not align with a token boundary, any tokens that straddle the range - either starting before but extending past `start`, or starting before but continuing past `end` - are also included.

The `Annotator` and `Tokenizer` are added as member variables of the `ASTFrontendAction` class.
Not all annotations we are interested are handled by the `ASTFrontendAction`.
In this case, we'll need to ability to pass references to the `Annotator` and `Tokenizer` around so that annotations are inserted into the same resulting file.

---

Thanks for reading!
In the [next post](), we'll walk through a few basic visitor implementations to get familiarized with the process of extracting data from AST nodes.
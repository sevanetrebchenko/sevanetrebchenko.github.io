
One popular method for syntax highlighting in browsers is the [PrismJS](https://prismjs.com/) library.
However, PrismJS struggles with proper C++ syntax highlighting, which is a problem for me as many of my projects (particularly those based around computer graphics) are written in C++.
As the purpose of this blog is to showcase some of the technical aspects of my projects that I find interesting (meaning lots of code snippets!), I decided to invest a little more time into developing a more robust solution for C++ syntax highlighting to improve readability.

## The problems of syntax highlighting with PrismJS
PrismJS breaks the source code into tokens based on a set of predefined grammar rules specific to each language.
These rules are essentially regular expressions that identify different types of elements in the code, such as keywords, strings, numbers, comments, etc.
This process involves parsing the raw code snippet and categorizing the parts into distinct tokens.
Once tokenized, PrismJS applies a set of CSS classes to each token, which can then be used to apply styling.

However, syntax highlighting for C++ requires a more nuanced approach.
For example, PrismJS only highlights the declaration of `struct` and `class` types, treating subsequent uses as plain tokens.
This likely stems from the difficulty of distinguishing whether a token represents the name of a class or a variable, as it's perfectly valid to have a variable with the same name as a class (provided the class is properly scoped).
```cpp line-numbers:{enabled}
namespace detail {
    struct MyStruct {
        // ...
    };
}

int main() {
    // This is valid C++
    detail::MyStruct MyStruct { };
    
    // ...
}
```
Syntax highlighting based on tokenization alone is not a viable solution for this case.

A similar issue arises with syntax highlighting for class members and static member variables.
While tokenization or regular expressions can provide a partially working solution, they fall short when parsing definitions of class member variables and inline member functions.
For example, one possible "solution" could be to annotate any tokens following a class access operator (`.` or `->`) as class members.

```cpp line-numbers:{enabled}
#include <cmath> // std::sqrt

struct Vector3 {
    Vector3(float x, float y, float z) : x(x), y(y), z(z) {
        // Constructor parameters have the same name as class member values, 
        // which poses a challenge for syntax highlighting based on tokenization alone
    }
    
    // No syntax highlighting for class members and/or their use in member function definitions...
    
    float length() const {
        return std::sqrt(x * x + y * y + z * z);
    }
    
    void normalize() {
        float len = length();
        if (len == 0.0f) {
            return;
        }
        x /= len;
        y /= len;
        z /= len;
    }
    
    float x;
    float y;
    float z;
};

float dot(const Vector3& a, const Vector3& b) {
    // Idea: highlight the first identifier token after the access operator . as a member variable
    // However, this approach does not properly distinguish member variables from member functions
    return a.x * b.x + a.y * b.y + a.z * b.z;
}
```
However, this solution quickly breaks down.
What about inline member function definitions, where the access operator `this->` isn't required (such as the `length` function on line 10)?
Or constructors, where parameters and class members may share the same name but should not be annotated as the same type?
Furthermore, a distinction needs be made for function calls, which use a similar syntax to member access but should be annotated differently.
A regular expression to capture all of these cases would already be needlessly complex.

## Abstract Syntax Trees

A more effective approach would be to parse the **A**bstract **S**yntax **T**ree (AST) that is generated during compilation and add annotations to tokens based on the exposed symbols.
The Clang C/C++ compiler exposes [`libclang`](https://clang.llvm.org/doxygen/group__CINDEX.html), an API for parsing and traversing ASTs (which conveniently means I don't need to go through the trouble of [writing one from scratch]()).
Many IDEs also use this for syntax highlighting.

To better understand the structure of an AST, let's examine the one generated for the code snippet above.
We can do this by specifying the `-Xclang -ast-dump=json` flags during compilation:
```json
> clang -Xclang -ast-dump=json -fsyntax-only src/example.cpp > out.json
        
{
    "id": "0x11bbd5c4890",
    "kind": "TranslationUnitDecl",
    "loc": {},
    "range": {
        "begin": {},
        "end": {}
    },
    "inner": [
        ...
        {
            "id": "0x24accda1100",
            "kind": "CXXRecordDecl",
            "loc": {
                "offset": 40,
                "file": "example.cpp",
                "line": 3,
                "col": 8,
                "tokLen": 7
            },
            "range": {
                "begin": {
                    "offset": 33,
                    "col": 1,
                    "tokLen": 6
                },
                "end": {
                    "offset": 711,
                    "line": 28,
                    "col": 1,
                    "tokLen": 1
                }
            },
          "isReferenced": true,
          "name": "Vector3",
          "tagUsed": "struct",
          // Is this a declaration or definition?
          "completeDefinition": true,
          // Type traits (trivially copy / move constructible?, has default destructor?, etc.)
          "definitionData": { ... },
          "inner": [ ... ]
        },
        {
            "id": "0x24accdbdc18",
            "kind": "FunctionDecl",
            "loc": {
                "offset": 739,
                "line": 31,
                "col": 7,
                "tokLen": 3
            },
            "range": {
                "begin": {
                    "offset": 733,
                    "col": 1,
                    "tokLen": 5
                },
                "end": {
                    "offset": 982,
                    "line": 35,
                    "col": 1,
                    "tokLen": 1
                }
            },
            "name": "dot",
            "mangledName": "?dot@@YAMAEBUVector3@@0@Z",
            "type": {
                "qualType": "float (const Vector3 &, const Vector3 &)"
            },
            "inner": [ ... ]
        }
    ]
}
```
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
```yaml
TranslationUnitDecl:
	CXXRecordDecl: Vector3  // line 3, column 8
		CXXRecordDecl:
		CXXConstructorDecl: Vector3
			ParmVarDecl: x
			ParmVarDecl: y
			ParmVarDecl: z
			CXXCtorInitializer:
				ImplicitCastExpr:
					DeclRefExpr: x
			CXXCtorInitializer:
				ImplicitCastExpr:
					DeclRefExpr: y
			CXXCtorInitializer:
				ImplicitCastExpr:
					DeclRefExpr: z
			CompoundStmt:
		CXXMethodDecl: length
			CompoundStmt:
				ReturnStmt:
					CallExpr:
						ImplicitCastExpr:
							DeclRefExpr: sqrt
						BinaryOperator: +
							BinaryOperator: +
								BinaryOperator: *
									ImplicitCastExpr:
										MemberExpr: x
											CXXThisExpr:
									ImplicitCastExpr:
										MemberExpr: x
											CXXThisExpr:
								BinaryOperator: *
									ImplicitCastExpr:
										MemberExpr: y
											CXXThisExpr:
									ImplicitCastExpr:
										MemberExpr: y
											CXXThisExpr:
							BinaryOperator: *
								ImplicitCastExpr:
									MemberExpr: z
										CXXThisExpr:
								ImplicitCastExpr:
									MemberExpr: z
										CXXThisExpr:
		FieldDecl: x
		FieldDecl: y
		FieldDecl: z
	FunctionDecl: dot
		ParmVarDecl: a
		ParmVarDecl: b
		CompoundStmt:
			ReturnStmt:
				BinaryOperator: +
					BinaryOperator: +
						BinaryOperator: *
							ImplicitCastExpr:
								MemberExpr: x
									DeclRefExpr: a
							ImplicitCastExpr:
								MemberExpr: x
									DeclRefExpr: b
						BinaryOperator: *
							ImplicitCastExpr:
								MemberExpr: y
									DeclRefExpr: a
							ImplicitCastExpr:
								MemberExpr: y
									DeclRefExpr: b
					BinaryOperator: *
						ImplicitCastExpr:
							MemberExpr: z
								DeclRefExpr: a
						ImplicitCastExpr:
							MemberExpr: z
								DeclRefExpr: b
```
Most node kinds are self-explanatory, except for two: `CompoundStmt` and `UnexposedRef`. Here is a brief overview of what these nodes represent:
- `CompoundStmt`: This node corresponds the body of a function, containing all symbols within the function body in its `inner` element.
- `UnexposedRef`: This node appears when an expression cannot be directly classified, is incomplete, or lacks enough context for precise classification by Clang.

For the purposes of this project, these nodes can safely be ignored. 
References to `CompoundStmt` and `UnexposedRef` nodes in the AST above were retained to maintain consistency, but all relevant information for syntax highlighting can be extracted from their children.
 
## Python

Below is a sample C++ code snippet showcasing a variety of language features.
Syntax highlighting is handled exclusively by PrismJS.

```cpp
#pragma once

#include <stdexcept> // std::runtime_error, std::out_of_range
#include <vector> // std::vector
#include <string> // std::string, std::to_string
#include <ctime> // std::tm, std::time_t, std::time, std::localtime
#include <sstream> // std::stringstream
#include <iostream> // std::cout
#include <cmath> // std::sqrt
#include <concepts> // std::input_or_output_iterator, std::sentinel_for,
                    // std::incrementable, std::same_as, std::convertible_to
                    
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


    // Prints today's date
    // For C++20 and above, use std::system_clock::now() and std::year_month_day
    std::time_t time = std::time(nullptr);
    std::tm* local_time = std::localtime(&time);

    int year = 1900 + local_time->tm_year;
    utility::Month month = static_cast<utility::Month>(1 + local_time->tm_mon);
    int day = local_time->tm_mday;
    
    std::string suffix;
    switch (day) {
        case 1:
            suffix = "st";
            break;
        case 2:
            suffix = "nd";
            break;
        case 3:
            suffix = "rd";
            break;
        default:
            suffix = "th";
            break;
    }

    str = utility::concat("Today is ", utility::to_string(month), " ", day, suffix, ", ", year);
    std::cout << str << '\n';

    
    // Determine the orthonormal basis for the given forward vector (assuming (0, 1, 0) is up)
    math::Vector3 up = math::Vector3::up;
    math::Vector3 forward = math::normalize(math::Vector3(0.75f, 0.12f, 3.49f)); // Arbitrary
    math::Vector3 right = math::cross(forward, up);
    
    str = utility::concat("The cross product of vectors ", up, " and ", forward, " is ", right);
    std::cout << str << '\n';
    
    
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

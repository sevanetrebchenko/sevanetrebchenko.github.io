
*Reader beware: this post is actively being worked on!*










An alternative approach for annotating these nodes is through the `VisitCallExpr` visitor function.






Note that most of these changes also apply to template contexts.

Keen observers will notice that the base class hierarchy is not annotated.
We can attempt to traverse the base class hierarchy through the underlying `CXXRecordDecl` node:
```cpp title:{visitor.cpp} added:{17-28}
#include "visitor.hpp"

bool Visitor::VisitClassTemplateDecl(clang::ClassTemplateDecl* node) {
    const clang::SourceManager& source_manager = m_context->getSourceManager();
    clang::SourceLocation location = node->getLocation();
    
    // Skip template class definitions that do not come from the main file
    if (!source_manager.isInMainFile(location)) {
        return true;
    }
    
    // Insert annotation for template class name
    std::string name = node->getNameAsString();
    unsigned line = source_manager.getSpellingLineNumber(location);
    unsigned column = source_manager.getSpellingColumnNumber(location);
    
    m_annotator->insert_annotation("class-name", line, column, name.length());

    // Try annotating class names in the base class hierarchy...
    const clang::CXXRecordDecl* templated = node->getTemplatedDecl();
    for (const clang::CXXBaseSpecifier& base : templated->bases()) {
        // This returns the fully-qualified name, including namespaces and class names...
        name = base.getType().getAsString();

        location = base.getBaseTypeLoc();
        line = source_manager.getSpellingLineNumber(location);
        column = source_manager.getSpellingColumnNumber(location);

        m_annotator->insert_annotation("class-name", line, column, name.length());
    }
    
    return true;
}
```
This approach iterates through the base class hierarchy retrieved from `CXXRecordDecl::bases`, with the underlying `CXXRecordDecl` node accessed via `ClassTemplateDecl::getTemplatedDecl`.
However, there are a few issues with this method.

First, the `CXXBaseSpecifier` class doesn't provide an easy way to obtain detailed information about the type it refers to.
While `CXXBaseSpecifier::getType` (or its variants) can be used to access the underlying `CXXRecordDecl`, these functions ultimately return information about the root type (ignoring any typedefs).
For example, when working with `std::false_type`, this method returns details about the underlying `std::integral_constant`, which complicates inserting annotations as annotations are based on class name.

An alternative approach, as seen in the code above, works with the top-level type retrieved from `CXXBaseSpecifier::getType`.
Stringifying this type results in a fully-qualified type name, which can include namespaces and other class names.
Unfortunately, this approach is also not feasible, as we are looking for just the name of the top-level class.

Luckily, there is a more robust approach that we can take, that we will see later.
For now, we will skip annotating base class hierarchies entirely.

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

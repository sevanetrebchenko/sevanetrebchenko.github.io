
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
```cpp line-numbers:{enable}
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
```cpp line-numbers:{enable}
#include <cmath> // std::sqrt

struct Vector3 {
    Vector3(float x, float y, float z) {
        // Constructor parameters share their name with class members,
        // meaning we run the risk of incorrectly annotating these tokens
        // ...
    }
    
    float length() const {
        // No syntax highlighting here...
        return std::sqrt(x * x + y * y + z * z);
    }

    float x;
    float y;
    float z;
};

// Dot product
float dot(const Vector3& a, const Vector3& b) {
    // We can cheat here by highlighting any tokens after the . as member variables
    // Need to account for function calls...
    return a.x * b.x + a.y * b.y + a.z * b.z;
}
```
However, this solution quickly breaks down.
What about inline member function definitions, where the access operator `this->` isn't required (such as the `length` function on line 10)?
Or constructors, where parameters and class members may share the same name but should not be annotated as the same type?
Furthermore, a distinction needs be made for function calls, which use a similar syntax to member access but should be annotated differently.
A regular expression to capture all of these cases (+more!) would already be needlessly complex.

A more effective approach is to parse the **A**bstract **S**yntax **T**ree (AST) generated during compilation, as it provided a much more detailed view of the symbols in the source code.
Note that it is possible to see the generated AST by specifying the `-Xclang -ast-dump=json` flags during compilation.
```json

```

The Clang C/C++ compiler offers [`libclang`](https://clang.llvm.org/doxygen/group__CINDEX.html), an API for parsing and traversing ASTs (which also means I don't need to go through the trouble of [writing one from scratch]()).
Its primary use is for enabling syntax highlighting in IDEs.
`libclang` also comes with Python bindings, found in the module [`clang.cindex`](https://libclang.readthedocs.io/en/latest/index.html).
Rather than relying solely on tokenization or regular expressions for syntax highlighting, I decided to create a small project that leverages `clang.cindex` to enhance code snippet highlighting by parsing data from the generated AST.
This approach allows for much more accurate annotation of class names, member variables, and functions, as well as proper highlighting of other tokens such as preprocessor defines, enums, and unions. 

## Python

Below is a sample C++ code snippet showcasing a variety of language features, with syntax highlighting handled exclusively by PrismJS.

```cpp line-numbers:{enable}
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
            // This is safe because the non-const Vector3::operator[] does not modify the value
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
Let's start simple and gradually build up towards more complex cases.

### Keywords
There are a few different ways to perform syntax highlighting on keywords.


Keywords are the easiest tokens to parse, and there are a few different wa

### Comments

### Literals

### Namespaces

### Functions

### Enums

### Unions

### Classes

Ironically, a lot of the code written for this post is not written in C++, meaning I must resort to sample C++ code for showcasing the custom functionality. When/if a better solution for some of the more complex use cases comes out

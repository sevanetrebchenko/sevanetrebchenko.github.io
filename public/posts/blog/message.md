
## Introduction

I really like Python format strings. The C++20 format library (wrapper around fmtlib) comes close, but I was never a huge fan of the C-style format specifiers for things like precision, width. Moreover, adding support for custom format specifiers would require manual parsing of the string, and that's where I feel the C++20 format library falls short. I felt the interface for creating custom formatters was unintuitive, so I rolled out a custom solution that I was more comfortable with. An alternative approach to this would be to use C++ streams, but they are incredibly verbose and [come with performance implications](). I also thought this would be a fun learning experience, and serve as a base for a simple logging library I was working on at the time.

This library ended up being a deep dive into templates, tuples, and avoiding complication errors with compile time logic.


The concept of a format string is pretty simple. You have a set of placeholders (defined by curly braces) 

## Implementation

The main interface of the library is as follows:

```cpp
struct FormatString {
    FormatString(const std::string& format, std::source_location source = std::source_location::current());
    FormatString(std::string_view format, std::source_location source = std::source_location::current());
    FormatString(const char* format, std::source_location source = std::source_location::current());
    ~FormatString();
    
    std::string_view format;
    std::source_location source;
};

template <typename T>
struct NamedArgument {
    using type = T;
    
    NamedArgument(std::string_view name, const T& value);
    ~NamedArgument();

    std::string_view name;
    const T& value;
};

template <typename ...Ts>
std::string format(FormatString fmt, const Ts&... args);
```

This is just a test
```cpp added:{} removed:{} modified:{} highlighted:{} hidden:{} line-numbers:{enable}
#pragma once

#include <stdexcept> // std::runtime_error
#include <string> // std::string
#include <iostream> // std::cout
#include <concepts> // std::same_as

#define ASSERT(EXPRESSION, MESSAGE)        \
    if (!(EXPRESSION)) {                   \
        throw std::runtime_error(MESSAGE); \
    }

template <typename T>
class MyClass {
    public:
        MyClass(T value) : m_value(value) {
            ASSERT(value > 0, "value must be greater than 0");
        }
        
        ~MyClass() {
            // Complex destructor logic
        }
    
        T value() const;
    
    private:
        T m_value;
};

T MyClass::value() const {
    return m_value;
}

namespace outer::inner {
}

enum class State {
    IDLE,
    ALERT
};

namespace utility {

    namespace detail {
        // Nested namespaces
        
        struct Animal {
            enum class State {
                IDLE,
                ALERT
            };
        };
    
        template <typename T>
        concept Container = requires(T container) {
            // 1. container must have valid begin() / end()
            { std::begin(container) } -> std::same_as<decltype(std::end(container))>;
            
            // 2. container iterator must be incrementable
            { ++std::begin(container) };
            
            // 3. container iterator must support comparison operators
            { std::begin(container) == std::begin(container) } -> std::same_as<bool>;
            { std::begin(container) != std::begin(container) } -> std::same_as<bool>;
            
            // 4. container iterator must be deferenceable
            { *std::begin(container) };
        };
    
    }
    
    template <typename ...Ts>
    void print(const Ts&... args) {
        (std::cout << ... << args) << '\n';
    }
    
    template <typename T, template <typename> class G>
    void print(const T& container) {
        std::cout << "[ ";
        
        std::vector<int>::const_iterator end = std::end(c);
        for (auto iter = std::begin(c); iter != end; ++iter) {
            std::cout << *iter;
            if (iter + 1 != end) {
                std::cout << ", ";
            }
        }
        
        std::cout << " ]" << '\n';
    }

}

namespace math {

    struct Vector3 {
        Vector3() : x(0.0f), y(0.0f), z(0.0f) {
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
    
        // Returns the magnitude of the vector
        float length() const {
            return std::sqrt(x * x + y * y + z * z);
        }
        
        void print() const {
            using namespace utility;
            print("(", x, ", ", y, ", ", z, ")");
        }
        
        float x;
        float y;
        float z;
    };

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
        if (length > 0.0f) {
            return v / length;
        }
        return { };
    }

}



int main() {
    // Prints "Hello, world!"
    utility::print("Hello", ",", " ", "world", "!");
    
    // Prints "[ 0, 1, 2, 3, 4, 5 ]"
    std::vector<int> vec = { 0, 1, 2, 3, 4, 5 };
    utility::print(vec);

    return 0;
}

```

The `FormatString` struct is a wrapper around a string, and serves one important purpose: capturing a `source_location` object at the call site to `format(...)` (no more `__LINE__` and `__filename__` macros!) This is used by the implementation to provide more meaningful error messages for debugging in the case of a syntax error, and can be used by derivative systems (like a logging module) to report the location of a call to `format` in a log message.

The wrapper is necessary because default arguments are (unfortunately) not allowed at the end of variadic template argument lists. Otherwise, the interface of `format` could be simplified to:
```cpp
template <typename ...Ts>
std::string format(std::string_view fmt, const Ts&... args, std::source_location source = std::source_location::current());
```

The explicit keyword is purposefully omitted from the constructors of `FormatString` (as much as CLion likes to complain about this) because it allows for calls to `format` to implicitly capture details about the source location while only requiring a string object and keeping the usage of the interface simple. This approach can be further extended to capture additional information about the string itself, but I haven't found a use for this.

The `NamedArgument<T>` type is a wrapper for named placeholders, and is required so that the implementation knows which placeholder to format in which location. It captures a reference to the value that should be used for formatting to avoid copying non-trivially copyable (and potentially expensive) types.

Finally, the necessary pieces for `format` to work come together . This is a sample usage of the function:
```cpp
HAVE SOMETHING MORE INTERESTING HERE
std::string result = format("This is a {} string!", "format");
```

Formatting the same string using C++ streams would look something like this:
```cpp
std::stringstream str;
str << "This is a " << "format" << "string!";
std::string result = str.str();
```
which is not great.




### `format(...)` Implementation Details

This section will primarily focus on the `format` function, since the implementation of both `FormatString` and `NamedArgument` are trivial and not that interesting. If you're interested, you can see the full implementation of the library [here]().

Here is a breakdown of the different stages of the function:
```cpp
template <typename ...Ts>
std::string format(FormatString fmt, const Ts&... args) {
    // Parse the format string for placeholders
    // 
}
```

A deisng decision I made at the time was formatting each placeholder individually  See the Iterations section below for why I decided against this kind of approach

### Custom Formatters

The bulk of the implementation time was spent working on type formatters. I prioritized the extensibility of the system and making it easy to impelement custom formatters for user-defined types. As mentioned above, I wasn't the biggest fan of the way fmtlib or C++20 format strings handle this, so a big focus of mine was to make the API easy to use. Before diving into the specifics, let's first talk about format specifiers.

#### Format Specifiers

Format specifiers allow for 

### Iterations


### Integration

With my format string implementation complete, I turned my attention to the logging system I was working on.

### Post Mortem
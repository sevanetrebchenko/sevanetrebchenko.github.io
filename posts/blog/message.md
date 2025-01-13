
## Introduction

I really like Python format strings. The C++20 format library (wrapper around fmtlib) comes close, but I was never a huge fan of the C-style format specifiers for things like precision, width. Moreover, adding support for custom format specifiers would require manual parsing of the string, and that's where I feel the C++20 format library falls short. I felt the interface for creating custom formatters was unintuitive, so I rolled out a custom solution that I was more comfortable with. An alternative approach to this would be to use C++ streams, but they are incredibly verbose and [come with performance implications](). I also thought this would be a fun learning experience, and serve as a base for a simple logging library I was working on at the time.

This library ended up being a deep dive into templates, tuples, and avoiding complication errors with compile time logic.


The concept of a format string is pretty simple. You have a set of placeholders (defined by curly braces) 

## Implementation

The main interface of the library is as follows:

```cpp


//#pragma once

# include <stdexcept> // std::runtime_error
#include <iostream> // std::cout
#include <concepts> // std::same_as
#include <vector> // std::vector
#include <cmath> // std::sqrt

#define [[macro.macro-name,ASSERT]](EXPRESSION, MESSAGE)        \
    if (!(EXPRESSION)) {                   \
        throw [[namespace-name,std]]::[[class-name,runtime_error]](MESSAGE); \
    }

namespace [[namespace-name,utility]] {
    namespace [[namespace-name,detail]] {}
}

namespace [[namespace-name,math]] {

    struct [[class-name,Vector3]] {
        static int [[member-variable,k]];

        Vector3();

        Vector3() : [[member-variable,x]](0.0f), [[member-variable,y]](0.0f), [[member-variable,z]](0.0f) {
            [[macro.macro-name,ASSERT]](false, "haha std::vector");
            [[namespace-name,std]]::[[class-name,string]] r = R"delim(Some raw content)delim";
        }

        Vector3(float x, float y, float z) : [[member-variable,x]](x), [[member-variable,y]](y), [[member-variable,z]](z) {
        }

        ~Vector3() = default;

        Vector3(const [[class-name,Vector3]]& other) {
        }

        [[class-name,Vector3]] operator[[function-operator,=]](const [[class-name,Vector3]]& other) const {
        }

        [[class-name,Vector3]] operator[[function-operator,<<=]](const [[class-name,Vector3]]& other) const {
            return { [[member-variable,x]] + other.[[member-variable,x]], [[member-variable,y]] + other.[[member-variable,y]], [[member-variable,z]] + other.[[member-variable,z]] };
        }

        [[class-name,Vector3]] operator [[function-operator,+]](const [[class-name,Vector3]]& other) const {
            return { [[member-variable,x]] + other.[[member-variable,x]], [[member-variable,y]] + other.[[member-variable,y]], [[member-variable,z]] + other.[[member-variable,z]] };
        }

        [[class-name,Vector3]] operator[[function-operator,-]](const [[class-name,Vector3]]& other) const {
            return { [[member-variable,x]] - other.[[member-variable,x]], [[member-variable,y]] - other.[[member-variable,y]], [[member-variable,z]] - other.[[member-variable,z]] };
        }

        [[class-name,Vector3]] operator[[function-operator,*]](float s) const {
            return { [[member-variable,x]] * s, [[member-variable,y]] * s, [[member-variable,z]] * s };
        }

        // Overloading the dereference operator
        int& operator[[function-operator,*]]() {
            return &[[member-variable,x]];
        }

        [[class-name,Vector3]] operator[[function-operator,/]](float s) const {
            return { [[member-variable,x]] / s, [[member-variable,y]] / s, [[member-variable,z]] / s };
        }

        // Returns the magnitude of the vector
        float length() const {
            return [[namespace-name,std]]::sqrt([[member-variable,x]] * [[member-variable,x]] + [[member-variable,y]] * [[member-variable,y]] + [[member-variable,z]] * [[member-variable,z]]);
        }

        void print() const {
            auto lambda = []() {
                [[member-variable,x]];
                [[member-variable,y]];
            };

            namespace [[namespace-name,u]] = [[namespace-name,utility]]::[[namespace-name,detail]];
            [[namespace-name,utility]]::[[namespace-name,detail]]::print("(", [[member-variable,x]], ", ", [[member-variable,y]], ", ", [[member-variable,z]], ")");
            asdf::print("");
        }

        float [[member-variable,x]];
        float [[member-variable,y]];
        float [[member-variable,z]];
    };

    // Dot product
    float dot([[class-name,Vector3]] a, [[class-name,Vector3]] b) {
        return a.[[member-variable,x]] * b.[[member-variable,x]] + a.[[member-variable,y]] * b.[[member-variable,y]] + a.[[member-variable,z]] * b.[[member-variable,z]];
    }

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
    [[class-name,Vector3]] normalize(const [[class-name,Vector3]]& v) {
        [[class-name,Vector3]]* ve = new [[class-name,Vector3]]();
        *ve = 2;

        float length = v.length();
        if (length > 0.0f) {
            return (v / length);
        }
        return { };
    }

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
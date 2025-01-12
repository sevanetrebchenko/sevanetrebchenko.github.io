
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

#define ASSERT(EXPRESSION, MESSAGE)        \
    if (!(EXPRESSION)) {                   \
        throw [[namespace-name,std]]::[[class-name,runtime_error]](MESSAGE); \
    }

#define TEST 15
#define MyTYPE [[class-name,MyClass]]<float>

#if defined TEST
#endif

template <typename [[class-name,T]]>
class [[class-name,MyClass]] {
    public:
        static int [[member-variable,my_static]];

        static void build();

        MyClass([[class-name,T]] value)
         : [[member-variable,m_value]](value) {
            ASSERT(value > 0, "value must be greater than 0");
            [[member-variable,m_value]];
            [[member-variable,my_static]];
        }

        ~MyClass() {
            // Complex destructor logic
        }

        [[class-name,T]] value() const;

    private:
        [[class-name,T]] [[member-variable,m_value]];
};

template <typename [[class-name,T]]>
[[class-name,T]] [[class-name,MyClass]]<[[class-name,T]]>::value() const {
    return [[member-variable,m_value]];
}

using namespace [[namespace-name,std]];

namespace [[namespace-name,utility]] {

    namespace [[namespace-name,detail]] {
        // Nested namespaces

        struct [[class-name,Animal]] {
            enum class [[enum-name,State]] {
                [[enum-value,AWAKE]],
                [[enum-value,ASLEEP]] = 4
            };
        };

        template <typename [[class-name,T]]>
        concept Container = requires([[class-name,T]] container) {
            // 1. container must have valid begin() / end()
            { [[namespace-name,std]]::begin(container) } -> [[namespace-name,std]]::[[class-name,same_as]]<decltype([[namespace-name,std]]::end(container))>;

            // 2. container iterator must be incrementable
            { ++[[namespace-name,std]]::begin(container) };

            // 3. container iterator must support comparison operators
            { [[namespace-name,std]]::begin(container) == [[namespace-name,std]]::begin(container) } -> [[namespace-name,std]]::[[class-name,same_as]]<bool>;
            { [[namespace-name,std]]::begin(container) != [[namespace-name,std]]::begin(container) } -> [[namespace-name,std]]::[[class-name,same_as]]<bool>;

            // 4. container iterator must be deferenceable
            { *[[namespace-name,std]]::begin(container) };
        };

    }

    template <typename ...Ts>
    void print(const Ts&... args) {
         ([[namespace-name,std]]::[[class-name,cout]] << ... << args) << '\n';
    }

    template <[[namespace-name,detail]]::[[class-name,Container]] C>
    void print(const C& c) {
        [[namespace-name,std]]::[[class-name,cout]] << "[ ";

        [[namespace-name,std]]::[[class-name,vector]]<int>::[[class-name,const_iterator]] end = [[namespace-name,std]]::end(c);
        for (auto iter = [[namespace-name,std]]::begin(c); iter != end; [[function-operator,++iter) {]]
            [[namespace-name,std]]::[[class-name,cout]] << *iter;
            if (iter + 1 != end) {
                [[namespace-name,std]]::[[class-name,cout]] << ", ";
            }
        }

        [[namespace-name,std]]::[[class-name,cout]] << " ]" << '\n';
    }

}

template <typename [[class-name,T]]>
class [[class-name,Test]] {
                public:
                    using [[class-name,type]] = [[class-name,T]];
            };

namespace [[namespace-name,outer]]::[[namespace-name,inner]] {
}

namespace [[namespace-name,math]] {

    int test(const [[class-name,Test]]<[[class-name,Test]]<int>>& a) {
        auto b = []() {
            [[namespace-name,std]]::[[class-name,cout]];
        }
    }

    struct [[class-name,Vector3]] {
        Vector3();

        Vector3() : [[member-variable,x]](0.0f), [[member-variable,y]](0.0f), [[member-variable,z]](0.0f) {
        }

        Vector3(float x, float y, float z) : [[member-variable,x]](x), [[member-variable,y]](y), [[member-variable,z]](z) {
        }

        ~Vector3() = default;

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
        Vector* ve = new Vector();
        [[function-operator,*ve = 2;]]

        float length = v.length();
        if (length > 0.0f) {
            return ([[function-operator,v]] / length);
        }
        return { };
    }

}


template <typename [[class-name,T]]>
struct [[class-name,K]] {
    struct [[class-name,ASDF]] {
        using namespace [[namespace-name,utility]];
        static int [[member-variable,a]];
    };

    static int [[member-variable,b]];
};

int main() {
//    // Prints "Hello, world!"
//    utility::print("Hello", ",", " ", "world", "!");
//
//    MyTYPE a { 0.0f };

    using [[class-name,T]] = [[class-name,K]]<int>;
    using [[class-name,F]] = [[class-name,T]];

    int a = [[class-name,F]]::[[class-name,ASDF]]::a;
    int b = [[class-name,S]]<int>::[[member-variable,b]];


    [[enum-name,State]] state = [[enum-name,State]]::[[enum-value,ASLEEP]];
//
//    // Prints "[ 0, 1, 2, 3, 4, 5 ]"
//    std::vector<int> vec = { 0, 1, 2, 3, 4, 5 };
//    utility::print(vec);

    return 0;
}

namespace [[namespace-name,utility]] {
    namespace [[namespace-name,detail]] {
        void print(const char* format, float x, float y, float z);
    }
}


void example() {
    using namespace [[namespace-name,utility]]::[[namespace-name,detail]];

    [[class-name,MyClass]]<int, float>::MyMethod<int, float, ...>();
    [[class-name,AnotherClass]]<int, [[class-name,T]], [[namespace-name,std]]::[[class-name,string]]>::Method<...>();
    [[class-name,MyClass]]<[[class-name,T]], [[class-name,U]]>::[[class-name,Nested]]<[[class-name,T]], [[class-name,U]]> myVar;

    print("(", 1.0f, 2.0f, 3.0f);
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
If you haven't already, make sure to read the previous posts in this series!
 - [Spark's ECS Architecture: An Overview](https://sevanetrebchenko.com/blog/spark-ecs)
 - [Spark's ECS Architecture - Part 1: Entities](https://sevanetrebchenko.com/blog/spark-ecs-part-1)

In the previous post, we discussed the necessary backend for supporting entities in Spark's ECS architecture. Now that we have entities, how can we start attaching components to them and utilizing compositions of components to create unique behaviors? 

Instead of first defining what a component is, let's start from the top and go down, and build a set of requirements for what a component needs to have to be considered well-defined. 

The way in which groups of components are stored will ultimately an impact on the way components are structured. I mentioned in the [introduction post to this series](https://sevanetrebchenko.com/blog/spark-ecs) that one of the benefits of an ECS architecture when it comes to organizing data is more easily-attainable cache friendliness. This is because of the way systems in ECS architectures operate on components. 

Let's say we have a Transform system that operates on any entity that has a Transfrom component. An example update loop of such a system would look as follows:

```cpp added:{} removed:{} modified:{} highlighted:{} hidden:{} line-numbers:{enable}
#pragma once

#ifndef TEST
#define TEST

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

namespace utility {

    namespace detail {
        // Nested namespaces
        
        struct Animal {
            enum class State {
                
            };
        }
    
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
    
    template <Container T>
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

#endif // TEST
```
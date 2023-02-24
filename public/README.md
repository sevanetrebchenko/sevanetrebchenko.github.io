<h1 style="text-align:center;">Spark's ECS Architecture - Part 2: Components</h1>

If you haven't already, make sure to read the previous posts in this series!
 - [Spark's ECS Architecture: An Overview](https://sevanetrebchenko.com/blog/spark-ecs)
 - [Spark's ECS Architecture - Part 1: Entities](https://sevanetrebchenko.com/blog/spark-ecs-part-1)

In the previous post, we discussed the necessary backend for supporting entities in Spark's ECS architecture. Now that we have entities, how can we start attaching components to them and utilizing compositions of components to create unique behaviors? 

Instead of first defining what a component is, let's start from the top and go down, and build a set of requirements for what a component needs to have to be considered well-defined. 

The way in which groups of components are stored will ultimately an impact on the way components are structured. I mentioned in the [introduction post to this series](https://sevanetrebchenko.com/blog/spark-ecs) that one of the benefits of an ECS architecture when it comes to organizing data is more easily-attainable cache friendliness. This is because of the way systems in ECS architectures operate on components. 

Let's say we have a Transform system that operates on any entity that has a Transfrom component. An example update loop of such a system would look as follows:

```cpp added:{1-6, 7} removed:{4-5} modified:{} hidden:{1-5} line-numbers:{enable}
#pragma once
#include <iostream>
#include <string>

#define TEST_DEFINE_1 1
#define TEST_DEFINE_2 2
// #define TEST_DEFINE_3 3

#if defined(TEST_DEFINE_1)

  #if defined(TEST_DEFINE_2)

    // test code hahah hehe
    // more test code
  #else 

    // asdf asdf asdf 
    ...
  #endif

  // hahahehe

#elif defined(TEST_DEFINE_2)

  #if defined(TEST_DEFINE_1)

    // test code hahah hehe
    // more test code
  #else 

    // asdf asdf asdf 
    ...
  #endif

#else

  // hahahehe

#endif

template <typename Tddd>
class MyClass {
 public:
  #define MY_PROPERTY      const Tddd* 
  MY_PROPERTY  my_property;

   ...
};

        enum class Mode {
            MODE_STICKY_KEYS          = 1u << 0u,
            MODE_STICKY_MOUSE_BUTTONS = 1u << 1u,
        };

const constant = 4;

int main() {
  MyClass<int> my_object;
  my_object.my_property = 42;
  my_object.my_property = 'd';
  my_object.call_function();

  const CONSTANT = 123123u;

  std::cout << my_object.my_property << std::endl;
  return 0;
}


 namespace lightswitch::    asdf   {
  class Derived : protected Base<float...> {
        public:

        protected:

        private:
         int m_member;
  };
}

using namespace a::b::c::d;
namespace alias = ab::t::trad;


void TransformSystem::Update(float deltaTime) {
  using U = lightswitch::asdf::Derived::
lightswitch::asdf::Derived affff;

    if (test) {
        using U = std::unique_ptr<const int*, float, Tt>::type;
    }

    #define HEHEHAHA
    for (Transform& transformComponent : allTransformComponents) {
      transformComponent->m_member;
        // Update transform component here.
       ...
    }
}
```
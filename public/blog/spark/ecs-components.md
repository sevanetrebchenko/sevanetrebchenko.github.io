<style>
code {
    font-family: 'JetBrains Mono', monospace !important; 
    background: #f4f4f4;
    border: 1px solid #ddd;
    border-left: 3px solid orange;
    color: #666;
    page-break-inside: avoid;
    font-size: 16px;
    line-height: 1.6;
    max-width: 100%;
    overflow: auto;
    padding: 1em 1.5em;
    display: block;
    word-wrap: break-word;
}

img {
    width:100%;
    max-width:940px;
    display:block;
    margin:auto;"
}
</style>

<h1 style="text-align:center;">Spark's ECS Architecture - Part 2: Components</h1>

If you haven't already, make sure to read the previous posts in this series!
 - [Spark's ECS Architecture: An Overview](https://sevanetrebchenko.com/blog/spark-ecs)
 - [Spark's ECS Architecture - Part 1: Entities](https://sevanetrebchenko.com/blog/spark-ecs-part-1)

In the previous post, we discussed the necessary backend for supporting entities in Spark's ECS architecture. Now that we have entities, how can we start attaching components to them and utilizing compositions of components to create unique behaviors? 

Instead of first defining what a component is, let's start from the top and go down, and build a set of requirements for what a component needs to have to be considered well-defined. 

The way in which groups of components are stored will ultimately an impact on the way components are structured. I mentioned in the [introduction post to this series](https://sevanetrebchenko.com/blog/spark-ecs) that one of the benefits of an ECS architecture when it comes to organizing data is more easily-attainable cache friendliness. This is because of the way systems in ECS architectures operate on components. 

Let's say we have a Transform system that operates on any entity that has a *Transform* component. An example update loop of such a system would look as follows:

```cpp
void TransformSystem::Update(float deltaTime) {
    for (Transform& transformComponent : allTransformComponents) {
        // Update transform component here.
        ...
    }
}
```

Notice that, upon requesting a *Transform* component from the list of all *Transform* components, some amount of data is loaded into the cache along with the memory address of the desired component. 

![](/blog/spark/not-cache-friendly.png)

This extra data in the cache is useless if the components are not laid out side-by-side in memory. Continuing to process the components in such a way will result in a cache miss every time the next component is read. A better way to structure the layout of our components is to pack them into arrays.

![](/blog/spark/cache-friendly.png)

Structuring the data this way will allow accessing of the components in the sample update loop to happen much faster since the data is laid out in a way that utilizes more of the cache before hitting a cache miss.

## Component Manager

The ComponentManager's job is just this: to interface with a list of components that are stored in a memory-efficient way. 

```cpp
template <class ComponentType>
class ComponentManager : public IComponentManager {
    public:
        ComponentManager();
        ~ComponentManager() override;

        // Creates and returns the component.
        ComponentType* CreateComponent();

        // Validates and destroys the component.
        void DeleteComponent(ComponentType *component);

    private:
        // A cache-friendly way to store components.
        ...
};
```

There are a number of ways to do this, the simplest of which is a monolithic array of components. Such a data structure ensures components are contiguous in memory. However, as will be detailed in the Systems portion of Spark's ECS architecture, this solution does not work. The remainder of the ComponentManager is an interface to create and destroy components. It is templatized to only manage a component of a single type. Note that this implementation does not know anything about [entities]() that were discussed in the previous post, as there will be another layer of abstraction to combine these two systems.

Below is the pseudocode for the CreateComponent and DestroyComponent functions. If you are interested in the chosen implementation for Spark's ECS architecture, be sure to check out the post on [Spark's custom memory manager]().

```cpp
template <class ComponentType>
ComponentType* ComponentManager<ComponentType>::CreateComponent() {
    // Create a new component of type ComponentType.
    ...

    return component;
}

template <class ComponentType>
void ComponentManager<ComponentType>::DeleteComponent(ComponentType *component) {
    // Validate component.
    if (!component) {
        return;
    }
    ...

    // Remove component from data structure.
    ...
}
```
A ComponentManager acts like a wrapper around a given data structure that is contiguous in memory. Additionally, to allow ComponentManagers for any given type of component to return a pointer to a component, we must have a **base component class that all components derive from.**

## Component Manager Collection

The ComponentManagerCollection simply makes the accessing different ComponentManagers easier.

```cpp
template <class ...ComponentTypes>
class ComponentManagerCollection {
    public:
        template <class ComponentType>
        NODISCARD ComponentManager<ComponentType>* GetComponentManager();

    protected:
        ComponentManagerCollection();
        ~ComponentManagerCollection() override;

    private:
        template <class ComponentType>
        void CreateComponentSystem();

        template <class ComponentType>
        void DestroyComponentSystem();

        std::unordered_map<ComponentTypeID, IComponentManager*> componentManagerMap_;
};
```

You may notice that the ComponentManager map uses one level of indirection to store ComponentManagers. This is because a ComponentManager templatized to a given type of component is considered its own type. Hence, there needs to be an IComponentManager interface that all ComponentManagers derive from to allow templatized ComponentManagers to be polymorphic at runtime.

```cpp
// Virtual abstract interface so that component managers can be polymorphic at runtime.
class IComponentManager {
    public:
        virtual ~IComponentManager() = default;
};
```


In order to get a ComponentManager of a given component type, two things must be confirmed: the ComponentManager is created and initialized, and the desired component type exists as an argument in the variadic template list for the ComponentManagerCollection. 

The former of the two is mitigated by a macro, which expands to a list of all the currently supported component types in the engine. When creating a new component, the author needs to ensure the component is added to this list. 

```cpp
// An example component list, supporting a Transform and a Physics component.
#define COMPONENT_TYPES ::Spark::ECS::Transform, ::Spark::ECS::Physics
```

```cpp
template<class... ComponentTypes>
ComponentManagerCollection<ComponentTypes...>::ComponentManagerCollection() {
    // Ensure given ComponentType is valid (exists in COMPONENT_TYPES define)
    static_assert((std::is_base_of_v<IComponent, ComponentTypes> && ...), "Invalid template parameter provided to base BaseComponentSystem - component types must derive from IComponent.");

    // Call CreateComponentSystem for each type in ComponentTypes.
    PARAMETER_PACK_EXPAND(CreateComponentSystem, ComponentTypes);
}

template <class... ComponentTypes>
template <class ComponentType>
void ComponentManagerCollection<ComponentTypes...>::CreateComponentSystem() {
    // Emplace a new ComponentManager in the map.
    componentManagerMap_[ComponentType::ID] = new ComponentManager<ComponentType>();
}
```

Upon creation of the ComponentManagerCollection, the CreateComponentSystem function is called for each argument of that list, ensuring that all properly-defined components have a matching ComponentManager created for them. Note that the ComponentManagerCollection constructor checks to make sure all components derive from an IComponent base class. This will be explained in the next section.

In a similar fashion, DestroyComponentSystem is called for each registered ComponentManager when the ComponentManagerCollection is destroyed.

```cpp
template<class... ComponentTypes>
template<class ComponentType>
void ComponentManagerCollection<ComponentTypes...>::DestroyComponentSystem() {
    delete componentManagerMap_[ComponentType::ID];
}
```

Settings things up in such a way makes accessing a ComponentManager for an individual ComponentType a simple lookup.

```cpp
template <class... ComponentTypes>
template <class ComponentType>
ComponentManager<ComponentType>* ComponentManagerCollection<ComponentTypes...>::GetComponentManager() {
    // Check the validity of the given ComponentType.
    static_assert((std::is_base_of_v<IComponent, ComponentTypes> && ...), "Invalid template parameter provided to GetComponentManager - component types must derive from IComponent.");
    static_assert((std::is_same_v<ComponentType, ComponentTypes> || ...), "Invalid component type provided to ComponentManagerCollection::GetComponentManager. There is no ComponentManager instance that handles provided component type.");

    // ComponentManager is guaranteed to exist here.
    return dynamic_cast<ComponentManager<ComponentType>*>(componentManagerMap_.find(ComponentType::ID)->second);
}
```

In the functions CreateComponentSystem, DestroyComponentSystem, and GetComponentManager, **a component is required to have a static member 'ID'** that can be used as a key into the ComponentManager mapping.

## Components

Tying it all together now. Based on the above implementation, there is a good understanding for what components need to have to be well-defined:
 1. Each component derives from a base component class.
 2. Each component has a static member variable 'ID'   

Deriving from a base IComponent type allows ComponentManagers to be generic and return pointers to components without knowing the underlying component type. Since components are passed around using the base pointer, giving components a static member variabele 'ID' will allow the ComponentManagerCollection (among other core engine systems) to use type erasure to handle components generically while knowing the derived type of the component for lookup purposes. However, since 'ComponentType::ID' will be used in template deductions, this member variable needs to be available at program compile time.

The base component requirement is quite simple to meet. 

```cpp
struct IComponent {
    virtual ~IComponent() = default;
};
```

With generating unique compile-time IDs, there are a few options. The simplest option is to maintain a counter across all the available component types, making sure to increment this counter so that no two components have the same ID. However, this is a very error-prone and tedious approach. It's better to have the program generate these IDs for us.

For generating unique component IDs, I utilized a [32-bit Fowler–Noll–Vo hashing function (FVN1a)](https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function).

```cpp
constexpr std::uint32_t FNV1a_32bit(const char *string, std::size_t currentIndex) {
    if (currentIndex) {
        return (FNV1a_32bit(string, currentIndex - 1u) ^ static_cast<unsigned char>(string[currentIndex])) * 16777619u;
    }
    else {
        return (2166136261u ^ static_cast<unsigned char>(string[currentIndex])) * 16777619u;
    }
}
```

With this function, the component's name could be used to generate unique IDs. As long as no two component names are the same, the chances for collision between two generated IDs is low. Because of this, the trade-off between manually maintaining component IDs and generating them is important to keep in mind.

With the requirements out of the way, we can finally get around to making components! Below is an example of a Transform component, well-defined and ready to be used inside the component management system. The REGISTER_COMPONENT macro allows the simplification of boilerplate code that is consistent across different types of components.

```cpp
// Wrapper to make interfacing with the FNV1a hashing function easier.
#define STRINGHASH(string) (FNV1a_32bit(string, sizeof(string) - 1))

// Put this somewhere in the definition of your custom component.
#define REGISTER_COMPONENT(ClassName)                                  \
public:                                                                \
    static constexpr ECS::ComponentTypeID ID = STRINGHASH(#ClassName); \
    static constexpr const char* Name = #ClassName;                    \
private:


struct Transform : public IComponent {
    REGISTER_COMPONENT(Transform);

    Transform();
    ~Transform() override;

    // Data.
    ...
};
```

And there we have it! A fully complete component management system for Spark's ECS architecture.


## Interacting With Other Systems

Now that entities and components are set up, we can start constructing our different game objects by attaching components to entities. Make sure you are familiar with the [Entity Manager] from the previous post in this series, as we will build on it in the following section.

The EntityManager class can now interface with our component management system to query information about our entities.

```cpp
class EntityManager : public Singleton<EntityManager> {
    public:
        ...

        template <class ComponentType>
        ComponentType* AddComponent(EntityID ID);

        template <class ComponentType>
        bool HasComponent(EntityID ID) const;

        template <class ComponentType>
        void RemoveComponent(EntityID ID);

        ...

    private:
        // Entity component mapping.
        typedef std::unordered_map<ComponentTypeID, IComponent*> EntityComponentMap;
        std::unordered_map<EntityID, EntityComponentMap> entityComponents_{ };
```

AddComponent adds a given type of component to an entity, given that the entity does not already have a component of that type. If the ID of a new entity is passed in, the Entity Manager creates a slot for it.

```cpp
template<class ComponentType>
ComponentType* EntityManager::AddComponent(EntityID ID) {
    EntityComponentMap& componentMap = entityComponents_[ID];

    // Check to make sure entity does not already have a component of ComponentType.
    auto componentIter = componentMap.find(ComponentType::ID);
    if (componentIter == componentMap.end()) {

        // Retrieve the component manager from the ComponentManagerCollection and create a component.
        ComponentManager<ComponentType>* componentManager = ComponentManagerCollection<COMPONENT_TYPES>::GetInstance()->GetComponentManager<ComponentType>();
        ComponentType* component = componentManager->CreateComponent();

        componentMap.insert({ ComponentType::ID, component });
        return component.
    }
    else {
        LogWarning("Component add failure: Entity %u already has an instance of component of type: '%s'", ID, ComponentType::Name);
        return nullptr;
    }
}
```

HasComponent queries the component map of the given entity to check if it has the desired component.

```cpp
template <ComponentType>
bool EntityManager::HasComponent(EntityID ID) const {
    // Find entity with given ID.
    auto componentMapIter = entityComponents_.find(ID);
    if (componentMapIter == entityComponents_.end()) {
        // Entity does not exist.
        return false;
    }

    // Find component.
    EntityComponentMap& componentMap = componentMapIter->second;
    auto componentIter = componentMap.find(ComponentType::ID);
    if (componentIter == componentMap.end()) {
        // Component does not exist.
        return false;
    }

    // Both entity and component exist.
    return true;
}
```

RemoveComponent queries the component map of the given entity and removes the desired component if it exists.

```cpp
template<class ComponentType>
void EntityManager::RemoveComponent(EntityID ID) {
    // Check to make sure component exists.
    if (!HasComponent<ComponentType>(ID)) {
        return;
    }

    // Component is guaranteed to exist, return memory back to the ComponentManager.
    ComponentManager<ComponentType>* componentManager = ComponentManagerCollection<COMPONENT_TYPES>::GetInstance()->GetComponentManager<ComponentType>();
    componentManager->DeleteComponent(static_cast<ComponentType *>(entityComponents_[ID][ComponentType::ID]));

    ...
}
```

## What's Next?

With this, the component management system of Spark's ECS architecture is set up and ready to be used. In the next post, we'll tackle the design and implementation of the final piece of the ECS puzzle: Systems.
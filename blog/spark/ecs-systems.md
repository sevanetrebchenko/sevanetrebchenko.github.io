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

<h1 style="text-align:center;">Spark's ECS Architecture - Part 3: Systems</h1>

If you haven't already, make sure to read the previous posts in this series!
 - [Spark's ECS Architecture: An Overview](https://sevanetrebchenko.com/blog/spark-ecs)
 - [Spark's ECS Architecture - Part 1: Entities](https://sevanetrebchenko.com/blog/spark-ecs-part-1)
 - [Spark's ECS Architecture - Part 2: Components](https://sevanetrebchenko.com/blog/spark-ecs-part-2)

In the previous post, we discussed the necessary backend for supporting components in Spark's ECS architecture. Now that we can start registering components and interacting with entities by adding or removing components from them, how do we udpate individual component state, or create unique behaviors for entities that have a specific set of components?

Let's say we have a Physics system that operates on any entity that has a *Transform*, a *Physics*, and a *Collider* component. This system will be used to detect and resolve collisions between entities. An example update loop of such a system would look as follows:

```cpp
void PhysicsSystem<Transform, Physics, Collider>>::Update(float deltaTime) {
    for (ComponentTuple& components : validEntities) {
        // Get desired components.
        Transform& transformComponent = components.transform;
        Physics& physicsComponent = components.physics;
        Collider& colliderComponent = components.collider;

        // Update component state.
        // Collision detection / resolution.
        ...
    }
}
```

Note that each 'entry' in the system is a tuple of components that belong to a specific entity. From this example, we can start building up the behavior we want component systems in Spark's ECS architecture to have.

## Systems

Systems are designed to operate on the list of entities with components that match the registration of the system.

```cpp
// ComponentTypes... refers to the components this system operates on.
template <class ...ComponentTypes>
class BaseComponentSystem {
    public:
        BaseComponentSystem();
        ~BaseComponentSystem();

        // Standard functions to init, update, and shutdown the system.
        void Initialize() override;
        void Update(float dt) override;
        void Shutdown() override;

    protected:
        // Give derived component systems access to component tuples.
        using ComponentTuple = std::tuple<ComponentTypes*...>;
        std::vector<ComponentTuple> tuples_; // Tuples managed by this system.
    ...
}
```

Systems register what components they will operate on via the variadic template arguments. Systems filter entities based on the components they have attached to them. If an entity has all the required components the system is registered to process, an entry is made for that entity within the component system. The system retrieves only the components it is registered to operate on and creates a ComponentTuple out of these components. From then on, the system only operates on the components contained within this ComponentTuple. 

```cpp
// Function takes a list of entity components (retrieved from the Entity Manager).
template <class... ComponentTypes>
bool BaseComponentSystem<ComponentTypes...>::FilterEntity(const EntityComponentMap& entityComponents, BaseComponentSystem::ComponentTuple &tuple) const {
    unsigned numMatchingComponents = 0;

    for (std::pair<EntityID, IComponent*> componentData : entityComponents) {
        // Retrieve component data from entity.
        ComponentTypeID componentTypeID = componentData.first;
        IComponent* component = componentData.second;

        // Recursive kickoff function.
        if (ProcessEntityComponent<0, ComponentTypes...>(componentTypeID, component, tuple)) {
            ++numMatchingComponents;

            if (numMatchingComponents == sizeof...(ComponentTypes)) {
                // Got all the necessary components from this entity required for processing this system.
                // Components are contained within the tuple.
                // Entity is safe to add into the system ComponentTuple pool for processing.
                return true;
            }
        }
    }

    return false;
}
```

Filtering an entity requires all the components of the entity to be traversed. A ComponentTuple is created as temporary storage for keeping track of the components the component system cares about. The ProcessEntityComponent function attempts to, given a component, emplace it in the ComponentTuple in the correct location. This is done with the help of template recursion.

```cpp
template <class... ComponentTypes>
template <unsigned Index, class ComponentType, class... AdditionalComponentArgs>
bool BaseComponentSystem<ComponentTypes...>::ProcessEntityComponent(ComponentTypeID componentTypeID, IComponent *component, ComponentTuple &componentTuple) {
    // Found a matching component type.
    if (ComponentType::ID == componentTypeID) {
        ComponentType* derivedComponentType = dynamic_cast<ComponentType*>(component);

        // Validation checks.
        ...

        // Emplace in the ComponentTuple.
        std::get<Index>(componentTuple) = derivedComponentType;
        return true;
    }
    else {
        // Continue through the positions of the tuple, looking for a place to put this component.
        return ProcessEntityComponent<Index + 1, AdditionalComponentArgs...>(componentTypeID, component, componentTuple);
    }
}

template <class... ComponentTypes>
template <unsigned>
bool BaseComponentSystem<ComponentTypes...>::ProcessEntityComponent(ComponentTypeID, IComponent*, ComponentTuple&) {
    // Component is not managed by this system (doesn't exist in the tuple).
    return false;
}
```

Note that not all components that are attached to the entity are valid to be processed by this component system. Hence, filtering an entity stops when the number of matching components in the ComponentTuple matches the registered components of the component system. A ComponentTuple is valid given that it has the same number of components in the ComponentTuple as the component system is registered to because every iteration of ProcessEntityComponent that finds a valid component emplaces it in the ComponentTuple. The ComponentTuple is then safe to add to the system ComponentTuple pool for processing.

```cpp
// Note: mappings are omitted for brevity.
template <class... ComponentTypes>
void BaseComponentSystem<ComponentTypes...>::InsertTuple(EntityID entityID, ComponentTuple &tuple) {
    // Insert tuple.
    tuples_.emplace_back(std::move(tuple));
    unsigned index = tuples_.size();

    // Register tuple mapping.
    ...
}
```

Repeating the same process for all entities in the scene gives an up-to-date distribution of all entities into the systems they should be processed by. Note that entity filtering must take place any time an entity has a component added or removed. For those entities that are already registered in the system, however, adding a component does not negatively affect the validity of the entity's ComponentTuple. In this case, the component change is safe to ignore.

On component removal from an entity, however, there is a chance that the entity no longer qualifies to be processed by this system. In this case, the entity must be removed from the system ComponentTuple pool. The entity is first found using mappings from entityID to its position in the system's ComponentTuple pool. The swap paradigm is used, swapping the ComponentTuple of the entity to be removed and that of the last entity in the pool to avoid any expensive popping operations.

```cpp
// Note: mappings are omitted for brevity.
template <class... ComponentTypes>
void BaseComponentSystem<ComponentTypes...>::RemoveEntity(EntityID entityID) {
    // Validate entity to make sure entity ID exists within the ComponentTuple pool.
    ...

    // Remove mapping for this entity.
    ...

    // Erase mapping for last element.
    ...

    // Swap element to delete with last element.
    std::swap(tuples_[entityIndex], tuples_[lastIndex]);
    tuples_.pop_back();

    // Update mappings of swapped element.
    ...
}
```

Since component systems are greated with a generic number of components that can be processed, knowing at which location a component lies within a given ComponentTuple is a challenge. Instead, the implementation also provides an interface to safely retrieve a desired component from a ComponentTuple.

```cpp
// Method 1: by index.
template <class... ComponentTypes>
template <class ComponentType>
ComponentType* BaseComponentSystem<ComponentTypes...>::GetComponent(unsigned index) {
    static_assert((std::is_same_v<ComponentType, ComponentTypes> || ...), "Component type is not managed by the queried system.");

    // Check for invalid index.
    if (index >= tuples_.size()) {
        LogError("Exception thrown: Index: %i provided to GetComponent is out of range.", index);
        throw std::out_of_range("Invalid index provided to GetComponent.");
    }

    ComponentType* component = GetComponentHelper<ComponentType, 0, ComponentTypes...>(tuples_[index]);
    return component;
}

// Method 2: by ComponentTuple.
template <class... ComponentTypes>
template <class ComponentType>
ComponentType* BaseComponentSystem<ComponentTypes...>::GetComponent(const BaseComponentSystem::ComponentTuple& componentTuple) {
    // Ensure component is managed by this system.
    static_assert((std::is_same_v<ComponentType, ComponentTypes> || ...), "Component type is not managed by the queried system.");
    return GetComponentHelper<ComponentType, 0, ComponentTypes...>(componentTuple);
}
```

The given ways to access components from ComponentTuples support common ways components are accessed in ECS architectures. 

```cpp
// Method 1: by index.
void PhysicsSystem<Transform, Physics, Collider>>::Update(float deltaTime) {
    for (int i = 0; i < tuples_.size(); ++i) {
        // Get desired components by index.
        Transform* transformComponent = GetComponent<Transform>(i);
        Physics& physicsComponent = GetComponent<Physics>(i);
        Collider& colliderComponent = GetComponent<Collider>(i);

        // Update component state.
        // Collision detection / resolution.
        ...
    }
}

// Method 2: by ComponentTuple.
void PhysicsSystem<Transform, Physics, Collider>>::Update(float deltaTime) {
    for (ComponentTuple& tuple : tuples_) {
        // Get desired components by ComponentTuple.
        Transform* transformComponent = GetComponent<Transform>(tuple);
        Physics& physicsComponent = GetComponent<Physics>(tuple);
        Collider& colliderComponent = GetComponent<Collider>(tuple);

        // Update component state.
        // Collision detection / resolution.
        ...
    }
}
```

Both versions of the GetComponent function utilize the GetComponentHelper function, which uses a similar template recursion pattern as the ProcessEntityComponent function used in filtering entities. ComponentTuples are recursively traversed until the desired component type is found. 

```cpp
template <class... ComponentTypes>
template <class DesiredComponentType, unsigned Index, class ComponentType, class ...AdditionalComponentArgs>
DesiredComponentType* BaseComponentSystem<ComponentTypes...>::GetComponentHelper(const BaseComponentSystem::ComponentTuple& componentTuple) const {
    // Found desired component type.
    if constexpr (DesiredComponentType::ID == ComponentType::ID) {
        return std::get<Index>(componentTuple);
    }
    else {
        return GetComponentHelper<DesiredComponentType, Index + 1, AdditionalComponentArgs...>(componentTuple);
    }
}

template <class... ComponentTypes>
template <class DesiredComponentType, unsigned Index>
DesiredComponentType* BaseComponentSystem<ComponentTypes...>::GetComponentHelper(const BaseComponentSystem::ComponentTuple& componentTuple) const {
    LogError("Requesting component that isn't managed by the component system.)";
    return nullptr;
}
```

## What's Next?

The completion of component systems rounds out Spark's ECS architecture, and how different pieces from different systems fit together. With some minor differences for the purposes of clarity, this series described the thought process behind Spark's ECS architecture, and gave implementation details along the way. 

Thanks for reading! Feel free to reach out to me with any inquiries, clarifications, or questions you may have. Until next time!
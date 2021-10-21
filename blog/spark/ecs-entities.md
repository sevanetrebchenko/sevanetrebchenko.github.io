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
</style>

<h1 style="text-align:center;">Spark's ECS Architecture - Part 1: Entities</h1>

If you haven't already, make sure to read the previous post in this series!
 - [Spark's ECS Architecture: An Overview](https://sevanetrebchenko.com/blog/spark-ecs)

## Entities

Since entities merely exist as a query to group different types of components into one game object, the goal in the Spark Game Engine was to make entities as simple as possible. Hence, an entity is no more than a integer.

<code style="code">
typedef std::uint32_t EntityID;
</code>  

Most of the interesting behavior related to entities lies within the Entity Manager. 

## Entity Manager

Entities are created and initialized appropriately with the help of the [Entity Manager](https://github.com/sevanetrebchenko/spark/blob/master/include/spark/ecs/entities/entity_manager.h). All created entities must have a name associated with them. 

```cpp
EntityID CreateEntity(const std::string& entityName);
```

The name given to an entity can be anything, as long as it is unique (name does not match that of an already existing entity) and the name does not match the name of a built-in component. This is checked using the GetValidEntityName function. The Entity Manager is set up in such a way so that it's easy to jump between entity ID and entity name by keeping separate mappings for both.

```cpp
EntityID EntityManager::CreateEntity(const std::string& entityName) {
    // Check to make sure desired entity name is valid.
    std::string name = GetValidEntityName(entityName);
    if (name != entityName) {
        LogWarning("Entity name cannot match that of a built-in component or another entity. "
                    "Entity name changed from '%s' to '%s'.", entityName.c_str(), name.c_str());
    }

    EntityID ID = GetNextEntityID();

    // Register entity ID and name mapping.
    entityNames_[ID] = name;
    entityIDs_[entityName] = ID;

    // All entities start with a Transform component.
    ... 

    return ID;
}
```

What about destroying entities? The function used for destroying entities has the following signature:

```cpp
void DestroyEntity(EntityID ID);
void DestroyEntity(const std::string& entityName);
```

Entities can either be destroyed by entity ID or by entity name. The difference between the two functions is that destroying an entity by name first looks up the entity ID associated with the given name using the following function, and then calls DestroyEntity the determined ID, given that it exists.

```cpp
EntityID EntityManager::GetEntityIDFromName(const std::string &entityName) const {
    // Check to make sure an entity with the given name is a valid entity.
    auto entityNameIter = entityIDs_.find(entityName);
    if (entityNameIter != entityIDs_.end()) {
        return entityNameIter->second;
    }

    return INVALID_ID;
}
```

```cpp
void EntityManager::DestroyEntity(EntityID ID) {
    // Verify entity specified by ID is valid and registered correctly.
    auto entityNameIter = entityNames_.find(ID);
    auto entityComponentMapIter = entityComponents_.find(ID);

    bool bothExist = entityNameIter != entityNames_.end() && entityComponentMapIter != entityComponents_.end();
    bool bothDoNotExist = entityNameIter == entityNames_.end() && entityComponentMapIter == entityComponents_.end();

    SP_ASSERT(bothExist || bothDoNotExist, "Incorrectly configured entity in EntityManager. EntityID: %u", ID);

    if (bothDoNotExist) {
        LogError("Attemping to destroy entity that does not exist. Entity ID: %u", ID);
        return; // Do not destroy entity that does not exist.
    }

    // Return all components to corresponding ComponentManagers.
    ...

    // Erase entity ID and name mappings.
    entityComponents_.erase(entityComponentMapIter);
    entityIDs_.erase(entityIDs_.find(entityNameIter->second)); // Guaranteed to exist based on the above check.
    entityNames_.erase(entityNameIter);

    ...
}
```

In the current state of the Spark Game Engine, entity IDs are not recycled. A global tracker exists inside the EntityManager class that gets incremented every time an entity is created. This does not impede on the rest of the ECS architecture, however, since the only thing that matters is the existence of a globally unique identifier for each entity.  

Improvements could be made in terms of entity ID reusability. Currently, if the number of entities in any single game scene exceeds 4,294,967,295 (the maximum value for an unsigned 32-bit integer), there will be issues. One possible improvement to the EntityManager includes reusing entities that have been destroyed and not needed by the application anymore. This could be achieved quite easily by using a queue to push valid entity IDs to. However, for the time being, that is more than enough entities to start with.  

For these examples, code related to the interaction between entities and components is omitted for the sake of brevity. These functions will be revisited in a later post talking about the components side of Spark's ECS architecture.

## What's Next?

Thanks for reading! In the next post of this series, we will tackle the methodology behind the implementation of components and component managers in the Spark Game Engine.
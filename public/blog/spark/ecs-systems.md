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
 - [Spark's ECS Architecture: An Overview](http://192.168.1.158:3000/blog/spark-ecs)
 - [Spark's ECS Architecture - Part 1: Entities](http://192.168.1.158:3000/blog/spark-ecs-part-1)
 - [Spark's ECS Architecture - Part 2: Components](http://192.168.1.158:3000/blog/spark-ecs-part-2)

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

Systems are designed to operate on the list of entities with components that have 

With the proposed layout for the data within component systems, there needs to be a way to create tuples of components for entities that meet the requirements of the system.
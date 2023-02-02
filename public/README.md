<h1 style="text-align:center;">Spark's ECS Architecture - Part 2: Components</h1>

If you haven't already, make sure to read the previous posts in this series!
 - [Spark's ECS Architecture: An Overview](https://sevanetrebchenko.com/blog/spark-ecs)
 - [Spark's ECS Architecture - Part 1: Entities](https://sevanetrebchenko.com/blog/spark-ecs-part-1)

In the previous post, we discussed the necessary backend for supporting entities in Spark's ECS architecture. Now that we have entities, how can we start attaching components to them and utilizing compositions of components to create unique behaviors? 

Instead of first defining what a component is, let's start from the top and go down, and build a set of requirements for what a component needs to have to be considered well-defined. 

The way in which groups of components are stored will ultimately an impact on the way components are structured. I mentioned in the [introduction post to this series](https://sevanetrebchenko.com/blog/spark-ecs) that one of the benefits of an ECS architecture when it comes to organizing data is more easily-attainable cache friendliness. This is because of the way systems in ECS architectures operate on components. 

Let's say we have a Transform system that operates on any entity that has a Transfrom component. An example update loop of such a system would look as follows:

```cpp
void TransformSystem::Update(float deltaTime) {
+    for (Transform& transformComponent : allTransformComponents) {
        // Update transform component here.
+       ...
-  }
}
```
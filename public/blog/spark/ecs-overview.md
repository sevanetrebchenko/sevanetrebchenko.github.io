<h1 style="text-align:center;">Spark's ECS Architecture: An Overview</h1>

## What is the ECS Architecture?

In this series of posts, I want to discuss the ECS architecture when it comes to game engine development, and the design decisions I made when coming up with my own implementation for the Spark Game Engine.  

The ECS, or Entity Component System, architecture describes an alternative way to structure the relationship between game objects and their data, and follows the composition over inheritance principle. In a complex system such as a game, the ECS architecture prefers composition, or composing game object behavior from a given set of components, over inheritance-based techniques such as Object Oriented Programming (OOP). This brings with it two main benefits: avoiding deeply nested inheritance trees and more easily attainable cache friendliness for the game, the latter of which will be explored in a later post in this series.

Some notable examples of commercial engines that use the ECS architecture are:
 - [Unity (DOTS)](https://unity.com/dots)
 - [Overwatch](https://playoverwatch.com/en-us/)
 - [Minecraft](https://www.minecraft.net/en-us) (built using [EnTT](https://github.com/skypjack/entt))

### Structure

The basic structure of an ECS architecture is as follows:
 - **Entities:** a general-purpose representation of a game object, exists to allow the adding and removing of Components to build up the desired behavior
 - **Components:** Simple, plain-old-data (POD) structures to store a subset of data about an object, used to attach to Entities to provide a desired property
 - **Systems:** Iterate over and provide functionality for Entities with a given set of Components 

For example, let's say an entity contains a *Renderable* and a *Transform* component. This entity should be rendered to the screen at the location it is at. Another entity may have *Transform* and *Audio* components, which allows it to play a sound from a specific location. However, since this entity does not have a *Renderable* component, it will not be rendered to the screen. Finally, an entity with a *Transform*, and *Renderable*, and a *Physics* component will be rendered moving across the screen.  

For this example, there will be a number of systems to operate on the entities and there components. An audio system will play the appropriate sound for any entities that have an *Audio* component attached to them. A rendering system will render any entities that have a *Renderable* and a *Transform* component to the screen. The system requires both a *Renderable* and a *Transform* because it needs to know what position to render a given object at. In a similar fashion, a movement system will update any entities that have *Transform* and *Physics* components attached to them, for example applying acceleration and velocity to the entity's position.  

This is a simple example, but it demonstrates the relationship between entities, components, and systems.

## What's Next?

Thanks for reading! In the next post of this series, we will tackle the methodology behind the implementation of entities in the Spark Game Engine. Until next time!
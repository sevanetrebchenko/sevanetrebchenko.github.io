<h1 style="text-align:center;">Hybrid Rendering Engine</h1>

## Overview  
This rendering framework was developed for CS350 - Advanced Computer Graphics II at the DigiPen Institute of Technology. Topics include:
 - <a href="#deferred_rendering">Deferred Rendering</a>
     - <a href="#deferred_rendering_pipeline">Pipeline Description</a>
     - <a href="#phong_illumination_model">Phong Illumination Model</a>
     - <a href="#debug_normal_visualization">Debug Normal Visualization</a>
 - <a href="#hierarchical_spatial_partitioning">Hierarchical Spatial Partitioning</a>
     - <a href="#bsp_tree">Binary Space Partitioning (BSP) Tree</a>
     - <a href="#octree">Octree</a>
 - <a href="#gjk_collision_detection">GJK Algorithm for 3D Collision Detection</a>

**Graphics API:** OpenGL 4.5   
**Dependencies**: 
 - [GLFW](https://github.com/glfw/glfw)
 - [Glad (OpenGL Core v4.5)](https://glad.dav1d.de/)
 - [Dear ImGui](https://github.com/ocornut/imgui)
 - [OpenGL Mathematics (GLM)](https://github.com/g-truc/glm)
 - [tinyobjloader](https://github.com/tinyobjloader/tinyobjloader)
 - [STB Image](https://github.com/nothings/stb)   

**Supported Platforms:** 
 - Windows
 - Linux  

**Languages:** ​C++, GLSL  
**Project Duration:** January, 2021 - April, 2021 (4 months)

</br>

<a id="deferred_rendering"></a>
## Project 1: Deferred Rendering

<a id="deferred_rendering_pipeline"></a>
### Pipeline Description

This project was my first experience implementing a 3D deferred rendering pipeline in OpenGL. The traditional approach to rendering objects onto a screen is done with forward rendering, where each object is individually processed, rendered and illuminated by all the light sources in the scene. The major downside of forward rendering is that rendering scenes with large amounts of geometry and light sources becomes very computationally expensive. Each rendered object has to iterate over each light source per every rendered fragment. With a deferred pipeline, the heavy rendering is postponed to a later stage (known as the lighting stage), after the necessary data has been collected (known as the geometry stage). One advantage of rendering in such a way is that the data collected in the geometry stage directly correlates to the data that gets output to the screen. This ensures that intense shader calculations, such as calculating the Phong Illumination Model, is done only once per rendered fragment, which allows a greatly increased number of illuminating light sources without a cost to performance.  
<br>


<img src="/projects/hybrid-rendering-engine/images/deferred_rendering_1.png" alt="Deferred Rendering Pipeline" style="width:100%;max-width:940px;display:block;margin:auto;"/> 

*Figure 1: Final output of a sample scene rendered with the deferred rendering technique. The bunny is being illuminated by 3 (invisible) point light sources using the Phong Illumination Model.*  

</br>


The output from the geometry pass can be seen in the 6 smaller textures to the right of the main output texture. In order, these textures hold the following information:
 - **Vertex positions** (in view space), to determine which fragments get shaded
 - **Face normals** (in view space), for correctness of the lighting calculations
 - **Ambient component** of the Phong Illumination Model
 - **Diffuse component** of the Phong Illumination Model
 - **Specular component** of the Phong Illumination Model
 - **Scene depth** to preserve depth information and ensure that only the nearest visible fragments get shaded

This information is stored per-pixel in textures in order to easily allow querying of the information later on in the deferred rendering pipeline. After the necessary information is gathered in the geometry pass, it is used to render the final output texture.  
</br>

<a id="phong_illumination_model"></a>
### Phong Illumination Model

Another requirement for this project was to implement the Phong Illumination Model using the deferred rendering pipeline. The Phong Illumination Model is composed of three main components: the **ambient**, **diffuse**, and **specular**. One of the properties of light is that it can indirectly illuminate surfaces by scattering and reflecting in many different directions and reach spots that are otherwise not visible. This is also known as Global Illumination (GI), and is difficult and expensive to calculate. Instead, the Phong Illumination Model has what is known as the ambient component, which serves to mimic GI and make objects look indirectly illuminated (even when there is not a direct light source acting on the object). The diffuse component represents the the color produced by dull, smooth objects when directly illuminated by a light source, and the specular component contributes the bright specular reflections that appear on shiny surfaces, such as metal or plastic.  
</br>


<img src="/projects/hybrid-rendering-engine/images/deferred_rendering_2.png" alt="Phong Illumination Model" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 2: Adjusting the ambient, diffuse, and specular coefficients of a model can give it a completely different look.*  

</br>


Looking at the geometry pass textures to the right of the main output texture gives an idea of where the individual contributions from each of the components come from. [Click to read more]() about the implementation details of a deferred rendering pipeline using the Phong Illumination Model!  
</br>

<a id="debug_normal_visualization"></a>
### Debug Normal Visualization

Normals are necessary for a correct application of the Phong Illumination Model. The final requirement for this project was to be able to visualize the normals of a given model. Pictured below are two different types of normals that can be used during rendering: **Vertex Normals** and **Face Normals**, which differ slightly in their application towards rendering, as well as calculation and positioning along the surface of the model.  
<br>


<img src="/projects/hybrid-rendering-engine/images/vertex_normals.png" alt="Vertex Normals" style="width:100%;max-width:940px;display:block;margin:auto;"/>

*Figure 3: Vertex normals originate from each of the vertices of the model.*  

</br>


<img src="/projects/hybrid-rendering-engine/images/face_normals.png" alt="Face Normals" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 4: Face normals originate from the center of mesh faces.*  

</br>


<a id="hierarchical_spatial_partitioning"></a>
## Project 2: Hierarchical Spatial Partitioning

The second project explored hierarchical data structures and space partitioning. For this portion of the course, I implemented an Octree and a Binary Space Partitioning (BSP) tree. Both of these data structures recursively subdivide a set of vertices of a given model into smaller partitions until the subsections satisfy a set of requirements. The process of subdividing allows the space of vertices to be represented in a hierarchical manner in the form of a tree-like data structure, which allows for an efficient and compact representation of a potentially vast set of data. Such a representation also has potential applications in 3D collision detection (discussed in Project 3 below) and optimizing raytracing algorithms, to name a few. The main requirement for this project was the number of triangles in the resulting subdivisions: if a subdivision contained more than a set number of triangles, it required further subdivision to simplify.

Both Octrees and BSP trees use subdivisions along split planes. Split planes look very different depending on the hierarchical data structure and implementation details. If it is determined that a given space contains more than the maximum allowed number of triangles, it must be split. Mesh triangles along the boundary of the split plane are subdivided further and separated between both planes as to not overlap across multiple plane boundaries.

This framework allows for the dynamic recomputation of both available hierachical data structures at runtime with a configurable maximum allowed number of triangles per subdivision.  
</br>

<a id="bsp_tree"></a>
### Binary Space Partitioning (BSP) Tree

In order to choose an optimal split plane for a BSP tree, a number of potential cantidate planes are generated using the vertices of the mesh. The split of each plane is ranked against the others in order to attain an optimal split plane, which comes as close as possible to dividing the input space into equal positive and negative half-planes. The subdivided spaces are inserted into a binary tree representation of the entire scene space (hence, the name "Binary Space Partition" tree). It is important to keep in mind that this method is not the only option for generating split planes, and there are a number of other (and better!) ways.  

Below are some BSP example images from the project. The different colors help identify the boundary of the split plane, and the model was rendered in wireframe mode to help visualize the subspaces, as well as showcase how triangles that line the edge of the split plane are subdivided further to create a clear separation of the two halves.  
</br>


<img src="/projects/hybrid-rendering-engine/images/bsp-1.png" alt="BSP Tree, 4,000 triangles" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 5: BSP with 4,000 triangles maximum per half, with one split plane.*  

</br>


<img src="/projects/hybrid-rendering-engine/images/bsp-2.png" alt="BSP Tree, 2,000 triangles" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 6: BSP with 2,000 triangles maximum per half, with two split planes.*  

</br>

<img src="/projects/hybrid-rendering-engine/images/bsp-3.png" alt="BSP Tree, 300 triangles" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 7: BSP with 300 triangles maximum per half.*  

</br>


<a id="octree"></a>
### Octree

Octrees are the 3D representation of quadtrees, in which each subdivision divides a given space into 8 separate child nodes. Because of the rigid nature of this data structure, however, the split planes come predefined, and divide the input space along the three primary axes. If the number of triangles in any given child node exceeds the maximum allowed number of triangles, that node subdivides into 8 more child nodes. The different levels of the Octree can easily be traversed up and down, as shown in the images below.  
</br>


<img src="/projects/hybrid-rendering-engine/images/octree-1.png" alt="Octree Root" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 8: Root level of the octree.*  

</br>


<img src="/projects/hybrid-rendering-engine/images/octree-2.png" alt="Octree Level 1" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 9: One level deep into the octree.*  

</br>


<img src="/projects/hybrid-rendering-engine/images/octree-3.png" alt="Octree Level 2" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 10: Two levels deep into the octree.*  

</br>


<img src="/projects/hybrid-rendering-engine/images/octree-4.png" alt="Octree Base Level" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 11: Base level of the octree.*  

</br>


It is trivial to tell where model geometry complexity lies with such a spatial representation, as more densely packed areas of meshes will contain more frequent and smaller subdivisions. Conversely, simpler areas with less geometry will contain fewer, larger subdivisions. [Click to read more]() about the implementation details of constructing the BSP tree and Octree spatial data structures used for this project!  
</br>

<a id="gjk_collision_detection"></a>
## Project 3: Gilbert–Johnson–Keerthi (GJK) Algorithm for 3D Collision Detection

The final part of this course was to implement the Gilbert-Johnson-Keerthi algorithm for detecting collisions in 3D space. For the purposes of collision, one can consider the points of the convex hull of two models, but it is important to remember that convex hulls contain an infinite number of points that make up the 3D volume inside. Programmatically, though, the GJK algorithm is easily implemented using only the vertices of both models. 

The GJK algorithm utilizes the Minkowski difference, which is formed by subtracting each point of one model's mesh from another, to determine if two objects are colliding. The Minkwoski difference states that, given two intersecting objects in 3D space, there exists at least *one* point that is the same across both models. Subtracting this point will result in a point at the origin of the world. Put differently, if the Minkowski difference of any two given models contains the origin, the objects are intersecting. The goal of the GJK algorithm is to determine whether this fact is true in the smallest amount of necessary computation power. This, paired together with the spatial data structures from Project 2, allows the GJK algorithm to operate on a significantly smaller subset of mesh vertices. Not having to compute and iterate over an entire convex hull every frame to detect collisions between objects allows the GJK algorithm to be used for fast, reliable collision detection at program runtime.

[Click to read more]() about the details of the GJK algorithm and the implementation used for this project!

Below are images showing various example scenarios of the GJK algorithm from the framework. A sphere model is shot from the position of the camera along the camera's forward vector until the sphere collides with the model, at which point the GJK algorithm is ran to detect collisions. An octree from Project 2 is used to partition the input data space to speed up checks and reduce the total number of expensive computations. The sphere is first checked against different levels of the octree until a leaf node is reached, at which point the sphere is checked for collision against the convex hull of vertices in that specific leaf node. If a collision is detected, both the sphere and the vertices of the leaf node are rendered in red.


<img src="/projects/hybrid-rendering-engine/images/gjk-5.png" alt="GJK Example Scenario 1" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 12: Sphere collision example with bunny model. Normally rendered output.*  

</br>


<img src="/projects/hybrid-rendering-engine/images/gjk-6.png" alt="GJK Example Scenario 1 Wireframe" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 13: Wireframe render of Figure 12, using an Octree spatial data structure with a maximum of 4,000 triangles per node. Note the portion of the model colored in red, which shows the vertices that were checked for collision.*  

</br>


<img src="/projects/hybrid-rendering-engine/images/gjk-7.png" alt="GJK Example Scenario 1 Wireframe" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 14: A different perspective on the collision shown in Figures 12 and 13.*  

</br>


<img src="/projects/hybrid-rendering-engine/images/gjk-3.png" alt="GJK Example Scenario 2" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 15: Sphere collision example with bunny model. Normally rendered output.*  

</br>


<img src="/projects/hybrid-rendering-engine/images/gjk-4.png" alt="GJK Example Scenario 2 Wireframe" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 16: Wireframe render of Figure 15, using an Octree spatial data structure with a maximum of 4,000 triangles per node. Note the portion of the model colored in red, which shows the vertices that were checked for collision.*  

</br>


<img src="/projects/hybrid-rendering-engine/images/gjk-1.png" alt="GJK Example Scenario 3" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 17: Sphere collision example with bunny model. Normally rendered output.*   

</br>


<img src="/projects/hybrid-rendering-engine/images/gjk-2.png" alt="GJK Example Scenario 3 Wireframe" style="width:100%;max-width:940px;display:block;margin:auto;"/>  

*Figure 18: Wireframe render of Figure 17, using an Octree spatial data structure with a maximum of 1,000 triangles per node. Notice how the portion of the model colored in red is much smaller than in Figures 13, 14, and 16, as the vertices are more finely separated.*  

</br>

<a id="what's_next"></a>
## What's Next?

Thanks for reading! I hope you found this project interesting or informative. See you in the next post!
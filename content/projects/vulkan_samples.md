---
title: "Vulkan Samples"
description: "Shadow mapping, ambient occlusion, sorted transparency and image-based PBR in Vulkan, on a bare-bones framework (2024)."
tags: ["c++", "vulkan", "graphics"]
date: 2024-08-11
draft: true
links:
  - url: https://github.com/sevanetrebchenko/vulkan-samples
---

> **Draft (2026-11-07):** first draft around the final captures in `_captures/vulkan-samples/final`. Media is not encoded into `public/projects/vulkan_samples/` yet. Quoted notes are placeholders for you.

*C++ · Vulkan · solo · 2024*

A set of small Vulkan samples, each one technique on a shared, bare-bones framework. Most of these techniques I'd first built in OpenGL for DigiPen's CS562 (Advanced Real-Time Rendering); this project rebuilds them in Vulkan and takes several further, physically based rendering most of all. The samples go from the simplest to the most involved: shadows from a directional light, then from a point light, ambient occlusion, transparency, and image-based PBR.

> **TODO (you):** what the framework handles (instance and device setup, swapchain, pipelines, descriptors, synchronization, ...), and anything about why Vulkan.

The shadow, AO and transparency samples share one scene: a few chess pieces in a three-walled room, rendered deferred. A geometry pass writes each pixel's position, normal and material into a set of screen-sized images, and a lighting pass shades every pixel once from those.

## Directional shadow mapping
A shadow map is the scene rendered from the light, keeping only depth. When shading a pixel, its position is transformed into the light's view, and its depth from the light is compared with the depth stored at that spot. If something stored there is closer to the light, the pixel is in shadow.

A directional light, like the sun, has parallel rays, so its view is an orthographic projection: a box around the scene. That has a useful property: every texel of the shadow map covers the same area of the scene, wherever it lands.

![Chess pieces on a board, their shadows sweeping around them as the light circles the scene](/projects/vulkan_samples/directional_shadow_mapping.mp4 "a directional light making one turn around the board")

![The shadow map seen from the light: the board as a diamond, the pieces darker where they are closer, turning as the light circles](/projects/vulkan_samples/directional_shadow_map.mp4 "the 4096 × 4096 shadow map over the same turn, seen from the light; darker is closer")

Two things decide how good this looks. The first is the bias. The stored depth is sampled per texel, and a surface tilted away from the light covers a slope within each texel, so a surface compared against its own depth randomly shadows itself in stripes ("shadow acne"). Comparing against the stored depth plus a small offset fixes that, but too large an offset detaches shadows from the objects casting them. The second is resolution. Each texel is either in shadow or not, so a shadow's edge is a staircase of shadow map texels, and as the light moves, the scene lands on different texels every frame and the staircase crawls. This sample uses one comparison per pixel and simply makes the map large (4096 × 4096) for a scene this size, which keeps the steps small. Filtering them away is a whole topic of its own (see [What's next](#whats-next)).

## Omnidirectional shadow mapping
A point light shines in every direction, so one view isn't enough. The shadow map is a cube map instead: six square faces, each a 90° view from the light. All six are rendered in a single pass, with a geometry shader that sends each triangle to every face (`gl_Layer`). Rather than depth, each face stores the distance from the light, divided by the far plane, so that a lookup only needs the direction from the light to the pixel: the cube map returns the stored distance in that direction, and it's compared with the pixel's own distance.

![The chess pieces in a red, green and blue room, a small white light circling above them and their shadows swinging across the floor and walls](/projects/vulkan_samples/omnidirectional_shadow_mapping.mp4 "a point light (the white dot) circling the room")

![The cube map unfolded into a cross: the walls, ceiling and floor as grey gradients, the pieces darker shapes on the floor face](/projects/vulkan_samples/omnidirectional_shadow_map.jpg "the cube shadow map unfolded into a cross, distance from the light in grey")

A cube map's texels also fan out from the light, like a projector's: one texel covers more of the scene the further away it lands. So unlike the directional case, shadows further from the light have coarser steps. Here too, the map is simply large (4096 per face).

> **TODO (you):** the light sphere is drawn for the clip, mention it or not.

## Ambient occlusion
Ambient light is the light that isn't coming from the light source: everything bouncing around the room. A crease or a corner sees less of the room than an open surface, so it receives less of it. Ambient occlusion estimates how much of each point's surroundings is blocked, and darkens its ambient light by that much. In the scene above, ambient light is all that reaches the inside of a shadow, so that is where it shows.

This is screen-space AO (SSAO), computed from the geometry pass's images. For each pixel, 64 points are placed in a hemisphere above the surface, within half a unit, more of them close to the surface. Each is projected back onto the screen and compared with the position stored there: if the visible surface at that spot is in front of the sample point, the sample is blocked. A range check ignores surfaces much further away than the radius, which would otherwise darken the edges of every object in front of a distant wall. The fraction of samples left unblocked is the occlusion.

Sixty-four samples aren't enough for a smooth result, so each pixel rotates the hemisphere by one of 16 rotations that repeat in a 4 × 4 tile, and a blur averages each 4 × 4 block afterwards, which cancels out the tile. The blur only averages neighbors on the same surface: a neighbor has to lie on the plane of the center pixel and face the same way. A plain blur smears the occlusion across the outlines of the pieces, and comparing distances from the camera instead of planes breaks down on surfaces seen at a grazing angle, where the distance changes quickly from one pixel to the next.

::comparison[the same frames without and with ambient occlusion; drag to compare]
![The chess room with the light circling, the shadowed areas flat](/projects/vulkan_samples/omnidirectional_shadow_mapping.mp4 "without")
![The same scene with ambient occlusion, the shadowed areas darker in creases, corners and around the bases of the pieces](/projects/vulkan_samples/ambient_occlusion.mp4 "with")
::

![The ambient occlusion term on its own: white everywhere, with dark lines in the room's corners and around the bases of the pieces](/projects/vulkan_samples/ambient_occlusion_buffer.jpg "the occlusion term on its own, after the blur")

## Transparency
Opaque surfaces don't care what order they're drawn in: the depth buffer keeps whichever is closest. Transparent ones do. Each one is blended over whatever is already in the image, and blending isn't commutative, so a surface behind another has to be drawn first. They also can't write to the depth buffer, or a transparent surface in front would hide the ones behind it, which should show through.

So the transparent triangles are drawn back to front. Every frame, the triangles of all the transparent pieces are sorted on the CPU by the distance from the camera to their center, and written in that order into an index buffer, one per frame in flight so the GPU never reads a buffer while it's being rewritten. They're sorted together rather than piece by piece: two pieces can overlap on screen, and only one sorted list puts their triangles in the right order relative to each other. They're drawn after the lighting pass, blended over the lit opaque scene, depth tested against it but not writing depth, and with back faces kept, so the far side of each piece shows through the near side.

![All the chess pieces in clear glass, lit from above, the board and walls visible through them](/projects/vulkan_samples/transparency.jpg "every piece transparent, sorted back to front, lit from above")

Sorting by triangle centers is an approximation. Triangles that intersect, or overlap in a cycle (A in front of B in front of C in front of A), have no correct order at all, and a long triangle's center can be a poor stand-in for where it overlaps another. For separate pieces like these it holds up; order-independent methods avoid the problem altogether (see [What's next](#whats-next)).

## Physically based rendering
The last sample is the most involved: a glTF model, the [Damaged Helmet](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/DamagedHelmet), lit entirely by its surroundings, an HDR environment map. It was my first full PBR implementation, so this section goes into more detail.

![The damaged sci-fi helmet turning slowly in a sunlit living room, its metal reflecting the room and its visor glowing](/projects/vulkan_samples/pbr.mp4 "the helmet lit only by the room around it")

### Materials
The helmet uses the metallic-roughness model. Every texel says how metallic the surface is and how rough. A rough surface scatters reflected light over a wide range of directions, so its reflections are blurry; a smooth one reflects almost like a mirror. A metal has no diffuse color at all, only colored reflections; a non-metal (a dielectric) has a diffuse color and colorless reflections of about 4% head on. The base color (albedo) means either, depending on the metalness.

![The helmet's base colors: grey shell, white plating](/projects/vulkan_samples/pbr_albedo.jpg "base color (albedo)")
![The helmet's metallic and roughness: blue where metallic, green where rough](/projects/vulkan_samples/pbr_metallic_roughness.jpg "metallic (blue) and roughness (green)")

![The helmet's ambient occlusion: white with dark crevices](/projects/vulkan_samples/pbr_ao.jpg "ambient occlusion")
![Only the helmet's glowing parts lit, the rest black](/projects/vulkan_samples/pbr_emissive.jpg "emissive")

A normal map adds the fine detail (rivets, vents, seams) that the mesh itself doesn't have, by bending each pixel's normal. It's stored in tangent space, relative to each surface, and turned into world space with the tangent, bitangent and normal at each pixel.

![The helmet's normals in world space, colored by direction, with the fine panel detail of the normal map](/projects/vulkan_samples/pbr_normals.jpg "the normals used for lighting, mesh plus normal map, in world space")

### The BRDF
How a surface reflects light is described by a BRDF. This sample uses the Cook-Torrance microfacet model, which treats a surface as countless tiny mirrors (microfacets) facing in slightly different directions. Its specular part has three terms:

- **D, the normal distribution:** how many microfacets face exactly the right way to reflect the light toward the eye. This is GGX (Trowbridge-Reitz), with α = roughness², which makes roughness feel more even across its range.
- **F, Fresnel:** how much light is reflected rather than transmitted, which rises sharply towards grazing angles. Schlick's approximation, starting from the 4% (or the metal's color) head on.
- **G, the geometry term:** how many of those microfacets are hidden from the light or the eye by others. Smith's method with Schlick-GGX.

The diffuse part is Lambertian, scaled by what Fresnel didn't reflect, and zero for metals.

> **TODO (you):** CS562 differences, if you want them here: there the lighting was sampled at runtime in the shader, with α = roughness, Smith's rational approximation of G, and a separate diffuse/specular color (Kd, Ks) rather than metal-roughness.

### Lighting from the environment
With an environment map, light comes from every direction at once, so lighting a pixel means integrating the BRDF over the whole sphere around it. That's far too much work per pixel per frame, but most of it doesn't depend on the pixel, only on directions and material, so it can be done once, ahead of time. The HDR map (an equirectangular image) is first turned into a cube map, and the two halves of the BRDF are precomputed separately.

**Diffuse.** A Lambertian surface collects light from the whole hemisphere around its normal, weighted by the cosine of the angle to it. The result depends only on the normal, so it can be stored in a small cube map (the irradiance map) and looked up by normal. My first version computed it by brute force: a compute shader looped over the whole hemisphere for every texel, in steps of 0.05 radians, about four thousand environment samples per texel. It worked, but it was slow enough that a finer step made the driver decide the GPU had hung and reset it (`VK_ERROR_DEVICE_LOST`).

The version here uses spherical harmonics instead. Spherical harmonics are to functions on a sphere what a Fourier series is to a signal: a set of basis functions of increasing frequency, so any function on the sphere is a weighted sum of them. Irradiance is very smooth, because each point averages over a whole hemisphere, so the first three bands, nine basis functions, capture it almost exactly. The environment is projected onto those nine functions once on the CPU, a single pass over the HDR image summing each texel times each basis function, weighted by its solid angle, which gives nine RGB coefficients. Convolving with the cosine lobe is then just a scale per band (π, 2π/3 and π/4, here divided by π), because the cosine lobe is symmetric around the normal. The irradiance in any direction is the nine coefficients times the nine basis functions evaluated in that direction, which a compute shader writes into a 64 × 64 cube map. The whole thing costs one pass over the image, independent of the irradiance map's size.

**Specular.** Reflections depend on the view direction, the normal and the roughness, too much to store directly. The split-sum approximation (from Epic's Unreal Engine 4 notes) splits the integral into two parts that can each be stored:

- **A prefiltered environment map:** the environment blurred by the GGX lobe for increasing roughness, one level per mip of a cube map, assuming the view direction equals the normal. Each texel is the average of 2048 directions importance sampled from GGX, from a Hammersley sequence. With few samples, sharp bright spots in the environment leave blotches, so each sample reads the environment from a mip level matched to the solid angle the sample stands for: an unlikely sample covers a large area of the sphere, so it reads a blurrier level ("filtered importance sampling", GPU Gems 3, chapter 20).
- **A BRDF lookup table:** the rest of the integral depends only on the angle to the view and the roughness, so it's a 2D texture, computed once: a scale and a bias applied to the surface's reflectance at normal incidence.

At runtime, a pixel's reflection is one lookup into the prefiltered map, at the mip for its roughness in its reflection direction, times the scale and bias from the table. Diffuse is one lookup into the irradiance map.

### Output
Lighting is computed in HDR, so the result has to be mapped to the screen's range. This uses the ACES filmic curve (Narkowicz's fit), which rolls highlights off smoothly and keeps contrast in the darks, then pulls the colors part of the way back towards grey, since the curve also saturates them. The emissive parts of the helmet get a bloom: rendered on their own at half resolution, blurred with a separable Gaussian in a compute shader, and added on top. The helmet is rendered with 8× MSAA.

The same helmet, the same code, only the environment map changed:

![The helmet on a rocky ridge above a valley at sunset](/projects/vulkan_samples/pbr_valley.jpg "Valley of Desolation")
![The helmet against a pink sunrise sky](/projects/vulkan_samples/pbr_sunrise.jpg "Pink Sunrise")

## Also in this repo
- **Deferred rendering:** the geometry and lighting passes the shadow samples are built on, as a sample of its own.
- **Cloth:** a compute shader cloth simulation.

> **TODO (you):** one line each, or drop.

## What's next
- **Shadow filtering.** PCF (percentage-closer filtering): averaging several comparisons around each pixel turns the stair steps into a gradient. On a cube map the samples have to lie on the plane facing the light, since only sideways offsets change which texel is read. Bilinear PCF, with a hardware comparison sampler, to remove the banding plain PCF leaves.
- **Shadow bias.** Normal offset: moving the lookup out along the surface normal, by more at grazing angles, instead of one large depth bias.
- **Soft shadows.** PCSS (percentage-closer soft shadows), which widens the blur the further a shadow falls from what casts it. Variance or exponential shadow maps, which can be blurred and mipmapped like ordinary textures.
- **Larger scenes.** Cascaded shadow maps, which split a directional light's view into several maps at increasing distances from the camera.
- **Transparency.** Order-independent methods: weighted blended OIT, which needs no sorting at all at some cost in accuracy, and depth peeling, which is exact but renders the transparent geometry once per layer.
- **Ambient occlusion.** Horizon-based methods (HBAO, GTAO), more accurate for the same number of samples, and accumulating samples over several frames.

## Credits
Damaged Helmet: model by theblueturtle_ (CC BY 4.0), from the Khronos glTF sample models. Environment maps from Poly Haven (CC0): Valley of Desolation, Pink Sunrise. Newport Loft: HDRLabs sIBL Archive, [TODO confirm license]. Chess pieces: [TODO source and license].

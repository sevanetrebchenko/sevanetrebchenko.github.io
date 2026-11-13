---
title: "Ray tracing in a few weekends"
description: "A simple offline CPU ray tracer, built by working through Peter Shirley's 'Ray Tracing in One Weekend' series."
tags: ["c++", "ray-tracing"]
date: 2022-01-25
kind: small
draft: true
thumbnail: /projects/riow/cover.jpg
links:
  - url: https://github.com/sevanetrebchenko/riow
---

My first ray tracer, built by following Peter Shirley's [*Ray Tracing in One Weekend*](https://raytracing.github.io/) series.
It renders offline on the CPU and writes the result to an image.

Scenes are built using primitives, which can be translated and rotated.

Materials include Lambertian (matte), metal, and glass.
Matte surfaces can use an image texture, and any object can be made to emit light.
Smoke and fog are modeled as volumes of constant density.
Objects are stored in a bounding volume hierarchy (BVH) so that each ray only tests the objects it might hit.
The camera supports depth of field, and every pixel averages many samples to reduce noise and smooth out edges.
Light bouncing off matte surfaces is sampled with a cosine weighting, which matches how an ideal matte surface scatters light.

::carousel
![](/projects/riow/cornell_matte.jpg "Cornell box (2048x2048, 1024spp)")
![](/projects/riow/cornell.jpg "Metal and glass materials (2048x2048, 1024spp)")
![](/projects/riow/glass_smoke.jpg "Caustics and smoke (2048x2048, 4096spp)")
::

![](/projects/riow/textures_transformed.jpg "Texture mapping (2048x2048, 4096spp)")
![](/projects/riow/earth.jpg "Final scene (2560x1440, 4096spp)")

# What's next

This project introduced me to raytracing and laid out the groundwork for how the algorithm works.
Because of the short nature of the project, however, there were many things I was not able to get to.
Triangle meshes, importance sampling, PDFs and more accurate materials, and multithreading would all make the scene render more visually accurate results faster.
There are also some more advanced techniques, such as subsurface scattering, and camera lenses, that would also be super interesting to explore.
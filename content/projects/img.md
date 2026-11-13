---
title: "img"
description: "Image processing in plain C++: grayscale, downscaling, k-means recolouring, Voronoi diagrams and dithering."
tags: ["c++", "image-processing"]
date: 2022-01-10
kind: small
draft: true
thumbnail: /projects/img/toucan_k_means.gif
caption: "Recolouring with k-means clustering, for k from 2 to 16."
links:
  - url: https://github.com/sevanetrebchenko/img
---

A sandbox for image processing algorithms, written in plain C++ with only GLM and stb for loading and saving images. The code favours simplicity, avoiding large abstractions and optimizations.

![Original photo of a toucan](/projects/img/toucan.jpg "original")
![The toucan in grayscale](/projects/img/toucan_grayscale.jpg "grayscale")
![The toucan downscaled to 20 by 20 pixels](/projects/img/toucan_20x20px.jpg "downscaled to 20×20 pixels")

## Dithering

Thirteen methods: error diffusion, Floyd–Steinberg and its "false" variant, Jarvis–Judice–Ninke, Stucki, Atkinson, Burkes, the Sierra family, and ordered dithering with 2×2, 4×4 and 8×8 Bayer matrices.

::carousel
![Floyd–Steinberg dithering](/projects/img/toucan_dither_floyd_steinberg.png "Floyd–Steinberg")
![Atkinson dithering](/projects/img/toucan_dither_atkinson.png "Atkinson")
![Stucki dithering](/projects/img/toucan_dither_stucki.png "Stucki")
![4×4 Bayer ordered dithering](/projects/img/toucan_dither_bayer_4x4.png "4×4 Bayer matrix (ordered dithering)")
::

## Voronoi diagrams

![The toucan as a Voronoi diagram with an increasing number of regions](/projects/img/toucan_voronoi.gif "50 to 10,000 Voronoi regions, each filled with a single colour")

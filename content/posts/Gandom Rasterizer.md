+++
title = 'Gandom Rasterizer'
date = 2025-09-05T05:21:43+03:30
cover = { image = "/images/gandom/lantern_poly_surface.png" }
tags = ["Renderer","Computer Graphics","C","Real-Time Rendering"]
+++

Gandom is a software rasterizer that mimics algorithms which are behind graphics APIs and even what are implemented physically on GPU dies.
In this project, I have implemented the processes used by graphics APIs
and GPUs to render and synthesize an image for display,
implemented entirely in code running on a CPU. For the performance issues
I leveraged SIMD instructions (AVX2) to improve its performance.
I implemented key algorithms of the graphics pipeline,
such as triangle clipping, back-face culling, and scanline rasterization.

## Key Features

- **Geometric Processing:** Model/View/Projection transformations,
perspective correct interpolation.
- **Rasterization Core:** Efficient triangle setup, scanline or 
barycentric-based pixel traversal.
- **Per-Fragment Operations:** Depth buffering (Z-buffering) for
correct occlusion.
- **Texture Mapping:** Affine or perspective-correct texture sampling.
- **Model Loading:** Ability to parse and render standard 3D
model file formats.

Here are some images from Gandom:

<div style="display: flex; justify-content: center;">
  <img src="/images/gandom/house.png" alt="Center of the map" style="width: 100%;">
</div>


<div style="display: flex; justify-content: center;">
  <img src="/images/gandom/lantern.png" alt="Center of the map" style="width: 100%;">
</div>

## Future Works
- **Vertex and Fragment Shaders:** Support for a simple shader model, allowing for programmable lighting and coloring.
- **Texture Filtering:** various filtering options like nearest-neighbor, bilinear, etc.
- **Other Per-Fragment Operations:** configurable blending modes.

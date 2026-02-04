+++
title = 'Gandom Rasterizer'
date = 2025-09-05T05:21:43+03:30
cover = { image = "/images/gandom/lantern_poly_surface.png" }
tags = ["Renderer","Computer Graphics","C","Real-Time Rendering"]
+++

Gandom is a software rasterizer that mimics algorithms which are behind graphics 
APIs and even what are implemented physically on GPUs.
In this project, I have implemented what graphics APIs and GPUs do to render
and syntheis an image over the display, completely with a code which
runs over CPU. Many algorithms were implemented in this software from rendering
a triangle to clipping that triangle and back face culling and etc.
Here are some images from Gandom:

<div style="display: flex; justify-content: center;">
  <img src="/images/gandom/house.png" alt="Center of the map" style="width: 100%;">
</div>


<div style="display: flex; justify-content: center;">
  <img src="/images/gandom/lantern.png" alt="Center of the map" style="width: 100%;">
</div>

# Future Works
It incldues adding more advanced features that are available on modern graphics 
APIs and support for shaders.


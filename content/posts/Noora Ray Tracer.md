+++
title = 'Noora Ray Tracer'
date = 2025-04-04T15:40:08+03:30
cover = { image = "/images/noora/RayTracer.png" }
tags = ["Ray Tracing","Rendering","C++","Real-Time Rendering","CUDA"]
+++
Noora is a ray tracer began as a deep dive into the algorithms that bring virtual scenes to life. Starting with Peter Shirley's accessible guides, I built a functional Monte Carlo path tracer—an offline renderer that simulates complex lighting effects like caustics and diffuse inter-reflection by tracing the path of light through a scene.

Currently, it is an offline renderer capable of producing images with global illumination, soft shadows, and realistic materials, but I am developing a GPU-accelerated, real-time version to explore the performance and algorithmic trade-offs between offline and interactive rendering.

## Key Features
- **Core Features:** Accurate global illumination, anti-aliasing, depth-of-field, and support for various geometric primitives.

- **Material Model:** Diffuse, metallic, and dielectric (glass) surfaces with configurable roughness.

- **Acceleration:** A bounding volume hierarchy (BVH) for significantly faster ray-intersection tests.

<div style="display: flex; justify-content: center;">
    <img src="/images/noora/cornelBox.png" alt="Center of the map" style="width: 100%;">
</div>

## Future Works
- A Formal Monte Carlo Integration Framework
- Importance Sampling with Probability Density Functions (PDFs)
- Direct and Explicit Light Source Sampling
- Advanced PDF Management for Path Weights
- Orthonormal Basis (ONB) Generation for Sampling
- Implementing a True Scattering PDF for Materials
- Cosine-Weighted Sampling for Diffuse Surfaces
- Mixture Densities for Combined BRDF & Light Sampling
- Rendering Equation Mathematical Foundation
- Production-Ready Unbiased Path Tracer Architecture
- Change its backend to support CUDA, OpenGL or Vulkan.


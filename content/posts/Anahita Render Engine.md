+++
title = 'Anahita Render Engine'
date = 2023-06-28T05:43:23+03:30
cover = { image = "/images/anahita/anahita-cover.jpg" }
tags = ["Computer Graphics", "OpenGL", "C++", "Rendering"]
+++
This is a renderer that I have developed for the bachelor's degree project. In the beginning, I used the Blinn-Phong rendering model for it and now I am working on implementing a physically-based rendering model. For controlling the objects in the scene from light sources to complicated mesh objects and for the sake of debugging, I also implemented a GUI using Dear ImGui.

![View](/images/anahita/anahita-gui.png)

Here you can load meshes to the scene through GUI that under the hood uses the Assimp library and besides that, you can control each object's attributes. There is a scene graph that controls all objects on the scene and in addition to these, you can add and configure different sources of light on the scene. Unfortunately, the shaders are hard-coded for now, but I plan to take care of that too in the future. Below the GUI there is a log widget that shows warnings errors and all other sorts of messages that you may need.

The core of the renderer is implemented via C++ and OpenGL. I implemented many basic techniques in this renderer and also some advanced techniques (such as deferred shading or SSAO) that make Anahita a more slick renderer. I will update this post whenever I will take this piece of software to another level.

<div style="text-align: center;">
  <img src="/images/anahita/anahita-shadow.png" alt="Shadow" style="width: 100%;">
</div>

# Future Plans
- Implementing physically-based rendering model
- Developing a versatile world-editor
- Flexible editor for writing and changing shaders for each object
- Adding other types of source light

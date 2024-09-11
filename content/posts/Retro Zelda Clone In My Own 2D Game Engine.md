+++
title = 'Retro Zelda Clone in My Own 2D Game Engine'
date = 2024-09-05T17:01:33+03:30
cover = { image = "/images/zelda/zelda-cover.png" }
tags = ["Game Engine","Game Engine Architecture","C++","ECS","Video Game"]
+++
This is a simple clone of the old famous game Legend of Zelda that I have created with my 2D game engine. I created an ECS 2D game engine using C++ and SFML (as a library for handling graphics and sound). Due to this software architecture, it is easy to create new levels in a script file and then use that file in the game as a level. I didn't pick any specific scripting language for this and it has a simple format for now. But as one of my goals in this project, I want to adopt the Lua language for handling scripts as it gets more complicated.

<div style="display: flex; justify-content: center;">
  <img src="/images/zelda/center.gif" alt="Center of the map" style="width: 100%;">
</div>


As I said for now it is using SFML as a graphics library and I plan to drop it out and replace it with my own graphics framework that deals with graphics (the same thing for the sound system).
For debugging and also for in-game menus I used Dear ImGui. Even though I can handle the menus via SFML, due to my plan for using OpenGL as the graphics library, I chose to use Dear ImGui cause it is exhausting work to implement menus and deal with texts in this library. In this specific game, I have implemented the backpack (inventory) in the Dear ImGui as well.

# Future works
Soon I will replace this clone with my own game which is still under development and as I said above I am going to implement the abilities of the library that I am currently using with my version.

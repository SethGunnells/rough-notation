# Rough Notation

[See the original here](https://github.com/pshihn/rough-notation)

This is a fork of Rough Notation that I created for more ease of use with Remotion. The problem with using the existing library with Remotion is two fold:

  1. The seed value for RoughJS is not exposed so it can't be set to be the same across multiple threads when rendering.
  2. The animation is based in CSS animation, meaning it can't be controlled via frame interpolation, another problem for multithreading.

This fork changes a number of things:

  1. A new method has been added allowing for setting the percentage of the SVG that has been "drawn" (that is visible). This allows for animating the annotation via JS and interpolating it by frame for multithreading.
  2. All code related to animation and animation sequencing has been removed as it is not needed for how I am using this fork.
  3. An array of DOM nodes can be passed which will be used to determine the drawing rectangle. This is so something like the markup structure created by syntax highlighting libraries can be annotated without trying to figure out how to wrap the desired nodes.

## Installation

You can add rough-notation to your project via npm

```
npm install --save @sethgunnells/rough-notation
```

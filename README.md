Luggage decal (three.js)
========

[![NPM Package][npm]][npm-url]
[![Build Size][build-size]][build-size-url]
[![NPM Downloads][npm-downloads]][npmtrends-url]
[![Dev Dependencies][dev-dependencies]][dev-dependencies-url]
[![Language Grade][lgtm]][lgtm-url]

#### Project Purpose ####

The aim of the project is to create an easy to use luggage decal.  This project is based on three.js (example:[webgl/decals](https://threejs.org/examples/?q=decals#webgl_decals) )

### Usage ###

This code creates a scene, a camera, and a geometric cube, and it adds the cube to the scene. It then creates a `WebGL` renderer for the scene and camera, and it adds that viewport to the `document.body` element. Finally, it animates the cube within the scene for the camera.

This project used `DecalGeometry`, `OrbitControls`, `dat.gui(GUI)`, `STLLoader` (without ES6).

Download project and run `npm install`, then just find the file path: `../examples/src/luggage.html`

```javascript
<script src='../js/STLLoader.js'></script>
<script src='../js/DecalGeometry.js'></script>
<script src='../js/OrbitControls.js'></script>
<script src='../js/dat.gui.min.js'></script>
<script src='../js/STLExporter.js'></script>
```

[npm]: https://img.shields.io/npm/v/three
[npm-url]: https://www.npmjs.com/package/three
[build-size]: https://badgen.net/bundlephobia/minzip/three
[build-size-url]: https://bundlephobia.com/result?p=three
[npm-downloads]: https://img.shields.io/npm/dw/three
[npmtrends-url]: https://www.npmtrends.com/three
[dev-dependencies]: https://img.shields.io/david/dev/mrdoob/three.js
[dev-dependencies-url]: https://david-dm.org/mrdoob/three.js#info=devDependencies
[lgtm]: https://img.shields.io/lgtm/alerts/github/mrdoob/three.js
[lgtm-url]: https://lgtm.com/projects/g/mrdoob/three.js/

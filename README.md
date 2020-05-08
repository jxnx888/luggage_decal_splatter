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

This project used `DecalGeometry`, `OrbitControls`, `dat.gui(GUI)`, `STLLoader`.

```javascript
<script src='../js/STLLoader.js'></script>
<script src='../js/DecalGeometry.js'></script>
<script src='../js/OrbitControls.js'></script>
<script src='../js/dat.gui.min.js'></script>
<script src='../js/STLExporter.js'></script>
var renderer, scene, camera, stats;
	var mesh;
	var raycaster;
	var line;
	var currentDecal;
	var intersection = {
		intersects: false,
		point: new THREE.Vector3(),
		normal: new THREE.Vector3()
	};
	var mouse = new THREE.Vector2();
	var intersects = [];
	var defaultSTL = '../models/stl/ascii/grey.stl';
	var textureLoader = new THREE.TextureLoader();
	var currentDecal=decalMap[1]; //当前贴图默认第一个
	var decalDiffuse = textureLoader.load( decalMap[1] );
	var decalNormal = textureLoader.load( decalMap[1] );
	var decalMaterial = new THREE.MeshPhongMaterial( {
		specular: 0x444444,
		map: decalDiffuse,
		normalMap: decalNormal,
		normalScale: new THREE.Vector2( 1, 1 ),
		shininess: 30,
		transparent: true,
		depthTest: true,
		depthWrite: false,
		polygonOffset: true,
		polygonOffsetFactor: - 4,
		wireframe: false,
	} );
	var lastShootPostion;
	var lastShootrotation;
	var decals = [];
	var removedDecals = [];
	var currentObj=[];//当前主体 行李箱
	var currentDecalObj=[];//当前主体的decal
	var recentlyUsedDecal= new Array();//使用过的的decal
	var mouseHelper;
	var position = new THREE.Vector3();
	var orientation = new THREE.Euler();
	var size = new THREE.Vector3( 10, 10, 10 );
	var currentSize = new THREE.Vector3( 10, 10, 10 ); //当前鼠标decal的大小
	var currentPosition = new THREE.Vector3(0,0,0);//当前鼠标decal的位置
	var currentmaterial;;//当前鼠标decal的材质
	var dirLight, dirLightHeper, hemiLight, hemiLightHelper;
	var params = {
		SUBMIT:function (){
			exportASCII();
		},
		/*minScale: 10,*/
		maxScale: 30,
		rotation: Math.PI /180, // positive is counter-clockwise   Math.PI = 3.14 = 180°
		back: function () {
			removeLastDecals();
		},
		forward: function () {
			returnLastDecals();
		},
		clear: function () {
			removeDecals();
		}
	};
	window.addEventListener( 'load', init );
    function init( file ) {
		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight);
		container.appendChild( renderer.domElement );
		/*stats = new Stats(); // ping/FPS 网络帧数
        container.appendChild( stats.dom );*/
		scene = new THREE.Scene();
		// sky + ground
		//sky
		scene.background = new THREE.Color( 0xcce0ff );
		scene.fog = new THREE.Fog( 0xcce0ff, 50, 1000 );
		// ground
		var loaderText = new THREE.TextureLoader();
		var groundTexture = loaderText.load( '../img/grasslight-big.jpg' );
		groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
		groundTexture.repeat.set( 25, 25 );
		groundTexture.anisotropy = 1;
		groundTexture.encoding = THREE.sRGBEncoding;
		var groundMaterial = new THREE.MeshLambertMaterial( { map: groundTexture } );
		var meshGround = new THREE.Mesh( new THREE.PlaneBufferGeometry( 6000, 6000 ), groundMaterial );
		meshGround.position.y = - 50;
		meshGround.rotation.x = - Math.PI / 2;
		meshGround.receiveShadow = true;
		scene.add( meshGround );
		// sky + ground end
		scene.add( new THREE.AxesHelper( 50 ) ); //坐标位置辅助线 Coordinate system
		// 相机位置距离 camera position
		camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
		camera.position.z = 120;
		camera.target = new THREE.Vector3();
		var controls = new THREE.OrbitControls( camera, renderer.domElement );
		controls.minDistance = 50; //设置相机距离原点的最近距离 min distance from origin to camera 
		controls.maxDistance = 200;//设置相机距离原点的最远距离 max distance from origin to camera
		exporter = new THREE.STLExporter(); //explorter 导出工具
		// LIGHTS
		scene.add( new THREE.AmbientLight( 0xFFFFFFF,1.2) );//（环境光）
		dirLight = new THREE.DirectionalLight( 0xffffff, .08 ); //正面上 front top light
		dirLight.position.set( 0,75, 100 );
		dirLightHeper = new THREE.DirectionalLightHelper( dirLight, 5 );//光源辅助线   assist line
		scene.add( dirLightHeper );
		scene.add( dirLight );
		dirLight = new THREE.DirectionalLight( 0xffffff, .08 ); //正面下 front bottom light
		dirLight.position.set( 0,-75,100 );
		dirLightHeper = new THREE.DirectionalLightHelper( dirLight, 5 );//光源辅助线  assist line
		scene.add( dirLightHeper );
		scene.add( dirLight );
		dirLight = new THREE.DirectionalLight( 0xffffff, .18 );
		dirLight.position.set( 0, 75, -100 ); //背部 上 rear top light
		dirLightHeper = new THREE.DirectionalLightHelper( dirLight, 5 );
		scene.add( dirLightHeper );
		scene.add( dirLight );
		dirLight = new THREE.DirectionalLight( 0xffffff, .18 );
		dirLight.position.set( 0, -75, -100 ); //背部 上 rear bottom light
		dirLightHeper = new THREE.DirectionalLightHelper( dirLight, 5 );
		scene.add( dirLightHeper );
		scene.add( dirLight );
		dirLight = new THREE.DirectionalLight( 0xffffff, .18 );
		dirLight.position.set( 0, 100, 0 ); //顶部 top light
		dirLightHeper = new THREE.DirectionalLightHelper( dirLight, 5 );
		scene.add( dirLightHeper );
		scene.add( dirLight );
		dirLight = new THREE.DirectionalLight( 0xffffff, .18 );
		dirLight.position.set( 100, 0, 0 ); //右侧 right light
		dirLightHeper = new THREE.DirectionalLightHelper( dirLight, 5 );
		scene.add( dirLightHeper );
		scene.add( dirLight );
		dirLight = new THREE.DirectionalLight( 0xffffff, .18 );
		dirLight.position.set( 0, -100, 0 ); //底部 bottom light
		dirLightHeper = new THREE.DirectionalLightHelper( dirLight, 5 );
		scene.add( dirLightHeper );
		scene.add( dirLight );
		dirLight = new THREE.DirectionalLight( 0xffffff, .18 );
		dirLight.position.set( -100, 0, 0 );//左侧 left light
		dirLightHeper = new THREE.DirectionalLightHelper( dirLight, 5 );
		scene.add( dirLightHeper );
		scene.add( dirLight );
		// 鼠标红线
		var geometry = new THREE.BufferGeometry();
		geometry.setFromPoints( [new THREE.Vector3(), new THREE.Vector3()] );
		var lineMaterial = new THREE.LineBasicMaterial( {
			color: 0xFF0000,
			linewidth: 100,
			linecap: 'round',
			linejoin: 'round'
		} );
		line = new THREE.Line( geometry, lineMaterial );
		// scene.add( line ); //鼠标辅助线
		loadSTL(defaultSTL,decals);
		raycaster = new THREE.Raycaster();
		initGUI();//右上角操作栏 
		window.addEventListener( 'resize', onWindowResize, false );
		var moved = false;
		controls.addEventListener( 'change', function () {
			moved = true;
		} );
		window.addEventListener( 'mousedown', function () {
			moved = false;
		}, false );
		window.addEventListener( 'mouseup', function () {
			checkIntersection();
			if (! moved && intersection.intersects) shoot(0);
		} );
		window.addEventListener( 'mousemove', onTouchMove );
		window.addEventListener( 'touchmove', onTouchMove );
		onWindowResize();
		animate(); //render 等

	}
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

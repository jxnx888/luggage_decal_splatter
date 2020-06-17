var dragObj;
var selectedDragObj;
var selectedDragObjFlag;
var maxW, maxH;
var shapesEventL = document.getElementById( "childWrapper" );
var shapesMain = document.getElementById( "shapes" );
var movedDir; //拖拽距离
var dragedFlag = false;
var listShapes = [];
var listLDraw = [];
var listSTL = [];
var saveFlag = false;

// var mobile = /Android|webOS|iPhone|iPad|BlackBerry/i.test( navigator.userAgent );
var mobile = true;
var container = document.getElementById( 'container' ); //
var twoPointTouchFlag = false;
var pointOneFlag, pointTwoFlag, touchScale;
var camera, scene, renderer;
var directionalLight, spotLight;
var cameraZoom = 1;
var outlinePass, composer, effectFXAA, renderPass;
var plane;
var gridHelper, gradGroundMesh, gradGroundMesh1;
var mouse, raycaster, isShiftDown = false;
var controls;
var mouseHelper, mouseHelperMaterial;
var controlsMoved = false;
var objects = [];
var currentObj; //当前形状
var currentObjMaterial = new THREE.MeshLambertMaterial( { color: 0xdddddd } );
var currentShapeType;
var currentColorFlag = 0;
var currentObjMesh; //当前obj mesh
var shapeHelperObjects = [];
var shapesObj = []; //所有的当前已放置的obj
var currentAllObjs = []; //所有的当前已放置的obj
var transformControl;
var WORK_SPACE_SIZE = 200;
var SHAPE_SIZE = 20;
var LIMIT_SIZE = 4;
var tcX, tcY, tcZ, tcScale, tcScaleY; //当前对象的xyz值
var tcScaleYPosition, tcScaleYPositionFlag; //tcScaleYPosition: 改变大小之前位置；tcScaleYPosition: 改变大小之前是否贴住工作台
var transformControlModeType = 1;
var transformControlMove = false;
var transformDragFlag = true;
var focusedTransformObj;
var textTR = '当前状态:<br>移动';
var textSC = '当前状态:<br>改变大小';
var textRO = '当前状态:<br> 旋转';
var intersectsSelect = [];
var intersection = {
	intersects: false,
	point: new THREE.Vector3(),
	normal: new THREE.Vector3()
};
var allOperation = [];//all the operated operation(undo)
var redoOperation = [];//all the redo operation
var eachObjectInfo = {};//每一个对象的每一个步骤；
var eachRedoObjectInfo = {};//每一个对象的每一个步骤；
var shootedFlag = false;

var orientationControls = new THREE.OrientationControls( 50 ); //右上角三视图
var stlGeoFlag = 0; //0 geo; 1 stl
//LDraw
var lDrawModul;
var lDrawModulGUI;
var lDrawGuiData = {
	smoothNormals: true,
	separateObjects: true,
	constructionStep: 0,
	noConstructionSteps: "无步骤"
};
//LDraw  end
var currentModule = 0; //0:基础模型 1：lego
$( function () {
	listModule();

	shapesMain.addEventListener( "touchstart", function ( e ) {
		$( ".zoom_options,.color_wrapper" ).hide();//隐藏子窗口
	} );
	shapesEventL.addEventListener( "touchstart", function ( e ) {
		$( ".zoom_options,.color_wrapper" ).hide();//隐藏子窗口
		selectedDragObj = $( e.target );
		if (selectedDragObj.hasClass( "drag" )) {
			$( ".active_shape" ).removeClass( "active_shape" );
			if (selectedDragObj.hasClass( "name" )) {
				dragObj = $( selectedDragObj ).parents( ".module" ).find( ".sprint" ).clone();
				$( selectedDragObj ).parents( ".module" ).addClass( "active_shape" );
				selectedDragObjFlag = true;
			} else if (selectedDragObj.hasClass( "sprint" )) {
				dragObj = selectedDragObj.clone();
				$( selectedDragObj ).parents( ".module" ).addClass( "active_shape" );
				selectedDragObjFlag = true;
			} else if (selectedDragObj.hasClass( "module" )) {
				dragObj = $( selectedDragObj ).find( ".sprint" ).clone();
				$( selectedDragObj ).addClass( "active_shape" );
				selectedDragObjFlag = false;
			}
			dragObj.addClass( "startDrag" );
			maxW = document.body.clientWidth - selectedDragObj[0].offsetWidth;
			maxH = document.body.clientHeight - selectedDragObj[0].offsetHeight;
		}
	}, false );
	shapesEventL.addEventListener( "touchmove", function ( e ) {
		dragedFlag = true;
		var ev = e || window.event;
		var touch = ev.targetTouches[0];
		var windowWidth = window.innerWidth;
		movedDir = windowWidth - touch.clientX;

		if (dragObj && movedDir > 100) {
			$( "body" ).append( dragObj );
			var oLeft = touch.clientX - 50;
			var oTop = touch.clientY - 50;
			if (oLeft < 0) {
				oLeft = 0;
			} else if (oLeft >= maxW) {
				oLeft = maxW;
			}
			if (oTop < 0) {
				oTop;
			} else if (oTop >= maxH) {
				oTop = maxH;
			}
			dragObj[0].style.left = oLeft + 25 + 'px';
			dragObj[0].style.top = oTop + 'px';
		}
	}, false );
	shapesEventL.addEventListener( "touchend", function ( e ) {
		if (dragObj && dragedFlag && movedDir > 100) {
			// $( selectedDragObj ).parents( ".module" ).trigger( "click" );
			if (selectedDragObjFlag) {
				var code = Number( $( selectedDragObj ).parents( ".module" ).find( ".this_code" ).val() );
				var type = Number( $( selectedDragObj ).parents( ".module" ).find( ".this_module" ).val() );
			} else if (selectedDragObjFlag == false) {
				var code = Number( $( selectedDragObj ).find( ".this_code" ).val() );
				var type = Number( $( selectedDragObj ).find( ".this_module" ).val() );
			}
			if (type == 0) {
				changeShapes( code );
			} else if (type == 1) {
				loadSTL( code );
			} else if (type == 2) {
				showInput( 0 );
			}
			$( dragObj ).remove();
			setTimeout( function () {
				onDocumentMouseDown( e );
			}, 100 );
		} else {
			$( dragObj ).remove();
		}
		dragedFlag = false;
		$( ".active_shape" ).removeClass( "active_shape" );
	}, false );
	window.addEventListener( "touchmove", function ( event ) {
			if (event.scale !== 1) {
				event.preventDefault();
			}
		},
		{ passive: false }
	);
//input标签 软键盘打开和收起
	$( "#save_name" ).focus( function () {
		$( ".save_name_module" ).css( { "top": "-.85rem" } );
		$( ".obj_control" ).hide();
	} );
	$( "#save_name" ).blur( function () {
		$( ".save_name_module" ).css( { "top": "23%" } );
		$( ".obj_control" ).show();
	} );
//以下代码针对安卓收起，关闭软键盘，是不会失去焦点的
	var winHeight = $( window ).height();   //获取当前页面高度
	$( window ).resize( function () {
		var thisHeight = $( this ).height();
		if (winHeight - thisHeight > 50) {
			//当软键盘弹出，在这里面操作
			$( ".save_name_module" ).css( { "top": "-.85rem" } );
			$( ".obj_control" ).hide();

		} else {
			//当软键盘收起，在此处操作
			$( ".save_name_module" ).css( { "top": "23%" } );
			$( ".obj_control" ).show();
		}
	} );
//input标签 软键盘打开和收起 end
	$( ".show_more" ).click( function () {
		$( ".zoom_options,.color_wrapper" ).hide();//隐藏子窗口
		$( "#shapes" ).toggle();
		$( "#shapes" ).toggleClass( "shapes_close" );
		$( ".show_more" ).toggleClass( "show_more_close" );
		$( ".child_wrapper " ).hide();
		$( ".obj_control" ).toggleClass( "has_right_menu" );
		$( ".orientationControls" ).toggleClass( "right_menu_hide" );

		if ($( ".obj_control" ).hasClass( "has_right_menu" )) {
			$( ".obj_control" ).css( { width: window.innerWidth - 100 } );
		} else {
			$( ".obj_control" ).css( { width: "100%" } );
		}
		onWindowResize(); //canvas floats to right side,in case the show_more close, there were dark side
	} );

	init();
	render();
} );

function showModule( type ) {//type 0: 标准模型    1:卡通模型 2: lego 模型
	if (type == 0) {
		$( ".normal_wrapper" ).show();
	} else if (type == 1) {
		$( ".cartoon_wrapper" ).show();
	} else if (type == 2) {
		$( ".buymodule_wrapper" ).show();
	} else if (type == 3) {
		alert( "购买跳转" );
	}
}

function hideModule( obj ) {
	stopPropagationFn();
	$( obj ).parents( ".child_wrapper" ).hide();
}

function listModule( type ) {
	$.ajax( {
		type: "GET",
		url: "../static/moduleList.json",
		dataType: "JSON",
		cache: false,
		beforeSend: function () {
		},
		success: function ( res ) {
			var shapesHtml = '<div class="child_title" onclick="hideModule(this)"><i class="iconfont arrow">&#xe720;</i>基础模型</div>';
			var shapesIndex = 0;
			listShapes = res.data.shapes;
			for (var i in listShapes) {
				if (listShapes[i].module == "shape") {
					shapesHtml += '<div class="module shapes drag ' + listShapes[i].title + '" >';
					shapesHtml += '<input class="this_module" type="hidden" value="0">';
				} else if (listShapes[i].module == "stl") {
					shapesHtml += '<div class="module shapes drag ' + listShapes[i].title + '">'; // onclick="loadSTL(11,this)"
					shapesHtml += '<input class="this_module" type="hidden" value="1">';
				} else if (listShapes[i].module == "text") {
					shapesHtml += '<div class="module shapes drag ' + listShapes[i].title + '">'; // onclick="showInput(0,this)"
					shapesHtml += '<input class="this_module" type="hidden" value="2">';

				}
				shapesHtml += '<input class="this_code" type="hidden" value="' + listShapes[i].code + '">';
				// shapesHtml += '<img src="' + listShapes[i].url + '" alt="Doughnut" class="drag">';
				shapesHtml += '<div class="drag sprint sprint_' + listShapes[i].title + '"></div>';
				shapesHtml += '<div class="name drag">' + listShapes[i].name + '</div>';
				shapesHtml += '<div class="color_change">';
				if (i != listShapes.length - 1) {
					shapesHtml += '<div class="color_option color_yellow color_circle" onclick="changeColorBeforeShoot(1,this)"></div>';
					shapesHtml += '<div class="color_option color_white color_circle" onclick="changeColorBeforeShoot(0,this)"></div>';
				} else {
					shapesHtml += '<div class="color_option color_yellow color_circle" onclick="changeTextColor(1,this)"></div>';
					shapesHtml += '<div class="color_option color_white color_circle" onclick="changeTextColor(0,this)"></div>';
				}
				shapesHtml += '</div>';
				shapesHtml += '</div>';
				shapesIndex ++;
			}
			$( ".normal_wrapper" ).html( shapesHtml );

			var cartoonHtml = '<div class="child_title" onclick="hideModule(this)"><i class="iconfont arrow">&#xe720;</i>卡通模型</div>';
			var cartoonIndex = 0;
			listSTL = res.data.stl;
			for (var i in listSTL) {
				cartoonHtml += '<div class="module lego drag ' + listSTL[i].title + '">'; // onclick="loadSTL(' + cartoonIndex + ',this)"
				cartoonHtml += '<input class="this_code" type="hidden" value="' + cartoonIndex + '">';
				cartoonHtml += '<input class="this_module" type="hidden" value="1">';
				cartoonHtml += '<div class="drag sprint sprint_' + listSTL[i].title + ' sprintY"></div>';
				// cartoonHtml += '<div class="img_wrapper"><img src="../img/3dPrinting/sprint_' + listSTL[i].title + '.png" alt="' + listSTL[i].title + '" class="drag"></div>';
				cartoonHtml += '<div class="name drag">' + listSTL[i].name + '</div>';
				cartoonHtml += '<div class="color_change">';
				cartoonHtml += '<div class="color_option color_yellow color_circle" onclick="changeColorBeforeShoot(1,this)"></div>';
				cartoonHtml += '<div class="color_option color_white color_circle" onclick="changeColorBeforeShoot(0,this)"></div>';
				cartoonHtml += '</div>';
				cartoonHtml += '</div>';
				cartoonIndex ++;
			}
			cartoonHtml += '<div class="go_shopping" onclick="goShop() ">购买模型</div>';
			$( ".cartoon_wrapper" ).html( cartoonHtml );

		},
		error: function ( res ) {
			console.log( res );
		}
	} );

}

function getTimeStr() {
	var date = new Date();
	var Y = date.getFullYear();
	var M = ( date.getMonth() + 1 ) < 10 ? ( '0' + ( date.getMonth() + 1 ) ) : ( date.getMonth() + 1 );
	var D = date.getDate() < 10 ? ( '0' + date.getDate() ) : date.getDate();
	var h = date.getHours() < 10 ? ( '0' + date.getHours() ) : date.getHours();
	var m = date.getMinutes() < 10 ? ( '0' + date.getMinutes() ) : date.getMinutes();
	var s = date.getSeconds() < 10 ? ( '0' + date.getSeconds() ) : date.getSeconds();
	var dateStr = Y + M + D + h + m + s;
	return dateStr;
}

function saveModuleShow( type ) {
	if (objects.length > 1) {
		if (type == 0) {
			$( "#save_name" ).val( getTimeStr() );
			$( ".save_name_ok" ).attr( 'onclick', "exportMoudle(0)" );
			$( ".save_name_module,.save_name_module_bg" ).show();
		} else {
			$( ".save_name_module,.save_name_module_bg" ).hide();
		}
	} else {
		$( ".save_name_module,.save_name_module_bg" ).hide();
	}
}

function saveModuleName( obj, type ) {
	var name = $( obj ).val();
	if (name.length > 0) {
		// $(".save_name_ok").removeClass("btn_disable");
		$( ".save_name_ok" ).attr( 'onclick', "exportMoudle(0)" );
	} else {
		// $(".save_name_ok").addClass("btn_disable");
		$( ".save_name_ok" ).attr( 'onclick', "validateName()" );
	}
}

function validateName() {
	$( ".save_name_verify" ).show();
	setTimeout( function () {
		$( ".save_name_verify" ).hide();
	}, 2000 );
}

function goHomePage() {
	if (objects.length > 1) {
		if (saveFlag) {
			js.changeActive( "3" );//1,我的模型 2 商城 3 模型库首页 4 创建模型
		} else {
			$( ".save_ask,.save_name_module_bg" ).show();
		}
	} else {
		// document.location = "http://192.168.1.163:8080/examples/src/shopping.html";
		js.changeActive( "3" );//1,我的模型 2 商城 3 模型库首页 4 创建模型
	}

}

function goHomeSaveModule( type ) {//type 0:gohome 1; save
	$( ".save_ask,.save_name_module_bg" ).hide();
	if (type === 0) {
		js.changeActive( "3" );//1,我的模型 2 商城 3 模型库首页 4 创建模型
	} else {
		saveModuleShow( 0 );
	}
}

function goShop() {//type 0:gohome 1; save
	js.changeActive( "2" );//1,我的模型 2 商城 3 模型库首页 4 创建模型
}

function hideGoHome() {
	$( ".save_ask,.save_name_module_bg" ).hide();
}

function showChild( type ) {
	if (type === 0) {
		$( ".zoom_options" ).toggle();
		$( ".color_wrapper" ).hide();
	} else if (type === 1) {
		$( ".color_wrapper" ).toggle();
		$( ".zoom_options" ).hide();
	}
}

function zoomView( zoomIndex ) {
	if (cameraZoom) {
		cameraZoom = zoomIndex / 100;
		camera.zoom = cameraZoom;
		camera.lookAt( scene.position );
		camera.updateProjectionMatrix();
	}
}

//main
function init() {
	renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
	// renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setPixelRatio( ( window.devicePixelRatio ) ? window.devicePixelRatio : 1 );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.autoClear = false;
	renderer.setClearColor( 0x000000, 0.0 );
	container.appendChild( renderer.domElement );

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
	// camera.position.set( 0, 200, 350 ); //正面
	camera.position.set( 170, 145, 255 ); //45°
	camera.lookAt( 0, 0, 0 );

	scene = new THREE.Scene();
	// scene.background = new THREE.Color( 0xf0f0f0 );
	// scene.background = new THREE.Color( 0xf8f8f9 );
	// scene.background = new THREE.Color( 0xffffff );
	// scene.userData.outlineEnabled = true;
	// scene.add( new THREE.AxesHelper( 50 ) ); //坐标位置辅助线 Coordinate system

	// roll-over helpers

	var rollOverGeo = new THREE.BoxBufferGeometry( SHAPE_SIZE, SHAPE_SIZE, SHAPE_SIZE );
	mouseHelperMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
	mouseHelper = new THREE.Mesh( rollOverGeo, mouseHelperMaterial );
	if (! mobile) {
		scene.add( mouseHelper );
	}

	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();

	var geometry = new THREE.PlaneBufferGeometry( WORK_SPACE_SIZE, WORK_SPACE_SIZE );
	geometry.rotateX( - Math.PI / 2 );

	plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xe5e4df, visible: true } ) );
	plane.name = "plane";
	plane.receiveShadow = true;
	plane.castShadow = true;
	scene.add( plane );
	objects.push( plane );

	// grid

	gridHelper = new THREE.GridHelper( WORK_SPACE_SIZE, 20, 0x999999, 0xc999999 );
	// gridHelper = new THREE.GridHelper( 300, 6, 0x999999, 0xc999999 );
	gridHelper.name = 'GridHelper';
	scene.add( gridHelper );

	gradGroundMesh = new THREE.Mesh( new THREE.BoxBufferGeometry( WORK_SPACE_SIZE, .8, WORK_SPACE_SIZE ), new THREE.MeshLambertMaterial( { color: 0xffffff } ) );
	gradGroundMesh.position.y = - .8;
	gradGroundMesh.name = 'GridHelper';
	gradGroundMesh.receiveShadow = true;
	gradGroundMesh.castShadow = true;
	scene.add( gradGroundMesh );
	gradGroundMesh1 = new THREE.Mesh( new THREE.BoxBufferGeometry( WORK_SPACE_SIZE, 3, WORK_SPACE_SIZE ), new THREE.MeshLambertMaterial( { color: 0xffc869 } ) );
	gradGroundMesh1.position.y = - 2.5;
	gradGroundMesh1.name = 'GridHelper';
	gradGroundMesh1.receiveShadow = true;
	gradGroundMesh1.castShadow = true;
	scene.add( gradGroundMesh1 );
	//grid end

	// lights
	var ambientLight = new THREE.AmbientLight( 0x606060, 1 ); //0x606060
	scene.add( ambientLight );
	directionalLight = new THREE.DirectionalLight( 0xFFFFFF, 1.3 );
	directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
	// dirLightHeper = new THREE.DirectionalLightHelper( directionalLight, 215 );//光源辅助线
	// scene.add( dirLightHeper );
	scene.add( directionalLight );

	// outline
	composer = new THREE.EffectComposer( renderer );
	renderPass = new THREE.RenderPass( scene, camera );
	composer.addPass( renderPass );
	outlinePass = new THREE.OutlinePass( new THREE.Vector2( window.innerWidth - 100, window.innerHeight ), scene, camera );
	outlinePass.edgeStrength = 4;//强度 默认3
	outlinePass.edgeThickness = 1;
	outlinePass.visibleEdgeColor.set( '#00ff00' );// 边缘可见部分发光颜色
	outlinePass.hiddenEdgeColor.set( '#00ff00' );//边缘遮挡部分发光颜色
	outlinePass.edgeGlow = 1;//发光颜色虚边
	// outlinePass.pulsePeriod= 3;//发光颜色闪烁频率

	composer.addPass( outlinePass );
	effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
	effectFXAA.uniforms['resolution'].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
	// outline end

	// 旋转控制
	controls = new THREE.OrbitControls( camera, renderer.domElement ); // project controller
	controls.minDistance = 10; //设置相机距离原点的最近距离 min distance of camera to coordinate origin
	controls.maxDistance = 1300;//设置相机距离原点的最远距离 max distance of camera to coordinate origin
	controls.enableKeys = true;
	controls.keys = {
		LEFT: 65, //left arrow
		UP: 87, // up arrow
		RIGHT: 68, // right arrow
		BOTTOM: 83 // down arrow
	};
	controls.enablePan = false;//是否开启右键拖拽
	controls.enableZoom = false;//是否可以缩放

	controls.addEventListener( 'change', function ( event ) {
		controlsMoved = true;
		if (objects.length > 1) {
			if (camera.position.y < 0) { //当镜头在底板 底部后，隐藏
				clearCache( gridHelper );
				scene.remove( gridHelper );
				clearCache( gradGroundMesh );
				scene.remove( gradGroundMesh );
				clearCache( gradGroundMesh1 );
				scene.remove( gradGroundMesh1 );
			} else {
				clearCache( gridHelper );
				scene.remove( gridHelper );
				clearCache( gradGroundMesh );
				scene.remove( gradGroundMesh );
				clearCache( gradGroundMesh1 );
				scene.remove( gradGroundMesh1 );
				scene.add( gridHelper );
				scene.add( gradGroundMesh );
				scene.add( gradGroundMesh1 );
			}
		} else {
			clearCache( gridHelper );
			scene.remove( gridHelper );
			clearCache( gradGroundMesh );
			scene.remove( gradGroundMesh );
			clearCache( gradGroundMesh1 );
			scene.remove( gradGroundMesh1 );
			scene.add( gridHelper );
			scene.add( gradGroundMesh );
			scene.add( gradGroundMesh1 );
		}
	} );
	// controls.enabled = false;
	//移动shape
	transformControl = new THREE.TransformControls( camera, renderer.domElement );
	transformControl.name = "transformControl";
	transformControl.size = 1.5;
	scene.add( transformControl );

	transformControl.addEventListener( 'dragging-changed', function ( event ) {
		if (controls) {
			controls.enabled = ! event.value;
			transformDragFlag = ! event.value;
		}
		// console.log('dragging-changed')
		transformControlMove = true;
	}, false );
	transformControl.addEventListener( 'change', function () {
		if (shootedFlag) {
			shapesController( 0 );
		}
		showCurrentColor();
		onAnimationStep();
	}, false );
	transformControl.addEventListener( 'mouseDown', function () {
		transformControlMove = false;
		checkScalePosition( transformControl.object );
	}, false );
	transformControl.addEventListener( 'touchstart', function () {
		transformControlMove = false;
		var obj = transformControl.object;
		tcScaleYPosition = obj.position.clone().y;
		tcScaleY = obj.scale.clone().y;
	}, false );
	transformControl.addEventListener( 'mouseUp', function () {
		if (transformControlMove) {
			allOperationAdd();
		}
		showCurrentColor();
		if (focusedTransformObj) {
			transformControl.object = focusedTransformObj;
		}
	}, false );
	//移动shape End
	container.addEventListener( 'mousedown', function ( e ) {
		controlsMoved = false;
		$( ".zoom_options,.color_wrapper" ).hide();//隐藏子窗口
	}, false );
	container.addEventListener( 'touchstart', function ( e ) {
		$( ".zoom_options,.color_wrapper" ).hide();//隐藏子窗口
		controlsMoved = false;
		var obj = transformControl.object;
		if (e.touches.length >= 2) { //判断是否有两个点在屏幕上
			controls.enabled = false;
			twoPointTouchFlag = true;
			pointOneFlag = e.touches; //得到第一组两个点
			if (transformControl.object) {
				tcX = obj.scale.x;
				tcY = obj.scale.y;
				tcZ = obj.scale.z;
				checkScalePosition( obj );
			}
		} else {
			controls.enabled = transformDragFlag;
			twoPointTouchFlag = false;
			touchScale = '';
		}
	}, false );
	container.addEventListener( 'mousemove', onDocumentMouseMove, false );
	container.addEventListener( 'touchmove', function ( e ) {
		onDocumentMouseMove( e );
		transformControlMove = true;
		if (e.touches.length >= 2 && twoPointTouchFlag) { //判断是否有两个点在屏幕上
			twoPointTouchFlag = true;
			pointTwoFlag = e.touches; //得到第一组两个点
			touchScale = getDistance( pointTwoFlag[0], pointTwoFlag[1] ) / getDistance( pointOneFlag[0], pointOneFlag[1] ); //得到缩放比例，getDistance是勾股定理的一个方法
			if (transformControl.object && touchScale) {
				var scaleXX = tcX * touchScale;
				var scaleYY = tcY * touchScale;
				var scaleZZ = tcZ * touchScale;
				if (scaleXX > LIMIT_SIZE) {
					scaleXX = LIMIT_SIZE;
					scaleYY = LIMIT_SIZE;
					scaleZZ = LIMIT_SIZE;
				}
				transformControl.object.scale.set( scaleXX, scaleYY, scaleZZ );
				checkAxis( "scale", transformControl.object );
			}
		}
	}, false );

	container.addEventListener( 'mouseup', function ( e ) {
		if (transformControl.object) {
			focusedTransformObj = transformControl.object;
		}
		if (currentModule == 0 && ! controlsMoved) {
			setTimeout( function () {
				onDocumentMouseDown( e );
			}, 100 );
		}
		tcScaleYPosition = '';
		tcScaleYPositionFlag = '';
		tcScaleY = '';
		tcX = '';
		tcY = '';
		tcZ = '';
	}, false );
	container.addEventListener( 'touchend', function ( e ) {
		if (transformControl.object) {
			focusedTransformObj = transformControl.object;
		}
		if (currentModule == 0 && ! controlsMoved) {
			setTimeout( function () {
				onDocumentMouseDown( e );
			}, 100 );
		}
		tcScaleYPosition = '';
		tcScaleYPositionFlag = '';
		tcScaleY = '';
		tcX = '';
		tcY = '';
		tcZ = '';
	}, false );
	container.addEventListener( 'keydown', onDocumentKeyDown, false );
	container.addEventListener( 'keyup', onDocumentKeyUp, false );

	document.body.appendChild( orientationControls.element );
	orientationControls.element.addEventListener( 'click', function ( e ) {

		switch (e.target.id) {
			case 'front':
				camera.position.set( 0, 0, 300 );
				break;
			case 'back':
				camera.position.set( 0, 0, - 300 );
				break;
			case 'top':
				camera.position.set( 0, 300, 0 );
				break;
			case 'bottom':
				camera.position.set( 0, - 300, 0 );
				break;
			case 'left':
				camera.position.set( - 300, 0, 0 );
				break;
			case 'right':
				camera.position.set( 300, 0, 0 );
				break;
		}
		camera.lookAt( scene.position );
		camera.updateProjectionMatrix();
	} );
	//
	// initGUI();
	container.addEventListener( 'resize', onWindowResize, false );
	window.addEventListener( 'resize', onWindowResize, false );
	animate();
	onWindowResize();
}

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	orientationControls.update( camera );
	composer.render();
	// stats.update();
}

function onWindowResize() {
	var controlBoardWidth = $( "#shapes" ).hasClass( "shapes_close" ); //left decal side width
	if (controlBoardWidth) {
		camera.aspect = ( window.innerWidth ) / window.innerHeight;
		renderer.setSize( window.innerWidth, window.innerHeight );
		composer.setSize( window.innerWidth, window.innerHeight );
		effectFXAA.uniforms['resolution'].value.set( 1 / window.innerWidth, 1 / window.innerHeight );

	} else {
		camera.aspect = ( window.innerWidth - 100 ) / window.innerHeight;
		renderer.setSize( window.innerWidth - 100, window.innerHeight );
		composer.setSize( window.innerWidth - 100, window.innerHeight );
		effectFXAA.uniforms['resolution'].value.set( 1 / ( window.innerWidth - 100 ), 1 / window.innerHeight );
	}
	camera.updateProjectionMatrix();

}

function onDocumentMouseMove( event ) {

	// event.preventDefault();

	mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( objects );

	if (intersects.length > 0) {

		var intersect = intersects[0];

		mouseHelper.position.copy( intersect.point ).add( intersect.face.normal );
		mouseHelper.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );

	}
	render();

}

function onDocumentMouseDown( event ) {
	/*var intersects = raycaster.intersectObjects( objects );
	if (intersects.length > 0) {
		shootedFlag = false;
	}
	else{
		shootedFlag = true;
	}*/
	if (! shootedFlag) {
		event.preventDefault();
		var controlBoardWidth = $( "#shapes" ).hasClass( "shapes_close" ); //left decal side width
		if (controlBoardWidth) {
			if (event.type == "touchend") {
				var touch = event.changedTouches[0];
				mouse.set( ( touch.clientX / window.innerWidth ) * 2 - 1, - ( touch.clientY / window.innerHeight ) * 2 + 1 );
			} else {
				mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
			}
		} else {
			if (event.type == "touchend") {
				var touch = event.changedTouches[0];
				mouse.set( ( touch.clientX / ( window.innerWidth - 100 ) ) * 2 - 1, - ( touch.clientY / window.innerHeight ) * 2 + 1 );
			} else {
				mouse.set( ( event.clientX / ( window.innerWidth - 100 ) ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
			}
		}

		raycaster.setFromCamera( mouse, camera );

		var intersects = raycaster.intersectObjects( objects );

		if (intersects.length > 0) {

			var intersect = intersects[0];

			// delete cube

			if (isShiftDown) {

				if (intersect.object !== plane) {

					scene.remove( intersect.object );

					objects.splice( objects.indexOf( intersect.object ), 1 );

				}

				// create cube

			} else {
				if (objects.length < 11 && currentObj) {
					var voxelMaterial = currentObjMaterial.clone();
					var voxel = new THREE.Mesh( currentObj, voxelMaterial );
					voxel.position.copy( intersect.point ).add( intersect.face.normal );
					// voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar(25 );
					if (stlGeoFlag == 0) {
						voxel.position.divideScalar( SHAPE_SIZE ).floor().multiplyScalar( SHAPE_SIZE ).addScalar( SHAPE_SIZE / 2 );
						voxel.name = "shapes";
					} else if (stlGeoFlag == 1) {
						voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
						voxel.name = "stl";
					}
					voxel.receiveShadow = true;
					voxel.castShadow = true;
					scene.add( voxel );
					objects.push( voxel );
					shapeHelperObjects.push( voxel );
					shapesObj.push( voxel ); //全删除使用
					currentAllObjs.push( voxel ); //
					$( ".undo_control" ).removeClass( "noActive_control" );//
					$( ".save_stl" ).removeClass( "noActive_save" );//
					transformControl.object = voxel;
					focusedTransformObj = transformControl.object;
					createObjForOperation( voxel, 'add' );
					eachObjSetps( voxel, 0 );
					shapesController();
					transformControl.attach( focusedTransformObj );
					cleanSelectedObject( voxel );
					showCurrentColor();
					resetSomeThing();
				}
				/*else {
					console.log( "The max shapes are 10." );
				}*/
			}
			shootedFlag = true;
			render();

		}
	} else {
		checkIntersection( event );
	}
}

function resetSomeThing() {
	$( ".active_shape" ).removeClass( "active_shape" );
	currentObjMaterial = new THREE.MeshLambertMaterial( { color: 0xdddddd } );
}

function onDocumentKeyDown( event ) {

	switch (event.keyCode) {

		case 16:
			isShiftDown = true;
			break;

	}

}

function onDocumentKeyUp( event ) {

	switch (event.keyCode) {

		case 16:
			isShiftDown = false;
			break;

	}

}

function render() {

	renderer.render( scene, camera );

}

/**
 * 清空当前obj对象的缓存
 * @param mesh  mesh对象
 * */
function clearCache( currentMesh ) {
	currentMesh.geometry.dispose();
	currentMesh.material.dispose();
}

function changeShapes( geo ) {//geo: 当前类型
	stlGeoFlag = 0;//0 geo; 1 stl
	stopPropagationFn();
	showInput( 1 );
	$( ".active_color" ).removeClass( "active_color" );
	currentModule = 0;//编辑模式，各种基础模型
	enabledLego( 1 );
	shootedFlag = false;
	/*if(controls){
		controls.dispose();
	}*/
	$( ".active_shape" ).removeClass( "active_shape" );
	switch (geo) {
		case 0:
			// 正方形
			currentShapeType = 0;
			currentObj = new THREE.BoxBufferGeometry( SHAPE_SIZE, SHAPE_SIZE, SHAPE_SIZE );
			$( ".cube" ).addClass( "active_shape" );
			break;
		case 1:
			//圆柱
			currentShapeType = 1;
			currentObj = new THREE.CylinderBufferGeometry( SHAPE_SIZE / 2, SHAPE_SIZE / 2, SHAPE_SIZE, 32 ); //CylinderGeometry(radiusTop : 浮点类型, radiusBottom : 浮点类型, height : 浮点类型, radialSegments : 整数类型, heightSegments : 整数类型, openEnded : 布尔类型, thetaStart : 浮点类型, thetaLength : 浮点类型)
			$( ".cylinder" ).addClass( "active_shape" );
			break;
		case 2:
			// 圆锥形
			currentShapeType = 2;
			currentObj = new THREE.ConeBufferGeometry( SHAPE_SIZE / 2, SHAPE_SIZE, 32 ); //ConeBufferGeometry(radius : Float, height : Float, radialSegments : Integer, heightSegments : Integer, openEnded : Boolean, thetaStart : Float, thetaLength : Float)
			$( ".cone" ).addClass( "active_shape" );
			break;
		case 3:
			// 球形
			currentShapeType = 3;
			currentObj = new THREE.SphereBufferGeometry( SHAPE_SIZE / 2, SHAPE_SIZE / 2, 50 );//SphereBufferGeometry(radius : Float, widthSegments : Integer, heightSegments : Integer, phiStart : Float, phiLength : Float, thetaStart : Float, thetaLength : Float)
			$( ".ball" ).addClass( "active_shape" );
			break;
		case 4:
			// 环形
			currentShapeType = 4;
			currentObj = new THREE.TorusGeometry( 10, 2.5, 16, 100 );//TorusGeometry(radius : Float, tube : Float, radialSegments : Integer, tubularSegments : Integer, arc : Float)
			$( ".doughnut" ).addClass( "active_shape" );
			break;
		case 5:
			// 棱柱形prismatic
			currentShapeType = 14;
			currentObj = new THREE.CylinderBufferGeometry( SHAPE_SIZE / 2, SHAPE_SIZE / 2, SHAPE_SIZE, 5 ); //CylinderGeometry(radiusTop : 浮点类型, radiusBottom : 浮点类型, height : 浮点类型, radialSegments : 整数类型, heightSegments : 整数类型, openEnded : 布尔类型, thetaStart : 浮点类型, thetaLength : 浮点类型)
			$( ".prismatic" ).addClass( "active_shape" );
			break;
		case 6:
			// 棱锥形Pyramid
			currentShapeType = 15;
			currentObj = new THREE.ConeBufferGeometry( SHAPE_SIZE / 2, SHAPE_SIZE, 4 ); //ConeBufferGeometry(radius : Float, height : Float, radialSegments : Integer, heightSegments : Integer, openEnded : Boolean, thetaStart : Float, thetaLength : Float)
			$( ".pyramid" ).addClass( "active_shape" );
			break;
		case 7:
			// 空心圆柱Hollow cylinder
			currentShapeType = 16;
			var outerRadius = SHAPE_SIZE / 2;
			var innerRadius = SHAPE_SIZE / 3;
			var height = SHAPE_SIZE;

			var arcShape = new THREE.Shape();
			arcShape.moveTo( outerRadius * 2, outerRadius );
			arcShape.absarc( outerRadius, outerRadius, outerRadius, 0, Math.PI * 2, false );
			var holePath = new THREE.Path();
			holePath.moveTo( outerRadius + innerRadius, outerRadius );
			holePath.absarc( outerRadius, outerRadius, innerRadius, 0, Math.PI * 2, true );
			arcShape.holes.push( holePath );
			var geometry = new THREE.ExtrudeGeometry( arcShape, {
				amount: height,
				bevelEnabled: false,
				steps: 1,
				curveSegments: 60
			} );
			geometry.center();
			geometry.rotateX( Math.PI * - .5 );
			currentObj = geometry;//TorusGeometry(radius : Float, tube : Float, radialSegments : Integer, tubularSegments : Integer, arc : Float)
			$( ".hollowcylinder" ).addClass( "active_shape" );
			break;
		case 8:
			// 三棱柱
			currentShapeType = 17;
			currentObj = new THREE.CylinderBufferGeometry( SHAPE_SIZE / 2, SHAPE_SIZE / 2, SHAPE_SIZE, 3 ); //CylinderGeometry(radiusTop : 浮点类型, radiusBottom : 浮点类型, height : 浮点类型, radialSegments : 整数类型, heightSegments : 整数类型, openEnded : 布尔类型, thetaStart : 浮点类型, thetaLength : 浮点类型)
			$( ".triprism" ).addClass( "active_shape" );
			break;
		default:
			// 正方形
			currentObj = new THREE.BoxBufferGeometry( SHAPE_SIZE, SHAPE_SIZE, SHAPE_SIZE );
	}

	changeMouseHelper( currentColorFlag );
	currentObjMesh = new THREE.Mesh( currentObj, currentObjMaterial );
	// scene.add( currentObjMesh );
}

function changeColorBeforeShoot( type, obj ) {
	stopPropagationFn();
	$( ".active_color" ).removeClass( "active_color" );
	$( ".sprintY" ).removeClass( "sprintY" );
	if (type == 0) {
		$( obj ).addClass( 'active_color' );
		$( obj ).parents( ".module" ).find( ".sprint" ).removeClass( 'sprintY' );
		currentObjMaterial = new THREE.MeshLambertMaterial( { color: 0xdddddd } );
	} else if (type == 1) {
		$( obj ).addClass( 'active_color' );
		$( obj ).parents( ".module" ).find( ".sprint" ).addClass( 'sprintY' );
		currentObjMaterial = new THREE.MeshLambertMaterial( { color: 0xf2f545 } );
	}
}

function changeCurrentColor( type ) {
	$( ".outside_color" ).removeClass( "white_color_circle" );
	if (transformControl.object) {
		if (type == 0) {
			transformControl.object.material.color.set( "#dddddd" );
			$( ".outside_color" ).addClass( "white_color_circle" );
		} else {
			transformControl.object.material.color.set( "#f2f545" );
			$( ".outside_color" ).removeClass( "white_color_circle" );
		}
		createObjForOperation( transformControl.object, 'transform' );
		eachObjSetps( transformControl.object, 0 );
	}
}

function changeMouseHelper( type ) { //type 0: 颜色改为白色 1：颜色改为黄色
	if (type == 0) {
		mouseHelperMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, opacity: 1, transparent: true } );
	} else {
		mouseHelperMaterial = new THREE.MeshBasicMaterial( { color: 0xf2f545, opacity: 1, transparent: true } );
	}
	clearCache( mouseHelper );
	scene.remove( mouseHelper );
	mouseHelper = new THREE.Mesh( currentObj, mouseHelperMaterial );
	mouseHelper.name = "mouseHelper";
	if (! mobile) {
		scene.add( mouseHelper );
	}
}

function removeAllShapes() {
	shapesObj.forEach( function ( d ) {
		clearCache( d );
		scene.remove( d );
		for (var i in objects) {
			if (objects[i].uuid == d.uuid) {
				objects.splice( i, 1 ); //remove element that index is i in array decals
			}
		}
	} );
	shapesObj = [];
	transformControl.detach(); //隐藏控制控件
}

function createObjForOperation( meshObj, type ) {
	if (allOperation.length >= 5) {
		allOperation.shift();
	}
	var obj = {};
	obj['uuid'] = meshObj.uuid;
	obj['position'] = meshObj.position.clone();
	obj['rotation'] = meshObj.rotation.clone();
	obj['quaternion'] = meshObj.quaternion.clone();
	obj['scale'] = meshObj.scale.clone();
	obj['color'] = meshObj.material.color.clone();
	obj['operation'] = type;
	obj['mesh'] = meshObj;
	allOperation.push( obj );
}

function eachObjSetps( e, type ) { //生成json 键的行为对象; e:mesh object  type 0: undo 1: redo
	var obj = {};

	if (type === 0) {
		if (! eachObjectInfo[e.uuid]) {
			eachObjectInfo[e.uuid] = [];
		}
		obj['uuid'] = e.uuid;
		obj['position'] = e.position.clone();
		obj['rotation'] = e.rotation.clone();
		obj['quaternion'] = e.quaternion.clone();
		obj['scale'] = e.scale.clone();
		obj['color'] = e.material.color.clone();
		obj['mesh'] = e;
		obj['time'] = Date.parse( new Date() );
		if (eachObjectInfo[e.uuid].length) {
			obj['index'] = eachObjectInfo[e.uuid].length;
		} else {
			obj['index'] = 0;
		}
		var arr = eachObjectInfo[e.uuid];
		arr.push( obj );
	} else if (type === 2) {
		if (! eachObjectInfo[e.uuid]) {
			eachObjectInfo[e.uuid] = [];
		}
		obj['uuid'] = e.uuid;
		obj['position'] = e.position.clone();
		obj['rotation'] = e.rotation.clone();
		obj['quaternion'] = e.quaternion.clone();
		obj['scale'] = e.scale.clone();
		obj['color'] = e.color.clone();
		obj['mesh'] = e.mesh;
		obj['time'] = Date.parse( new Date() );
		if (eachObjectInfo[e.uuid].length) {
			obj['index'] = eachObjectInfo[e.uuid].length;
		} else {
			obj['index'] = 0;
		}
		var arr = eachObjectInfo[e.uuid];
		arr.push( obj );
	} else if (type === 1) {
		if (! eachRedoObjectInfo[e.uuid]) {
			eachRedoObjectInfo[e.uuid] = [];
		}
		obj['uuid'] = e.uuid;
		obj['position'] = e.position.clone();
		obj['rotation'] = e.rotation.clone();
		obj['quaternion'] = e.quaternion.clone();
		obj['scale'] = e.scale.clone();
		obj['color'] = e.color.clone();
		obj['mesh'] = e.mesh;
		obj['time'] = Date.parse( new Date() );
		var arr = eachRedoObjectInfo[e.uuid];
		arr.push( obj );
	}

}

function redoUndo( type ) { //type 0: undo 1: redo
	$( ".zoom_options,.color_wrapper" ).hide();//隐藏子窗口
	var transformFlag = false;
	var deleteFlag = false;
	var addFlag = false;
	if (type === 0) {
		if (allOperation.length > 0) {
			var operationL = allOperation[allOperation.length - 1];//最后一个last
			redoOperation.push( operationL ); //add the undo to redo
			if (operationL.operation === 'transform') {
				transformFlag = true;
			} else if (operationL.operation === 'delete') {
				deleteFlag = true;
			} else if (operationL.operation === 'add') {
				addFlag = true;
			}
			if (addFlag) {
				if (operationL.mesh) {
					eachObjSetps( operationL, 1 );
					scene.remove( operationL.mesh );
					objects.splice( objects.indexOf( operationL.mesh ), 1 );
				}
			} else if (deleteFlag) {
				if (operationL.mesh) {
					eachObjSetps( operationL, 1 );
					scene.add( operationL.mesh );
					objects.push( operationL.mesh );
				}
			} else if (transformFlag) {
				var thisObj = eachObjectInfo[operationL.uuid]; //寻找对应对象步骤
				if (thisObj) {
					if (thisObj.length > 1) {
						redoProcess( thisObj[thisObj.length - 2] );
					} else {
						redoProcess( thisObj[thisObj.length - 1] );
					}
					eachObjSetps( eachObjectInfo[operationL.uuid].pop(), 1 );
					console.log( "transform" );
				}
			}
			allOperation.pop();
		}

	} else if (type === 1) {
		if (redoOperation.length > 0) {
			var redoOperationL = redoOperation[redoOperation.length - 1];//最后一个last
			allOperation.push( redoOperationL ); //add the undo to redo
			if (redoOperationL.operation === 'transform') {
				transformFlag = true;
			} else if (redoOperationL.operation === 'delete') {
				deleteFlag = true;
			} else if (redoOperationL.operation === 'add') {
				addFlag = true;
			}
			if (addFlag) {
				if (redoOperationL.mesh) {
					eachObjSetps( redoOperationL, 2 );
					scene.add( redoOperationL.mesh );
					objects.push( redoOperationL.mesh );
				}
			} else if (deleteFlag) {
				if (redoOperationL.mesh) {
					eachObjSetps( redoOperationL, 2 );
					scene.remove( redoOperationL.mesh );
					objects.splice( objects.indexOf( redoOperationL.mesh ), 1 );

				}
			} else if (transformFlag) {
				var thisObj = eachRedoObjectInfo[redoOperationL.uuid]; //寻找对应对象步骤
				if (thisObj) {
					if (thisObj.length > 1) {
						redoProcess( thisObj[thisObj.length - 2] );
					} else {
						redoProcess( thisObj[thisObj.length - 1] );
					}
					eachObjSetps( eachRedoObjectInfo[redoOperationL.uuid].pop(), 2 );
				}
			}
			redoOperation.pop();
		}
	}
	transformControl.detach(); //隐藏控制控件
	outlinePass.selectedObjects = [];
	$( ".color_control_wrapper" ).hide();
	$( ".active_control" ).removeClass( "active_control" );
	render();
	if (allOperation.length > 0) {
		$( ".undo_control" ).removeClass( "noActive_control" );
	} else {
		$( ".undo_control" ).addClass( "noActive_control" );
	}
	if (redoOperation.length > 0) {
		$( ".redo_control" ).removeClass( "noActive_control" );
	} else {
		$( ".redo_control" ).addClass( "noActive_control" );
	}
	if (objects.length > 1) {
		$( ".save_stl" ).removeClass( "noActive_save" );
	} else {
		$( ".save_stl" ).removeClass( "noActive_save" ).addClass( "noActive_save" );
	}

}

function redoProcess( operator, obj ) {
	/*		operator.position.copy(obj.position);
			operator.rotation._x=obj.rotation._x;
			operator.rotation._y=obj.rotation._y;
			operator.rotation._z=obj.rotation._z;
			operator.quaternion._x=obj.quaternion._x;
			operator.quaternion._y=obj.quaternion._y;
			operator.quaternion._z=obj.quaternion._z;
			operator.scale.set(obj.scale.x,obj.scale.y,obj.scale.z);*/
	operator.mesh.position.copy( operator.position );
	operator.mesh.rotation._x = operator.rotation._x;
	operator.mesh.rotation._y = operator.rotation._y;
	operator.mesh.rotation._z = operator.rotation._z;
	operator.mesh.quaternion._x = operator.quaternion._x;
	operator.mesh.quaternion._y = operator.quaternion._y;
	operator.mesh.quaternion._z = operator.quaternion._z;
	operator.mesh.scale.set( operator.scale.x, operator.scale.y, operator.scale.z );
	operator.mesh.material.color.set( operator.color );
}

function checkIntersection( event ) {
	var x, y;
	if (event.changedTouches) {
		x = event.changedTouches[0].pageX;
		y = event.changedTouches[0].pageY;
	} else {
		x = event.clientX;
		y = event.clientY;
	}
	mouse.x = ( x / window.innerWidth ) * 2 - 1;
	mouse.y = - ( y / window.innerHeight ) * 2 + 1;

	var controlBoardWidth = $( "#shapes" ).hasClass( "shapes_close" ); //left decal side width
	if (! controlBoardWidth) {
		mouse.x = ( x / ( window.innerWidth - 100 ) ) * 2 - 1;
		mouse.y = - ( y / window.innerHeight ) * 2 + 1;
	}
	if (! plane) return;
	raycaster.setFromCamera( mouse, camera );
	raycaster.intersectObject( plane, false, intersectsSelect );
	if (intersectsSelect.length > 0) {
		var p = intersectsSelect[0].point;
		mouseHelper.position.set( 0, 0, 0 );
		mouseHelper.position.copy( p );  //copy intersection position to mouseHelper
		intersection.point.copy( p );
		/*1.克隆旧的法线 2.旧法线乘以模型的世界矩阵得到归一化后的法线 3.和一个标量相乘，放大10倍。 4.加上点击点的坐标，进行平移。*/
		var n = intersectsSelect[0].face.normal.clone();
		n.transformDirection( plane.matrixWorld );
		n.multiplyScalar( 10 );
		n.add( intersectsSelect[0].point );

		intersection.normal.copy( intersectsSelect[0].face.normal );
		mouseHelper.lookAt( n );

		var sceneChilds = raycaster.intersectObjects( scene.children ); //get all objects in the current position of your mouse;
		if (sceneChilds.length > 1) {
			if (sceneChilds && ( sceneChilds[0].object.name == "shapes" || sceneChilds[0].object.name == "stl" )) {
				transformControl.detach( transformControl.object );
				transformControl.attach( sceneChilds[0].object );
			} else if (sceneChilds[0].object.name == "plane") {
				transformControl.detach( transformControl.object );
				transformControl.attach( sceneChilds[0].object );
			}
		}
		intersection.intersects = true;
		intersectsSelect.length = 0;

	} else {
		intersection.intersects = false;

		var sceneChilds = raycaster.intersectObjects( scene.children ); //get all objects in the current position of your mouse;
		if (sceneChilds.length > 0) {
			if (sceneChilds && ( sceneChilds[0].object.name == "shapes" || sceneChilds[0].object.name == "stl" )) {
				transformControl.detach( transformControl.object );
				transformControl.attach( sceneChilds[0].object );
			} else if (sceneChilds[0].object.name == "plane") {
				transformControl.detach( transformControl.object );
				transformControl.attach( sceneChilds[0].object );
			}
		}
	}
	render();
}

var selectedObjects = [];

function addSelectedObject( object ) {

	selectedObjects = [];
	selectedObjects.push( object );

}

function cleanSelectedObject( obj ) {
	if (obj) {
		addSelectedObject( obj );
		outlinePass.selectedObjects = selectedObjects;
	}
}

// 导出相关
function exportMoudle( type ) { //type 0: ASCII 1: GLTF
	if (objects.length > 1) {
		scene.remove( transformControl );
		scene.remove( mouseHelper );
		clearCache( gridHelper );
		scene.remove( gridHelper );
		clearCache( gradGroundMesh );
		scene.remove( gradGroundMesh );
		clearCache( gradGroundMesh1 );
		scene.remove( gradGroundMesh1 );
		clearCache( plane );
		scene.remove( plane );
		outlinePass.selectedObjects = [];
		// scene.rotateOnAxis( new THREE.Vector3( 1, 0, 0 ), -90 * ( Math.PI / 180 ) );

		var nameStr = $( "#save_name" ).val();
		var successFlag;
		if (nameStr) {
			saveFlag = true;
			if (type === 0) {
				exporter = new THREE.STLExporter(); //导出工具  exporter tool
				var result = exporter.parse( scene );
				var date = Date.parse( new Date() );
				// saveString( result, nameStr + '.stl' );
				successFlag = js.saveStl( result, nameStr + '.stl' );
				// successFlag = true;
			} else {
				var input = scene;
				var gltfExporter = new THREE.GLTFExporter();
				var options = {
					trs: false,
					onlyVisible: true,
					truncateDrawRange: true,
					binary: false,
					forcePowerOfTwoTextures: false,
					maxTextureSize: 4096
				};
				gltfExporter.parse( input, function ( result ) {
					var output = JSON.stringify( result, null, 2 );
					console.log( output );
					var date = Date.parse( new Date() );
					saveString( output, nameStr + '.gltf' );
				}, options );
			}
		}

		if (successFlag) {
			saveModuleShow( 1 );
			// 保存成功，清空当前项目
			objects.forEach( function ( d ) {
				clearCache( d );
				scene.remove( d );
			} );
			objects = [];
			objects.push( plane );
			transformControl.detach();
			$( ".save_stl" ).addClass( "noActive_save" );
			// 保存成功，清空当前项目 end
		} else {
			$( ".save_name_verify" ).text( "保存失败，请重试" ).show();
			setTimeout( function () {
				$( ".save_name_verify" ).text( "请输入模型名称" ).hide();
			}, 1500 );
		}
		if (! mobile) {
			scene.add( mouseHelper );
		}
		scene.add( transformControl );
		scene.add( gridHelper );
		scene.add( gradGroundMesh );
		scene.add( gradGroundMesh1 );
		scene.add( plane );
		camera.position.set( 170, 145, 255 ); //45°
		camera.lookAt( 0, 0, 0 );
	}
}

function save( blob, filename ) {
	var link = document.createElement( 'a' );
	link.style.display = 'none';
	link.className = 'saveFile';
	document.body.appendChild( link );
	link.href = URL.createObjectURL( blob );
	link.download = filename;
	link.click();
	$( ".saveFile" ).remove();

	// document.location = "js://webview?url=" + URL.createObjectURL( blob )+"&fileName="+filename;
	//$( ".save_name_module,.save_name_module_bg" ).hide();
}

function saveString( text, filename ) {
	// console.log( new Blob( [ text ]))
	save( new Blob( [text], { type: 'text/plain' } ), filename );

}

// 导出相关 end
//camera 方向

function showCameraSides() {
	$( ".sides_wrapper" ).toggle();
}

function cameraSides( type ) {
	// stopPropagationFn();
	switch (type) {
		case 0: //front
			toOrthographicCamera( 0 );
			camera.position.set( 0, 0, 350 );
			break;
		case 1://rear
			toOrthographicCamera( 0 );
			camera.position.set( 0, 0, - 350 );
			break;
		case 2://left
			toOrthographicCamera( 0 );
			camera.position.set( - 350, 0, 0 );
			break;
		case 3://right
			toOrthographicCamera( 0 );
			camera.position.set( 350, 0, 0 );
			break;
		case 4://top
			toOrthographicCamera( 1 );
			camera.position.set( 0, 450, 0 );
			break;
		case 5://bottom
			toOrthographicCamera( 1 );
			camera.position.set( 0, - 450, 0 );
			break;
		case 6://45°角度
			toOrthographicCamera( 1 );
			camera.position.set( 290, 200, 280 );
			break;
		case 7://zoom in
			if (cameraZoom) {
				cameraZoom = cameraZoom + 0.1;
				camera.zoom = cameraZoom;
				var zoomHtml = ( cameraZoom * 100 ).toFixed( 0 ) + "%";
				$( ".zoom_index" ).text( zoomHtml );
			}
			break;
		case 8://zoom out
			cameraZoom = cameraZoom - 0.1;
			camera.zoom = cameraZoom;
			var zoomHtml = ( cameraZoom * 100 ).toFixed( 0 ) + "%";
			$( ".zoom_index" ).text( zoomHtml );
			break;
		default://reset
			camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
			camera.position.set( 0, 200, 350 );
	}
	camera.lookAt( scene.position );
	camera.updateProjectionMatrix();
	if (type != 7 && type != 8) {
		resetZoom();
	}
	// controls.update();
	// controls.dispose();
}

function toOrthographicCamera( type ) {
	var aspect = window.innerWidth / window.innerHeight;
	if (type == 0) {
		var frustumSize = 200;
	} else {
		var frustumSize = 350;
	}
	camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000 );
}

//camera 方向
function resetZoom() {
	$( ".zoom_index" ).text( "100%" );
	camera.zoom = 1;
	camera.lookAt( scene.position );
	camera.updateProjectionMatrix();
}

async function loadSTL( thisSTL, obj ) {
	stlGeoFlag = 1;//0 geo; 1 stl
	showInput( 1 );
	$( ".active_shape" ).removeClass( "active_shape" );
	$( obj ).addClass( "active_shape" );
	currentModule = 0; //编辑模式，各种基础模型
	enabledLego( 1 );
	$( "#loading_data" ).show();
	shootedFlag = false;
	/*if(controls){
		controls.dispose();
	}*/
	var file;
	switch (thisSTL) {
		case 0:
			file = '../models/stl/ascii/3dPrinting/standing.stl';
			currentShapeType = 5;
			break;
		case 1:
			file = '../models/stl/ascii/3dPrinting/climbing.stl';
			currentShapeType = 6;
			break;
		case 2:
			file = '../models/stl/ascii/3dPrinting/lying.stl';
			currentShapeType = 7;
			break;
		case 3:
			file = '../models/stl/ascii/3dPrinting/sitting.stl';
			currentShapeType = 8;
			break;
		case 4:
			file = '../models/stl/ascii/3dPrinting/tyrannosaurusRex.stl';
			currentShapeType = 9;
			break;
		case 5:
			file = '../models/stl/ascii/3dPrinting/pokemon/bulbasaur_starter_1gen_flowalistik.stl';
			currentShapeType = 10;
			break;
		case 6:
			file = '../models/stl/ascii/3dPrinting/pokemon/charmander_starter_1gen_flowalistik.stl';
			currentShapeType = 11;
			break;
		case 7:
			file = '../models/stl/ascii/3dPrinting/pokemon/chikorita_starter_2gen_flowalistik.stl';
			currentShapeType = 12;
			break;
		case 8:
			file = '../models/stl/ascii/3dPrinting/pokemon/pikachu_1gen_flowalistik.stl';
			currentShapeType = 13;
			break;
		case 9:
			file = '../models/stl/ascii/3dPrinting/pokemon/squirtle_starter_1gen_flowalistik.stl';
			currentShapeType = 18;
			break;
		case 10:
			file = '../models/stl/ascii/3dPrinting/pokemon/totodile_starter_2gen_flowalistik.stl';
			currentShapeType = 19;
			break;
		case 11:
			file = '../models/stl/ascii/3dPrinting/five-point-star.stl';
			currentShapeType = 20;
			break;
		default:
			file = '../models/stl/ascii/3dPrinting/tyrannosaurusRex.stl';
	}
	var loader = new THREE.STLLoader();
	/*await Promise.all( [
		loader.loadAsync( file, function ( geometry ) {
			currentObj = geometry;
			$( "#loading_data" ).hide();
		} )
	] );*/
	await loader.load( file, function ( geometry ) {
		currentObj = geometry;
		$( "#loading_data" ).hide();
	} );
}

//Lego
function askDialog( type, index ) {
	if (currentModule == 0) {
		var text = '';
		if (type == 0) {
			text = '<p class="removeFont">You will lost your design if you open the Lego</p>';
		} else if (type == 1) {
			text = '<p class="removeFont">You will lost your design if you open the pose</p>';
		}
		$.dialog( {
			type: 'confirm',
			showTitle: false,
			overlayClose: true,
			dialogClass: 'removeSingleBox',
			showClose: true,
			contentHtml: text,
			buttonText: {
				ok: 'Confirm',
				cancel: 'Cancel'
			},
			buttonClass: {
				ok: 'removeBtn_ok',
				cancel: 'removeBtn_cancel'
			},
			onClickOk: function () {
				resetZoom();
				if (type == 0) {
					currentModule = 1; //lego模式
					loadLDraw( index );
				} else if (type == 1) {
					currentModule = 2; //pose模式
					loadVpd( index );
				} else {
					currentModule = 0;
				}

			},
			onClickCancel: function () {

			}
		} );
	} else {
		loadLDraw( index );
	}
}

function loadLDraw( thisLDraw ) {
	$( "#loading_data" ).show();
	enabledLego( 0 );
	var currentLDraw;
	switch (thisLDraw) {
		case 0:
			currentLDraw = listLDraw[0].url;
			break;
		case 1:
			currentLDraw = listLDraw[1].url;
			break;
		case 2:
			currentLDraw = listLDraw[2].url;
			break;
		case 3:
			currentLDraw = listLDraw[3].url;
			break;
		case 4:
			currentLDraw = listLDraw[4].url;
			break;
		case 5:
			currentLDraw = listLDraw[5].url;
			break;
		case 6:
			currentLDraw = listLDraw[6].url;
			break;
	}
	if (lDrawModul) {
		scene.remove( lDrawModul );
	}

	lDrawModul = null;

	var lDrawLoader = new THREE.LDrawLoader();
	lDrawLoader.separateObjects = lDrawGuiData.separateObjects;
	lDrawLoader.smoothNormals = lDrawGuiData.smoothNormals;
	lDrawLoader
		.load( currentLDraw, function ( group2 ) {

			if (lDrawModul) {

				scene.remove( lDrawModul );

			}

			lDrawModul = group2;

			// Convert from LDraw coordinates: rotate 180 degrees around OX
			lDrawModul.rotation.x = Math.PI;

			scene.add( lDrawModul );

			// Adjust materials

			var lDrawMaterials = lDrawLoader.materials;

			lDrawGuiData.constructionStep = lDrawModul.userData.numConstructionSteps - 1;

			updateObjectsVisibility();

			// Adjust camera and light

			var bbox = new THREE.Box3().setFromObject( lDrawModul );
			var size = bbox.getSize( new THREE.Vector3() );
			var radius = Math.max( size.x, Math.max( size.y, size.z ) ) * 0.5;

			if (false) {
				controls.target0.copy( bbox.getCenter( new THREE.Vector3() ) );
				controls.position0.set( - 2.3, 2, 2 ).multiplyScalar( radius ).add( controls.target0 );
				controls.reset();
			}
			createGUI();
			$( "#loading_data" ).hide();
		} );

}

function updateObjectsVisibility() {

	lDrawModul.traverse( c => {
		if (c.isLineSegments) {
		} else if (c.isGroup) {
			// Hide objects with construction step > gui setting
			c.visible = c.userData.constructionStep <= lDrawGuiData.constructionStep;
		}
	} );
}

function createGUI() {
	if (lDrawModulGUI) {
		lDrawModulGUI.destroy();
		$( ".lego_constrution" ).hide();
	}
	lDrawModulGUI = new dat.GUI();
	if (lDrawGuiData.separateObjects) {
		if (lDrawModul.userData.numConstructionSteps > 1) {
			lDrawModulGUI.add( lDrawGuiData, 'constructionStep', 0, lDrawModul.userData.numConstructionSteps - 1 ).step( 1 ).name( '建模步骤' ).onChange( updateObjectsVisibility );//Construction step
		} else {
			lDrawModulGUI.add( lDrawGuiData, 'noConstructionSteps' ).name( '建模步骤' ).onChange( updateObjectsVisibility );
		}
	}

	$( ".dg.ac" ).addClass( "lego_constrution" );
	$( ".dg.ac.lego_constrution" ).find( "ul li" );
	$( ".dg.ac" ).show();

}

function enabledLego( type ) { //type 0:enable 1:disable
	if (type == 0) {
		removeAllShapes(); //删除所有目标
		// $(".side_control").hide(); //
		shapesController( 0 );//不显示所有控制
		// scene.background = new THREE.Color( 0xdeebed );
		clearCache( gridHelper );
		scene.remove( gridHelper );
	} else {
		scene.remove( lDrawModul );
		if (lDrawModulGUI) {
			lDrawModulGUI.destroy();
			lDrawModulGUI = '';
			$( ".lego_constrution" ).hide();
		}
		// scene.background = new THREE.Color( 0x000000 );
		// $(".side_control").show();
		scene.add( gridHelper );
	}
}

//Lego end

function changeControls( type, obj ) {
	$( ".zoom_options,.color_wrapper" ).hide();//隐藏子窗口
	if (transformControlModeType == 0 && type == 0) {
		$( obj ).toggleClass( "active_control" );
	} else if (transformControlModeType == 1 && type == 1) {
		$( obj ).toggleClass( "active_control" );
	} else if (transformControlModeType == 2 && type == 2) {
		$( obj ).toggleClass( "active_control" );
	} else if (transformControlModeType == 3 && type == 3) {
		$( obj ).toggleClass( "active_control" );
	} else {
		$( ".active_control" ).removeClass( "active_control" );
		$( obj ).addClass( "active_control" );
	}
	if (! $( obj ).hasClass( "active_control" )) {
		transformControl.detach( transformControl.object ); //隐藏控制控件
		outlinePass.selectedObjects = [];
	} else {
		transformControl.attach( transformControl.object ); //隐藏控制控件
	}
	switch (type) {
		case 0:
			transformControl.setMode( "scale" );
			$( ".control_type" ).html( textSC );
			transformControlModeType = 0;
			break;
		case 1:
			transformControl.setMode( "translate" );
			$( ".control_type" ).html( textTR );
			transformControlModeType = 1;
			break;
		case 2:
			transformControl.setMode( "rotate" );
			$( ".control_type" ).html( textRO );
			transformControlModeType = 2;
			break;
		default:
			transformControl.setMode( "translate" );
			$( ".control_type" ).html( textTR );
			transformControlModeType = 0;
	}
	transformControl.object ? $( ".color_control_wrapper" ).show() : $( ".color_control_wrapper" ).hide();

}

function deletedSelected() {
	$( ".zoom_options,.color_wrapper" ).hide();//隐藏子窗口
	if (focusedTransformObj && transformControl.object) {
		createObjForOperation( transformControl.object, 'delete' );
		eachObjSetps( transformControl.object, 0 );
		scene.remove( transformControl.object );
		objects.splice( objects.indexOf( transformControl.object ), 1 );
	}
	transformControl.detach();
	// $(".active_control").removeClass("active_control");
	shapesController( 0 );
	render();
	if (objects.length > 1) {
		$( ".save_stl" ).removeClass( "noActive_save" );
	} else {
		$( ".save_stl" ).removeClass( "noActive_save" ).addClass( "noActive_save" );
	}

}

function shapesController( type ) {//type 0: normal
	if (! $( ".show_more" ).hasClass( "show_more_close" )) {
		$( ".obj_control" ).css( { width: window.innerWidth - 100 } );
	}
	$( ".obj_control_wrapper" ).show();

}

function allOperationAdd() {
	if (focusedTransformObj) {
		var type = transformControl.getMode();
		createObjForOperation( transformControl.object, 'transform' );
		eachObjSetps( transformControl.object, 0 );
	}
	if (allOperation.length > 0) {
		$( ".undo_control" ).removeClass( "noActive_control" );
	} else {
		$( ".undo_control" ).addClass( "noActive_control" );
	}
}

function stopPropagationFn() {
	var e = event || window.event || arguments.callee.caller.arguments[0];
	if (e && e.stopPropagation) {
		e.stopPropagation();
	} else { //ie
		window.event.cancelBubble = true;
	}

}

function showCurrentColor() {
	$( ".outside_color" ).removeClass( "white_color_circle" );
	if (transformControl.object) {
		var thisColor = transformControl.object.material.color.toJSON();
		if (thisColor == "14540253") {
			$( ".outside_color" ).addClass( "white_color_circle" );
		} else {
			$( ".outside_color" ).removeClass( "white_color_circle" );
		}
		cleanSelectedObject( transformControl.object );
		switch (transformControlModeType) {
			case 0:
				$( ".control_type" ).html( textSC );
				break;
			case 1:
				$( ".control_type" ).html( textTR );
				break;
			case 2:
				$( ".control_type" ).html( textRO );
				break;
		}
		$( ".control_type" ).show();
	} else {
		$( ".control_type" ).hide();
	}
}

function getDistance( p1, p2 ) {
	var x = p2.pageX - p1.pageX,
		y = p2.pageY - p1.pageY;
	return Math.sqrt( ( x * x ) + ( y * y ) );
};

function checkScalePosition( obj ) {
	tcScale = obj.scale.clone();
	tcScaleYPosition = obj.position.clone().y;
	tcScaleY = obj.scale.clone().y;
	if (obj.name == "shapes") {
		if (tcScaleYPosition == ( ( SHAPE_SIZE * obj.scale.y ) / 2 )) {
			tcScaleYPositionFlag = true;
		} else {
			tcScaleYPositionFlag = false;
		}
	} else if (obj.name == "stl") {
		if (tcScaleYPosition == ( obj.geometry.boundingSphere.radius )) {
			tcScaleYPositionFlag = true;
		} else {
			tcScaleYPositionFlag = false;
		}
	}
}

function onAnimationStep() { //检测scale，使其永远在0.1- LIMIT_SIZE 之间
	if (transformControl.object) {
		var saveDefauleSHAPE_SIZE = SHAPE_SIZE;
		var saveDefauleLIMIT_SIZE = LIMIT_SIZE;
		var saveDefauleLIMIT_SIZEMin = 0.1;
		var getMode = transformControl.getMode();
		var currentObj = transformControl.object;
		/*if(currentObj.name == "shapes"){

		}else if(currentObj.name == "stl"){
			if(currentObj.geometry.boundingSphere) {
				SHAPE_SIZE = ( currentObj.geometry.boundingSphere.radius ) * 2
			}
		}*/
		switch (getMode) {
			case "scale":
				if (currentObj.name == "stl") {
					LIMIT_SIZE = 2.22;
					// saveDefauleLIMIT_SIZEMin = 0.056
				}
				currentObj.scale.clampScalar( saveDefauleLIMIT_SIZEMin, LIMIT_SIZE );
				checkAxis( "scale", currentObj );
				break;
			case "translate":
				// console.log( transformControl.axis, currentObj.position );
				if (transformControl.axis == "X") {
					if (currentObj.position.x >= 0 && currentObj.position.x + ( ( SHAPE_SIZE * currentObj.scale.x ) / 2 ) >= ( WORK_SPACE_SIZE / 2 )) {
						currentObj.position.x = ( WORK_SPACE_SIZE / 2 ) - ( ( SHAPE_SIZE * currentObj.scale.x ) / 2 );
					} else if (currentObj.position.x < 0 && currentObj.position.x - ( ( SHAPE_SIZE * currentObj.scale.x ) / 2 ) <= - ( WORK_SPACE_SIZE / 2 )) {
						currentObj.position.x = - ( WORK_SPACE_SIZE / 2 ) + ( ( SHAPE_SIZE * currentObj.scale.x ) / 2 );
					}
				} else if (transformControl.axis == "Z") {
					if (currentObj.position.z >= 0 && currentObj.position.z + ( ( SHAPE_SIZE * currentObj.scale.z ) / 2 ) >= ( WORK_SPACE_SIZE / 2 )) {
						currentObj.position.z = ( WORK_SPACE_SIZE / 2 ) - ( ( SHAPE_SIZE * currentObj.scale.z ) / 2 );
					} else if (currentObj.position.z < 0 && currentObj.position.z - ( ( SHAPE_SIZE * currentObj.scale.z ) / 2 ) <= - ( WORK_SPACE_SIZE / 2 )) {
						currentObj.position.z = - ( WORK_SPACE_SIZE / 2 ) + ( ( SHAPE_SIZE * currentObj.scale.z ) / 2 );
					}
				} else if (transformControl.axis == "Y") {
					if (currentObj.position.y >= 0 && ( currentObj.position.y + ( ( SHAPE_SIZE * currentObj.scale.y ) / 2 ) ) >= ( WORK_SPACE_SIZE )) { //向上移
						currentObj.position.y = ( WORK_SPACE_SIZE ) - ( ( SHAPE_SIZE * currentObj.scale.y ) / 2 );
					} else if (currentObj.name == "stl") {
						if (currentObj.position.y < ( currentObj.geometry.boundingSphere.radius * currentObj.scale.y )) {
							console.log( currentObj.position.y, currentObj.geometry.boundingSphere.radius * currentObj.scale.y );
							currentObj.position.y = ( SHAPE_SIZE * currentObj.scale.y );
						}
					} else if (currentObj.position.y < ( SHAPE_SIZE * currentObj.scale.y ) / 2) {
						currentObj.position.y = ( SHAPE_SIZE * currentObj.scale.y ) / 2;
					}
				}
				break;
			case "rotate":
				break;
		}
		SHAPE_SIZE = saveDefauleSHAPE_SIZE;
		LIMIT_SIZE = saveDefauleLIMIT_SIZE;
	}
}

function checkAxis( type, obj ) { // 改变大小的时候，价差坐标，不能超出工作台
	if (type === "scale") {
		if (obj.position.x >= 0 && obj.position.x + ( ( SHAPE_SIZE * obj.scale.x ) / 2 ) >= ( WORK_SPACE_SIZE / 2 )) {
			obj.position.x = ( WORK_SPACE_SIZE / 2 ) - ( ( SHAPE_SIZE * obj.scale.x ) / 2 );
		} else if (obj.position.x < 0 && obj.position.x - ( ( SHAPE_SIZE * obj.scale.x ) / 2 ) <= - ( WORK_SPACE_SIZE / 2 )) {
			obj.position.x = - ( WORK_SPACE_SIZE / 2 ) + ( ( SHAPE_SIZE * obj.scale.x ) / 2 );
		}
		if (obj.position.z >= 0 && obj.position.z + ( ( SHAPE_SIZE * obj.scale.z ) / 2 ) >= ( WORK_SPACE_SIZE / 2 )) {
			obj.position.z = ( WORK_SPACE_SIZE / 2 ) - ( ( SHAPE_SIZE * obj.scale.z ) / 2 );
		} else if (obj.position.z < 0 && obj.position.z - ( ( SHAPE_SIZE * obj.scale.z ) / 2 ) <= - ( WORK_SPACE_SIZE / 2 )) {
			obj.position.z = - ( WORK_SPACE_SIZE / 2 ) + ( ( SHAPE_SIZE * obj.scale.z ) / 2 );
		}
		if (obj.position.y >= 0 && obj.position.y <= ( ( SHAPE_SIZE * obj.scale.y ) / 2 )) {
			obj.position.y = ( SHAPE_SIZE * obj.scale.y ) / 2;
		} else if (obj.position.y >= 0 && tcScaleYPositionFlag) {
			console.log( "if y 2" );
			if (obj.name == "stl") {
				// console.log("stl",tcScaleYPosition,((obj.geometry.boundingSphere.radius* obj.scale.y )/2));
				if (obj.geometry.boundingSphere) {
					if (tcScaleYPosition == ( ( obj.geometry.boundingSphere.radius * obj.scale.y ) / 2 )) {
						obj.position.y = obj.geometry.boundingSphere.radius * obj.scale.y;
					} else {
						obj.position.y = ( SHAPE_SIZE * obj.scale.y ) / 2;
					}
				}
			} else {
				obj.position.y = ( SHAPE_SIZE * obj.scale.y ) / 2;
			}
		} else if (obj.position.y < 0) {
			obj.position.y = ( SHAPE_SIZE * obj.scale.y ) / 2;
		}
	} else if (type === "rotate") {

	}
}

//main end


// Text object

var textInput;
var loader = new THREE.FontLoader();
var group, materials;
var wordColor = 0xdddddd;
var wordFont = undefined;

function showInput( type, obj ) {
	if (type === 0) {
		currentObj = undefined;
		$( ".text_window" ).show();
		$( ".active_shape" ).removeClass( "active_shape" );
		// $( obj ).addClass( "active_shape" );
	} else {
		$( ".text_window" ).hide();
		$( ".text_ok" ).addClass( "btn_disable" );
		$( ".text_ok" ).attr( 'onclick', "" );
		$( "#textContent" ).val( "" );
		textInput = '';
	}
}

function textInputFn( obj, val ) {
	textInput = $( obj ).val();
	var textLength = $( obj ).val().length;
	if (textLength > 0) {
		$( ".text_ok" ).removeClass( "btn_disable" );
		$( ".text_ok" ).attr( 'onclick', "insertWord('" + textInput + "')" );
	} else {
		$( ".text_ok" ).addClass( "btn_disable" );
		$( ".text_ok" ).attr( 'onclick', "" );
	}
}

function changeTextColor( type, obj ) {
	stopPropagationFn();
	$( ".active_color" ).removeClass( "active_color" );
	$( ".sprintY" ).removeClass( "sprintY" );
	if (type == 0) {
		$( obj ).addClass( 'active_color' );
		$( obj ).parents( ".module" ).find( ".sprint" ).removeClass( 'sprintY' );
		wordColor = 0xdddddd;
	} else if (type == 1) {
		$( obj ).addClass( 'active_color' );
		$( obj ).parents( ".module" ).find( ".sprint" ).addClass( 'sprintY' );
		wordColor = 0xf2f545;
	}
}

function insertWord( word ) {
	$( "#loading_data" ).show();
	showInput( 1 );
	loader.load( '../css/font/other/SimHei_Regular.json', function ( font ) {
		wordFont = font;
		createText( word );
		$( "#loading_data" ).hide();
	} );
}

function createText( word ) {
	var xMid, text;
	var message = word;
	var fontSize;
	switch (message.length) {
		case 3:
			fontSize = 60;
			break;
		case 4:
			fontSize = 55;
			break;
		case 5:
			fontSize = 50;
			break;
		case 6:
			fontSize = 45;
			break;
		case 7:
			fontSize = 40;
			break;
		case 8:
			fontSize = 40;
			break;
		case 9:
			fontSize = 40;
			break;
		case 10:
			fontSize = 40;
			break;
		default:
			fontSize = 70;
	}
	var textGeo = new THREE.TextGeometry( message, {
		font: wordFont,
		size: fontSize,
		height: 10, //文字厚度
		curveSegments: 22,
		bevelEnabled: false,
	} );
	textGeo.computeBoundingBox();
	textGeo.computeVertexNormals();
	var geometry = new THREE.BufferGeometry().fromGeometry( textGeo );
	geometry.computeBoundingBox();

	xMid = - 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x ); //位置，使其居中
	geometry.translate( xMid, 0, 0 );
	geometry.rotateX( - ( Math.PI / 2 ) ); //文字为横卧在工作台上
	// make shape ( N.B. edge view not visible )
	var matLite = new THREE.MeshPhongMaterial( { color: wordColor, flatShading: true } );
	text = new THREE.Mesh( geometry, matLite );
	text.name = 'shapes';
	text.receiveShadow = true;
	text.castShadow = true;
	scene.add( text );
	objects.push( text );
	shapesObj.push( text ); //全删除使用
	currentAllObjs.push( text ); //
	$( ".undo_control" ).removeClass( "noActive_control" );//
	$( ".save_stl" ).removeClass( "noActive_save" );//
	transformControl.object = text;
	focusedTransformObj = transformControl.object;
	cleanSelectedObject( text );
	createObjForOperation( text, "add" );
	eachObjSetps( text, 0 );
	shapesController();
	transformControl.attach( focusedTransformObj );
	resetSomeThing();
}

// Text object end

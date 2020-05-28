import { MMDLoader } from '../jsm/loaders/MMDLoader.js';
import { MMDAnimationHelper } from '../jsm/animation/MMDAnimationHelper.js';

$( ".pose" ).show();
var modelFile = '../models/miku/miku_v2.pmd';
var vpdFiles;
var mmdHelper = new MMDAnimationHelper();
var MLoader = new MMDLoader();
var MMDmesh;
var vpds = [];
var currentPost = 0;//当前post
var listPost = [];
var mikuObj = document.getElementById( "miku" );
mikuObj.addEventListener( 'click', loadPost, false );

function listPoseModule( type ) {
	$.ajax( {
		type: "GET",
		url: "../static/moduleList.json",
		dataType: "JSON",
		cache: false,
		async: false,
		beforeSend: function () {
		},
		success: function ( res ) {
			listPost = res.data.pose;
			vpdFiles = listPost;
			var poseHtml = '<div class="child_title" onclick="hideModule(this)"><i class="iconfont arrow">&#xe6a5;</i>Pose</div>';
			var index = 0;
			/*for(var j in listPost){
				if(j!="8" && j!="9") { //9.10不显示
					/!*poseHtml += '<div class="module shapes doughnut" onclick="askPoseDialog(1,' + index + ')">';
					poseHtml += '<img src="../img/3dPrinting/doughnut.png" alt="Doughnut">';
					poseHtml += '<div class="name">' + listPost[j].name + '</div>';
					poseHtml += '</div>';*!/
					var vpd_wrapper = document.getElementById("vpd_wrapper");
					var eachPose = document.createElement( 'div' );
					eachPose.className = 'module pose '+listPost[j].name;
					var eachPoseImg = document.createElement( 'img' );
					eachPoseImg.setAttribute('src','../img/3dPrinting/doughnut.png');
					eachPose.appendChild(eachPoseImg);
					var eachPoseName = document.createElement( 'div' );
					eachPoseName.className = 'name';
					eachPoseName.textContent=listPost[j].name;
					eachPose.appendChild(eachPoseName);
					vpd_wrapper.appendChild( eachPose );
					eachPose.addEventListener( 'click', loadVpd(index), false );
				}
				index ++
			}*/
			$( ".shapes_options.pose" ).click( function ( e ) {
				$( ".vpd_wrapper" ).show();
			} );
		},
		error: function ( res ) {
			console.log( res );
		}
	} );

}

function askPoseDialog( type, index ) {
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

var vpdIndex = 0;

function loadPost( poseIndex ) {
	$( "#loading_data" ).show();
	enabledLego( 0, 1 );
	MLoader.load( modelFile, function ( object ) {
		MMDmesh = object;
		MMDmesh.position.y = - 150;
		MMDmesh.scale.set( 12, 12, 12 );
		MMDmesh.name = 'miku';
		scene.add( MMDmesh );
		initMMDGui();
		$( "#loading_data" ).hide();
	}, onProgress, null );
}

function loadVpd( poseIndex ) {
	var currentVpd;
	switch (poseIndex) {
		case 0:
			currentVpd = listPost[0].url;
			break;
		case 1:
			currentVpd = listPost[1].url;
			break;
		case 2:
			currentVpd = listPost[2].url;
			break;
		case 3:
			currentVpd = listPost[3].url;
			break;
		case 4:
			currentVpd = listPost[4].url;
			break;
		case 5:
			currentVpd = listPost[5].url;
			break;
		case 6:
			currentVpd = listPost[6].url;
			break;
		case 7:
			currentVpd = listPost[6].url;
			break;
		case 8:
			currentVpd = listPost[6].url;
			break;
		case 9:
			currentVpd = listPost[6].url;
			break;
		case 10:
			currentVpd = listPost[6].url;
			break;
		case 11:
			currentVpd = listPost[6].url;
			break;
		default:
			currentVpd = listPost[1].url;
	}
	var vpdFile = currentVpd;

	MLoader.loadVPD( vpdFile, false, function ( vpd ) {

		vpds.push( vpd );

		vpdIndex ++;

		if (vpdIndex < vpdFiles.length) {

			loadVpd();

		} else {

			initMMDGui();

		}

	}, onProgress, null );

}

var MMDGui;

function initMMDGui() {
	if (MMDGui) {
		MMDGui.destroy();
	}
	MMDGui = new dat.GUI();
	var dictionary = MMDmesh.morphTargetDictionary;

	var guiControls = {};
	var keys = [];

	// var poses = MMDGui.addFolder( 'Poses' );
	var morphs = MMDGui.addFolder( 'Morphs' );

	function getBaseName( s ) {
		var url = s.url;
		return url.slice( url.lastIndexOf( '/' ) + 1 );
	}

	function initControls() {
		for (var key in dictionary) {
			guiControls[key] = 0.0;
		}
		guiControls.pose = - 1;
		for (var i = 0; i < vpdFiles.length; i ++) {
			guiControls[getBaseName( vpdFiles[i] )] = false;
		}
	}

	function initKeys() {

		for (var key in dictionary) {

			keys.push( key );

		}

	}

	function initPoses() {

		var files = { default: - 1 };

		for (var i = 0; i < vpdFiles.length; i ++) {

			files[getBaseName( vpdFiles[i] )] = i;

		}

		poses.add( guiControls, 'pose', files ).onChange( onChangePose );

	}

	function initMorphs() {

		for (var key in dictionary) {

			morphs.add( guiControls, key, 0.0, 1.0, 0.01 ).onChange( onChangeMorph );

		}

	}

	function onChangeMorph() {

		for (var i = 0; i < keys.length; i ++) {

			var key = keys[i];
			var value = guiControls[key];
			MMDmesh.morphTargetInfluences[i] = value;

		}

	}

	function onChangePose() {

		var index = parseInt( guiControls.pose );

		if (index === - 1) {

			MMDmesh.pose();

		} else {

			mmdHelper.pose( MMDmesh, vpds[index] );

		}

	}

	initControls();
	initKeys();
	// initPoses();
	initMorphs();

	onChangeMorph();
	onChangePose();

	// poses.open();
	morphs.open();

}

function onProgress( xhr ) {

	if (xhr.lengthComputable) {

		var percentComplete = xhr.loaded / xhr.total * 100;
		console.log( Math.round( percentComplete, 2 ) + '% downloaded' );

	}

}

listPoseModule();
export { MMDmesh, MMDGui } ;

// IMPORTS
import * as THREE from "../threejs/three.module.js";
import * as ORBIT_CONTROLS from '../threejs/OrbitControls.js';
import * as MESSAGE from '../common/message.js';
import * as BASE from "../common/base.js";
import * as SCENE_CONFIGURATION from "../common/scene-configuration.js";
import * as CONSTANTS from "../common/constants.js";
import * as THREE_ACTIONS from "../common/three-actions.js";
import * as MISC from "../common/misc.js";

// VARIABLES AND CONSTANTS

var scene, renderer, camera, diffuseSphere, glossySphere, metallicSphere, controls;

function preprocessSceneConfiguration(sceneConfiguration){

	// More URLs than names
	if(sceneConfiguration.environment_url.length > sceneConfiguration.environment_name.length && sceneConfiguration.environment_url.length > 1){
		MESSAGE.newWarning("Not all environments have a name.");
		sceneConfiguration.environment_name = MISC.padArray(sceneConfiguration.environment_name,sceneConfiguration.environment_url.length,"Unnamed HDRI");
	}

	// More names than URLs
	else if(sceneConfiguration.environment_url.length < sceneConfiguration.environment_name.length){
		MESSAGE.newWarning("More env. names than URLs have been defined.")
		sceneConfiguration.environment_name = sceneConfiguration.environment_name.slice(0,sceneConfiguration.environment_url.length);
	}

	return sceneConfiguration;
}

function updateScene(oldSceneConfiguration,newSceneConfiguration){

	console.debug("Update scene",oldSceneConfiguration,newSceneConfiguration);

	// Exposure
	renderer.toneMappingExposure = Math.pow(2,newSceneConfiguration["environment_exposure"]);
	renderer.toneMapping = CONSTANTS.toneMapping[newSceneConfiguration["environment_tonemapping"]];

	// Set Environment
	if(newSceneConfiguration.environment_url.length > 0){
		if( !SCENE_CONFIGURATION.equalAtKey(oldSceneConfiguration,newSceneConfiguration,"environment_index") || 
			!SCENE_CONFIGURATION.equalAtKey(oldSceneConfiguration,newSceneConfiguration,"environment_url")){
			var envFileUrl = newSceneConfiguration.environment_url[newSceneConfiguration.environment_index];
			THREE_ACTIONS.updateSceneEnvironment(envFileUrl,scene,renderer);
		}
	}
	
}

function initializeScene(){

	SCENE_CONFIGURATION.initializeConfiguration({
	
		"environment_tonemapping" : "linear",
		"environment_exposure" : 0.0,
	
		"environment_url" : [],
		"environment_name": [],
		"environment_index":0
	
	});

	// scene
	scene = new THREE.Scene();

	// camera
	camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 0.1, 1000 );
	camera.position.x = 2;
	camera.position.y = 1;

	// renderer
	renderer = new THREE.WebGLRenderer();
	renderer.outputEncoding = CONSTANTS.encoding.sRGB;

	THREE_ACTIONS.updateSceneEnvironment("./media/tent.exr",scene,renderer);

	// orbit controls
	controls = new ORBIT_CONTROLS.OrbitControls(camera, renderer.domElement);
	controls.enableZoom = true;
	controls.minDistance = controls.maxDistance = 2;
	controls.enablePan = false;
	controls.enableDamping = true;
	controls.listenToKeyEvents(window);

	// Window resizing
	window.addEventListener('resize', (e) => { THREE_ACTIONS.resizeRenderingArea(camera,renderer)}, false);
	window.addEventListener('mousedown', (e) => { THREE_ACTIONS.resizeRenderingArea(camera,renderer)}, false);
	window.addEventListener('touchstart', (e) => { THREE_ACTIONS.resizeRenderingArea(camera,renderer)}, false);

	// Zoom
	var zoomHandler = function(event,camera) {
		camera.fov = Math.min(Math.max(camera.fov + event.deltaY/50, 1), 150);
		camera.updateProjectionMatrix();
	}
	document.addEventListener( 'mousewheel', (e) =>{zoomHandler(e,camera)});

	// Set up renderer
	document.querySelector('#renderer_target').appendChild( renderer.domElement );
	THREE_ACTIONS.resizeRenderingArea(camera,renderer);
}

function animate() {
    requestAnimationFrame( animate );
	controls.update();
    renderer.render( scene, camera );
}

BASE.start(initializeScene,preprocessSceneConfiguration,updateScene,animate);

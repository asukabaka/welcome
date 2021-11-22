import * as THREE from '../build/three.module.js';
import Stats from './jsm/libs/stats.module.js';
import { GUI } from './jsm/libs/dat.gui.module.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import {PointerLockControls} from "./src/PointerLockControls.js";
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
import { EffectComposer } from './jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './jsm/postprocessing/UnrealBloomPass.js';
import { Water } from './jsm/objects/Water.js';
import { Sky } from './jsm/objects/Sky.js';

let container;
let camera, stats;
let composer, renderer, mixer, clock;
let scene;
let controls, water, sun;
let sky;
let raycaster;
let material;
let mesh, mesh1, mesh2, mesh3;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();
const objects = [];
const params = {
  exposure: .6,
  bloomStrength: 0.5,
  bloomThreshold: 0,
  bloomRadius: 1
};

init();
initControls();
initWASD();
initBloom();
initWater();
initSky();
initParticles();
initModels();
animateWater();
animateWASD();
animateParticles();

function init() {
  clock = new THREE.Clock();
	stats = new Stats();
  // Establish the camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.y = 30;
  // Define basic scene parameters
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0xffffff, 0, 750);

  // Define scene lighting
  const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);
  // Define controls
  controls = new PointerLockControls(camera, document.body);

  // Add raycasting for mouse controls
  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    10
  );
  // Define Rendered and html document placement
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ReinhardToneMapping;
  document.body.appendChild(renderer.domElement);

}
function initWASD(){
  // Define key controls for WASD controls
	const onKeyDown = function(event) {
		switch (event.code) {
			case "ArrowUp":
			case "KeyW":
				moveForward = true;
				break;

			case "ArrowLeft":
			case "KeyA":
				moveLeft = true;
				break;

			case "ArrowDown":
			case "KeyS":
				moveBackward = true;
				break;

			case "ArrowRight":
			case "KeyD":
				moveRight = true;
				break;

			case "Space":
				if (canJump === true) velocity.y += 350;
				canJump = false;
				break;
		}
	};

	const onKeyUp = function(event) {
		switch (event.code) {
			case "ArrowUp":
			case "KeyW":
				moveForward = false;
				break;

			case "ArrowLeft":
			case "KeyA":
				moveLeft = false;
				break;

			case "ArrowDown":
			case "KeyS":
				moveBackward = false;
				break;

			case "ArrowRight":
			case "KeyD":
				moveRight = false;
				break;
		}
	};

	document.addEventListener("keydown", onKeyDown);
	document.addEventListener("keyup", onKeyUp);
}
function initControls(){
  // Identify the html divs for the overlays
  const blocker = document.getElementById("blocker");
  const instructions = document.getElementById("instructions");

  // Listen for clicks and respond by removing overlays and starting mouse look controls
  // Listen
  instructions.addEventListener("click", function() {
    controls.lock();
  });
  // Remove overlays and begin controls on click
  controls.addEventListener("lock", function() {
    instructions.style.display = "none";
    blocker.style.display = "none";
  });
  // Restore overlays and stop controls on esc
  controls.addEventListener("unlock", function() {
    blocker.style.display = "block";
    instructions.style.display = "";
  });
  // Add controls to scene
  scene.add(controls.getObject());
}
function initBloom() {
  clock = new THREE.Clock();

  scene.add( new THREE.AmbientLight( 0x404040 ) );

  const pointLight = new THREE.PointLight( 0xffffff, 1 );
  camera.add( pointLight );

  const renderScene = new RenderPass( scene, camera );

  const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
  bloomPass.threshold = params.bloomThreshold;
  bloomPass.strength = params.bloomStrength;
  bloomPass.radius = params.bloomRadius;

  composer = new EffectComposer( renderer );
  composer.addPass( renderScene );
  composer.addPass( bloomPass );

  new GLTFLoader().load( 'models/gltf/PrimaryIonDrive.glb', function ( gltf ) {

    const model = gltf.scene;

    scene.add( model );

    mixer = new THREE.AnimationMixer( model );
    const clip = gltf.animations[ 0 ];
    mixer.clipAction( clip.optimize() ).play();

    animateBloom();

  } );

  const gui = new GUI();

  gui.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {

    renderer.toneMappingExposure = Math.pow( value, 4.0 );

  } );

  gui.add( params, 'bloomThreshold', 0.0, 1.0 ).onChange( function ( value ) {

    bloomPass.threshold = Number( value );

  } );

  gui.add( params, 'bloomStrength', 0.0, 3.0 ).onChange( function ( value ) {

    bloomPass.strength = Number( value );

  } );

  gui.add( params, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {

    bloomPass.radius = Number( value );

  } );

  window.addEventListener( 'resize', onWindowResize );

}
function initWater() {
  container = document.getElementById( 'container' );

				//

				sun = new THREE.Vector3();

				// Water

				const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

				water = new Water(
					waterGeometry,
					{
						textureWidth: 512,
						textureHeight: 512,
						waterNormals: new THREE.TextureLoader().load( './assets/waternormals.jpg', function ( texture ) {

							texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

						} ),
						sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
						waterColor: 0x3d8d96 ,
						distortionScale: 8,
						fog: scene.fog !== undefined
					}
				);

				water.rotation.x = - Math.PI / 2;

				scene.add( water );

				// Skybox

				const sky = new Sky();
				sky.scale.setScalar( 10000 );
				scene.add( sky );

				const skyUniforms = sky.material.uniforms;

				skyUniforms[ 'turbidity' ].value = 10;
				skyUniforms[ 'rayleigh' ].value = 2;
				skyUniforms[ 'mieCoefficient' ].value = 0.005;
				skyUniforms[ 'mieDirectionalG' ].value = 0.8;

				const parameters = {
					elevation: 2,
					azimuth: 180
				};

				const pmremGenerator = new THREE.PMREMGenerator( renderer );

				function updateSun() {

					const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
					const theta = THREE.MathUtils.degToRad( parameters.azimuth );

					sun.setFromSphericalCoords( 1, phi, theta );

					sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
					water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

					scene.environment = pmremGenerator.fromScene( sky ).texture;

				}

				updateSun();

				stats = new Stats();
				container.appendChild( stats.dom );

				// GUI

				const gui = new GUI();

				const folderSky = gui.addFolder( 'Sky' );
				folderSky.add( parameters, 'elevation', 0, 90, 0.1 ).onChange( updateSun );
				folderSky.add( parameters, 'azimuth', - 180, 180, 0.1 ).onChange( updateSun );
				folderSky.open();

				const waterUniforms = water.material.uniforms;

				const folderWater = gui.addFolder( 'Water' );
				folderWater.add( waterUniforms.distortionScale, 'value', 0, 8, 0.1 ).name( 'distortionScale' );
				folderWater.add( waterUniforms.size, 'value', 0.1, 10, 0.1 ).name( 'size' );
				folderWater.open();

				//

				window.addEventListener( 'resize', onWindowResize );
}
function initSky() {

  // Add Sky
				sky = new Sky();
				sky.scale.setScalar( 450000 );
				scene.add( sky );
				sun = new THREE.Vector3();
				const effectController = {
					turbidity: 20,
					rayleigh: 0,
					mieCoefficient: 0.1,
					mieDirectionalG: 1,
					elevation: 2,
					azimuth: 180,
					exposure: .75
				};

				function guiChanged() {

					const uniforms = sky.material.uniforms;
					uniforms[ 'turbidity' ].value = effectController.turbidity;
					uniforms[ 'rayleigh' ].value = effectController.rayleigh;
					uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
					uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

					const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
					const theta = THREE.MathUtils.degToRad( effectController.azimuth );

					sun.setFromSphericalCoords( 1, phi, theta );

					uniforms[ 'sunPosition' ].value.copy( sun );

					renderer.toneMappingExposure = effectController.exposure;
					renderer.render( scene, camera );

				}

				const gui = new GUI();

				gui.add( effectController, 'turbidity', 0.0, 20.0, 0.1 ).onChange( guiChanged );
				gui.add( effectController, 'rayleigh', 0.0, 4, 0.001 ).onChange( guiChanged );
				gui.add( effectController, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( guiChanged );
				gui.add( effectController, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( guiChanged );
				gui.add( effectController, 'elevation', 0, 90, 0.1 ).onChange( guiChanged );
				gui.add( effectController, 'azimuth', - 180, 180, 0.1 ).onChange( guiChanged );
				gui.add( effectController, 'exposure', 0, 1, 0.0001 ).onChange( guiChanged );

				guiChanged();


}
function initParticles() {
	// Particles
									const geometry = new THREE.BufferGeometry();
									const vertices = [];

									const sprite = new THREE.TextureLoader().load( './assets/disc.png' );

									for ( let i = 0; i < 1000000; i ++ ) {

										const x = 20000 * Math.random() - 1000;
										const y = 20000 * Math.random() - 1000;
										const z = 2000 * Math.random() - 1000;

										vertices.push( x, y, z );

									}

									geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

									material = new THREE.PointsMaterial( { size: 1.75, sizeAttenuation: true, map: sprite, alphaTest: 0.25, transparent: true } );
									material.color.setHSL( 0.5, 1, 0.5 );

									const particles = new THREE.Points( geometry, material );
									scene.add( particles );
}
function initModels() {
	//3D file Loader

	const loader = new GLTFLoader().load("./assets/city1.gltf",
		function(gltf) {
			mesh = gltf.scene;
			mesh.position.set(0, 0, 1);
			mesh.scale.set(3, 3, 3);
			scene.add(mesh);
		},
		undefined,
		function(error) {
			console.error(error);
		}
	);

	const loader1 = new GLTFLoader().load("./assets/BrokenBuilding1.gltf",
		function(gltf) {
			mesh1 = gltf.scene;
			mesh1.position.set(10, 0, 10);
			mesh1.scale.set(300, 300, 300);
			// Add model to scene
			scene.add(mesh1);
		},
		undefined,
		function(error) {
			console.error(error);
		}
	);

	const loader2 = new GLTFLoader().load("./assets/BrokenBuilding1.gltf",
		function(gltf) {
			mesh2 = gltf.scene;
			mesh2.position.set(-3000, 0, 1000);
			mesh2.scale.set(300, 300, 300);
			mesh2.rotation.x = Math.PI / -30;
			scene.add(mesh2);
		},
		undefined,
		function(error) {
			console.error(error);
		}
	);

	const loader3 = new GLTFLoader().load("./assets/BrokenBuilding1.gltf",
		function(gltf) {
			mesh3 = gltf.scene;
			mesh3.position.set(-3000, 0, -1000);
			mesh3.scale.set(200, 200, 200);
			mesh3.rotation.x = Math.PI / 40;
			scene.add(mesh3);
		},
		undefined,
		function(error) {
			console.error(error);
		}
	);
}

function onWindowResize() {

  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize( width, height );
  // composer.setSize( width, height );

}

function animateWASD() {
  requestAnimationFrame(animateWASD);

  const time = performance.now();

  // Check for controls being activated (locked) and animate scene according to controls
  if (controls.isLocked === true) {
    raycaster.ray.origin.copy(controls.getObject().position);
    raycaster.ray.origin.y -= 10;

    const intersections = raycaster.intersectObjects(objects, false);

    const onObject = intersections.length > 0;

    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    if (onObject === true) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
    }

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    controls.getObject().position.y += velocity.y * delta; // new behavior

    if (controls.getObject().position.y < 10) {
      velocity.y = 0;
      controls.getObject().position.y = 10;

      canJump = true;
    }
  }

  prevTime = time;

  renderer.render(scene, camera);
}
function animateBloom() {

  requestAnimationFrame( animateBloom );

  const delta = clock.getDelta();

  mixer.update( delta );

  stats.update();

  composer.render();

}
function animateWater() {
        requestAnimationFrame( animateWater );
				renderWater();
				stats.update();
}
function animateParticles() {
  requestAnimationFrame( animateParticles );

  renderParticles();
  stats.update();
}

function renderWater() {
  const time = performance.now() * 0.001;
				water.material.uniforms[ 'time' ].value += 1.0 / 60.0;

				renderer.render( scene, camera );
}
function renderSky() {
  renderer.render( scene, camera );
}
function renderParticles() {

				material.color.setHSL( 0.5, 1, 0.5 );

				renderer.render( scene, camera );

}
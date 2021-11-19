// Art 109 Three.js Demo Site
// client7.js
// A three.js scene which uses planes and texture loading to generate a scene with images which can be traversed with basic WASD and mouse controls, this scene is full screen with an overlay.

// Import required source code
// Import three.js core
import * as THREE from "./build/three.module.js";
import {PointerLockControls} from "./src/PointerLockControls.js";
import {GLTFLoader} from "./src/GLTFLoader.js";
import { Water } from './src/Water.js';
import { EffectComposer } from './postprocessing/EffectComposer.js';
import { RenderPass } from './postprocessing/RenderPass.js';
import { UnrealBloomPass } from './postprocessing/UnrealBloomPass.js';
import { Sky } from './src/Sky.js';
import { GUI } from './src/dat.gui.module.js';
import { OrbitControls } from './src/OrbitControls.js';
// Establish variables
let camera, scene, controls, material;
let composer, renderer, mixer, clock;
let water, sun, sky;
let mesh, mesh1, mesh2, mesh3;
const objects = [];
let raycaster;

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

const params = {
				exposure: 1,
				bloomStrength: 0.5,
				bloomThreshold: 0,
				bloomRadius: 1
        };


// Initialization and animation function calls
init();
animate();
//Initialize Sky
function initSky() {

  // Add Sky
				sky = new Sky();
				sky.scale.setScalar( 450000 );
				scene.add( sky );
				sun = new THREE.Vector3();
        //
        //
        // const skyUniforms = sky.material.uniforms;
        //
        // skyUniforms['turbidity'].value = 20;
        // skyUniforms['rayleigh'].value = 0;
        // skyUniforms['mieCoefficient'].value = 0.1;
        // skyUniforms['mieDirectionalG'].value = 1;
        //
        // const parameters = {
        //   elevation: 2,
        //   azimuth: 180,
        //   exposure: renderer.toneMappingExposure,
        //     };
				/// GUI

				const effectController = {
					turbidity: 20,
					rayleigh: 0,
					mieCoefficient: 0.1,
					mieDirectionalG: 1,
					elevation: 2,
					azimuth: 180,
					exposure: renderer.toneMappingExposure
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
// Initialize the scene
function init() {
	clock = new THREE.Clock();
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

  sun = new THREE.Vector3();
  // Define controls
  controls = new PointerLockControls(camera, document.body);

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

  // Add raycasting for mouse controls
  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    10
  );

  //3D file Loader

  const loader = new GLTFLoader().load("./assets/city1.gltf",
    function(gltf) {
      // Scan loaded model for mesh and apply defined material if mesh is present
      // gltf.scene.traverse(function(child) {  });

      // Set position and scale
      mesh = gltf.scene;
      mesh.position.set(0, 0, 1);
      mesh.scale.set(3, 3, 3);
      // Add model to scene
      scene.add(mesh);
    },
    undefined,
    function(error) {
      console.error(error);
    }
  );

	const loader1 = new GLTFLoader().load("./assets/BrokenBuilding1.gltf",
		function(gltf) {
			// Scan loaded model for mesh and apply defined material if mesh is present
			// gltf.scene.traverse(function(child) {  });

			// Set position and scale
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
			// Scan loaded model for mesh and apply defined material if mesh is present
			// gltf.scene.traverse(function(child) {  });

			// Set position and scale
			mesh2 = gltf.scene;
			mesh2.position.set(-3000, 0, 1000);
			mesh2.scale.set(300, 300, 300);
			mesh2.rotation.x = Math.PI / -30;
			// Add model to scene
			scene.add(mesh2);
		},
		undefined,
		function(error) {
			console.error(error);
		}
	);

	const loader3 = new GLTFLoader().load("./assets/BrokenBuilding1.gltf",
		function(gltf) {
			// Scan loaded model for mesh and apply defined material if mesh is present
			// gltf.scene.traverse(function(child) {  });

			// Set position and scale
			mesh3 = gltf.scene;
			mesh3.position.set(-3000, 0, -1000);
			mesh3.scale.set(200, 200, 200);
			mesh3.rotation.x = Math.PI / 40;
			// Add model to scene
			scene.add(mesh3);
		},
		undefined,
		function(error) {
			console.error(error);
		}
	);

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

                				material = new THREE.PointsMaterial( { size: 2, sizeAttenuation: true, map: sprite, alphaTest: 0.5, transparent: true } );
                				material.color.setHSL( 0.5, 1, 0.5 );

                				const particles = new THREE.Points( geometry, material );
                				scene.add( particles );


  // Define Rendered and html document placement
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ReinhardToneMapping;
  document.body.appendChild(renderer.domElement);
	// Bloom

					const renderScene = new RenderPass( scene, camera );

					const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
					bloomPass.threshold = params.bloomThreshold;
					bloomPass.strength = params.bloomStrength;
					bloomPass.radius = params.bloomRadius;

					composer = new EffectComposer( renderer );
					composer.addPass( renderScene );
					composer.addPass( bloomPass );
					new GLTFLoader().load( './assets/PrimaryIonDrive.glb', function ( gltf ) {

					const model = gltf.scene;

					// scene.add( model );

					mixer = new THREE.AnimationMixer( model );
					const clip = gltf.animations[ 0 ];
					mixer.clipAction( clip.optimize() ).play();

					animate();

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
  initSky();

  // Listen for window resizing
  window.addEventListener("resize", onWindowResize);
}

// Window resizing function
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation function
function animate() {
  requestAnimationFrame(animate);
  render();
  composer.render();
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
	const delta = clock.getDelta();

				mixer.update( delta );

				stats.update();


  renderer.render(scene, camera);
}

function render() {

				const time = performance.now() * 0.001;

				water.material.uniforms[ 'time' ].value += 1.0 / 60.0;

        // const h = ( 360 * ( 1.0 + time ) % 360 ) / 360;
				// material.color.setHSL( h, 0.5, 0.5 );
        material.color.setHSL( 0.5, 1, 0.5 );

				renderer.render( scene, camera );

			}

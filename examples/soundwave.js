
import * as THREE from '../build/three.module.js';

			import Stats from './jsm/libs/stats.module.js';

			const SEPARATION = 100, AMOUNTX = 50, AMOUNTY = 50;

			let container, stats;
			let camera, scene, renderer;
			let material;
			let particles, count = 0;

			let mouseX = 0, mouseY = 0;

			let windowHalfX = window.innerWidth / 2;
			let windowHalfY = window.innerHeight / 2;
			let analyser, uniforms, data;

			init();
			animate();
			initSound();

			function init() {

				container = document.createElement( 'div' );
				document.body.appendChild( container );

				camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
				camera.position.z = 1000;

				scene = new THREE.Scene();

				//

				const numParticles = AMOUNTX * AMOUNTY;

				const positions = new Float32Array( numParticles * 3 );
				const scales = new Float32Array( numParticles );

				let i = 0, j = 0;

				for ( let ix = 0; ix < AMOUNTX; ix ++ ) {

					for ( let iy = 0; iy < AMOUNTY; iy ++ ) {

						positions[ i ] = ix * SEPARATION - ( ( AMOUNTX * SEPARATION ) / 2 ); // x
						positions[ i + 1 ] = 0; // y
						positions[ i + 2 ] = iy * SEPARATION - ( ( AMOUNTY * SEPARATION ) / 2 ); // z

						scales[ j ] = 1;

						i += 3;
						j ++;

					}

				}

				const geometry = new THREE.BufferGeometry();
				geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
				geometry.setAttribute( 'scale', new THREE.BufferAttribute( scales, 1 ) );

				material = new THREE.ShaderMaterial( {

					uniforms: {
						color: { value: new THREE.Color( 0xffffff ) },
					},
					vertexShader: document.getElementById( 'vertexshader' ).textContent,
					fragmentShader: document.getElementById( 'fragmentshader' ).textContent

				} );

				//

				particles = new THREE.Points( geometry, material );
				scene.add( particles );

				//

				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				container.appendChild( renderer.domElement );

				stats = new Stats();
				container.appendChild( stats.dom );

				container.style.touchAction = 'none';
				container.addEventListener( 'pointermove', onPointerMove );

				//

				window.addEventListener( 'resize', onWindowResize );

			}
			function initSound() {
			  const fftSize = 128;

			  const listener = new THREE.AudioListener();

			  const audio = new THREE.Audio( listener );
			  const file = './assets/ambientMusic.mp3';


			    const loader = new THREE.AudioLoader();
			    loader.load( file, function ( buffer ) {
			      audio.setLoop(true);
			      audio.setBuffer( buffer );
			      audio.play();

			    } );
			  analyser = new THREE.AudioAnalyser( audio, fftSize );
			  data = analyser.getAverageFrequency();
			}

			function onWindowResize() {

				windowHalfX = window.innerWidth / 2;
				windowHalfY = window.innerHeight / 2;

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

			}

			//

			function onPointerMove( event ) {

				if ( event.isPrimary === false ) return;

				mouseX = event.clientX - windowHalfX;
				mouseY = event.clientY - windowHalfY;

			}

			//

			function animate() {

				requestAnimationFrame( animate );

				render();
				stats.update();

			}

			function render() {

				camera.position.x += ( mouseX - camera.position.x ) * .05;
				camera.position.y += ( - mouseY - camera.position.y ) * .05;
				camera.lookAt( scene.position );

				const positions = particles.geometry.attributes.position.array;
				const scales = particles.geometry.attributes.scale.array;

				let i = 0, j = 0;

				for ( let ix = 0; ix < AMOUNTX; ix ++ ) {

					for ( let iy = 0; iy < AMOUNTY; iy ++ ) {

						positions[ i + 1 ] = ( Math.sin( ( ix + count ) * 0.3 ) * 10 ) +
										( Math.sin( ( iy + count ) * 0.5 ) * 10 );

						scales[ j ] = ( 0.000001 * ( ( ix + count ) * 0.3 ) + 1 ) * 2 +
										( 0.000001 * ( ( iy + count ) * 0.5 ) + 1 ) * 2;

						i += 3;
						j ++;

					}

				}
				particles.geometry.attributes.position.y = data;
				particles.geometry.attributes.position.needsUpdate = true;
				particles.geometry.attributes.scale.needsUpdate = true;

				renderer.render( scene, camera );

				count += 0.1;

			}

import { IoElement, RegisterIoElement } from "io-gui";
import { WebGLRenderer, Scene, PerspectiveCamera, OrthographicCamera, Vector3, sRGBEncoding, EquirectangularReflectionMapping, ACESFilmicToneMapping, Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { OrbitControls, TransformControls } from 'io-gui-three-controls';

const gltfLoader = new GLTFLoader();
const rgbeLoader = new RGBELoader();
const renderer = new WebGLRenderer( { antialias: false, preserveDrawingBuffer: true, alpha: true } );
const gl = renderer.getContext();
renderer.domElement.className = 'canvas3d';
renderer.shadowMap.enabled = true;
renderer.setClearColor( 0x000000, 1.0 );
renderer.autoClear = false;
let host;
let perfNow = 0;
let perfDelta = 1000;
let perfAverage = 1000;
let perfWarned;

const _performanceCheck = function () {

	if ( perfWarned )
		return;

	perfDelta = performance.now() - perfNow;
	perfAverage = Math.min( ( perfAverage * 10 + perfDelta ) / 11, 1000 );
	perfNow = performance.now();

	if ( perfAverage < 16 ) {

		console.warn( 'ThreeViewport performance warning: rendering multiple canvases!' );
		perfWarned = true;

	}

};

const renderedQueue = [];
const renderNextQueue = [];

const animate = function () {

	for ( let i = 0; i < renderedQueue.length; i ++ )
		renderedQueue[ i ].rendered = false;
	renderedQueue.length = 0;

	for ( let i = 0; i < renderNextQueue.length; i ++ ) {

		renderNextQueue[ i ].scheduled = false;
		renderNextQueue[ i ].render();

	}

	renderNextQueue.length = 0;
	requestAnimationFrame( animate );

};

requestAnimationFrame( animate );

export class ThreeViewport extends IoElement {

	static get Style() {

		return /* css */ `
      :host {
        position: relative;
        overflow: hidden;
        display: flex;
        touch-action: none;
        user-select: none;
        box-sizing: border-box;
      }
      :host:focus > canvas {
        outline: var(--io-border-width) solid var(--io-color-focus);
        outline-offset: calc(var(--io-border-width) * -1);
      }
      :host > canvas {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        image-rendering: pixelated;
      }
      :host[ishost] > canvas:not(.canvas3d) {
        display: none;
      }
    `;

	}
	_ctx;
	renderer;
	camera;
	controls;
	transformControls;
	scene;
	renderPass;
	composer;
	envMap = null;
	static get Properties() {

		return {
			ishost: {
				type: Boolean,

				// reflect: 1
			},
			size: [ 0, 0 ],
			tabindex: 1,
			clearColor: 0x000000,
			clearAlpha: 1
		};

	}
	static get Listeners() {

		return {
			'dragstart': 'preventDefault'
		};

	}
	constructor( properties = {} ) {

		super( properties );
		this.template( [[ 'canvas', { $: 'canvas' } ]] );
		this._ctx = this.$.canvas.getContext( '2d' );
		this.$.canvas.imageSmoothingEnabled = false;
		this.renderer = renderer;
		this.camera = new PerspectiveCamera( 75, 1, 10, 3000 );
		this.controls = new OrbitControls( this.camera, this );
		this.transformControls = new TransformControls( this.camera, this );
		this.scene = new Scene();
		this.renderPass = new RenderPass( this.scene, this.camera );
		this.composer = new EffectComposer( this.renderer );

		// envMap: null | Texture = null;
		this.renderer.setClearColor( 0x999999 );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.outputEncoding = sRGBEncoding;
		this.renderer.toneMapping = ACESFilmicToneMapping;
		this.renderer.autoClear = false;
		this.composer.addPass( this.renderPass );
		this.composer.addPass( new ShaderPass( GammaCorrectionShader ) );
		this.camera.position.set( 300, 200, 300 );
		this.camera.lookAt( new Vector3( 0, 0, 0 ) );
		this.render = this.render.bind( this );
		this.controls.addEventListener( 'change', this.render );
		this.controls.minDistance = 200;
		this.controls.maxDistance = 500;
		this.controls.zoomSpeed = 0.3;
		this.controls.enableDamping = true;
		const target = new Object3D();
		target.position.set( 0, 0, 0 );
		this.scene.add( target );
		this.transformControls.attach( target );

		this.transformControls.traverse( ( obj ) => {

			obj.layers.set( 1 );

		} );

		this.scene.add( this.transformControls );
		this.transformControls.addEventListener( 'change', this.render );

		this.transformControls.addEventListener( 'dragging-changed', ( event ) => {

			this.controls.enabled = ! event.value;

		} );

	}
	setHost() {

		if ( ! this.ishost ) {

			if ( host ) {

				const r = window.devicePixelRatio || 1;
				host._ctx.clearRect( 0, 0, host.size[ 0 ] * r, host.size[ 1 ] * r );
				host._ctx.drawImage( host.renderer.domElement, 0, 0, host.size[ 0 ] * r, host.size[ 1 ] * r );
				gl.flush();
				host.ishost = false;

			}
			/* eslint-disable-next-line */
            host = this;
			this.appendChild( this.renderer.domElement );
			this.ishost = true;
			_performanceCheck();

		}

		if ( this.size[ 0 ] && this.size[ 1 ] ) {

			this.renderer.setSize( this.size[ 0 ], this.size[ 1 ] );
			this.renderer.setPixelRatio( window.devicePixelRatio );
			this.renderer.setClearColor( this.clearColor, this.clearAlpha );

		}

	}
	connectedCallback() {

		super.connectedCallback();
		this._connected = true;

	}
	disconnectedCallback() {

		super.disconnectedCallback();
		this._connected = false;

	}
	onResized() {

		const rect = this.getBoundingClientRect();
		const aspect = rect.width / rect.height;
		this.composer.setSize( rect.width, rect.height );
		const camera = this.camera;

		if ( camera instanceof PerspectiveCamera ) {

			if ( camera.aspect !== aspect ) {

				camera.aspect = aspect;
				camera.updateProjectionMatrix();

			}

		}

		if ( camera instanceof OrthographicCamera ) {

			const hh = camera.top - camera.bottom / 2;
			const hw = hh * aspect;

			if ( camera.top !== hh || camera.right !== hw ) {

				camera.top = hh;
				camera.bottom = - hh;
				camera.right = hw;
				camera.left = - hw;
				camera.updateProjectionMatrix();

			}

		}

		this.rendered = false;
		this.size[ 0 ] = Math.floor( rect.width );
		this.size[ 1 ] = Math.floor( rect.height );
		const r = window.devicePixelRatio || 1;
		this.$.canvas.width = this.size[ 0 ] * r;
		this.$.canvas.height = this.size[ 1 ] * r;

		setTimeout( () => {

			this.render();

		} );

	}

	// initPostprocessing() {}
	loadIbl( url, onLoad, onProgress, onError ) {

		rgbeLoader.load( url, ( texture ) => {

			if ( onLoad )
				onLoad( texture );

			texture.mapping = EquirectangularReflectionMapping;
			this.scene.background = texture;
			this.scene.environment = texture;
			this.envMap = texture;
			this.lightProbeRig.update( this.renderer, this.scene );
			this.render();

		}, onProgress, onError );

	}
	loadModel( url, onLoad, onProgress, onError ) {

		gltfLoader.load( url, ( gltf ) => {

			if ( onLoad )
				onLoad( gltf.scene );

			this.scene.add( gltf.scene );
			this.lightProbeRig.update( this.renderer, this.scene );
			this.render();

		}, onProgress, onError );

	}
	render() {

		this.setHost();
		this.renderer.clear();
		this.scene.background = this.envMap;
		this.camera.layers.set( 0 );
		this.composer.render();
		this.renderer.clearDepth();
		this.camera.layers.set( 1 );
		this.scene.background = null;
		this.renderer.render( this.scene, this.camera );
		this.renderer.clearDepth();
		this.camera.layers.set( 100 );
		this.scene.background = null;
		this.renderer.render( this.scene, this.camera );
		this.rendered = true;

	}

}

RegisterIoElement( ThreeViewport );

//# sourceMappingURL=viewport.js.map

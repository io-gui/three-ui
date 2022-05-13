import { IoElement, RegisterIoElement } from "io-gui";
import { Scene, PerspectiveCamera, OrthographicCamera, Vector3, sRGBEncoding, EquirectangularReflectionMapping, ACESFilmicToneMapping, Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { OrbitControls, TransformControls } from 'io-gui-three-controls';
import { ThreeRenderer } from './renderer.js';

const gltfLoader = new GLTFLoader();
const rgbeLoader = new RGBELoader();

export class ThreeViewport extends IoElement {

	static get Style() {

		return /* css */ `
      :host {
        position: relative;
        overflow: hidden;
        display: flex;
      }
      :host > canvas {
        position: absolute;
        top: 0 !important;
        left: 0 !important;
      }
    `;

	}
	renderer;
	camera;
	controls;
	transformControls;
	scene;
	renderPass;
	bokehPass;
	composer;
	backgroundTexture = null;
	static get Properties() {

		return {
			tabindex: 1,
			exposure: 1,
		};

	}
	constructor( properties = {} ) {

		super( properties );
		this.rendererElement = new ThreeRenderer();
		this.appendChild( this.rendererElement );
		this.renderer = this.rendererElement.renderer;
		this.camera = new PerspectiveCamera( 75, 1, 1, 1000 );
		this.controls = new OrbitControls( this.camera, this );
		this.transformControls = new TransformControls( this.camera, this );
		this.scene = new Scene();
		this.renderPass = new RenderPass( this.scene, this.camera );

		this.bokehPass = new BokehPass( this.scene, this.camera, {
			focus: 500.0,
			aperture: 3 * 0.00001,
			maxblur: 0.15,
			width: window.innerWidth,
			height: window.innerHeight // ?
		} );

		this.composer = new EffectComposer( this.renderer );
		this.renderer.setClearColor( 0x999999 );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.outputEncoding = sRGBEncoding;
		this.renderer.toneMapping = ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = this.exposure;
		this.renderer.autoClear = false;
		this.composer.addPass( this.renderPass );
		this.composer.addPass( new ShaderPass( GammaCorrectionShader ) );
		this.composer.addPass( this.bokehPass );
		this.camera.position.set( 50, 30, 30 );
		this.camera.lookAt( new Vector3( 0, 0, 0 ) );
		this.render = this.render.bind( this );
		this.controls.addEventListener( 'change', this.render );
		this.controls.minDistance = 200;
		this.controls.maxDistance = 500;
		this.controls.zoomSpeed = 0.3;
		this.controls.enableDamping = true;
		this.controls.position.set( 0, 0, 0 );
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

		setTimeout( () => {

			this.render();

		} );

	}
	loadIbl( url, onLoad, onProgress, onError ) {

		rgbeLoader.load( url, ( texture ) => {

			if ( onLoad )
				onLoad( texture );

			texture.mapping = EquirectangularReflectionMapping;
			this.scene.background = texture;
			this.scene.environment = texture;
			this.backgroundTexture = texture;
			this.render();

		}, onProgress, onError );

	}
	loadModel( url, onLoad, onProgress, onError ) {

		gltfLoader.load( url, ( gltf ) => {

			if ( onLoad )
				onLoad( gltf.scene );

			this.scene.add( gltf.scene );
			this.render();

		}, onProgress, onError );

	}
	render() {

		this.rendererElement.setHost();
		this.bokehPass.uniforms.focus.value = this.camera.position.distanceTo( this.controls.position );
		this.bokehPass.uniforms.maxblur.value = 1000 / this.camera.position.distanceTo( this.controls.position );
		this.bokehPass.uniforms.aperture.value = 0.0035 / this.camera.position.distanceTo( this.controls.position );
		this.renderer.clear();
		this.renderer.clearDepth();
		this.scene.background = this.backgroundTexture;
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

	}

}

RegisterIoElement( ThreeViewport );

//# sourceMappingURL=viewport.js.map

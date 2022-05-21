import { IoElement, RegisterIoElement, Change } from "io-gui";
import { WebGLRenderer, Scene, Camera, PerspectiveCamera, OrthographicCamera, Vector3, sRGBEncoding, EquirectangularReflectionMapping, ACESFilmicToneMapping, Object3D, Texture } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { ControlsInteractive, ControlsCamera } from 'io-gui-three-controls';
import { ThreeRenderer } from './renderer.js';

const gltfLoader = new GLTFLoader();
const rgbeLoader = new RGBELoader();

export class ThreeViewport extends IoElement {
  static get Style() {
    return /* css */`
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
  renderer: WebGLRenderer;
  camera: PerspectiveCamera;

  // cameraControls?: ControlsCamera;
  // interactiveControls?: ControlsInteractive;

  scene: Scene;
  renderPass: RenderPass;
  composer: EffectComposer;
  backgroundTexture: null | Texture = null;

  static get Properties() {
    return {
      tabindex: 1,
      exposure: 1,
      cameraControls: {
        type: ControlsCamera,
        value: null
      },
      interactiveControls: {
        type: ControlsInteractive,
        value: null
      }
    };
  }
  constructor(properties: Record<string, any> = {}) {
    super(properties);
    this.rendererElement = new ThreeRenderer();
    this.appendChild(this.rendererElement);

    this.renderer = this.rendererElement.renderer;

    this.camera = new PerspectiveCamera(75, 1, 1, 1000);
  
    this.scene = new Scene();
  
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer = new EffectComposer(this.renderer);

    this.renderer.setClearColor(0x999999);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.exposure;
    this.renderer.autoClear = false;

    this.composer.addPass(this.renderPass);
    this.composer.addPass(new ShaderPass(GammaCorrectionShader));

    this.camera.position.set(50, 30, 30);
    this.camera.lookAt(new Vector3(0, 0, 0));

    this.render = this.render.bind(this);
  }
  cameraControlsChanged(change: Change) {
    if (change.oldValue) {
      change.oldValue.removeEventListener('change', this.render);
      this.scene.remove(change.oldValue);
    }
    if (change.value) {
      change.value.addEventListener('change', this.render);
      change.value.traverse((obj: Object3D) => {
        obj.layers.set(1);
      });
      this.scene.add(change.value);
    }
  }
  interactiveControlsChanged(change: Change) {
    if (change.oldValue) {
      change.oldValue.removeEventListener('change', this.render);
      change.oldValue.removeEventListener('active-changed', this.onInteractiveControlsActiveChanged);
      this.scene.remove(change.oldValue);
    }
    if (change.value) {
      change.value.addEventListener('change', this.render);
      change.value.addEventListener('active-changed', this.onInteractiveControlsActiveChanged);
      change.value.traverse((obj: Object3D) => {
        obj.layers.set(1);
      });
      this.scene.add(change.value);
    }
  }
  onInteractiveControlsActiveChanged(event: Change) {
    if (this.cameraControls) this.cameraControls.enabled = !(event as any).value;
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
    this.composer.setSize(rect.width, rect.height)
    const camera = this.camera as Camera;
    if (camera instanceof PerspectiveCamera) {
      if (camera.aspect !== aspect) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      }
    }
    if (camera instanceof OrthographicCamera) {
      const hh = camera.top - camera.bottom / 2;
      const hw = hh * aspect;
      if (camera.top !== hh || camera.right !== hw) {
        camera.top = hh;
        camera.bottom = - hh;
        camera.right = hw;
        camera.left = - hw;
        camera.updateProjectionMatrix();
      }
    }
    setTimeout(()=>{
      this.render();
    });
  }
  loadIbl(url: string, onLoad?: any, onProgress?: any, onError?: any) {
    rgbeLoader.load(url, (texture) => {
      if (onLoad) onLoad(texture);
      texture.mapping = EquirectangularReflectionMapping;
      this.scene.background = texture;
      this.scene.environment = texture;
      this.backgroundTexture = texture;
      this.dispatchEvent('ibl-loaded', texture);
      this.render();
    }, onProgress, onError);
  }
  loadModel(url: string, onLoad?: any, onProgress?: any, onError?: any) {
    gltfLoader.load(url, (gltf: GLTF) => {
      if (onLoad) onLoad(gltf.scene);
      this.scene.add(gltf.scene);
      this.dispatchEvent('model-loaded', gltf.scene);
      this.render();
    }, onProgress, onError);
  }
  render() {
    this.dispatchEvent('before-render');
    this.rendererElement.setHost();
    this.renderer.clear();
    this.renderer.clearDepth();
    this.scene.background = this.backgroundTexture;
    this.camera.layers.set(0);
    this.composer.render();
    this.renderer.clearDepth();
    this.camera.layers.set(1);
    this.scene.background = null;
    this.renderer.render(this.scene, this.camera);
    this.renderer.clearDepth();
    this.camera.layers.set(100);
    this.scene.background = null;
    this.renderer.render(this.scene, this.camera);
    this.dispatchEvent('after-render');
  }
}

RegisterIoElement(ThreeViewport);
import {IoElement, RegisterIoElement} from "io-gui";
import { WebGLRenderer, Scene, Camera, PerspectiveCamera, OrthographicCamera, Vector3, sRGBEncoding, EquirectangularReflectionMapping, ACESFilmicToneMapping, Object3D, Texture } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { OrbitControls, TransformControls } from 'io-gui-three-controls';
import './renderer.js';

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
  controls: OrbitControls;
  transformControls: TransformControls;
  scene: Scene;
  renderPass: RenderPass;
  composer: EffectComposer;
  envMap: null | Texture = null;

  static get Properties() {
    return {
      tabindex: 1
    };
  }
  constructor(properties: Record<string, any> = {}) {
    super(properties);
    this.template([['three-renderer', {$: 'renderer'}]]);

    this.renderer = this.$.renderer.renderer;

    this.camera = new PerspectiveCamera(75, 1, 10, 3000);
    this.controls = new OrbitControls(this.camera, this as unknown as HTMLElement);
    this.transformControls = new TransformControls(this.camera, this as unknown as HTMLElement);
  
    this.scene = new Scene();
  
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer = new EffectComposer(this.renderer);
  
    // envMap: null | Texture = null;

    this.renderer.setClearColor(0x999999);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.autoClear = false;

    this.composer.addPass(this.renderPass);
    this.composer.addPass(new ShaderPass(GammaCorrectionShader));

    this.camera.position.set(300, 200, 300);
    this.camera.lookAt(new Vector3(0, 0, 0));

    this.render = this.render.bind(this);
    this.controls.addEventListener('change', this.render);
    this.controls.minDistance = 200;
    this.controls.maxDistance = 500;
    this.controls.zoomSpeed = 0.3;
    this.controls.enableDamping = true;
    
    const target = new Object3D();
    target.position.set(0, 0, 0);
    this.scene.add(target);
    this.transformControls.attach(target);
    this.transformControls.traverse((obj: Object3D) => {
      obj.layers.set(1);
    });
    this.scene.add(this.transformControls as unknown as Object3D);
    this.transformControls.addEventListener('change', this.render);
    this.transformControls.addEventListener('dragging-changed', (event) => {
      this.controls.enabled = !(event as any).value;
    });
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
    this.rendered = false;
    setTimeout(()=>{
      this.render();
    });
  }
  // initPostprocessing() {}
  loadIbl(url: string, onLoad: any, onProgress: any, onError: any) {
    rgbeLoader.load(url, (texture) => {
      if (onLoad) onLoad(texture);
      texture.mapping = EquirectangularReflectionMapping;
      this.scene.background = texture;
      this.scene.environment = texture;
      this.envMap = texture;
      this.lightProbeRig.update(this.renderer, this.scene);
      this.render();
    }, onProgress, onError);
  }
  loadModel(url: string, onLoad: any, onProgress: any, onError: any) {
    gltfLoader.load(url, (gltf: GLTF) => {
      if (onLoad) onLoad(gltf.scene);
      this.scene.add(gltf.scene);
      this.lightProbeRig.update(this.renderer, this.scene);
      this.render();
    }, onProgress, onError);
  }
  render() {
    this.$.renderer.setHost();

    this.renderer.clear();
    this.scene.background = this.envMap;
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
    this.rendered = true;
  }
}

RegisterIoElement(ThreeViewport);
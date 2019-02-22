import {Scene, PerspectiveCamera, Vector3, OrthographicCamera, HemisphereLight} from "../../../three.js/build/three.module.js";
import {IoElement, html} from "../../../io/build/io.js";
import {GLTFLoader} from "../../lib/GLTFLoader.js";
import {EditorCameraControls} from "../controls/camera/Editor.js";
// import {OrbitCameraControls} from "../controls/camera/Orbit.js";
// import {TrackballCameraControls} from "../controls/camera/Trackball.js";
import "./viewport.js";

const loader = new GLTFLoader();
const scene = new Scene();

const perspCamera = new PerspectiveCamera(90, 1, 0.0001, 100);
perspCamera.position.set(1, 1, 1);
perspCamera._target = new Vector3(0, 0.75, 0);

const topCamera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.001, 20);
topCamera.position.set(0, 10, 0);
topCamera._target = new Vector3(0, 0.75, 0);

const leftCamera = new OrthographicCamera(-0.75, 0.75, 0.75, -0.75, 0.001, 20);
leftCamera.position.set(10, 0.75, 0);
leftCamera._target = new Vector3(0, 0.75, 0);

const frontCamera = new OrthographicCamera(-0.75, 0.75, 0.75, -0.75, 0.001, 20);
frontCamera.position.set(0, 0.75, 10);
frontCamera._target = new Vector3(0, 0.75, 0);

const controls = new EditorCameraControls();

export class ThreeEditor extends IoElement {
  static get style() {
    return html`
    <style>
      :host {
        display: grid;
        grid-template-columns: 50% 50%;
      }
      :host > three-viewport {
        display: flex;
        flex: 1 1 auto;
      }
    </style>
    `;
  }
  // static get properties() {
  //   return {
  //     controls: OrbitCameraControls,
  //   }
  // }
  connectedCallback() {
    super.connectedCallback();
    if (!scene.loaded) {
      loader.load('/three-ui/demo/scene/cubes.gltf', gltf => {
        gltf.scene.children.forEach(child => { scene.add( child ); });
        scene.add(new HemisphereLight(0x333333, 0xffffff, 3));
        window.dispatchEvent(new CustomEvent('object-mutated', {detail: {object: scene}}));
      }, undefined, function ( e ) {
        console.error( e );
      } );
      scene.loaded = true;
    }
  }
  constructor(props) {
    super(props);
    this.template([
      ['three-viewport', {id: 'viewport0', clearAlpha: 0, scene: scene, camera: perspCamera, controls: controls}],
      ['three-viewport', {id: 'viewport1', clearAlpha: 0, scene: scene, camera: topCamera, controls: controls}],
      ['three-viewport', {id: 'viewport2', clearAlpha: 0, scene: scene, camera: leftCamera, controls: controls}],
      ['three-viewport', {id: 'viewport3', clearAlpha: 0, scene: scene, camera: frontCamera, controls: controls}],
    ]);
  }
}

ThreeEditor.Register();

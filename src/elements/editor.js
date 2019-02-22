import {Scene, PerspectiveCamera, Vector3, OrthographicCamera, HemisphereLight} from "../../../three.js/build/three.module.js";
import {IoElement, html} from "../../../io/build/io.js";
import {GLTFLoader} from "../../lib/GLTFLoader.js";
import "./viewport.js";

const loader = new GLTFLoader();
const scene = new Scene();

const perspCamera = new PerspectiveCamera(90, 1, 0.0001, 100);
perspCamera.position.set(1, 1, 1);
perspCamera.target = new Vector3(0, 0.75, 0);

const topCamera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.001, 20);
topCamera.position.set(0, 10, 0);
topCamera.target = new Vector3(0, 0.75, 0);

const leftCamera = new OrthographicCamera(-0.75, 0.75, 0.75, -0.75, 0.001, 20);
leftCamera.position.set(10, 0.75, 0);
leftCamera.target = new Vector3(0, 0.75, 0);

const frontCamera = new OrthographicCamera(-0.75, 0.75, 0.75, -0.75, 0.001, 20);
frontCamera.position.set(0, 0.75, 10);
frontCamera.target = new Vector3(0, 0.75, 0);

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
      }
    </style>
    `;
  }
  connectedCallback() {
    super.connectedCallback();
    if (!scene.loaded) {
      loader.load('/three-ui/demo/scene/cubes.gltf', gltf => {
        window.dispatchEvent(new CustomEvent('object-mutated', {detail: {object: scene}}));
        gltf.scene.children.forEach(child => { scene.add( child ); });
        scene.add(new HemisphereLight(0x333333, 0xffffff, 3));
      }, undefined, function ( e ) {
        console.error( e );
      } );
      scene.loaded = true;
    }
  }
  constructor(props) {
    super(props);
    this.template([
      ['three-viewport', {id: 'viewport0', clearAlpha: 0, scene: scene, camera: perspCamera}],
      ['three-viewport', {id: 'viewport1', clearAlpha: 0, scene: scene, camera: topCamera}],
      ['three-viewport', {id: 'viewport2', clearAlpha: 0, scene: scene, camera: leftCamera}],
      ['three-viewport', {id: 'viewport3', clearAlpha: 0, scene: scene, camera: frontCamera}],
    ]);
  }
}

ThreeEditor.Register();
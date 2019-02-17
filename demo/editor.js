import * as THREE from "../../three.js/build/three.module.js";
import {IoElement, html} from "../../io/src/io.js";
import "../src/three-ui.js";
import {GLTFLoader} from "../lib/GLTFLoader.js";

const loader = new GLTFLoader();
const scene = new THREE.Scene();

loader.load('/three-ui/demo/scene/cubes.gltf', gltf => {
  gltf.scene.children.forEach(child => { scene.add( child ); });
  scene.add(new THREE.AmbientLight());
  window.dispatchEvent(new CustomEvent('object-mutated', {detail: {object: scene}}));
}, undefined, function ( e ) {
  console.error( e );
} );

const perspCamera = new THREE.PerspectiveCamera(50, 1, 0.001, 10);
perspCamera.position.set(1, 1, 1);
perspCamera.target = new THREE.Vector3(0, 0.75, 0);

const topCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.001, 20);
topCamera.position.set(0, 10, 0);
topCamera.target = new THREE.Vector3(0, 0.75, 0);

const leftCamera = new THREE.OrthographicCamera(-0.75, 0.75, 0.75, -0.75, 0.001, 20);
leftCamera.position.set(10, 0.75, 0);
leftCamera.target = new THREE.Vector3(0, 0.75, 0);

const frontCamera = new THREE.OrthographicCamera(-0.75, 0.75, 0.75, -0.75, 0.001, 20);
frontCamera.position.set(0, 0.75, 10);
frontCamera.target = new THREE.Vector3(0, 0.75, 0);

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

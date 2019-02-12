import {IoElement, html} from "../../io/src/io.js";
import "../src/three-ui.js";
import {ThreeDemoScene} from "./scene.js";
import * as THREE from "../../three.js/src/Three.js";

const scene = new ThreeDemoScene({path: '/three-ui/demo/scene/cubes.gltf'});

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

export class ThreeDemo extends IoElement {
  static get style() {
    return html`
    <style>
      :host {
        display: grid;
        grid-template-columns: 50% 50%;
        align-self: flex-start !important;
      }
      :host > three-viewport {
        display: flex;
      }
    </style>
    `;
  }
  objectMutated(event) {
    this.render();
  }
  render() {
    this.$.viewport0.render();
    this.$.viewport1.render();
    this.$.viewport2.render();
    this.$.viewport3.render();
  }
  constructor(props) {
    super(props);
    this.template([
      ['three-viewport', {id: 'viewport0', scene: scene, camera: perspCamera}],
      ['three-viewport', {id: 'viewport1', scene: scene, camera: topCamera}],
      ['three-viewport', {id: 'viewport2', scene: scene, camera: leftCamera}],
      ['three-viewport', {id: 'viewport3', scene: scene, camera: frontCamera}],
    ]);
  }
}

ThreeDemo.Register();

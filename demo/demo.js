import {IoElement, html} from "../../io/src/io.js";
import "../src/three-ui.js";
import {ThreeDemoScene} from "./scene.js";
import * as THREE from "../../three.js/build/three.module.js";

const scene = new ThreeDemoScene({path: '/three-ui/demo/scene/cubes.gltf'});

const perspCamera = new THREE.PerspectiveCamera(90, 1, 0.001, 10);
perspCamera.position.set(1, 1, 1);
perspCamera.target = new THREE.Vector3(0, 0.75, 0);

const topCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.001, 10);
topCamera.position.set(0, 5, 0);
topCamera.target = new THREE.Vector3(0, 0, 0);

const leftCamera = new THREE.OrthographicCamera(-0.75, 0.75, 0.75, -0.75, 0.001, 10);
leftCamera.position.set(5, 0.75, 0);
leftCamera.target = new THREE.Vector3(0, 0.75, 0);

const frontCamera = new THREE.OrthographicCamera(-0.75, 0.75, 0.75, -0.75, 0.001, 10);
frontCamera.position.set(0, 0.75, 5);
frontCamera.target = new THREE.Vector3(0, 0.75, 0);

export class ThreeDemo extends IoElement {
  static get style() {
    return html`
    <style>
      :host {
        display: block;
      }
      :host > div {
        display: grid;
        height: 400px;
        margin: var(--io-theme-spacing);
        grid-template-columns: auto auto;
      }
      :host > div > three-viewport {
        display: flex;
        height: 200px;
      }
      :host > div > .label {
        display: inline-block;
        border: 1px solid transparent;
        padding: var(--io-theme-padding);
        padding-left: calc(3 * var(--io-theme-padding));
        padding-right: calc(3 * var(--io-theme-padding));
      }
    </style>
    `;
  }
  static get properties() {
    return {
      value: function() { return scene; }
    }
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
      ['div', [
        ['three-viewport', {id: 'viewport0', scene: scene, camera: perspCamera}],
        ['three-viewport', {id: 'viewport1', scene: scene, camera: topCamera}],
        ['three-viewport', {id: 'viewport2', scene: scene, camera: leftCamera}],
        ['three-viewport', {id: 'viewport3', scene: scene, camera: frontCamera}],
      ]],
      ['three-inspector', {value: this.bind('value')}],
    ]);
  }
}

ThreeDemo.Register();

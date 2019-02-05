import {IoElement, html, IoProperties} from "../lib/io.js";
import "../src/three-ui.js";

import * as THREE from "../../three.js/build/three.module.js";
import {ThreeStorage as $} from "../src/elements/storage.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const light = new THREE.DirectionalLight();
const mesh = new THREE.Mesh(new THREE.SphereBufferGeometry(1,12,12), new THREE.MeshPhongMaterial());

camera.position.set(3, 3, 3);
camera.lookAt(scene.position);
camera.updateMatrixWorld();

scene.add(camera);
scene.add(light);
scene.add(mesh);

// const data = $('scene', scene);
const data = { value: scene };

const menuOptions = [
  {label: 'Scene', value: data.value},
  {label: 'Camera', value: data.value.children[0]},
  {label: 'Light', value: data.value.children[1]},
  {label: 'Mesh', value: data.value.children[2]},
  {label: 'Geometry', value: data.value.children[2].geometry},
  {label: 'Material', value: data.value.children[2].material},
];

export class ThreeDemo extends IoElement {
  static get style() {
    return html`
    <style>
      :host {
        display: block;
      }
      :host > div {
        display: flex;
        margin: var(--io-theme-spacing);
      }
      :host > three-viewport {
        display: block;
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
      value: function() { return data.value.children[2].geometry; }
    }
  }
  objectMutated(event) {
    // TODO: optimize
    this.$.viewport.rendered = false;
  }
  constructor(props) {
    super(props);
    this.template([
      ['three-viewport', {id: 'viewport', scene: data.value, camera: data.value.children[0]}],
      ['div', [
        ['span', {className: 'label'}, 'Select:'],
        ['io-option', {value: this.bind('value'), options: menuOptions}],
      ]],
      ['three-inspector', {value: this.bind('value')}],
    ]);
  }
}

ThreeDemo.Register();

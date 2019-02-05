import {IoElement, html} from "../lib/io.js";
import "../src/three-ui.js";

import * as THREE from "../../three.js/build/three.module.js";
import {ThreeStorage as $} from "../src/elements/storage.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const light = new THREE.DirectionalLight();
const mesh = new THREE.Mesh(new THREE.SphereBufferGeometry(1,1,2,2), new THREE.MeshBasicMaterial());

scene.add(camera);
scene.add(light);
scene.add(mesh);

const data = {
  scene: $('scene', scene).value
}

export class ThreeDemo extends IoElement {
  static get style() {
    return html`
    <style>
      :host .demo {
        margin: 1em;
        padding: 0.5em;
        background: #eee;
      }
      :host .demoLabel {
        padding: 0.25em;
        margin: -0.5em -0.5em 0.5em -0.5em;
        background: #ccc;
      }
    </style>
    `;
  }
  static get properties() {
    return {
      value: function() { return data.scene; }
    }
  }
  static get listeners() {
    return {
      'value-set': '_onValueSet'
    };
  }
  _onValueSet() {
    this.dispatchEvent('object-mutated', {object: this, key: '*'}, false, window);
  }
  constructor(props) {
    super(props);
    this.template([
      ['io-option', {value: this.bind('value'), options: [
        {label: 'Scene', value: data.scene},
        {label: 'Camera', value: data.scene.children[0]},
        {label: 'Light', value: data.scene.children[1]},
        {label: 'Mesh', value: data.scene.children[2]},
        {label: 'Geometry', value: data.scene.children[2].geometry},
        {label: 'Material', value: data.scene.children[2].material},
      ]}],
      ['io-inspector', {value: this.bind('value'), groups: {'vectors': ['vec2', 'vec3', 'vec4']}, expanded: ['vectors']}],
    ]);
  }
}

ThreeDemo.Register();

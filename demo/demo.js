import {IoElement, html} from "../lib/io.js";
import "../src/three-ui.js";
import {ThreeDemoScene} from "./scene.js";
import * as THREE from "../../three.js/build/three.module.js";

const scene = new ThreeDemoScene({path: 'demo/scene2/cubes2.glb'});
const camera = new THREE.PerspectiveCamera();
camera.fov = 60;
camera.position.set(1, 1, 1);
camera.lookAt(new THREE.Vector3(0, 0.75, 0));

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
      :host > three-renderer {
        display: flex;
        /* display: block; */
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
    // TODO: optimize
    this.$.renderer.render(scene, camera);
    this.$.renderer1.render(scene, camera);
    this.$.renderer2.render(scene, camera);
    this.$.renderer3.render(scene, camera);
  }
  resized() {
    clearTimeout(this._timeout);
    this._timeout = setTimeout(() => {
      this.$.renderer.render(scene, camera);
      this.$.renderer1.render(scene, camera);
      this.$.renderer2.render(scene, camera);
      this.$.renderer3.render(scene, camera);
    })
  }
  constructor(props) {
    super(props);

    // renderer.gammaInput = true;
    // renderer.gammaOutput = true;
    // renderer.gammaFactor = 2.2;

    this.template([
      ['three-renderer', {id: 'renderer', scene: scene, gammaInput: true, gammaOutput: true, gammaFactor: 2.2}],
      ['three-renderer', {id: 'renderer1', scene: scene, gammaInput: true, gammaOutput: true, gammaFactor: 2.2}],
      ['three-renderer', {id: 'renderer2', scene: scene, gammaInput: true, gammaOutput: true, gammaFactor: 2.2}],
      ['three-renderer', {id: 'renderer3', scene: scene, gammaInput: true, gammaOutput: true, gammaFactor: 2.2}],
      ['three-inspector', {value: this.bind('value')}],
    ]);
  }
}

ThreeDemo.Register();

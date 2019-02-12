import {html, IoElement} from "../../lib/io.js";
import * as THREE from "../../../three.js/build/three.module.js";
import {ThreeRenderer} from "./renderer.js";

import {OrbitCameraControls} from "../controls/camera/Orbit.js";

export class ThreeViewport extends ThreeRenderer {
  static get properties() {
    return {
      // controls: OrbitCameraControls
    }
  }
  constructor(props) {
    super(props);
    this.controls = new OrbitCameraControls({domElement: this, camera: this.camera});
    this.controls.addEventListener('change', this.render);
  }
  resized() {
    super.resized();
    this.render();
  }
  preRender() {}
  postRender() {}
}

ThreeViewport.Register();

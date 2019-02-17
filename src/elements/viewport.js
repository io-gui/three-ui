import {ThreeRenderer} from "./renderer.js";

import {OrbitCameraControls} from "../core/controls/camera/Orbit.js";

export class ThreeViewport extends ThreeRenderer {
  static get properties() {
    return {
      // controls: OrbitCameraControls
    };
  }
  constructor(props) {
    super(props);
    this.controls = new OrbitCameraControls({domElement: this, camera: this.camera});
    this.controls.addEventListener('change', this.render);
  }
  preRender() {}
  postRender() {}
}

ThreeViewport.Register();

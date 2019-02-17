import * as THREE from "../../../three.js/build/three.module.js";
import {ThreeRenderer} from "./renderer.js";
import {OrbitCameraControls} from "../core/controls/camera/Orbit.js";
import {SelectionControls} from "../core/controls/Selection.js";

export class ThreeViewport extends ThreeRenderer {
  static get properties() {
    return {
      // controls: OrbitCameraControls
      helperScene: THREE.Scene
    };
  }
  constructor(props) {
    super(props);
    this.controls = new OrbitCameraControls({domElement: this, camera: this.camera});
    this.controls.addEventListener('change', this.render);

    this.selectionControls = new SelectionControls({domElement: this, camera: this.camera, object_: this.scene});
    this.helperScene.add(this.selectionControls);

    const scope = this;

    this.selectionControls.addEventListener('change', this.render);
    this.selectionControls.addEventListener('selected-changed', (event) => {
      console.log(event.detail.selected[0].name)
    });
  }
  preRender() {
    this.selectionControls.camera = this.camera;
    let res = new THREE.Vector3(this.size[0], this.size[1], window.devicePixelRatio);
    this.helperScene.traverse(child => {
      if (child.material) {
        child.material.resolution = res;
      }
    });
  }
  postRender() {
    this.renderer.clearDepth();
    this.renderer.render(this.helperScene, this.camera, false, false);
  }
}

ThreeViewport.Register();

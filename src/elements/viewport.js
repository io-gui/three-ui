import {Scene, Vector3} from "../../../three.js/build/three.module.js";
import {ThreeRenderer} from "./renderer.js";
import {OrbitCameraControls} from "../core/controls/camera/Orbit.js";
import {SelectionControls} from "../core/controls/Selection.js";
import {CombinedTransformControls} from "../core/controls/transform/Combined.js";

export class ThreeViewport extends ThreeRenderer {
  static get properties() {
    return {
      // controls: OrbitCameraControls
      helperScene: Scene
    };
  }
  constructor(props) {
    super(props);
    this.controls = new OrbitCameraControls({domElement: this, camera: this.camera});
    this.controls.addEventListener('change', this.render);

    this.selectionControls = new SelectionControls({domElement: this, camera: this.camera, object_: this.scene});
    this.helperScene.add(this.selectionControls);


    this.transformControls = new CombinedTransformControls({domElement: this, camera: this.camera});
    this.transformControls.addEventListener('change', this.render);
    this.transformControls.size = 0.1;
    this.transformControls.space = 'local';
    this.transformControls.addEventListener('active-changed', transformControlsChanged);
    this.transformControls.addEventListener('space-changed', transformControlsChanged);
    this.transformControls.addEventListener('axis-changed', transformControlsChanged);
    this.helperScene.add(this.transformControls);

    const scope = this;

    function transformControlsChanged(event) {
      if (event.detail.property === 'active') scope.controls.enabled = event.detail.value ? false : true;
      if (event.detail.property === 'space') scope.selectionControls.transformSpace = event.detail.value;
      if (event.detail.property === 'axis') {
        scope.selectionControls.enabled = event.detail.value ? false : true;
        scope.controls.enabled = event.detail.value ? false : true;
      }
    }

    this.selectionControls.addEventListener('change', this.render);
    this.selectionControls.addEventListener('selected-changed', () => {
      // TODO: test with objects and selection
      this.transformControls.object = this.selectionControls;
      // this.transformControls.object = event.detail.selected[0];
    });
  }
  preRender() {
    this.selectionControls.camera = this.camera;
    let res = new Vector3(this.size[0], this.size[1], window.devicePixelRatio);
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

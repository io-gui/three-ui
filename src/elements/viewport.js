import {Scene, Vector3, WebGLRenderTarget, MeshBasicMaterial, VertexColors, Float32BufferAttribute, Color} from "../../../three.js/build/three.module.js";
import {ThreeRenderer} from "./renderer.js";
import {OrbitCameraControls} from "../core/controls/camera/Orbit.js";
// import {SelectionControls} from "../core/controls/Selection.js";
// import {CombinedTransformControls} from "../core/controls/transform/Combined.js";

// function setIdMaterial(object) {
//   if (object._idMaterial) object.material = object._idMaterial;
//   else if (object.material) {
//     object._material = object.material;
//     object._idMaterial = new MeshBasicMaterial({color: new Color().setHex(object.id)});
//     object.material = object._idMaterial;
//   }
// }
// function resetMaterial(object) {
//   if (object._material) object.material = object._material;
// }

export class ThreeViewport extends ThreeRenderer {
  static get properties() {
    return {
      controls: OrbitCameraControls,
    };
  }
  // objectMutated(event) {
  //   if (event.detail.object === this.scene) this.sceneChanged();
  // }
  sceneChanged() {
    this.scene._helpers = this.scene._helpers || new Scene();
  }
  cameraChanged() {
    this.attachControls(this.controls);
  }
  controlsChanged(event) {
    this.detachControls(event.detail.oldValue);
    this.attachControls(event.detail.value);
  }
  attachControls(controls) {
    if (controls) {
      controls.addEventListener('change', this.render);
      controls.attachViewport(this, this.camera);
    }
  }
  detachControls(controls) {
    controls.removeEventListener('change', this.render);
    controls.detachViewport(this);
    // console.log('asd', controls)
  }
  constructor(props) {
    super(props);
    this.attachControls(this.controls);
    // this.controlsChanged();

    // this.pickingTexture = new WebGLRenderTarget(1, 1);

    // this.controls = new OrbitCameraControls();
    // this.controls = new OrbitCameraControls({domElement: this, camera: this.camera});

    // this.selectionControls = new SelectionControls({domElement: this, camera: this.camera, object_: this.scene});
    // this.scene._helpers.add(this.selectionControls);

    // this.transformControls = new CombinedTransformControls({domElement: this, camera: this.camera});
    // this.transformControls.addEventListener('change', this.render);
    // this.transformControls.size = 0.1;
    // this.transformControls.space = 'local';
    // this.transformControls.addEventListener('active-changed', transformControlsChanged);
    // this.transformControls.addEventListener('space-changed', transformControlsChanged);
    // this.transformControls.addEventListener('axis-changed', transformControlsChanged);
    // this.scene._helpers.add(this.transformControls);


    // const scope = this;
    // function transformControlsChanged(event) {
    //   if (event.detail.property === 'active') scope.controls.enabled = event.detail.value ? false : true;
    //   if (event.detail.property === 'space') scope.selectionControls.transformSpace = event.detail.value;
    //   if (event.detail.property === 'axis') {
    //     scope.selectionControls.enabled = event.detail.value ? false : true;
    //     scope.controls.enabled = event.detail.value ? false : true;
    //   }
    // }

    // this.selectionControls.addEventListener('change', this.render);
    // this.selectionControls.addEventListener('selected-changed', () => {
    //   // TODO: test with objects and selection
    //   // this.transformControls.object = this.selectionControls;
    //   // this.transformControls.object = event.detail.selected[0];
    // });
  }
  preRender() {
    // this.selectionControls.camera = this.camera;
    // const res = new Vector3(this.size[0], this.size[1], window.devicePixelRatio);
    // this.scene._helpers.traverse(child => {
    //   if (child.material && child.material.resolution) {
    //     child.material.resolution.copy(res);
    //     child.material.uniformChanged();
    //   }
    // });
  }
  // render() {
  //   super.render();
  // }
  postRender() {
    this.renderer.clearDepth();
    this.renderer.render(this.scene._helpers, this.camera);
    // this.renderer.setRenderTarget(this.pickingTexture);
    // this.scene.traverse(setIdMaterial);
    // this.scene._helpers.traverse(setIdMaterial);
    // this.renderer.render(this.scene, this.camera);
    // this.renderer.render(this.scene._helpers, this.camera);
    // this.renderer.setRenderTarget(null);
    // this.scene.traverse(resetMaterial);
    // this.scene._helpers.traverse(resetMaterial);
  }
}

ThreeViewport.Register();

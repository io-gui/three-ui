import {ThreeRenderer} from "./renderer.js";
import {OrbitCameraControls} from "../controls/camera/Orbit.js";
import {SelectionControls} from "../controls/Selection.js";
import {Selection} from "../core/Selection.js";
// import {CombinedTransformControls} from "../controls/transform/Combined.js";

export class ThreeViewport extends ThreeRenderer {
  static get properties() {
    return {
      cameraTool: OrbitCameraControls,
      selectionTool: SelectionControls,
      selection: Selection,
    };
  }
  get bindings() {
    return {
      cameraTool: {scene: this.bind('scene')},
      selectionTool: {scene: this.bind('scene'), selection: this.bind('selection')},
      // TODO: make work without bindings
      // cameraTool: {scene: this.scene},
      // selectionTool: {scene: this.scene, selection: this.selection},
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this.cameraTool.attachViewport(this, this.camera);
    this.selectionTool.attachViewport(this, this.camera);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.cameraTool.detachViewport(this, this.camera);
    this.selectionTool.detachViewport(this, this.camera);
  }
  sceneChanged() {
    this.selectionTool.scene = this.scene;
  }
  cameraChanged() {
    this.cameraTool.attachViewport(this, this.camera);
    this.selectionTool.attachViewport(this, this.camera);
  }
  selectionToolChanged(event) {
    if (event.detail.oldValue) event.detail.oldValue.detachViewport(this);
    event.detail.value.attachViewport(this, this.camera);
  }
  cameraToolChanged(event) {
    if (event.detail.oldValue) event.detail.oldValue.detachViewport(this);
    event.detail.value.attachViewport(this, this.camera);
  }
  selectionMutated(event) {
    this.render();
  }
  dispose() {
    // TODO
    this.cameraTool.detachViewport(this, this.camera);
    this.selectionTool.detachViewport(this, this.camera);
  }
  preRender() {
  }
  postRender() {
    this.renderer.clearDepth();

    this.selectionTool.helperScene.traverse(child => {
      if (child.material) {
        child.material.resolution.set(this.size[0], this.size[1], window.devicePixelRatio);
        child.material.uniformChanged()
      }
    });

    if (this.cameraTool.helperScene) this.renderer.render(this.cameraTool.helperScene, this.camera);
    if (this.selectionTool.helperScene) this.renderer.render(this.selectionTool.helperScene, this.camera);
  }
}

ThreeViewport.Register();

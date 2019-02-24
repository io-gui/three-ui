import {Scene} from "../../../three.js/build/three.module.js";
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
  constructor(props) {
    super(props);
    this.sceneChanged();
  }
  connectedCallback() {
    super.connectedCallback();
    this.attachCameraTool(this.cameraTool);
    this.attachSelectionTool(this.selectionTool);
    this.selectionTool.scene = this.scene;
    this.selectionTool.selection = this.selection;
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.detachCameraTool(this.cameraTool);
    this.detachSelectionTool(this.selectionTool);
  }
  sceneChanged() {
    this.selectionTool.scene = this.scene;
    this.render();
  }
  cameraChanged() {
    this.attachCameraTool(this.cameraTool);
    this.attachSelectionTool(this.selectionTool);
    this.render();
  }
  selectionToolChanged(event) {
    this.detachSelectionTool(event.detail.oldValue);
    this.attachSelectionTool(event.detail.value);
    this.selectionTool.scene = this.scene;
    this.selectionTool.selection = this.selection;
    this.render();
  }
  cameraToolChanged(event) {
    this.detachCameraTool(event.detail.oldValue);
    this.attachCameraTool(event.detail.value);
  }
  attachCameraTool(tool) {
    if (tool) {
      tool.attachViewport(this, this.camera);
    }
  }
  detachCameraTool(tool) {
    if (tool) {
      tool.detachViewport(this);
    }
  }
  attachSelectionTool(tool) {
    if (tool) {
      tool.attachViewport(this, this.camera);
      tool.scene = this.scene;
    }
  }
  detachSelectionTool(tool) {
    if (tool) {
      tool.detachViewport(this);
      delete tool.scene;
    }
  }
  dispose() {
    // TODO
  }
  preRender() {
  }
  postRender() {
    this.renderer.clearDepth();
    if (this.cameraTool.helperScene) this.renderer.render(this.cameraTool.helperScene, this.camera);
    if (this.selectionTool.helperScene) this.renderer.render(this.selectionTool.helperScene, this.camera);
  }
}

ThreeViewport.Register();

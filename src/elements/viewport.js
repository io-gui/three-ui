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
  objectMutated(event) {
    if (event.detail.object === this.scene) this.render();
    if (event.detail.object === this.camera) this.render();
    if (event.detail.object === this.selection) this.render();
  }
  sceneChanged() {
    this.selectionTool.scene = this.scene;
  }
  selectionToolChanged() {
    this.selectionTool.scene = this.scene;
    this.selectionTool.selection = this.selection;
  }
  cameraChanged() {
    this.attachCameraTool(this.cameraTool);
    this.attachSelectionTool(this.selectionTool);
  }
  cameraToolChanged(event) {
    this.detachCameraTool(event.detail.oldValue);
    this.attachCameraTool(event.detail.value);
  }
  selectionToolChanged(event) {
    this.detachSelectionTool(event.detail.oldValue);
    this.attachSelectionTool(event.detail.value);
    this.selectionTool.selection = this.selection;
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
  onCameraToolChange(event) {
    if (event.detail.viewport === this) {
      this.render();
    }
  }
  dispose() {
    // TODO
  }
  preRender() {
  }
  postRender() {
    this.renderer.clearDepth();
    // this.scene._helpers = this.scene._helpers || new Scene();
    if (this.scene._helpers) this.renderer.render(this.scene._helpers, this.camera);
  }
}

ThreeViewport.Register();

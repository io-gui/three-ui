/**
 * @author arodic / http://github.com/arodic
 */

// TODO: marquee selection

import {Scene, Raycaster} from "../../../three.js/build/three.module.js";
import {Selection} from "../core/Selection.js";
import {SelectionHelper} from "../helpers/Selection.js";
import {Tool} from "../core/Tool.js";

// Temp variables
const raycaster = new Raycaster();

let time = 0, dtime = 0;
const CLICK_DIST = 2;
const CLICK_TIME = 250;

export class SelectionControls extends Tool {
  static get properties() {
    return {
      selection: Selection,
      helper: SelectionHelper,
    };
  }
  constructor(props) {
    super(props);
    this.addEventListener('pointerdown', this.onPointerdown.bind(this));
    this.addEventListener('pointerup', this.onPointerup.bind(this));
  }
  helperChanged(event) {
    const oldHelper = event.detail.oldValue;
    const helper = event.detail.value;
    if (oldHelper) this.helperScene.remove(oldHelper);
    if (helper) this.helperScene.remove(helper);
  }
  selectionChanged() {
    this.helper.selection = this.selection;
  }
  select(viewport, pointer, camera) {
    raycaster.setFromCamera(pointer.position, camera);
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    if (intersects.length > 0) {
      const object = intersects[0].object;
      // TODO: handle helper selection
      if (pointer.ctrlKey) {
        this.selection.toggle(object);
      } else {
        this.selection.replace(object);
      }
    } else {
      this.selection.clear();
    }
  }
  onPointerdown() {
    time = Date.now();
  }
  onPointerup(event) {
    const pointers = event.detail.pointers;
    const target = event.detail.event.target;
    const camera = event.detail.camera;
    const rect = event.detail.rect;
    const x = Math.floor(pointers[0].distance.x * rect.width / 2);
    const y = Math.floor(pointers[0].distance.y * rect.height / 2);
    const length = Math.sqrt(x * x + y * y);
    dtime = Date.now() - time;
    if (pointers[0] && dtime < CLICK_TIME) {
      if (length < CLICK_DIST) {
        this.select(target, pointers[0], camera);
      }
    }
  }
}

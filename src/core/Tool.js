/**
 * @author arodic / https://github.com/arodic
 */

import {IoCore} from "../../../io/build/io-core.js";
import {Pointers} from "./Pointers.js";

export class ViewportTool extends IoCore {
  static get properties() {
    return {
      enabled: true,
    };
  }
  constructor(props = {}) {
    super(props);

    this.viewports = [];
    this.cameras = new WeakMap();
    this.pointers = new Pointers({enabled: this.enabled});

    this.pointers.addEventListener('pointerdown', this.onViewportPointerDown.bind(this));
    this.pointers.addEventListener('pointerhover', this.onViewportPointerHover.bind(this));
    this.pointers.addEventListener('pointermove', this.onViewportPointerMove.bind(this));
    this.pointers.addEventListener('pointerup', this.onViewportPointerUp.bind(this));
    this.pointers.addEventListener('pointerleave', this.onViewportPointerLeave.bind(this));
    this.pointers.addEventListener('contextmenu', this.onViewportContextmenu.bind(this));
    this.pointers.addEventListener('wheel', this.onViewportWheel.bind(this));
    this.pointers.addEventListener('keydown', this.onViewportKeyDown.bind(this));
    this.pointers.addEventListener('keyup', this.onViewportKeyUp.bind(this));
    this.pointers.addEventListener('focus', this.onViewportFocus.bind(this));
    this.pointers.addEventListener('blur', this.onViewportBlur.bind(this));

    if (props.domElement && props.camera) {
      this.attachViewport(props.domElement, props.camera);
    }
  }
  enabledChanged() {
    this.pointers.enabled = this.enabled;
  }
  attachViewport(domElement, camera) {
    if (this.viewports.indexOf(domElement) === -1) {
      this.viewports.push(domElement);
    }
    this.pointers.attachElement(domElement);
    this.cameras.set(domElement, camera);
  }
  detachViewport(domElement) {
    if (this.viewports.indexOf(domElement) !== -1) {
      this.viewports.splice(this.viewports.indexOf(domElement), 1);
    }
    this.pointers.detachElement(domElement);
    this.cameras.delete(domElement);
  }
  // Viewport event handlers
  onViewportPointerDown(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    this.dispatchEvent('pointerdown', {event: event.detail.event, pointers: pointers, camera: camera});
  }
  onViewportPointerHover(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    this.dispatchEvent('pointerhover', {event: event.detail.event, pointers: pointers, camera: camera});
  }
  onViewportPointerMove(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    this.dispatchEvent('pointermove', {event: event.detail.event, target: target, pointers: pointers, camera: camera});
  }
  onViewportPointerUp(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    this.dispatchEvent('pointerup', {event: event.detail.event, target: target, pointers: pointers, camera: camera});
  }
  onViewportPointerLeave(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    this.dispatchEvent('pointerleave', {event: event.detail.event, target: target, pointers: pointers, camera: camera});
  }
  onViewportContextmenu(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    this.dispatchEvent('contextmenu', {event: event.detail.event, target: target, camera: camera});
  }
  onViewportKeyDown(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    this.dispatchEvent('keykown', {event: event.detail.event, target: target, camera: camera});
  }
  onViewportKeyUp(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    this.dispatchEvent('keyup', {event: event.detail.event, target: target, camera: camera});
  }
  onViewportWheel(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    this.dispatchEvent('wheel', {event: event.detail.event, target: target, camera: camera});
  }
  onViewportFocus(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    this.dispatchEvent('focus', {event: event.detail.event, target: target, camera: camera});
  }
  onViewportBlur(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    this.dispatchEvent('blur', {event: event.detail.event, target: target, camera: camera});
  }
  //
  dispose() {
    super.dispose();
    for (var i = this.viewports.length; i--;) {
      this.detachViewport(this.viewports[i]);
    }
    this.pointers.dispose();
    delete this.viewports;
    delete this.cameras;
    delete this.pointers;
    delete this.onViewportPointerDown;
    delete this.onViewportPointerHover;
    delete this.onViewportPointerMove;
    delete this.onViewportPointerUp;
    delete this.onViewportContextmenu;
    delete this.onViewportWheel;
    delete this.onViewportKeyDown;
    delete this.onViewportKeyUp;
    delete this.onViewportFocus;
    delete this.onViewportBlur;
  }
};

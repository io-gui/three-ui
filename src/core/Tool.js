/**
 * @author arodic / https://github.com/arodic
 */

import {Scene} from "../../../three.js/build/three.module.js";
import {IoCore} from "../../../io/build/io-core.js";
import {Pointers} from "./Pointers.js";

export class Tool extends IoCore {
  static get properties() {
    return {
      enabled: true,
      active: false,
      state: -1,
      scene: Scene,
      helperScene: Scene,
      viewports: [],
      cameras: WeakMap,
      pointers: Pointers,
    };
  }
  get bindings() {
    return {
      pointers: {enabled: this.bind('enabled')}
    }
  }
  constructor(props = {}) {
    super(props);

    this.pointers.addEventListener('pointerdown', this.onViewportPointerdown.bind(this));
    this.pointers.addEventListener('pointerhover', this.onViewportPointerhover.bind(this));
    this.pointers.addEventListener('pointermove', this.onViewportPointermove.bind(this));
    this.pointers.addEventListener('pointerup', this.onViewportPointerup.bind(this));
    this.pointers.addEventListener('pointerleave', this.onViewportPointerleave.bind(this));
    this.pointers.addEventListener('contextmenu', this.onViewportContextmenu.bind(this));
    this.pointers.addEventListener('wheel', this.onViewportWheel.bind(this));
    this.pointers.addEventListener('keydown', this.onViewportKeydown.bind(this));
    this.pointers.addEventListener('keyup', this.onViewportKeyup.bind(this));
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
  onViewportPointerdown(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('pointerdown', {event: event.detail.event, target: target, rect: rect, pointers: pointers, camera: camera});
  }
  onViewportPointerhover(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('pointerhover', {event: event.detail.event, target: target, rect: rect, pointers: pointers, camera: camera});
  }
  onViewportPointermove(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('pointermove', {event: event.detail.event, target: target, rect: rect, pointers: pointers, camera: camera});
  }
  onViewportPointerup(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('pointerup', {event: event.detail.event, target: target, rect: rect, pointers: pointers, camera: camera});
  }
  onViewportPointerleave(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('pointerleave', {event: event.detail.event, target: target, rect: rect, pointers: pointers, camera: camera});
  }
  onViewportContextmenu(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('contextmenu', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  onViewportKeydown(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('keykown', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  onViewportKeyup(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('keyup', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  onViewportWheel(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('wheel', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  onViewportFocus(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('focus', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  onViewportBlur(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('blur', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  dispose() {
    super.dispose();
    for (let i = this.viewports.length; i--;) {
      this.detachViewport(this.viewports[i]);
    }
    this.pointers.dispose();
    delete this.viewports;
    delete this.cameras;
    delete this.pointers;
    delete this.onViewportPointerdown;
    delete this.onViewportPointerhover;
    delete this.onViewportPointermove;
    delete this.onViewportPointerup;
    delete this.onViewportContextmenu;
    delete this.onViewportWheel;
    delete this.onViewportKeydown;
    delete this.onViewportKeyup;
    delete this.onViewportFocus;
    delete this.onViewportBlur;
  }
}

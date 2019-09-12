import {IoNode} from "../../../io/dist/io-core.js";

export class Pointers extends IoNode {
  static get properties() {
    return {
      enabled: true,
    };
  }
  constructor(props = {}) {
    super(props);

    this.domElements = [];
    this.pointers = new WeakMap();

    this.onPointerdown = this.onPointerdown.bind(this);
    this.onPointerhover = this.onPointerhover.bind(this);
    this.onPointermove = this.onPointermove.bind(this);
    this.onPointerup = this.onPointerup.bind(this);
    this.onContextmenu = this.onContextmenu.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
    this.onKeyup = this.onKeyup.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }
  attachElement(domElement) {
    if (this.domElements.indexOf(domElement) === -1) {
      domElement.addEventListener('pointerdown', this.onPointerdown);
      domElement.addEventListener('pointermove', this.onPointerhover);
      domElement.addEventListener('pointerup', this.onPointerup);
      domElement.addEventListener('pointerleave', this.onPointerleave);
      domElement.addEventListener('contextmenu', this.onContextmenu);
      domElement.addEventListener('wheel', this.onWheel);
      domElement.addEventListener('keydown', this.onKeydown);
      domElement.addEventListener('keyup', this.onKeyup);
      domElement.addEventListener('focus', this.onFocus);
      domElement.addEventListener('blur', this.onBlur);
      this.domElements.push(domElement);
    }
    this.pointers.set(domElement, {});
  }
  detachElement(domElement) {
    if (this.domElements.indexOf(domElement) !== -1) {
      this.domElements.splice(this.domElements.indexOf(domElement), 1);
      domElement.removeEventListener('pointerdown', this.onPointerdown);
      domElement.removeEventListener('pointermove', this.onPointerhover);
      domElement.removeEventListener('pointerup', this.onPointerup);
      domElement.removeEventListener('pointerleave', this.onPointerleave);
      domElement.removeEventListener('contextmenu', this.onContextmenu);
      domElement.removeEventListener('wheel', this.onWheel);
      domElement.removeEventListener('keydown', this.onKeydown);
      domElement.removeEventListener('keyup', this.onKeyup);
      domElement.removeEventListener('focus', this.onFocus);
      domElement.removeEventListener('blur', this.onBlur);
    }
    this.pointers.delete(domElement);
  }
  dispose() {
    super.dispose();
    for (let i = this.domElements.length; i--;) {
      this.detachElement(this.domElements[i]);
    }
    delete this.domElements;
    delete this.pointers;
    delete this.onPointerdown;
    delete this.onPointerhover;
    delete this.onPointermove;
    delete this.onPointerup;
    delete this.onContextmenu;
    delete this.onWheel;
    delete this.onKeydown;
    delete this.onKeyup;
    delete this.onFocus;
    delete this.onBlur;
  }
  // Viewport event handlers
  onPointerdown(event) {
    if (!this.enabled) return false;
    event.target.setPointerCapture(event.pointerId);
    const pointers = this.pointers.get(event.target);
    pointers[event.pointerId] = new Pointer(event);
    this.dispatchEvent('pointerdown', {event: event, pointers: [pointers[event.pointerId]]});
  }
  onPointerhover(event) {
    if (!this.enabled) return false;
    const pointers = this.pointers.get(event.target);
    pointers[event.pointerId] = new Pointer(event);
    if (event.buttons !== 0) {
      this.onPointermove(event);
      return;
    }
    this.dispatchEvent('pointerhover', {event: event, pointers: [pointers[event.pointerId]]});
  }
  onPointermove(event) {
    if (!this.enabled) return false;
    const pointers = this.pointers.get(event.target);
    pointers[event.pointerId] = new Pointer(event, pointers[event.pointerId].start);
    const pointerArray = [];
    for (let i in pointers) pointerArray.push(pointers[i]);
    this.dispatchEvent('pointermove', {event: event, pointers: pointerArray});
  }
  onPointerup(event) {
    if (!this.enabled) return false;
    event.target.releasePointerCapture(event.pointerId);
    const pointers = this.pointers.get(event.target);
    const pointer = new Pointer(event, pointers[event.pointerId].start);
    delete pointers[event.pointerId];
    this.dispatchEvent('pointerup', {event: event, pointers: [pointer]});
  }
  onPointerleave(event) {
    if (!this.enabled) return false;
    const pointers = this.pointers.get(event.target);
    const pointer = new Pointer(event);
    delete pointers[event.pointerId];
    this.dispatchEvent('pointerleave', {event: event, pointers: [pointer]});
  }
  onContextmenu(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('contextmenu', {event: event});
  }
  onKeydown(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('keydown', {event: event});
  }
  onKeyup(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('keyup', {event: event});
  }
  onWheel(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('wheel', {event: event});
  }
  onFocus(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('focus', {event: event});
  }
  onBlur(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('blur', {event: event});
  }
}

class Pointer {
  constructor(event, start) {
    const rect = event.target.getBoundingClientRect();
    const button0 = (event.buttons === 1 || event.buttons === 3 || event.buttons === 5 || event.buttons === 7) ? true : false;
    const button1 = (event.buttons === 2 || event.buttons === 6) ? true : false;
    const button2 = (event.buttons === 4) ? true : false;
    const x = (event.offsetX / rect.width) * 2.0 - 1.0;
    const y = (event.offsetY / rect.height) * - 2.0 + 1.0;
    const dx = (event.movementX / rect.width) * 2.0;
    const dy = (event.movementY / rect.height) * - 2.0;
    start = start || {x: x, y: y};
    return {
      pointerId: event.pointerId,
      target: event.target,
      rect: rect,
      type: event.type,
      pointerType: event.pointerType,
      position: {x: x, y: y},
      movement: {x: dx, y: dy},
      previous: {x: x - dx, y: y - dy},
      start: {x: start.x, y: start.y},
      distance: {x: x - start.x, y: y - start.y},
      buttons: event.buttons,
      button: button0 ? 0 : button1 ? 1 : button2 ? 2 : -1,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
    };
  }
}

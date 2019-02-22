/**
 * @author arodic / https://github.com/arodic
 */

import {IoLite} from "../../../io/build/io-lite.js";

export class Pointers extends IoLite {
	constructor(props = {}) {
		super(props);

		this.defineProperties({
			enabled: true,
		});

		this.domElements = [];
		this.pointers = new WeakMap();

		this._onPointerdown = this._onPointerdown.bind(this);
		this._onPointerhover = this._onPointerhover.bind(this);
		this._onPointermove = this._onPointermove.bind(this);
		this._onPointerup = this._onPointerup.bind(this);
		this._onContextmenu = this._onContextmenu.bind(this);
		this._onWheel = this._onWheel.bind(this);
		this._onKeydown = this._onKeydown.bind(this);
		this._onKeyup = this._onKeyup.bind(this);
		this._onFocus = this._onFocus.bind(this);
		this._onBlur = this._onBlur.bind(this);
	}
	attachElement(domElement) {
		if (this.domElements.indexOf(domElement) === -1) {
			domElement.addEventListener('pointerdown', this._onPointerdown);
			domElement.addEventListener('pointermove', this._onPointerhover);
			domElement.addEventListener('pointerup', this._onPointerup);
			domElement.addEventListener('pointerleave', this._onPointerleave);
			domElement.addEventListener('contextmenu', this._onContextmenu);
			domElement.addEventListener('wheel', this._onWheel);
			domElement.addEventListener('keydown', this._onKeydown);
			domElement.addEventListener('keyup', this._onKeyup);
			domElement.addEventListener('focus', this._onFocus);
			domElement.addEventListener('blur', this._onBlur);
			this.domElements.push(domElement);
		}
		this.pointers.set(domElement, {});
	}
	detachElement(domElement) {
		if (this.domElements.indexOf(domElement) !== -1) {
			this.domElements.splice(this.domElements.indexOf(domElement), 1);
			domElement.removeEventListener('pointerdown', this._onPointerdown);
			domElement.removeEventListener('pointermove', this._onPointerhover);
			domElement.removeEventListener('pointerup', this._onPointerup);
			domElement.removeEventListener('pointerleave', this._onPointerleave);
		}
		this.pointers.delete(domElement);
	}
	dispose() {
		super.dispose();
		for (var i = this.domElements.length; i--;) {
			this.detachElement(this.domElements[i]);
		}
		delete this.domElements;
		delete this.pointers;
		delete this._onPointerdown;
		delete this._onPointerhover;
		delete this._onPointermove;
		delete this._onPointerup;
		delete this._onContextmenu;
		delete this._onWheel;
		delete this._onKeydown;
		delete this._onKeyup;
		delete this._onFocus;
		delete this._onBlur;
	}
	// Viewport event handlers
	_onPointerdown(event) {
		if (!this.enabled) return false;
		event.target.setPointerCapture(event.pointerId);
		const pointers = this.pointers.get(event.target);
		pointers[event.pointerID] = new Pointer(event);
		this.dispatchEvent('pointerdown', [pointers[event.pointerID]]);
	}
	_onPointerhover(event) {
		if (!this.enabled) return false;
		if (event.buttons !== 0) {
			this._onPointermove(event);
			return;
		}
		const pointer = new Pointer(event);
		this.dispatchEvent('pointerhover', [pointer]);
	}
	_onPointermove(event) {
		if (!this.enabled) return false;
		const pointers = this.pointers.get(event.target);
		pointers[event.pointerID] = new Pointer(event, pointers[event.pointerID].start);
		const pointerArray = [];
		for (let i in pointers) pointerArray.push(pointers[i]);
		this.dispatchEvent('pointermove', pointerArray);
	}
	_onPointerup(event) {
		if (!this.enabled) return false;
		event.target.releasePointerCapture(event.pointerId);
		const pointers = this.pointers.get(event.target);
		const pointer = new Pointer(event, pointers[event.pointerID].start);
		delete pointers[event.pointerID];
		this.dispatchEvent('pointerup', [pointer]);
	}
	_onPointerleave(event) {
		if (!this.enabled) return false;
		const pointers = this.pointers.get(event.target);
		const pointer = new Pointer(event, pointers[event.pointerID].start);
		delete pointers[event.pointerID];
		this.dispatchEvent('pointerleave', [pointer]);
	}
	_onContextmenu(event) {
		if (!this.enabled) return false;
		this.dispatchEvent('contextmenu', event);
	}
	_onKeydown(event) {
		if (!this.enabled) return false;
		this.dispatchEvent('keydown', event);
	}
	_onKeyup(event) {
		if (!this.enabled) return false;
		this.dispatchEvent('keyup', event);
	}
	_onWheel(event) {
		if (!this.enabled) return false;
		this.dispatchEvent('wheel', event);
	}
	_onFocus(event) {
		if (!this.enabled) return false;
		this.dispatchEvent('focus', event);
	}
	_onBlur(event) {
		if (!this.enabled) return false;
		this.dispatchEvent('blur', event);
	}
};

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
			pointerID: event.pointerID,
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
		}
	}
}

import {Node} from "../../../iogui/build/io.js";

export class Pointers extends Node {
	static get Properties() {
		return {
			enabled: true,
			elements: [],
			elementPointers: WeakMap,
		};
	}
	attachElement(domElement) {
		if (this.elements.indexOf(domElement) === -1) {
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
			this.elements.push(domElement);
		}
		this.elementPointers.set(domElement, {});
	}
	detachElement(domElement) {
		if (this.elements.indexOf(domElement) !== -1) {
			this.elements.splice(this.elements.indexOf(domElement), 1);
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
		this.elementPointers.delete(domElement);
	}
	dispose() {
		super.dispose();
		for (let i = this.elements.length; i--;) {
			this.detachElement(this.elements[i]);
		}
		delete this.elements;
		delete this.elementPointers;
	}
	// Viewport event handlers
	onPointerdown(event) {
		if (!this.enabled) return false;
		const id = event.pointerId;
		event.target.setPointerCapture(id);
		const pointers = this.elementPointers.get(event.target);
		pointers[id] = new Pointer(event);
		this.dispatchEvent('pointerdown', {event: event, pointers: [pointers[id]]});
	}
	onPointerhover(event) {
		if (!this.enabled) return false;
		if (event.buttons === 0) {
			const pointer = new Pointer(event);
			this.dispatchEvent('pointerhover', {event: event, pointers: [pointer]});
		}
		else {
			this.onPointermove(event);
		}
	}
	onPointermove(event) {
		// NOTE: for several PointerEvent implementations firing multiple times in rAF cycle.
		this.throttle(this.onPointermoveThrottled, event);
	}
	onPointermoveThrottled(event) {
		if (!this.enabled) return false;
		const id = event.pointerId;
		const pointers = this.elementPointers.get(event.target);
		pointers[id] = new Pointer(event, pointers[id]);
		const pointerArray = [];
		for (let i in pointers) pointerArray.push(pointers[i]);
		this.dispatchEvent('pointermove', {event: event, pointers: pointerArray});
	}
	onPointerup(event) {
		if (!this.enabled) return false;
		const id = event.pointerId;
		event.target.releasePointerCapture(id);
		const pointers = this.elementPointers.get(event.target);
		const pointer = new Pointer(event, pointers[id]);
		delete pointers[id];
		this.dispatchEvent('pointerup', {event: event, pointers: [pointer]});
	}
	onPointerleave(event) {
		if (!this.enabled) return false;
		const id = event.pointerId;
		const pointers = this.elementPointers.get(event.target);
		const pointer = new Pointer(event);
		pointers[id] = undefined;
		delete pointers[id];
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

Pointers.Register();

class Pointer {
	constructor(event, previousPointer) {
		const rect = event.target.getBoundingClientRect();
		const button0 = (event.buttons === 1 || event.buttons === 3 || event.buttons === 5 || event.buttons === 7) ? true : false;
		const button1 = (event.buttons === 2 || event.buttons === 6) ? true : false;
		const button2 = (event.buttons === 4) ? true : false;
		const x = (event.offsetX / rect.width) * 2.0 - 1.0;
		const y = (event.offsetY / rect.height) * - 2.0 + 1.0;
		const dx = (event.movementX / rect.width) * 2.0;
		const dy = (event.movementY / rect.height) * - 2.0;
		const start = previousPointer ? previousPointer.start : {x: x, y: y};
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

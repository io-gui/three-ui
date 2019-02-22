/**
 * @author arodic / https://github.com/arodic
 */

import {IoLite} from "../../../io/build/io-lite.js";
import {Pointers} from "./Pointers.js";

export class ViewportTool extends IoLite {
	constructor(props = {}) {
		super(props);

		this.defineProperties({
			// object: props.object || null,
			enabled: true,
		});

		// this.pointers = new Pointers();

		this.viewports = [];
		this.cameras = new WeakMap();
		this.pointers = new WeakMap();

		this.onViewportPointerDown = this.onViewportPointerDown.bind(this);
		this.onViewportPointerHover = this.onViewportPointerHover.bind(this);
		this.onViewportPointerMove = this.onViewportPointerMove.bind(this);
		this.onViewportPointerUp = this.onViewportPointerUp.bind(this);
		this.onViewportContextmenu = this.onViewportContextmenu.bind(this);
		this.onViewportWheel = this.onViewportWheel.bind(this);
		this.onViewportKeyDown = this.onViewportKeyDown.bind(this);
		this.onViewportKeyUp = this.onViewportKeyUp.bind(this);
		this.onViewportFocus = this.onViewportFocus.bind(this);
		this.onViewportBlur = this.onViewportBlur.bind(this);

		if (props.domElement && props.camera) {
			this.attachViewport(props.domElement, props.camera);
		}
	}
	attachViewport(domElement, camera) {
		if (this.viewports.indexOf(domElement) === -1) {
			domElement.addEventListener('pointerdown', this.onViewportPointerDown);
			domElement.addEventListener('pointermove', this.onViewportPointerHover);
			domElement.addEventListener('pointerup', this.onViewportPointerUp);
			domElement.addEventListener('pointerleave', this.onViewportPointerLeave);
			domElement.addEventListener('contextmenu', this.onViewportContextmenu);
			domElement.addEventListener('wheel', this.onViewportWheel);
			domElement.addEventListener('keydown', this.onViewportKeyDown);
			domElement.addEventListener('keyup', this.onViewportKeyUp);
			domElement.addEventListener('focus', this.onViewportFocus);
			domElement.addEventListener('blur', this.onViewportBlur);
			this.viewports.push(domElement);
		}
		this.cameras.set(domElement, camera);
		this.pointers.set(domElement, {});
	}
	detachViewport(domElement) {
		if (this.viewports.indexOf(domElement) !== -1) {
			this.viewports.splice(this.viewports.indexOf(domElement), 1);
			domElement.removeEventListener('pointerdown', this.onViewportPointerDown);
			domElement.removeEventListener('pointermove', this.onViewportPointerHover);
			domElement.removeEventListener('pointerup', this.onViewportPointerUp);
			domElement.removeEventListener('pointerleave', this.onViewportPointerLeave);
		}
		this.cameras.delete(domElement);
		this.pointers.delete(domElement);
	}
	dispose() {
		super.dispose();
		for (var i = this.viewports.length; i--;) {
			this.detachViewport(this.viewports[i]);
		}
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
	// Viewport event handlers
	onViewportPointerDown(event) {
		if (!this.enabled) return false;
		event.target.setPointerCapture(event.pointerId);
		const pointers = this.pointers.get(event.target);
		const camera = this.cameras.get(event.target);
		pointers[event.pointerID] = new Pointer(event);
		this.onPointerDown(event, [pointers[event.pointerID]], camera);
	}
	onViewportPointerHover(event) {
		if (!this.enabled) return false;
		if (event.buttons !== 0) {
			this.onViewportPointerMove(event);
			return;
		}
		const pointer = new Pointer(event);
		const camera = this.cameras.get(event.target);
		this.onPointerHover(event, [pointer], camera);
	}
	onViewportPointerMove(event) {
		if (!this.enabled) return false;
		const pointers = this.pointers.get(event.target);
		const camera = this.cameras.get(event.target);
		pointers[event.pointerID] = new Pointer(event, pointers[event.pointerID].start);
		const pointerArray = [];
		for (let i in pointers) pointerArray.push(pointers[i]);
		this.onPointerMove(event, pointerArray, camera);
	}
	onViewportPointerUp(event) {
		if (!this.enabled) return false;
		event.target.releasePointerCapture(event.pointerId);
		const pointers = this.pointers.get(event.target);
		const camera = this.cameras.get(event.target);
		const pointer = new Pointer(event, pointers[event.pointerID].start);
		delete pointers[event.pointerID];
		this.onPointerUp(event, [pointer], camera);
	}
	onViewportPointerLeave(event) {
		if (!this.enabled) return false;
		const pointers = this.pointers.get(event.target);
		const camera = this.cameras.get(event.target);
		const pointer = new Pointer(event, pointers[event.pointerID].start);
		delete pointers[event.pointerID];
		this.onPointerLeave(event, [pointer], camera);
	}
	onViewportContextmenu(event) {
		if (!this.enabled) return false;
		const camera = this.cameras.get(event.target);
		this.onContextmenu(event, camera);
	}
	onViewportKeyDown(event) {
		if (!this.enabled) return false;
		const camera = this.cameras.get(event.target);
		this.onKeyDown(event, camera);
	}
	onViewportKeyUp(event) {
		if (!this.enabled) return false;
		const camera = this.cameras.get(event.target);
		this.onKeyUp(event, camera);
	}
	onViewportWheel(event) {
		if (!this.enabled) return false;
		const camera = this.cameras.get(event.target);
		this.onWheel(event, camera);
	}
	onViewportFocus(event) {
		if (!this.enabled) return false;
		const camera = this.cameras.get(event.target);
		this.onFocus(event, camera);
	}
	onViewportBlur(event) {
		if (!this.enabled) return false;
		const camera = this.cameras.get(event.target);
		this.onBlur(event, camera);
	}
	// Tool handlers - implemented in subclass!
	onPointerDown(event, pointers, camera) {
		(event, pointers, camera);
	}
	onPointerHover(event, pointers, camera) {
		(event, pointers, camera);
	}
	onPointerMove(event, pointers, camera) {
		(event, pointers, camera);
	}
	onPointerUp(event, pointers, camera) {
		(event, pointers, camera);
	}
	onPointerLeave(event, pointers, camera) {
		(event, pointers, camera);
	}
	onContextmenu(event, camera) {
		event.preventDefault();
	}
	onKeyDown(event, camera) {
		(event, camera);
	}
	onKeyUp(event, camera) {
		(event, camera);
	}
	onWheel(event, camera) {
		(event, camera);
	}
	onFocus(event, camera) {
		(event, camera);
	}
	onBlur(event, camera) {
		(event, camera);
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

import {IoNode} from "../../../io/build/io.js";
import * as THREE from "../../../three.js/build/three.module.js";

export class Shot extends IoNode {
	static get Properties() {
		return {
			camera: THREE.PerspectiveCamera,
			scene: THREE.Scene,
			time: {
				value: 0,
				config: {step: 0.01}
			}
		};
	}
	constructor() {
		super();
		this.init();
	}
	init() {
	}
	dispose() {
	}
	onPropertychanged() {

	}
	play() {

	}
	pause() {

	}
	stop() {

	}
	changed() {

	}
	preRender() {

	}
	postRender() {

	}
	path(path, importurl) {
		return new URL(path, importurl).pathname;
	}
}

Shot.Register();

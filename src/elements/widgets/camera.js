import {IoElement} from "../../../../io/build/io.js";

export class ThreeWidgetCamera extends IoElement {
	static get Style() {
		return /* css */`
		:host {
			display: flex;
			flex-direction: row;
		}
		:host > io-number-slider-range {
			flex: 1 1 calc(2 * var(--io-item-height));
			margin: 0 var(--io-spacing);
		}
		:host > io-number-slider-range > io-number {
			flex: 0 0 calc(3 * var(--io-item-height));
		}
		`;
	}
	static get Properties() {
		return {
			value: {
				type: Object,
				observe: true,
			},
		};
	}
	_setValues(event) {
		const camera = this.value;
		camera.near = event.detail.value[0];
		camera.far = event.detail.value[1];
		this.dispatchEvent('object-mutated', {object: camera}, false, window);
	}
	changed() {
		const camera = this.value;
		this.template([
			['span', {class: 'io-item'}, 'near:'],
			['io-number-slider-range', {step: 0.0001, min: 0, max: 10000, exponent: 5, value: [camera.near, camera.far], 'on-value-set': this._setValues}],
			['span', {class: 'io-item'}, ':far'],
		]);
		const farnumber = this.children[1].children[2];
		farnumber.step = 1;
	}

}

ThreeWidgetCamera.Register();

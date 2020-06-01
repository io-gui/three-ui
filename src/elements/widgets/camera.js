import {IoElement} from "../../../../iogui/build/iogui.js";

export class ThreeWidgetCamera extends IoElement {
	static get Style() {
		return /* css */`
		:host {
			display: grid;
			grid-gap: var(--io-spacing);
			justify-self: stretch;
			justify-items: start;
			white-space: nowrap;
			grid-template-columns: minmax(6em, min-content) minmax(12em, 1fr);
		}
		:host > span.io-item {
			width: 100%;
			max-width: 8em !important;
			text-align: right;
		}
		`;
	}
	static get Properties() {
		return {
			value: {
				type: Object,
				observe: 1,
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
			['span', {class: 'io-item'}, 'near-far:'],
			['io-number-slider-range', {step: 0.0001, min: 0.0001, max: 10000, exponent: 5, value: [camera.near, camera.far], 'on-value-set': this._setValues}],
		]);
		const farnumber = this.children[1].children[2];
		farnumber.step = 0.1;
	}

}

ThreeWidgetCamera.Register();

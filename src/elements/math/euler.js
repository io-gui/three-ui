import {IoElement, Options} from "../../../../iogui/build/io.js";

export class ThreeEuler extends IoElement {
	static get Style() {
		return /* css */`
		:host {
			display: flex;
			flex-direction: row;
			align-self: stretch;
			justify-self: stretch;
		}
		:host > io-number {
			width: inherit;
			flex: 1 1;
		}
		:host > *:not(:last-child) {
			margin-right: var(--io-spacing);
		}
		:host > io-boolean {
			width: var(--io-line-height) !important;
		}
		`;
	}
	static get Properties() {
		return {
			value: {
				value: Object,
				observe: 1,
			},
			conversion: 180/Math.PI,
			step: Math.PI/180,
			min: -Infinity,
			max: Infinity,
			components:['x', 'y', 'z'],
		};
	}
	_onValueSet(event) {
		const item = event.composedPath()[0];
		const c = item.id;
		const value = event.detail.value;
		const oldValue = event.detail.oldValue;
		this.value[c] = value;
		const detail = {object: this.value, property: c, value: value, oldValue: oldValue};
		this.dispatchEvent('object-mutated', detail, false, window);
	}
	_onOrderSet(event) {
		const value = event.detail.value;
		const oldValue = event.detail.oldValue;
		this.value.order = value;
		const detail = {object: this.value, property: 'order', value: value, oldValue: oldValue};
		this.dispatchEvent('object-mutated', detail, false, window);
	}
	changed() {
		const elements = [];
		for (let i in this.components) {
			const c = this.components[i];
			if (this.value[c] !== undefined) {
				elements.push(['io-number', {
					id: c,
					value: this.value[c],
					conversion: this.conversion,
					step: this.step,
					min: this.min,
					max: this.max,
					ladder: true,
					'on-value-set': this._onValueSet
				}]);
			}
		}
		elements.push(['io-option-menu', {
			value: this.value.order,
			options: new Options(['YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX']),
			'on-value-set': this._onOrderSet,
		}]);
		this.template(elements);
	}
}

ThreeEuler.Register();

import {Object3D, Scene} from "../../../../three.js/build/three.module.js";
import {IoElement, Options} from "../../../../iogui/build/iogui.js";

export class ThreeWidgetObject3D extends IoElement {
	static get Style() {
		return /* css */`
		:host {
			display: flex;
			overflow: hidden;
			align-self: stretch;
			margin: var(--io-spacing) 0;
		}
		:host * {
			overflow: hidden;
		}
		:host io-boolicon {
			border: var(--io-border);
			border-color: var(--io-color-border-outset);
			background-color: var(--io-background-color-dark);
			background-image: var(--io-gradient-button);
			margin-right: var(--io-spacing);
		}
		:host io-boolicon:not([value]) > svg {
			opacity: 0.25;
		}
		:host io-icon.widget-icon {
			padding: 0;
			margin: 0 var(--io-spacing);
			width: calc(calc(2 * var(--io-item-height)) + var(--io-spacing));
			height: calc(calc(2 * var(--io-item-height)) + var(--io-spacing));
		}
		:host io-string.name {
			flex-grow: 1;
		}
		:host io-string.name:empty:before {
			content: ' Name';
			white-space: pre;
			visibility: visible;
			opacity: 0.33;
		}
		:host io-option-menu {
			margin-left: auto;
		}
		:host io-button {
			padding-left: var(--io-spacing);
			padding-right: var(--io-spacing);
			margin-right: calc(0.5 * var(--io-spacing));
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
	get scene() {
		let parent = this.value;
		while (parent instanceof Object3D) {
			if (parent instanceof Scene && !parent.parent) {
				return parent;
			}
			parent = parent.parent;
		}
		return null;
	}
	_select(child) {
		this.className = 'select';
		this.dispatchEvent('item-clicked', {value: child}, true);
	}
	_setVisible(event) {
		this.value.visible = event.detail.value;
		this.dispatchEvent('object-mutated', {object: this.value}, false, window);
	}
	_setName(event) {
		this.value.name = event.detail.value;
		this.dispatchEvent('object-mutated', {object: this.value}, false, window);
	}
	changed() {
		const object = this.value;
		const hierarchyOptions = [];

		if (object.children) {
			hierarchyOptions.push(...object.children.map(child => {
				const label = child.name || child.constructor.name;
				return {label: label, value: child, action: this._select};
			}));
		}
		if (this.scene !== object) hierarchyOptions.push({icon: "🡄", label: 'Scene', value: this.scene, action: this._select});
		if (object.parent) hierarchyOptions.push({icon: "🡄", label: 'Parent', value: object.parent, action: this._select});

		this.template([
			['div', {class: 'io-row'}, [
				['io-icon', {class: 'widget-icon', icon: 'three:grid'}],
				['div', {class: 'io-column'}, [
					['div', {class: 'io-row'}, [
						['io-boolicon', {value: object.visible, 'on-value-set': this._setVisible, true: 'icons:visibility', false: 'icons:visibility_off'}],
						['io-string', {value: object.name, 'on-value-set': this._setName, class: 'name'}],
					]],
					['div', {class: 'io-row'}, [
						// ['io-button', {icon: 'icons:layers', label: ''}],
						object.material ? ['io-button', {icon: 'three:sphere_shade', label: 'mat', value: object.material, class: 'select'}] : null,
						object.geometry ? ['io-button', {icon: 'three:mesh_triangles', label: 'geo', value: object.geometry, class: 'select'}] : null,
						hierarchyOptions.length ? ['io-option-menu', {selectable: false, options: new Options(hierarchyOptions)}] : null,
					]],
				]],
			]]
		]);
	}

}

ThreeWidgetObject3D.Register();

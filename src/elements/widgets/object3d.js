import {
	Object3D, Scene
} from "../../../../three.js/build/three.module.js";
import {IoElement} from "../../../../io/build/io.js";


export class ThreeWidgetObject3D extends IoElement {
	static get Style() {
		return /* css */`
		:host {
			display: flex;
			overflow: hidden;
		}
		:host * {
			overflow: hidden;
		}
		:host io-icon.widget-icon {
			padding: 0;
			/* margin: 0 var(--io-spacing); */
			width: calc(calc(2 * var(--io-item-height)) + var(--io-spacing));
			height: calc(calc(2 * var(--io-item-height)) + var(--io-spacing));
		}
		:host io-string:empty:before {
			content: ' Name';
			white-space: pre;
			visibility: visible;
			opacity: 0.33;
		}
		:host io-string {
			flex-grow: 1;
		}
		:host io-item {
			overflow: hidden;
			text-overflow: ellipsis;
			color: var(--io-color-link);
		}
		:host io-item:hover {
			text-decoration: underline;
		}

		`;
	}
	static get Properties() {
		return {
			value: {
				type: Object3D,
				observe: true,
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
		const parent = this.value.parent || null;
		const scene = this.scene !== this.value ? this.scene : null;
		let children = null;
		if (this.value.children && this.value.children.length) {
			children = this.value.children.map(child => {
				const label = child.name || child.constructor.name;
				return {label: label, value: child, action: this._select};
			});
		}

		const geometry = this.value.geometry || null;
		const material = this.value.material || null;

		this.template([
			['div', {class: 'io-row'}, [
				['io-icon', {class: 'widget-icon', icon: 'three:grid'}],
				['div', {class: 'io-column'}, [
					['div', {class: 'io-row'}, [
						['io-string', {value: this.value.name, 'on-value-set': this._setName}],
						['io-switch', {value: this.value.visible, 'on-value-set': this._setVisible}],
					]],
					['div', {class: 'io-row'}, [
						scene ? ['io-button', {label: 'Scene', value: scene, class: 'select'}] : null,
						parent ? ['io-button', {label: 'Parent', value: parent, class: 'select'}] : null,
						children ? ['io-option-menu', {label: 'Children ⏷', selectable: false, options: children}] : null,
						material ? ['io-button', {label: 'Material', value: material, class: 'select'}] : null,
						geometry ? ['io-button', {label: 'Geometry', value: geometry, class: 'select'}] : null,
					]],
				]],
			]]
		]);
	}

}

ThreeWidgetObject3D.Register();

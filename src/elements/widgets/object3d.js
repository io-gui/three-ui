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
		:host io-icon {
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
	changed() {
		const geometry = this.value.geometry || null;
		const material = this.value.material || null;
		const parent = this.value.parent || null;
		const children = (this.value.children && this.value.children.length) ? this.value.children : null;
		const scene = this.scene;
		this.template([
			['div', {class: 'io-row'}, [
				['io-icon', {icon: 'icons:check'}],
				['div', {class: 'io-column'}, [
					['div', {class: 'io-row'}, [
						['io-switch', {value: this.value.visible}],
						['io-string', {value: this.value.name}],
					]],
					['div', {class: 'io-row'}, [
						material ? ['io-item', {label: 'material', value: material}]: null,
						geometry ? ['io-item', {label: 'geometry', value: geometry}]: null,
						parent ? ['io-item', {label: 'parent', value: parent}] : null,
						children ? ['io-item', {label: 'children', value: children}] : null,
						scene ? ['io-item', {label: 'scene', value: scene}] : null,
					]],
				]],
			]]
		]);
	}

}

ThreeWidgetObject3D.Register();

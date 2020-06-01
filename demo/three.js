import {IoElement, Options} from "../../iogui/build/iogui.js";
import {IoContextMenu} from "../../iogui/build/io-elements.js";
import {
	PerspectiveCamera,
	Scene,
	GridHelper,
	Vector3,
	HemisphereLight
} from "../../../three.js/build/three.module.js";
import {GLTFLoader} from "../../../three.js/examples/jsm/loaders/GLTFLoader.js";
import {Selection} from "../build/three-ui.js";

const scenePath = (new URL(import.meta.url).pathname).replace('three.js', 'scene/');

export class IoDemoThree extends IoElement {
	static get Style() {
		return /* css */`
		:host {
			display: flex;
			flex: 1 1;
			flex-direction: row;
			height: 100%;
		}
		:host > three-viewport {
			align-self: flex-stretch;
			flex: 1 0;
		}
		:host > three-inspector {
			flex: 0 1 22em;
			max-width: 50%;
			overflow-y: scroll;
		}
		`;
	}
	static get Properties() {
		return {
			scene: Scene,
			selection: {
				type: Selection,
				observe: 1,
			},
			camera: PerspectiveCamera,
		};
	}
	onChange() {
		this.$.viewport.render();
	}
	constructor(props) {
		super(props);
		this.template([
			['three-viewport', {scene: this.scene, camera: this.camera, selection: this.selection, id: 'viewport'}],
			['three-inspector', {id: 'inspector', value: this.camera}],
		]);

		const contextMenu = new IoContextMenu({
			button: 2,
			options: new Options([
				{label: 'Camera', action: () => { this.$.inspector.value = this.$.viewport.camera; }},
				{label: 'Scene', action: () => { this.$.inspector.value = this.$.viewport.scene; }},
				{label: 'Renderer', action: () => { this.$.inspector.value = this.$.viewport.renderer; }},
			])
		});
		this.$.viewport.appendChild(contextMenu);

		const scene = this.scene;
		scene.add( new GridHelper( 10, 10 ) );

		const camera = this.camera;
		camera.position.set(2, 2, 2);
		camera._target = new Vector3(0, 1, 0);
		camera.lookAt( camera._target );
		scene.add( camera );

		const loader = new GLTFLoader();

		loader.load(scenePath + 'cubes.gltf', gltf => {
			gltf.scene.children.forEach(child => { scene.add( child ); });
			scene.add(new HemisphereLight(0x333333, 0xffffff, 3));
			window.dispatchEvent(new CustomEvent('object-mutated', {detail: {objects: [scene, scene.children]}}));
			// this.$.inspector.value = this.scene.children[0];
		}, undefined, function ( e ) {
			console.error( e );
		} );
		loader.manager.onLoad = this.onChange;

		this.$.inspector.addEventListener( 'change', () => {
			this.onChange();
		} );

	}
	selectionMutated() {
		this.$.inspector.value = this.$.viewport.selection.selected[0] || this.scene;
	}
}

IoDemoThree.Register();
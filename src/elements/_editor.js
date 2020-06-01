import {Scene, PerspectiveCamera, Vector3, OrthographicCamera, HemisphereLight} from "../../../three.js/build/three.module.js";
import {IoElement} from "../../dist/iogui.js";
import {GLTFLoader} from "../../lib/GLTFLoader.js";
import {EditorCameraControls} from "../controls/camera/Editor.js.js";
// import {OrbitCameraControls} from "../controls/camera/Orbit.js";
// import {TrackballCameraControls} from "../controls/camera/Trackball.js";
import {SelectionControls} from "../controls/Selection.js.js";
// import {CombinedTransformControls} from "../controls/transform/Combined.js";
import {Selection} from "../core/Selection.js";

import "./viewport.js.js";

const loader = new GLTFLoader();
const scene = new Scene();

const perspCamera = new PerspectiveCamera(90, 1, 0.0001, 100);
perspCamera.position.set(1, 1, 1);
perspCamera._target = new Vector3(0, 0.75, 0);

const topCamera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.001, 20);
topCamera.position.set(0, 10, 0);
topCamera._target = new Vector3(0, 0.75, 0);

const leftCamera = new OrthographicCamera(-0.75, 0.75, 0.75, -0.75, 0.001, 20);
leftCamera.position.set(10, 0.75, 0);
leftCamera._target = new Vector3(0, 0.75, 0);

const frontCamera = new OrthographicCamera(-0.75, 0.75, 0.75, -0.75, 0.001, 20);
frontCamera.position.set(0, 0.75, 10);
frontCamera._target = new Vector3(0, 0.75, 0);

export class ThreeEditor extends IoElement {
	static get Style() {
		return /* css */`
		:host {
			display: grid;
			grid-template-columns: 50% 50%;
		}
		:host > three-viewport {
			display: flex;
			flex: 1 1 auto;
		}
		`;
	}
	static get Properties() {
		return {
			cameraControls: EditorCameraControls,
			selectionControls: SelectionControls,
			selection: Selection,
			// transformControls: CombinedTransformControls,
		};
	}
	connectedCallback() {
		super.connectedCallback();
		if (!scene.loaded) {
			loader.load('/three-ui/demo/scene/cubes.gltf', gltf => {
				gltf.scene.children.forEach(child => { scene.add( child ); });
				scene.add(new HemisphereLight(0x333333, 0xffffff, 3));
				window.dispatchEvent(new CustomEvent('object-mutated', {detail: {object: scene}}));
			}, undefined, function ( e ) {
				console.error( e );
			} );
			scene.loaded = true;
		}
	}
	constructor(props) {
		super(props);
		const viewportProps = {
			clearAlpha: 0,
			scene: scene,
			selection: this.selection,
			// TODO: make sure previous controls do disconnect!
			cameraTool: this.cameraControls,
			selectionTool: this.selectionControls,
			// editTool: this.transformControls,
		};
		this.template([
			['three-viewport', Object.assign({id: 'viewport0', camera: perspCamera}, viewportProps)],
			['three-viewport', Object.assign({id: 'viewport1', camera: topCamera}, viewportProps)],
			['three-viewport', Object.assign({id: 'viewport2', camera: leftCamera}, viewportProps)],
			['three-viewport', Object.assign({id: 'viewport3', camera: frontCamera}, viewportProps)],
		]);
	}
}

ThreeEditor.Register();

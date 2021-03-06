import {CylinderBufferGeometry} from "../../../three.js/build/three.module.js";
import {Helper} from "./Helper.js";
// import {TransformHelper} from "./Transform.js";
import {HelperGeometry} from "./HelperGeometry.js";
import {Selection} from "../core/Selection.js";

// Reusable utility variables
const PI = Math.PI;
const HPI = PI / 2;
const EPS = 0.000001;

const corner3Geometry = new HelperGeometry([
	[new CylinderBufferGeometry(EPS, EPS, 1, 4, 1, true), {color: [1, 0, 0], position: [0.5, 0, 0], rotation: [0, 0, HPI], thickness: 1}],
	[new CylinderBufferGeometry(EPS, EPS, 1, 4, 1, true), {color: [0, 1, 0], position: [0, 0.5, 0], rotation: [0, HPI, 0], thickness: 1}],
	[new CylinderBufferGeometry(EPS, EPS, 1, 4, 1, true), {color: [0, 0, 1], position: [0, 0, 0.5], rotation: [HPI, 0, 0], thickness: 1}],
]);

const handleGeometry = {
	XYZ: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [HPI, 0, PI]}),
	XYz: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [HPI, 0, HPI]}),
	xyz: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [-HPI, 0, -HPI]}),
	xyZ: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [-HPI, 0, 0]}),
	xYZ: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [PI/2, 0, -PI/2]}),
	xYz: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [PI/2, 0, 0]}),
	Xyz: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [0, 0, HPI]}),
	XyZ: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [0, PI, 0]}),
};

export class SelectionHelper extends Helper {
	static get Properties() {
		return {
			selection: Selection,
		};
	}
	get handleGeometry() {
		return handleGeometry;
	}
	constructor(props) {
		super(props);
		this.corners = this.addGeometries(this.handleGeometry);

		// const axis = new TransformHelper({object: this});
		// axis.size = 0.01;
		// axis.doFlip = false;
		// axis.doHide = false;
		// super.add(axis);
	}
	selectionMutated(event) {
		const selected = this.selection.selected;
		console.log(selected, event);

		// if (selected.length && selected[0].geometry) {
		//	const object = selected[0];
		//
		//	if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
		//	const bbMax = object.geometry.boundingBox.max;
		//	const bbMin = object.geometry.boundingBox.min;
		//	bbMax.applyMatrix4(object.matrixWorld);
		//	bbMin.applyMatrix4(object.matrixWorld);
		//
		//	this.corners['XYZ'].position.set(bbMax.x, bbMax.y, bbMax.z);
		//	this.corners['XYz'].position.set(bbMax.x, bbMax.y, bbMin.z);
		//	this.corners['xyz'].position.set(bbMin.x, bbMin.y, bbMin.z);
		//	this.corners['xyZ'].position.set(bbMin.x, bbMin.y, bbMax.z);
		//	this.corners['xYZ'].position.set(bbMin.x, bbMax.y, bbMax.z);
		//	this.corners['xYz'].position.set(bbMin.x, bbMax.y, bbMin.z);
		//	this.corners['Xyz'].position.set(bbMax.x, bbMin.y, bbMin.z);
		//	this.corners['XyZ'].position.set(bbMax.x, bbMin.y, bbMax.z);
		//
		//	//
		//
		//	object.updateMatrixWorld();
		//	object.matrixWorld.decompose(_position, _quaternion, _scale);
		//
		//	_m1.compose(this.position, this.quaternion, _one);
		//
		//	_scale.x = Math.abs(_scale.x);
		//	_scale.y = Math.abs(_scale.y);
		//	_scale.z = Math.abs(_scale.z);
		//
		//	for (let i = 0; i < 8; i ++) {
		//
		//		_position.copy(this.children[i].position).multiply(_scale);
		//
		//		let __scale = this.scale.clone();
		//
		//		let dir = this.children[i].position.clone().applyQuaternion(this.quaternion).normalize();
		//
		//		this.children[i].material.highlight = Math.min(Math.max(3 - Math.abs(dir.dot(this.eye)) * 4, -1), 0.5);
		//
		//		__scale.x = Math.min(this.scale.x, Math.abs(_position.x) / 2);
		//		__scale.y = Math.min(this.scale.y, Math.abs(_position.y) / 2);
		//		__scale.z = Math.min(this.scale.z, Math.abs(_position.z) / 2);
		//
		//		__scale.x = Math.max(__scale.x, EPS);
		//		__scale.y = Math.max(__scale.y, EPS);
		//		__scale.z = Math.max(__scale.z, EPS);
		//
		//		_m2.compose(_position, new Quaternion, __scale);
		//
		//		this.children[i].matrixWorld.copy(_m1).multiply(_m2);
		//	}
		//
		//
		// }
	}

	updateMatrixWorld() {
		this.updateHelperMatrix();
		// this.matrixWorldNeedsUpdate = false;
		//
		// this.object.matrixWorld.decompose(_position, _quaternion, _scale);
		//
		// _m1.compose(this.position, this.quaternion, _one);
		//
		// _scale.x = Math.abs(_scale.x);
		// _scale.y = Math.abs(_scale.y);
		// _scale.z = Math.abs(_scale.z);
		//
		// for (let i = 0; i < 8; i ++) {
		//
		//	_position.copy(this.children[i].position).multiply(_scale);
		//
		//	let __scale = this.scale.clone();
		//
		//	let dir = this.children[i].position.clone().applyQuaternion(this.quaternion).normalize();
		//
		//	this.children[i].material.highlight = Math.min(Math.max(3 - Math.abs(dir.dot(this.eye)) * 4, -1), 0.5);
		//
		//	__scale.x = Math.min(this.scale.x, Math.abs(_position.x) / 2);
		//	__scale.y = Math.min(this.scale.y, Math.abs(_position.y) / 2);
		//	__scale.z = Math.min(this.scale.z, Math.abs(_position.z) / 2);
		//
		//	__scale.x = Math.max(__scale.x, EPS);
		//	__scale.y = Math.max(__scale.y, EPS);
		//	__scale.z = Math.max(__scale.z, EPS);
		//
		//	_m2.compose(_position, new Quaternion, __scale);
		//
		//	this.children[i].matrixWorld.copy(_m1).multiply(_m2);
		// }
		// this.children[8].updateMatrixWorld();
	}
}

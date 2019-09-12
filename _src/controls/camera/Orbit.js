/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 * @author arodic / http://github.com/arodic
 */

import {Vector3, Quaternion, Spherical} from "../../../../three.js/build/three.module.js";
import {CameraControls} from "../Camera.js";

/*
 * This set of controls performs orbiting, dollying, and panning.
 * Unlike TrackballCameraControls, it maintains the "up" direction camera.up (+Y by default).
 *
 *  Orbit - left mouse / touch: one-finger move
 *  Dolly - middle mouse, or mousewheel / touch: two-finger spread or squish
 *  Pan - right mouse, or left mouse + ctrlKey/altKey, wasd, or arrow keys / touch: two-finger move
 */

// Temp variables
const eye = new Vector3();
const offset = new Vector3();
const offset2 = new Vector3();
const unitY = new Vector3(0, 1, 0);
const tempQuat = new Quaternion();
const tempQuatInverse = tempQuat.clone().inverse();

export class OrbitCameraControls extends CameraControls {
  static get properties() {
    return {
      minDistance: 0, // PerspectiveCamera dolly limit
      maxDistance: Infinity, // PerspectiveCamera dolly limit
      minZoom: 0, // OrthographicCamera zoom limit
      maxZoom: Infinity, // OrthographicCamera zoom limit
      minPolarAngle: 0, // radians (0 to Math.PI)
      maxPolarAngle: Math.PI, // radians (0 to Math.PI)
      minAzimuthAngle: - Infinity, // radians (-Math.PI to Math.PI)
      maxAzimuthAngle: Infinity, // radians (-Math.PI to Math.PI)
      screenSpacePanning: false,
      _spherical: Spherical
    };
  }
  orbit(orbit, camera) {
    // camera.up is the orbit axis
    tempQuat.setFromUnitVectors(camera.up, unitY);
    tempQuatInverse.copy(tempQuat).inverse();
    eye.copy(camera.position).sub(camera._target);
    // rotate eye to "y-axis-is-up" space
    eye.applyQuaternion(tempQuat);
    // angle from z-axis around y-axis
    this._spherical.setFromVector3(eye);
    this._spherical.theta -= orbit.x;
    this._spherical.phi += orbit.y;
    // restrict theta to be between desired limits
    this._spherical.theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, this._spherical.theta));
    // restrict phi to be between desired limits
    this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi));
  }
  dolly(dolly, camera) {
    let dollyScale = (dolly > 0) ? 1 - dolly : 1 / (1 + dolly);
    if (camera.isPerspectiveCamera) {
      this._spherical.radius /= dollyScale;
    } else if (camera.isOrthographicCamera) {
      camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, camera.zoom * dollyScale));
    }
    camera.updateProjectionMatrix();

    this._spherical.makeSafe();
    // restrict radius to be between desired limits
    this._spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this._spherical.radius));
  }
  pan(pan, camera) {
    // move target to panned location

    let panLeftDist;
    let panUpDist;
    if (camera.isPerspectiveCamera) {
      // half of the fov is center to top of screen
      let fovFactor = Math.tan((camera.fov / 2) * Math.PI / 180.0);
      panLeftDist = pan.x * eye.length() * fovFactor;
      panUpDist = -pan.y * eye.length() * fovFactor;
    } else if (camera.isOrthographicCamera) {
      panLeftDist = pan.x * (camera.right - camera.left) / camera.zoom;
      panUpDist = -pan.y * (camera.top - camera.bottom) / camera.zoom;
    }

    // panLeft
    offset.setFromMatrixColumn(camera.matrix, 0);
    offset.multiplyScalar(-panLeftDist);
    offset2.copy(offset);

    // panUp
    if (this.screenSpacePanning) {
      offset.setFromMatrixColumn(camera.matrix, 1);
    } else {
      offset.setFromMatrixColumn(camera.matrix, 0);
      offset.crossVectors(camera.up, offset);
    }
    offset.multiplyScalar(panUpDist);
    offset2.add(offset);

    camera._target.add(offset2);
    offset.setFromSpherical(this._spherical);
    // rotate offset back to "camera-up-vector-is-up" space
    offset.applyQuaternion(tempQuatInverse);
    camera.position.copy(camera._target).add(offset);
    camera.lookAt(camera._target);
  }
  focus(/*camera*/) {
    // console.log(this.selection);
  }
  // utility getters
  get polarAngle() {
    return this._spherical.phi;
  }
  get azimuthalAngle() {
    return this._spherical.theta;
  }
}

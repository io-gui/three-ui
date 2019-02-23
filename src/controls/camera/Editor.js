/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author arodic / http://github.com/arodic
 */

import {Vector3, Box3, Matrix3, Spherical, Sphere} from "../../../../three.js/build/three.module.js";
import {CameraControls} from "../Camera.js";

// Reusable utility variables
const center = new Vector3();
const delta = new Vector3();
const box = new Box3();
const normalMatrix = new Matrix3();
const spherical = new Spherical();
const sphere = new Sphere();

export class EditorCameraControls extends CameraControls {
  orbit(orbit, camera) {
    delta.copy(camera.position).sub(camera._target);
    spherical.setFromVector3(delta);
    spherical.theta -= orbit.x;
    spherical.phi += orbit.y;
    spherical.makeSafe();
    delta.setFromSpherical(spherical);
    camera.position.copy(camera._target).add(delta);
    camera.lookAt(camera._target);
  }
  dolly(dolly, camera) {
    delta.set(0, 0, dolly);
    let distance = camera.position.distanceTo(camera._target);
    delta.multiplyScalar(distance * this.dollySpeed);
    if (delta.length() > distance) return;
    delta.applyMatrix3(normalMatrix.getNormalMatrix(camera.matrix));
    camera.position.add(delta);
  }
  pan(pan, camera) {
    let distance = camera.position.distanceTo(camera._target);
    delta.set(-pan.x, -pan.y, 0);
    delta.multiplyScalar(distance);
    delta.applyMatrix3(normalMatrix.getNormalMatrix(camera.matrix));
    camera.position.add(delta);
    camera._target.add(delta);
  }
  focus(object, camera) {
    let distance;
    box.setFromObject(object);
    if (box.isEmpty() === false) {
      camera._target.copy(box.getCenter(center));
      distance = box.getBoundingSphere(sphere).radius;
    } else {
      // Focusing on an Group, AmbientLight, etc
      camera._target.setFromMatrixPosition(object.matrixWorld);
      distance = 0.1;
    }
    delta.set(0, 0, 1);
    delta.applyQuaternion(camera.quaternion);
    delta.multiplyScalar(distance * 4);
    camera.position.copy(camera._target).add(delta);
  }
}

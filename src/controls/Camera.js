/**
 * @author arodic / http://github.com/arodic
 */

import {Vector2, Vector3, MOUSE} from "../../../three.js/build/three.module.js";
import {Tool} from "../core/Tool.js";
import {Animation} from "../core/Animation.js";

/*
 * CameraControls is a base class for controls performing orbiting, dollying, and panning.
 *
 *    Orbit - left mouse / touch: one-finger move
 *    Dolly - middle mouse, or mousewheel / touch: two-finger spread or squish
 *    Pan - right mouse, or left mouse + ctrlKey/altKey, wasd, or arrow keys / touch: two-finger move
 */

const STATE = {NONE: - 1, ORBIT: 0, DOLLY: 1, PAN: 2, DOLLY_PAN: 3};
const EPS = 0.000001;

// Temp variables
const direction = new Vector2();
const aspectMultiplier = new Vector2();
const orbit = new Vector2();
const pan = new Vector2();

// Framerate-independent damping
function dampTo(source, target, smoothing, dt) {
  const t = 1 - Math.pow(smoothing, dt);
  return source * (1 - t) + target * t;
}

export class CameraControls extends Tool {
  static get properties() {
    return {
      enableOrbit: true,
      enableDolly: true,
      enablePan: true,
      enableFocus: true,
      orbitSpeed: 1.0,
      dollySpeed: 1.0,
      panSpeed: 1.0,
      keyOrbitSpeed: 0.1,
      keyDollySpeed: 0.1,
      keyPanSpeed: 0.1,
      wheelDollySpeed: 0.02,
      autoOrbit: Vector2,
      autoDollyPan: Vector3,
      enableDamping: true,
      dampingFactor: 0.05,
    };
  }
  constructor(props) {
    super(props);

    this.KEYS = {
      PAN_LEFT: 37, /* left */
      PAN_UP: 38, /* up */
      PAN_RIGHT: 39, /* right */
      PAN_DOWN: 40, /* down */
      ORBIT_LEFT: 65, /* A */
      ORBIT_RIGHT: 68, /* D */
      ORBIT_UP: 83, /* S */
      ORBIT_DOWN: 87, /* W */
      DOLLY_OUT: 189, /* + */
      DOLLY_IN: 187, /* - */
      FOCUS: 70 /* F */
    },
    this.BUTTON = {LEFT: MOUSE.LEFT, MIDDLE: MOUSE.MIDDLE, RIGHT: MOUSE.RIGHT}, // Mouse buttons

    this.animation = new Animation();
    this.animation.addEventListener('animation', event => {
      this.update(event.detail.timestep);
    });
    this.addEventListener('pointermove', this.onPointermove.bind(this));
    this.addEventListener('pointerup', this.onPointerup.bind(this));
  }
  dispose() {
    super.dispose();
  }
  attachViewport(domElement, camera) {
    super.attachViewport(domElement, camera);
    camera._target = camera._target || new Vector3();
    camera._state = camera._state || {
      _orbit: new Vector2(),
      _orbitV: new Vector2(),
      _pan: new Vector2(),
      _panV: new Vector2(),
      _dolly: 0,
      _dollyV: 0
    };
    camera.lookAt(camera._target);
    this.animation.startAnimation(0);
  }
  stateChanged() {
    this.active = this.state !== STATE.NONE;
    this.animation.startAnimation(0);
  }
  update(timestep) {
    let dt = timestep / 1000;

    for (let i = this.viewports.length; i--;) {

      const camera = this.cameras.get(this.viewports[i]);

      // Apply orbit intertia
      if (this.state !== STATE.ORBIT) {
        if (this.enableDamping) {
          camera._state._orbitV.x = dampTo(camera._state._orbitV.x, this.autoOrbit.x, this.dampingFactor, dt);
          camera._state._orbitV.y = dampTo(camera._state._orbitV.y, 0.0, this.dampingFactor, dt);
        }
      } else {
        camera._state._orbitV.set(this.autoOrbit.x, 0);
      }

      camera._state._orbit.x += camera._state._orbitV.x;
      camera._state._orbit.y += camera._state._orbitV.y;

      // Apply pan intertia
      if (this.state !== STATE.PAN) {
        camera._state._panV.x = dampTo(camera._state._panV.x, 0.0, this.dampingFactor, dt);
        camera._state._panV.y = dampTo(camera._state._panV.y, 0.0, this.dampingFactor, dt);
      } else {
        camera._state._panV.set(0, 0);
      }
      camera._state._pan.x += camera._state._panV.x;
      camera._state._pan.y += camera._state._panV.y;

      // Apply dolly intertia
      if (this.state !== STATE.DOLLY) {
        camera._state._dollyV = dampTo(camera._state._dollyV, 0.0, this.dampingFactor, dt);
      } else {
        camera._state._dollyV = 0;
      }
      camera._state._dolly += camera._state._dollyV;

      // set inertiae from current offsets
      if (this.enableDamping) {
        if (this.state === STATE.ORBIT) {
          camera._state._orbitV.copy(camera._state._orbit);
        }
        if (this.state === STATE.PAN) {
          camera._state._panV.copy(camera._state._pan);
        }
        if (this.state === STATE.DOLLY) {
          camera._state._dollyV = camera._state._dolly;
        }
      }

      this.orbit(orbit.copy(camera._state._orbit), camera);
      this.dolly(camera._state._dolly, camera);
      this.pan(pan.copy(camera._state._pan), camera);
      camera.lookAt(camera._target);

      camera._state._orbit.set(0, 0);
      camera._state._pan.set(0, 0);
      camera._state._dolly = 0;

      let viewportMaxV = 0;

      viewportMaxV = Math.max(viewportMaxV, Math.abs(camera._state._orbitV.x));
      viewportMaxV = Math.max(viewportMaxV, Math.abs(camera._state._orbitV.y));
      viewportMaxV = Math.max(viewportMaxV, Math.abs(camera._state._panV.x));
      viewportMaxV = Math.max(viewportMaxV, Math.abs(camera._state._panV.y));
      viewportMaxV = Math.max(viewportMaxV, Math.abs(camera._state._dollyV));

      if (viewportMaxV > EPS) {
        this.dispatchEvent('object-mutated', {object: camera}, false, window);
        this.animation.startAnimation(0);
      }
    }
  }
  onPointermove(event) {
    const pointers = event.detail.pointers;
    const camera = event.detail.camera;
    const rect = event.detail.rect;
    let prevDistance, distance;
    aspectMultiplier.set(rect.width / rect.height, 1);
    switch (pointers.length) {
      case 1:
        direction.copy(pointers[0].movement).multiply(aspectMultiplier);
        switch (pointers[0].button) {
          case this.BUTTON.LEFT:
            if (pointers.ctrlKey) {
              this._setPan(camera, direction.multiplyScalar(this.panSpeed));
            } else if (pointers.altKey) {
              this._setDolly(camera, pointers[0].movement.y * this.dollySpeed);
            } else {
              this._setOrbit(camera, direction.multiplyScalar(this.orbitSpeed));
            }
            break;
          case this.BUTTON.MIDDLE:
            this._setDolly(camera, pointers[0].movement.y * this.dollySpeed);
            break;
          case this.BUTTON.RIGHT:
            this._setPan(camera, direction.multiplyScalar(this.panSpeed));
            break;
        }
        break;
      // default: // 2 or more
      //   // two-fingered touch: dolly-pan
      //   // TODO: apply aspectMultiplier?
      //   distance = pointers[0].position.distanceTo(pointers[1].position);
      //   prevDistance = pointers[0].previous.distanceTo(pointers[1].previous);
      //   direction.copy(pointers[0].movement).add(pointers[1].movement).multiply(aspectMultiplier);
      //   this._setDollyPan(camera, (prevDistance - distance) * this.dollySpeed, direction.multiplyScalar(this.panSpeed));
      //   break;
    }
  }
  onPointerup(/*pointers, camera*/) {
    this.state = STATE.NONE;
  }
  // onKeyDown(event) {
  //   TODO: key inertia
  //   TODO: better state setting
  //   switch (event.keyCode) {
  //     case this.KEYS.PAN_UP:
  //       this._setPan(camera, direction.set(0, -this.keyPanSpeed));
  //       break;
  //     case this.KEYS.PAN_DOWN:
  //       this._setPan(camera, direction.set(0, this.keyPanSpeed));
  //       break;
  //     case this.KEYS.PAN_LEFT:
  //       this._setPan(camera, direction.set(this.keyPanSpeed, 0));
  //       break;
  //     case this.KEYS.PAN_RIGHT:
  //       this._setPan(camera, direction.set(-this.keyPanSpeed, 0));
  //       break;
  //     case this.KEYS.ORBIT_LEFT:
  //       this._setOrbit(camera, direction.set(this.keyOrbitSpeed, 0));
  //       break;
  //     case this.KEYS.ORBIT_RIGHT:
  //       this._setOrbit(camera, direction.set(-this.keyOrbitSpeed, 0));
  //       break;
  //     case this.KEYS.ORBIT_UP:
  //       this._setOrbit(camera, direction.set(0, this.keyOrbitSpeed));
  //       break;
  //     case this.KEYS.ORBIT_DOWN:
  //       this._setOrbit(camera, direction.set(0, -this.keyOrbitSpeed));
  //       break;
  //     case this.KEYS.DOLLY_IN:
  //       this._setDolly(camera, -this.keyDollySpeed);
  //       break;
  //     case this.KEYS.DOLLY_OUT:
  //       this._setDolly(camera, this.keyDollySpeed);
  //       break;
  //     case this.KEYS.FOCUS:
  //       this._setFocus(camera, );
  //       break;
  //     default:
  //       break;
  //   }
  //   this.active = false;
  // }
  onKeyUp() {
    // TODO: Consider improving for prevent pointer and multi-key interruptions.
    // this.active = false;
  }
  onWheel(event) {
    this.state = STATE.DOLLY;
    const camera = event.detail.camera;
    this._setDolly(camera, event.detail.delta * this.wheelDollySpeed);
    this.state = STATE.NONE;
    this.animation.startAnimation(0);
  }
  _setPan(camera, dir) {
    this.state = STATE.PAN;
    if (this.enablePan) camera._state._pan.copy(dir);
    this.animation.startAnimation(0);
  }
  _setDolly(camera, dir) {
    this.state = STATE.DOLLY;
    if (this.enableDolly) camera._state._dolly = dir;
    this.animation.startAnimation(0);
  }
  _setDollyPan(camera, dollyDir, panDir) {
    this.state = STATE.DOLLY_PAN;
    if (this.enableDolly) camera._state._dolly = dollyDir;
    if (this.enablePan) camera._state._pan.copy(panDir);
    this.animation.startAnimation(0);
  }
  _setOrbit(camera, dir) {
    this.state = STATE.ORBIT;
    if (this.enableOrbit) camera._state._orbit.copy(dir);
    this.animation.startAnimation(0);
  }
  _setFocus(camera) {
    this.state = STATE.NONE;
    if (this.object && this.enableFocus) this.focus(this.object, camera);
    this.animation.startAnimation(0);
  }

  // CameraControl methods. Implement in subclass!
  pan(/*pan, camera*/) {
    console.warn('CameraControls: pan() not implemented!');
  }
  dolly(/*dolly, camera*/) {
    console.warn('CameraControls: dolly() not implemented!');
  }
  orbit(/*orbit, camera*/) {
    console.warn('CameraControls: orbit() not implemented!');
  }
  focus(/*focus, camera*/) {
    console.warn('CameraControls: focus() not implemented!');
  }
}

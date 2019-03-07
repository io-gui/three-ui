import { IoProperties, html, IoNumber, IoCore as IoCore$1, IoElement, IoInspector, IoCollapsable } from '../../io/build/io.js';
import { IoCore, IoCoreMixin } from '../../io/build/io-core.js';
import { Scene, Vector2, Vector3, MOUSE, Box3, Matrix3, Spherical, Sphere, UniformsUtils, Color, FrontSide, ShaderMaterial, DataTexture, RGBAFormat, FloatType, NearestFilter, Sprite, Texture, Object3D, Mesh, Euler, Quaternion, Matrix4, BufferGeometry, Float32BufferAttribute, Uint16BufferAttribute, CylinderBufferGeometry, Raycaster, WebGLRenderer, PerspectiveCamera, OrthographicCamera, HemisphereLight, Clock } from '../../three.js/build/three.module.js';
import { BufferGeometryUtils } from '../lib/BufferGeometryUtils.js';
import { GLTFLoader } from '../lib/GLTFLoader.js';

class ThreeAttributes extends IoProperties {
  // static get listeners() {
  //   return {
  //     'object-mutated': 'onObjectMutated'
  //   }
  // }
  // onObjectMutated(event) {
  //   const obj = event.detail.object;
  //   for (let i = this.crumbs.length; i--;) {
  //     if ((obj instanceof Uint16Array || obj instanceof Float32Array) && this.crumbs[i].isBufferAttribute) {
  //       this.crumbs[i].needsUpdate = true;
  //     }
  //   }
  //   if (event.detail.object.isCamera) {
  //     event.detail.object.updateProjectionMatrix();
  //   }
  // }
  valueChanged() {
    const config = this._config;
    const elements = [];
    for (let c in config) {
      if (this.value[c]) {
        const tag = config[c][0];
        const protoConfig = config[c][1];
        const label = config[c].label || c;
        const itemConfig = {className: 'io-property-editor', title: label, id: c, value: this.value[c], 'on-value-set': this._onValueSet};
        elements.push(
          ['div', {className: 'io-property'}, [
            this.labeled ? ['span', {className: 'io-property-label', title: label}, label + ':'] : null,
            [tag, Object.assign(itemConfig, protoConfig)]
          ]]);
      }
    }
    this.template(elements);
  }
}

ThreeAttributes.Register();

ThreeAttributes.RegisterConfig({});

class ThreeColor extends IoProperties {
  static get style() {
    return html`<style>
    :host {
      display: flex;
      flex-direction: row;
    }
    :host > *:not(:last-child) {
      margin-right: 2px;
    }
    :host > three-color-hex {
      font-family: monospace;
      flex: 0 1 4.9em;
    }
    :host > io-number {
      flex: 1 1 calc(100% / 3 - 4.9em);
    }
    </style>`;
  }
  static get properties() {
    return {
      hex: Number
    };
  }
  hexChanged() {
    const rgb = hexToRgb(this.hex);
    this.value.r = rgb.r;
    this.value.g = rgb.g;
    this.value.b = rgb.b;
  }
  valueChanged() {
    this.hex = rgbToHex(this.value);
    this.template([
      ['io-number', {value: this.value.r, 'on-value-set': this._onValueSet, id: 'r', step: 0.01, min: 0, max: 1, strict: false}],
      ['io-number', {value: this.value.g, 'on-value-set': this._onValueSet, id: 'g', step: 0.01, min: 0, max: 1, strict: false}],
      ['io-number', {value: this.value.b, 'on-value-set': this._onValueSet, id: 'b', step: 0.01, min: 0, max: 1, strict: false}],
      ['three-color-hex', {value: this.bind('hex'), 'on-value-set': this._onValueSet, id: 'hex'}],
    ]);
  }
}

ThreeColor.Register();

class ThreeColorHex extends IoNumber {
  static get style() {
    return html`<style>
      :host::before {
        opacity: 0.5;
        content: '0x';
      }
    </style>`;
  }
  setFromText(text) {
    this.set('value', Math.floor(parseInt(text, 16)));
  }
  changed() {
    this.innerText = ( '000000' + this.value.toString( 16 ) ).slice( -6 );
    this.style.backgroundColor = '#' + this.innerText;
  }
}

ThreeColorHex.Register();

function rgbToHex(rgb) {
  return ((rgb.r * 255) << 16 ^ (rgb.g * 255) << 8 ^ (rgb.b * 255) << 0);
}

function hexToRgb(hex) {
  return {
    r: (hex >> 16 & 255) / 255,
    g: (hex >> 8 & 255) / 255,
    b: (hex & 255) / 255
  };
}

/**
 * @author arodic / https://github.com/arodic
 */

class Pointers extends IoCore {
  static get properties() {
    return {
      enabled: true,
    };
  }
  constructor(props = {}) {
    super(props);

    this.domElements = [];
    this.pointers = new WeakMap();

    this.onPointerdown = this.onPointerdown.bind(this);
    this.onPointerhover = this.onPointerhover.bind(this);
    this.onPointermove = this.onPointermove.bind(this);
    this.onPointerup = this.onPointerup.bind(this);
    this.onContextmenu = this.onContextmenu.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
    this.onKeyup = this.onKeyup.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }
  attachElement(domElement) {
    if (this.domElements.indexOf(domElement) === -1) {
      domElement.addEventListener('pointerdown', this.onPointerdown);
      domElement.addEventListener('pointermove', this.onPointerhover);
      domElement.addEventListener('pointerup', this.onPointerup);
      domElement.addEventListener('pointerleave', this.onPointerleave);
      domElement.addEventListener('contextmenu', this.onContextmenu);
      domElement.addEventListener('wheel', this.onWheel);
      domElement.addEventListener('keydown', this.onKeydown);
      domElement.addEventListener('keyup', this.onKeyup);
      domElement.addEventListener('focus', this.onFocus);
      domElement.addEventListener('blur', this.onBlur);
      this.domElements.push(domElement);
    }
    this.pointers.set(domElement, {});
  }
  detachElement(domElement) {
    if (this.domElements.indexOf(domElement) !== -1) {
      this.domElements.splice(this.domElements.indexOf(domElement), 1);
      domElement.removeEventListener('pointerdown', this.onPointerdown);
      domElement.removeEventListener('pointermove', this.onPointerhover);
      domElement.removeEventListener('pointerup', this.onPointerup);
      domElement.removeEventListener('pointerleave', this.onPointerleave);
      domElement.removeEventListener('contextmenu', this.onContextmenu);
      domElement.removeEventListener('wheel', this.onWheel);
      domElement.removeEventListener('keydown', this.onKeydown);
      domElement.removeEventListener('keyup', this.onKeyup);
      domElement.removeEventListener('focus', this.onFocus);
      domElement.removeEventListener('blur', this.onBlur);
    }
    this.pointers.delete(domElement);
  }
  dispose() {
    super.dispose();
    for (let i = this.domElements.length; i--;) {
      this.detachElement(this.domElements[i]);
    }
    delete this.domElements;
    delete this.pointers;
    delete this.onPointerdown;
    delete this.onPointerhover;
    delete this.onPointermove;
    delete this.onPointerup;
    delete this.onContextmenu;
    delete this.onWheel;
    delete this.onKeydown;
    delete this.onKeyup;
    delete this.onFocus;
    delete this.onBlur;
  }
  // Viewport event handlers
  onPointerdown(event) {
    if (!this.enabled) return false;
    event.target.setPointerCapture(event.pointerId);
    const pointers = this.pointers.get(event.target);
    pointers[event.pointerId] = new Pointer(event);
    this.dispatchEvent('pointerdown', {event: event, pointers: [pointers[event.pointerId]]});
  }
  onPointerhover(event) {
    if (!this.enabled) return false;
    if (event.buttons !== 0) {
      this.onPointermove(event);
      return;
    }
    const pointer = new Pointer(event);
    this.dispatchEvent('pointerhover', {event: event, pointers: [pointer]});
  }
  onPointermove(event) {
    if (!this.enabled) return false;
    const pointers = this.pointers.get(event.target);
    pointers[event.pointerId] = new Pointer(event, pointers[event.pointerId].start);
    const pointerArray = [];
    for (let i in pointers) pointerArray.push(pointers[i]);
    this.dispatchEvent('pointermove', {event: event, pointers: pointerArray});
  }
  onPointerup(event) {
    if (!this.enabled) return false;
    event.target.releasePointerCapture(event.pointerId);
    const pointers = this.pointers.get(event.target);
    const pointer = new Pointer(event, pointers[event.pointerId].start);
    delete pointers[event.pointerId];
    this.dispatchEvent('pointerup', {event: event, pointers: [pointer]});
  }
  onPointerleave(event) {
    if (!this.enabled) return false;
    const pointers = this.pointers.get(event.target);
    const pointer = new Pointer(event);
    delete pointers[event.pointerId];
    this.dispatchEvent('pointerleave', {event: event, pointers: [pointer]});
  }
  onContextmenu(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('contextmenu', {event: event});
  }
  onKeydown(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('keydown', {event: event});
  }
  onKeyup(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('keyup', {event: event});
  }
  onWheel(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('wheel', {event: event});
  }
  onFocus(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('focus', {event: event});
  }
  onBlur(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('blur', {event: event});
  }
}

class Pointer {
  constructor(event, start) {
    const rect = event.target.getBoundingClientRect();
    const button0 = (event.buttons === 1 || event.buttons === 3 || event.buttons === 5 || event.buttons === 7) ? true : false;
    const button1 = (event.buttons === 2 || event.buttons === 6) ? true : false;
    const button2 = (event.buttons === 4) ? true : false;
    const x = (event.offsetX / rect.width) * 2.0 - 1.0;
    const y = (event.offsetY / rect.height) * - 2.0 + 1.0;
    const dx = (event.movementX / rect.width) * 2.0;
    const dy = (event.movementY / rect.height) * - 2.0;
    start = start || {x: x, y: y};
    return {
      pointerId: event.pointerId,
      target: event.target,
      rect: rect,
      type: event.type,
      pointerType: event.pointerType,
      position: {x: x, y: y},
      movement: {x: dx, y: dy},
      previous: {x: x - dx, y: y - dy},
      start: {x: start.x, y: start.y},
      distance: {x: x - start.x, y: y - start.y},
      buttons: event.buttons,
      button: button0 ? 0 : button1 ? 1 : button2 ? 2 : -1,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
    };
  }
}

/**
 * @author arodic / https://github.com/arodic
 */

class Tool extends IoCore {
  static get properties() {
    return {
      enabled: true,
      active: false,
      state: -1,
      scene: Scene,
      helperScene: Scene,
      viewports: [],
      cameras: WeakMap,
      pointers: Pointers,
    };
  }
  get bindings() {
    return {
      pointers: {enabled: this.bind('enabled')}
    };
  }
  constructor(props = {}) {
    super(props);

    this.pointers.addEventListener('pointerdown', this.onViewportPointerdown.bind(this));
    this.pointers.addEventListener('pointerhover', this.onViewportPointerhover.bind(this));
    this.pointers.addEventListener('pointermove', this.onViewportPointermove.bind(this));
    this.pointers.addEventListener('pointerup', this.onViewportPointerup.bind(this));
    this.pointers.addEventListener('pointerleave', this.onViewportPointerleave.bind(this));
    this.pointers.addEventListener('contextmenu', this.onViewportContextmenu.bind(this));
    this.pointers.addEventListener('wheel', this.onViewportWheel.bind(this));
    this.pointers.addEventListener('keydown', this.onViewportKeydown.bind(this));
    this.pointers.addEventListener('keyup', this.onViewportKeyup.bind(this));
    this.pointers.addEventListener('focus', this.onViewportFocus.bind(this));
    this.pointers.addEventListener('blur', this.onViewportBlur.bind(this));

    if (props.domElement && props.camera) {
      this.attachViewport(props.domElement, props.camera);
    }
  }
  enabledChanged() {
    this.pointers.enabled = this.enabled;
  }
  attachViewport(domElement, camera) {
    if (this.viewports.indexOf(domElement) === -1) {
      this.viewports.push(domElement);
    }
    this.pointers.attachElement(domElement);
    this.cameras.set(domElement, camera);
  }
  detachViewport(domElement) {
    if (this.viewports.indexOf(domElement) !== -1) {
      this.viewports.splice(this.viewports.indexOf(domElement), 1);
    }
    this.pointers.detachElement(domElement);
    this.cameras.delete(domElement);
  }
  // Viewport event handlers
  onViewportPointerdown(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('pointerdown', {event: event.detail.event, target: target, rect: rect, pointers: pointers, camera: camera});
  }
  onViewportPointerhover(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('pointerhover', {event: event.detail.event, target: target, rect: rect, pointers: pointers, camera: camera});
  }
  onViewportPointermove(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('pointermove', {event: event.detail.event, target: target, rect: rect, pointers: pointers, camera: camera});
  }
  onViewportPointerup(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('pointerup', {event: event.detail.event, target: target, rect: rect, pointers: pointers, camera: camera});
  }
  onViewportPointerleave(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('pointerleave', {event: event.detail.event, target: target, rect: rect, pointers: pointers, camera: camera});
  }
  onViewportContextmenu(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('contextmenu', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  onViewportKeydown(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('keykown', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  onViewportKeyup(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('keyup', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  onViewportWheel(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('wheel', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  onViewportFocus(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('focus', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  onViewportBlur(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('blur', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  dispose() {
    super.dispose();
    for (let i = this.viewports.length; i--;) {
      this.detachViewport(this.viewports[i]);
    }
    this.pointers.dispose();
    delete this.viewports;
    delete this.cameras;
    delete this.pointers;
    delete this.onViewportPointerdown;
    delete this.onViewportPointerhover;
    delete this.onViewportPointermove;
    delete this.onViewportPointerup;
    delete this.onViewportContextmenu;
    delete this.onViewportWheel;
    delete this.onViewportKeydown;
    delete this.onViewportKeyup;
    delete this.onViewportFocus;
    delete this.onViewportBlur;
  }
}

/**
 * @author arodic / https://github.com/arodic
 */

/*
 * Creates a single requestAnimationFrame loop.
 * provides methods to control animation and update event to hook into animation updates.
 */

let time = performance.now();
const animationQueue = [];
const animate = function() {
  const newTime = performance.now();
  const timestep = newTime - time;
  time = newTime;
  for (let i = animationQueue.length; i--;) {
    animationQueue[i].animate(timestep, time);
  }
  requestAnimationFrame(animate);
};
requestAnimationFrame(animate);

class Animation extends IoCore {
  constructor() {
    super();
    this._time = 0;
    this._timeRemainging = 0;
  }
  startAnimation(duration) {
    this._time = 0;
    this._timeRemainging = Math.max(this._timeRemainging, duration * 1000 || 0);
    if (animationQueue.indexOf(this) === -1) animationQueue.push(this);
  }
  animate(timestep, time) {
    if (this._timeRemainging >= 0) {
      this._time = this._time + timestep;
      this._timeRemainging = this._timeRemainging - timestep;
      this.dispatchEvent('animation', {timestep: timestep, time: time});
    } else {
      this.stop();
    }
  }
  stop() {
    this._time = 0;
    this._timeRemainging = 0;
    animationQueue.splice(animationQueue.indexOf(this), 1);
  }
  stopAnimation() {
    this._active = false;
    cancelAnimationFrame(this._rafID);
  }
}

/**
 * @author arodic / http://github.com/arodic
 */

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

class CameraControls extends Tool {
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
    // let prevDistance, distance;
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

/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author arodic / http://github.com/arodic
 */

// Reusable utility variables
const center = new Vector3();
const delta = new Vector3();
const box = new Box3();
const normalMatrix = new Matrix3();
const spherical = new Spherical();
const sphere = new Sphere();

class EditorCameraControls extends CameraControls {
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

/**
 * @author arodic / http://github.com/arodic
 */

const selectedOld = [];

function filterItems(list, hierarchy, filter) {
  list = list instanceof Array ? list : [list];
  let filtered = [];
  for (let i = 0; i < list.length; i++) {
    if (!filter || filter(list[i])) filtered.push(list[i]);
    if (hierarchy) {
      let children = filterItems(list[i].children, hierarchy, filter);
      filtered.push(...children);
    }
  }
  return filtered;
}

class Selection extends IoCore$1 {
  static get properties() {
    return {
      selected: [],
    };
  }
  toggle(list, hierarchy, filter) {
    list = filterItems(list, hierarchy, filter);
    selectedOld.push(...this.selected);
    for (let i = list.length; i--;) {
      let index = this.selected.indexOf(list[i]);
      if (index !== -1) this.selected.splice(index, 1);
      else this.selected.push(list[i]);
    }
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  add(list, hierarchy, filter) {
    list = filterItems(list, hierarchy, filter);
    selectedOld.push(...this.selected);
    this.selected.concat(...list);
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  addFirst(list, hierarchy, filter) {
    list = filterItems(list, hierarchy, filter);
    selectedOld.push(...this.selected);
    this.selected.length = 0;
    this.selected.push(...list);
    this.selected.push(...selectedOld);
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  remove(list, hierarchy, filter) {
    list = filterItems(list, hierarchy, filter);
    selectedOld.push(...this.selected);
    for (let i = list.length; i--;) {
      let index = this.selected.indexOf(list[i]);
      if (index !== -1) this.selected.splice(i, 1);
    }
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  replace(list, hierarchy, filter) {
    list = filterItems(list, hierarchy, filter);
    selectedOld.push(...this.selected);
    this.selected.length = 0;
    this.selected.push(...list);
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  clear() {
    selectedOld.push(...this.selected);
    this.selected.length = 0;
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  dispose() {
    // TODO:
    console.log('dispose');
  }
}

// Material for outlines
class HelperMaterial extends IoCoreMixin(ShaderMaterial) {
  static get properties() {
    return {
      depthTest: true,
      depthWrite: true,
      transparent: false,
      side: FrontSide,

      color: { type: Color, change: 'uniformChanged'},
      opacity: { value: 1, change: 'uniformChanged'},
      depthBias: { value: 0, change: 'uniformChanged'},
      highlight: { value: 0, change: 'uniformChanged'},
      resolution: { type: Vector3, change: 'uniformChanged'},
    };
  }
  constructor(props = {}) {
    super(props);

    const data = new Float32Array([
      1.0 / 17.0, 0,0,0, 9.0 / 17.0, 0,0,0, 3.0 / 17.0, 0,0,0, 11.0 / 17.0, 0,0,0,
      13.0 / 17.0, 0,0,0, 5.0 / 17.0, 0,0,0, 15.0 / 17.0, 0,0,0, 7.0 / 17.0, 0,0,0,
      4.0 / 17.0, 0,0,0, 12.0 / 17.0, 0,0,0, 2.0 / 17.0, 0,0,0, 10.0 / 17.0, 0,0,0,
      16.0 / 17.0, 0,0,0, 8.0 / 17.0, 0,0,0, 14.0 / 17.0, 0,0,0, 6.0 / 17.0, 0,0,0,
    ]);
    const texture = new DataTexture( data, 4, 4, RGBAFormat, FloatType );
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;

    let color = props.color || new Color(0xffffff);
    let opacity = props.opacity !== undefined ? props.opacity : 1;

    this.color.copy(color);
    this.opacity = opacity;
    this.depthBias = props.depthBias || 0;
    this.highlight = props.highlight || 0;
    this.resolution.set(window.innerWidth, window.innerHeight, window.devicePixelRatio);

    this.uniforms = UniformsUtils.merge([this.uniforms, {
      "uColor":  {value: this.color},
      "uOpacity":  {value: this.opacity},
      "uDepthBias":  {value: this.depthBias},
      "uHighlight":  {value: this.highlight},
      "uResolution":  {value: this.resolution},
      "tDitherMatrix":  {value: texture},
    }]);

    this.uniforms.tDitherMatrix.value = texture;
    texture.needsUpdate = true;

    this.vertexShader = `

      attribute vec4 color;
      attribute float outline;

      varying vec4 vColor;
      varying float isOutline;
      varying vec2 vUv;

      uniform vec3 uResolution;
      uniform float uDepthBias;
      uniform float uHighlight;

      void main() {
        float aspect = projectionMatrix[0][0] / projectionMatrix[1][1];

        vColor = color;
        isOutline = outline;

        vec3 nor = normalMatrix * normal;
        vec4 pos = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

        // nor = (projectionMatrix * vec4(nor, 1.0)).xyz;
        nor = normalize((nor.xyz) * vec3(1., 1., 0.));

        pos.z -= uDepthBias * 0.1;
        pos.z -= uHighlight;

        float extrude = 0.0;
        if (outline > 0.0) {
          extrude = outline;
          pos.z += 0.00001;
          pos.z = max(-0.99, pos.z);
        } else {
          extrude -= outline;
          pos.z = max(-1.0, pos.z);
        }

        pos.xy /= pos.w;

        float dx = nor.x * extrude * (1.0 + uResolution.z);
        float dy = nor.y * extrude * (1.0 + uResolution.z);

        pos.x += (dx) * (1.0 / uResolution.x);
        pos.y += (dy) * (1.0 / uResolution.y);

        vUv = uv;

        pos.xy *= pos.w;

        gl_Position = pos;
      }
    `;
    this.fragmentShader = `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uHighlight;
      uniform sampler2D tDitherMatrix;

      varying vec4 vColor;
      varying float isOutline;
      varying vec2 vUv;

      void main() {

        float opacity = 1.0;
        vec3 color = vColor.rgb;

        if (isOutline > 0.0) {
          color = mix(color * vec3(0.25), vec3(0.0), max(0.0, uHighlight) );
          color = mix(color, vColor.rgb, max(0.0, -uHighlight) );
        }

        float dimming = mix(1.0, 0.0, max(0.0, -uHighlight));
        dimming = mix(dimming, 2.0, max(0.0, uHighlight));
        opacity = vColor.a * dimming;

        color = mix(vec3(0.5), saturate(color), dimming);

        gl_FragColor = vec4(color, uOpacity);

        opacity = opacity - mod(opacity, 0.25) + 0.25;

        vec2 matCoord = ( mod(gl_FragCoord.xy, 4.0) - vec2(0.5) ) / 4.0;
        vec4 ditherPattern = texture2D( tDitherMatrix, matCoord.xy );
        if (opacity < ditherPattern.r) discard;
      }
    `;
  }
  uniformChanged() {
    if (this.uniforms) ;
  }
}

HelperMaterial.Register = IoCoreMixin.Register;

/**
 * @author arodic / https://github.com/arodic
 */

class TextHelper extends IoCoreMixin(Sprite) {
  static get properties() {
    return {
      text: '',
      color: 'black',
      size: 0.5,
    };
  }
  constructor(props = {}) {
    super(props);

    this.scaleTarget = new Vector3(1, 1, 1);

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.texture = new Texture(this.canvas);

    this.material.map = this.texture;

    this.canvas.width = 256;
    this.canvas.height = 64;

    this.scale.set(1, 0.25, 1);
    this.scale.multiplyScalar(this.size);

    this.position.set(props.position[0], props.position[1], props.position[2]);
  }
  textChanged() {
    const ctx = this.ctx;
    const canvas = this.canvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold ' + canvas.height * 0.9 + 'px monospace';

    ctx.fillStyle = this.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.strokeStyle = 'black';
    ctx.lineWidth = canvas.height / 8;

    ctx.strokeText(this.text, canvas.width / 2, canvas.height / 2);
    ctx.fillText(this.text, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";

    ctx.fillText(this.text, canvas.width / 2, canvas.height / 2);

    this.texture.needsUpdate = true;
  }
}

/**
 * @author arodic / https://github.com/arodic
 */

// Reusable utility variables
const _cameraPosition = new Vector3();

/*
 * Helper extends Object3D to automatically follow its target `object` by copying transform matrices from it.
 * If `space` property is set to "world", helper will not inherit objects rotation.
 * Helpers will auto-scale in view space if `size` property is non-zero.
 */

class Helper extends IoCoreMixin(Object3D) {
  static get properties() {
    return {
      object: null,
      camera: null,
      depthBias: 0,
      space: 'local',
      size: 0
    };
  }
  constructor(props = {}) {
    super(props);
    this.eye = new Vector3();
  }
  onBeforeRender(renderer, scene, camera) {
    this.camera = camera;
  }
  depthBiasChanged() {
    this.traverse(object => {object.material.depthBias = this.depthBias;});
  }
  objectChanged() {
    this.updateHelperMatrix();
  }
  cameraChanged() {
    this.updateHelperMatrix();
  }
  spaceChanged() {
    this.updateHelperMatrix();
  }
  updateHelperMatrix() {
    if (this.object) {
      this.matrix.copy(this.object.matrix);
      this.matrixWorld.copy(this.object.matrixWorld);
      this.matrixWorld.decompose(this.position, this.quaternion, this.scale);
    } else {
      super.updateMatrixWorld();
    }

    if (this.camera) {
      let eyeDistance = 1;
      _cameraPosition.set(this.camera.matrixWorld.elements[12], this.camera.matrixWorld.elements[13], this.camera.matrixWorld.elements[14]);
      if (this.camera.isPerspectiveCamera) {
        this.eye.copy(_cameraPosition).sub(this.position);
        eyeDistance = 0.15 * this.eye.length() * (this.camera.fov / Math.PI);
        this.eye.normalize();
      } else if (this.camera.isOrthographicCamera) {
        eyeDistance = 3 * (this.camera.top - this.camera.bottom) / this.camera.zoom;
        this.eye.copy(_cameraPosition).normalize();
      }
      if (this.size) this.scale.set(1, 1, 1).multiplyScalar(eyeDistance * this.size);
    }
    if (this.space === 'world') this.quaternion.set(0, 0, 0, 1);

    this.matrixWorld.compose(this.position, this.quaternion, this.scale);
  }
  updateMatrixWorld( force ) {
    this.updateHelperMatrix();
    this.matrixWorldNeedsUpdate = false;
    for (let i = this.children.length; i--;) this.children[i].updateMatrixWorld(force);
  }
  // TODO: refactor. Consider moving to utils.
  addGeometries(geometries, props = {}) {
    const objects = [];
    for (let name in geometries) {
      objects.push(objects[name] = this.addObject(geometries[name], Object.assign(props, {name: name})));
    }
    return objects;
  }
  addObject(geometry, meshProps = {}) {

    const geometryProps = geometry.props || {};

    const materialProps = {highlight: 0};

    if (geometryProps.opacity !== undefined) materialProps.opacity = geometryProps.opacity;
    if (geometryProps.depthBias !== undefined) materialProps.depthBias = geometryProps.depthBias;
    if (meshProps.highlight !== undefined) materialProps.highlight = meshProps.highlight;

    const material = new HelperMaterial(materialProps);

    const mesh = new Mesh(geometry, material);

    meshProps = Object.assign({hidden: false, highlight: 0}, meshProps);

    mesh.positionTarget = mesh.position.clone();
    mesh.quaternionTarget = mesh.quaternion.clone();
    mesh.scaleTarget = mesh.scale.clone();

    //TODO: refactor
    for (let i in meshProps) mesh[i] = meshProps[i];
    this.add(mesh);
    return mesh;
  }
  addTextSprites(textSprites) {
    const texts = [];
    for (let name in textSprites) {
      const mesh = new TextHelper(textSprites[name]);
      mesh.name = name;
      mesh.positionTarget = mesh.position.clone();
      mesh.material.opacity = 0;
      mesh.material.visible = false;
      mesh.isInfo = true;
      texts.push(mesh);
      texts[name] = mesh;
      this.add(mesh);
    }
    return texts;
  }
}
Helper.Register = IoCoreMixin.Register;
// Helper.Register();

// Reusable utility variables
const _position = new Vector3();
const _euler = new Euler();
const _quaternion = new Quaternion();
const _scale = new Vector3();
const _matrix = new Matrix4();

class HelperGeometry extends BufferGeometry {
  constructor(geometry, props) {
    super();

    this.props = props;

    this.index = new Uint16BufferAttribute([], 1);
    this.addAttribute('position', new Float32BufferAttribute([], 3));
    this.addAttribute('uv', new Float32BufferAttribute([], 2));
    this.addAttribute('color', new Float32BufferAttribute([], 4));
    this.addAttribute('normal', new Float32BufferAttribute([], 3));
    this.addAttribute('outline', new Float32BufferAttribute([], 1));

    let chunks;
    if (geometry instanceof Array) {
      chunks = geometry;
    } else {
      chunks = [[geometry, props]];
    }

    const chunkGeometries = [];

    for (let i = chunks.length; i--;) {

      const chunk = chunks[i];

      let chunkGeo = chunk[0].clone();
      chunkGeometries.push(chunkGeo);

      let chunkProp = chunk[1] || {};

      const color = chunkProp.color || [];
      const position = chunkProp.position;
      const rotation = chunkProp.rotation;
      let scale = chunkProp.scale;

      let thickness = (chunkProp.thickness || -0) / 2;
      let outlineThickness = chunkProp.outlineThickness !== undefined ? chunkProp.outlineThickness : 1;

      if (scale && typeof scale === 'number') scale = [scale, scale, scale];

      _position.set(0, 0, 0);
      _quaternion.set(0, 0, 0, 1);
      _scale.set(1, 1, 1);

      if (position) _position.set(position[0], position[1], position[2]);
      if (rotation) _quaternion.setFromEuler(_euler.set(rotation[0], rotation[1], rotation[2]));
      if (scale) _scale.set(scale[0], scale[1], scale[2]);

      _matrix.compose(_position, _quaternion, _scale);

      chunkGeo.applyMatrix(_matrix);

      // TODO: investigate proper indexing!
      if (chunkGeo.index === null) {
        const indices = [];
        for (let j = 0; j < chunkGeo.attributes.position.count - 2; j+=3) {
          indices.push(j + 0);
          indices.push(j + 1);
          indices.push(j + 2);
        }
        chunkGeo.index = new Uint16BufferAttribute(indices, 1);
      }

      let vertCount = chunkGeo.attributes.position.count;

      if (!chunkGeo.attributes.color) {
        chunkGeo.addAttribute('color', new Float32BufferAttribute(new Array(vertCount * 4), 4));
      }

      const colorArray = chunkGeo.attributes.color.array;
      for (let j = 0; j < vertCount; j++) {
        const r = j * 4 + 0; colorArray[r] = color[0] !== undefined ? color[0] : colorArray[r];
        const g = j * 4 + 1; colorArray[g] = color[1] !== undefined ? color[1] : colorArray[g];
        const b = j * 4 + 2; colorArray[b] = color[2] !== undefined ? color[2] : colorArray[b];
        const a = j * 4 + 3; colorArray[a] = color[3] !== undefined ? color[3] : colorArray[a] || 1;
      }

      // Duplicate geometry and add outline attribute
      //TODO: enable outline overwrite (needs to know if is outline or not in combined geometry)
      if (!chunkGeo.attributes.outline) {
        const outlineArray = [];
        for (let j = 0; j < vertCount; j++) {
          outlineArray[j] = -thickness;
        }

        chunkGeo.addAttribute( 'outline', new Float32BufferAttribute(outlineArray, 1));
        BufferGeometryUtils.mergeBufferGeometries([chunkGeo, chunkGeo], false, chunkGeo);

        if (outlineThickness) {
          for (let j = 0; j < vertCount; j++) {
            chunkGeo.attributes.outline.array[(vertCount + j)] = outlineThickness + thickness;
          }
        }

        let array = chunkGeo.index.array;
        for (let j = array.length / 2; j < array.length; j+=3) {
          let a = array[j + 1];
          let b = array[j + 2];
          array[j + 1] = b;
          array[j + 2] = a;
        }
      }

      for (let j = 0; j < chunkGeo.attributes.outline.array.length; j++) {
        if (chunkGeo.attributes.outline.array[j] < 0) {
          if (chunkProp.thickness !== undefined) chunkGeo.attributes.outline.array[j] = -thickness;
        } else {
          if (chunkProp.outlineThickness !== undefined) chunkGeo.attributes.outline.array[j] = outlineThickness + thickness;
        }
      }

    }

    BufferGeometryUtils.mergeBufferGeometries(chunkGeometries, false, this);
  }
}

/**
 * @author arodic / https://github.com/arodic
 */

// Reusable utility variables
const PI = Math.PI;
const HPI = PI / 2;
const EPS$1 = 0.000001;

const corner3Geometry = new HelperGeometry([
  [new CylinderBufferGeometry(EPS$1, EPS$1, 1, 4, 2, true), {color: [1, 0, 0], position: [0.5, 0, 0], rotation: [0, 0, HPI], thickness: 1}],
  [new CylinderBufferGeometry(EPS$1, EPS$1, 1, 4, 2, true), {color: [0, 1, 0], position: [0, 0.5, 0], rotation: [0, HPI, 0], thickness: 1}],
  [new CylinderBufferGeometry(EPS$1, EPS$1, 1, 4, 2, true), {color: [0, 0, 1], position: [0, 0, 0.5], rotation: [HPI, 0, 0], thickness: 1}],
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

class SelectionHelper extends Helper {
  static get properties() {
    return {
      selection: null,
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
  selectionChanged() {
    // const selected = this.selection.selected;
    //
    // if (selected.length && selected[0].geometry) {
    //   const object = selected[0];
    //
    //   if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    //   const bbMax = object.geometry.boundingBox.max;
    //   const bbMin = object.geometry.boundingBox.min;
    //   // bbMax.applyMatrix4(object.matrixWorld);
    //   // bbMin.applyMatrix4(object.matrixWorld);
    //
    //   this.corners['XYZ'].position.set(bbMax.x, bbMax.y, bbMax.z);
    //   this.corners['XYz'].position.set(bbMax.x, bbMax.y, bbMin.z);
    //   this.corners['xyz'].position.set(bbMin.x, bbMin.y, bbMin.z);
    //   this.corners['xyZ'].position.set(bbMin.x, bbMin.y, bbMax.z);
    //   this.corners['xYZ'].position.set(bbMin.x, bbMax.y, bbMax.z);
    //   this.corners['xYz'].position.set(bbMin.x, bbMax.y, bbMin.z);
    //   this.corners['Xyz'].position.set(bbMax.x, bbMin.y, bbMin.z);
    //   this.corners['XyZ'].position.set(bbMax.x, bbMin.y, bbMax.z);
    //
    //   //
    //
    //   object.updateMatrixWorld();
    //   object.matrixWorld.decompose(_position, _quaternion, _scale);
    //
    //   _m1.compose(this.position, this.quaternion, _one);
    //
    //   _scale.x = Math.abs(_scale.x);
    //   _scale.y = Math.abs(_scale.y);
    //   _scale.z = Math.abs(_scale.z);
    //
    //   for (let i = 0; i < 8; i ++) {
    //
    //     _position.copy(this.children[i].position).multiply(_scale);
    //
    //     let __scale = this.scale.clone();
    //
    //     let dir = this.children[i].position.clone().applyQuaternion(this.quaternion).normalize();
    //
    //     this.children[i].material.highlight = Math.min(Math.max(3 - Math.abs(dir.dot(this.eye)) * 4, -1), 0.5);
    //
    //     __scale.x = Math.min(this.scale.x, Math.abs(_position.x) / 2);
    //     __scale.y = Math.min(this.scale.y, Math.abs(_position.y) / 2);
    //     __scale.z = Math.min(this.scale.z, Math.abs(_position.z) / 2);
    //
    //     __scale.x = Math.max(__scale.x, EPS);
    //     __scale.y = Math.max(__scale.y, EPS);
    //     __scale.z = Math.max(__scale.z, EPS);
    //
    //     _m2.compose(_position, new Quaternion, __scale);
    //
    //     this.children[i].matrixWorld.copy(_m1).multiply(_m2);
    //   }
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
    //   _position.copy(this.children[i].position).multiply(_scale);
    //
    //   let __scale = this.scale.clone();
    //
    //   let dir = this.children[i].position.clone().applyQuaternion(this.quaternion).normalize();
    //
    //   this.children[i].material.highlight = Math.min(Math.max(3 - Math.abs(dir.dot(this.eye)) * 4, -1), 0.5);
    //
    //   __scale.x = Math.min(this.scale.x, Math.abs(_position.x) / 2);
    //   __scale.y = Math.min(this.scale.y, Math.abs(_position.y) / 2);
    //   __scale.z = Math.min(this.scale.z, Math.abs(_position.z) / 2);
    //
    //   __scale.x = Math.max(__scale.x, EPS);
    //   __scale.y = Math.max(__scale.y, EPS);
    //   __scale.z = Math.max(__scale.z, EPS);
    //
    //   _m2.compose(_position, new Quaternion, __scale);
    //
    //   this.children[i].matrixWorld.copy(_m1).multiply(_m2);
    // }
    // this.children[8].updateMatrixWorld();
  }
}

/**
 * @author arodic / http://github.com/arodic
 */

// Temp variables
const raycaster = new Raycaster();

let time$1 = 0, dtime = 0;
const CLICK_DIST = 2;
const CLICK_TIME = 250;

class SelectionControls extends Tool {
  static get properties() {
    return {
      selection: Selection,
      helper: SelectionHelper,
    };
  }
  constructor(props) {
    super(props);
    this.addEventListener('pointerdown', this.onPointerdown.bind(this));
    this.addEventListener('pointerup', this.onPointerup.bind(this));
  }
  helperChanged(event) {
    const oldHelper = event.detail.oldValue;
    const helper = event.detail.value;
    if (oldHelper) this.helperScene.remove(oldHelper);
    if (helper) this.helperScene.remove(helper);
  }
  selectionChanged() {
    this.helper.selection = this.selection;
  }
  select(viewport, pointer, camera) {
    raycaster.setFromCamera(pointer.position, camera);
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    if (intersects.length > 0) {
      const object = intersects[0].object;
      // TODO: handle helper selection
      if (pointer.ctrlKey) {
        this.selection.toggle(object);
      } else {
        this.selection.replace(object);
      }
    } else {
      this.selection.clear();
    }
  }
  onPointerdown() {
    time$1 = Date.now();
  }
  onPointerup(event) {
    const pointers = event.detail.pointers;
    const target = event.detail.event.target;
    const camera = event.detail.camera;
    const rect = event.detail.rect;
    const x = Math.floor(pointers[0].distance.x * rect.width / 2);
    const y = Math.floor(pointers[0].distance.y * rect.height / 2);
    const length = Math.sqrt(x * x + y * y);
    dtime = Date.now() - time$1;
    if (pointers[0] && dtime < CLICK_TIME) {
      if (length < CLICK_DIST) {
        this.select(target, pointers[0], camera);
      }
    }
  }
}

const renderer = new WebGLRenderer({antialias: true, preserveDrawingBuffer: true, alpha: true});
const gl = renderer.getContext();

renderer.domElement.className = 'canvas3d';
renderer.gammaFactor = 2.2;
renderer.gammaInput = true;
renderer.gammaOutput = true;
renderer.shadowMap.enabled = true;
renderer.setClearColor(0x000000, 1.0);
renderer.autoClear = false;

let host;

let perfNow = 0;
let perfDelta = 1000;
let perfAverage = 1000;
let perfWarned;

const _performanceCheck = function() {
  if (perfWarned) return;
  perfDelta = performance.now() - perfNow;
  perfAverage = Math.min((perfAverage * 10 + perfDelta) / 11, 1000);
  perfNow = performance.now();
  if (perfAverage < 16) {
    console.warn('ThreeRenderer performance warning: rendering multiple canvases!');
    perfWarned = true;
  }
};

const renderedQueue = [];
const renderNextQueue = [];

const animate$1 = function() {
  for (let i = 0; i < renderedQueue.length; i++) renderedQueue[i].rendered = false;
  renderedQueue.length = 0;
  for (let i = 0; i < renderNextQueue.length; i++) {
    renderNextQueue[i].scheduled = false;
    renderNextQueue[i].render();
  }
  renderNextQueue.length = 0;
  requestAnimationFrame(animate$1);
};
requestAnimationFrame(animate$1);

class ThreeRenderer extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: block;
        overflow: hidden;
        position: relative;
        touch-action: none;
        user-select: none;
        box-sizing: border-box;
      }
      :host:focus {
        z-index: 2;
      }
      :host > canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        image-rendering: optimizeSpeed;             /* Older versions of FF          */
        image-rendering: -moz-crisp-edges;          /* FF 6.0+                       */
        image-rendering: -webkit-optimize-contrast; /* Safari                        */
        image-rendering: -o-crisp-edges;            /* OS X & Windows Opera (12.02+) */
        image-rendering: pixelated;                 /* Awesome future-browsers       */
        -ms-interpolation-mode: nearest-neighbor;
      }
      :host[ishost] > canvas:not(.canvas3d) {
        display: none;
      }
    </style>`;
  }
  static get properties() {
    return {
      scene: {
        type: Scene,
        change: 'renderableChanged',
      },
      camera: {
        type: PerspectiveCamera,
        change: 'renderableChanged',
      },
      ishost: {
        type: Boolean,
        reflect: true
      },
      size: [0, 0],
      tabindex: 1,
      clearColor: 0x000000,
      clearAlpha: 1,
      renderer: function () { return renderer; }
    };
  }
  static get listeners() {
    return {
      'dragstart': 'preventDefault'
    };
  }
  constructor(props) {
    super(props);
    this.template([['canvas', {id: 'canvas'}]]);
    this._ctx = this.$.canvas.getContext('2d');
    this.$.canvas.imageSmoothingEnabled = false;
  }
  renderableChanged() {
    this.queueRender();
  }
  sceneMutated() {
    this.queueRender();
  }
  cameraMutated() {
    this.queueRender();
  }
  queueRender() {
    if (!this.scheduled) {
      renderNextQueue.push(this);
      this.scheduled = true;
    }
  }
  render() {
    if (this.rendered || !this._ctx) {
      this.queueRender();
      return;
    }
    this.setHost();
    this.updateCameraAspect();
    this.preRender();
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.postRender();
    renderedQueue.push(this);
    this.rendered = true;
  }
  preRender() {}
  postRender() {}
  updateCameraAspect() {
    if (this.size[0] && this.size[1]) {
      const aspect = this.size[0] / this.size[1];
      if (this.camera instanceof PerspectiveCamera) {
        this.camera.aspect = aspect;
      }
      if (this.camera instanceof OrthographicCamera) {
        const hh = (this.camera.top - this.camera.bottom) / 2;
        let hw = hh * aspect;
        this.camera.top = hh;
        this.camera.bottom = - hh;
        this.camera.right = hw;
        this.camera.left = - hw;
        this.camera.updateMatrix();
        this.camera.updateMatrixWorld();
      }
      this.camera.updateProjectionMatrix();
    }
  }
  setHost() {
    if (!this.ishost) {
      if (host) {
        const r = window.devicePixelRatio || 1;
        host._ctx.clearRect(0, 0, host.size[0] * r, host.size[1] * r);
        host._ctx.drawImage(host.renderer.domElement, 0, 0, host.size[0] * r, host.size[1] * r);
        gl.flush();
        host.ishost = false;
      }
      host = this;
      this.appendChild(this.renderer.domElement);
      this.ishost = true;
      _performanceCheck();
    }
    if (this.size[0] && this.size[1]) {
      this.renderer.setSize(this.size[0], this.size[1]);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setClearColor(this.clearColor, this.clearAlpha);
    }
  }
  resized() {
    const rect = this.getBoundingClientRect();
    this.size[0] = Math.ceil(rect.width);
    this.size[1] = Math.ceil(rect.height);
    const r = window.devicePixelRatio || 1;
    this.$.canvas.width = this.size[0] * r;
    this.$.canvas.height = this.size[1] * r;
    if (this.size[0] && this.size[1]) {
      this.renderer.setSize(this.size[0], this.size[1]);
      this.renderer.setPixelRatio(window.devicePixelRatio);
    }
    this.render();
  }
}

ThreeRenderer.Register();

/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 * @author arodic / http://github.com/arodic
 */

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

class OrbitCameraControls extends CameraControls {
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

// import {CombinedTransformControls} from "../controls/transform/Combined.js";

class ThreeViewport extends ThreeRenderer {
  static get properties() {
    return {
      cameraTool: OrbitCameraControls,
      selectionTool: SelectionControls,
      selection: Selection,
    };
  }
  get bindings() {
    return {
      // This is top-down data flow so no bindings are needed.
      // However, using bindings here should still work.
      // TODO: investgate why it doesent.
      // cameraTool: {scene: this.bind('scene')},
      // selectionTool: {scene: this.bind('scene'), selection: this.bind('selection')},
      cameraTool: {scene: this.scene},
      selectionTool: {scene: this.scene, selection: this.selection},
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this.cameraTool.attachViewport(this, this.camera);
    this.selectionTool.attachViewport(this, this.camera);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.cameraTool.detachViewport(this, this.camera);
    this.selectionTool.detachViewport(this, this.camera);
  }
  sceneChanged() {
    this.selectionTool.scene = this.scene;
  }
  cameraChanged() {
    this.cameraTool.attachViewport(this, this.camera);
    this.selectionTool.attachViewport(this, this.camera);
  }
  selectionToolChanged(event) {
    if (event.detail.oldValue) event.detail.oldValue.detachViewport(this);
    event.detail.value.attachViewport(this, this.camera);
  }
  cameraToolChanged(event) {
    if (event.detail.oldValue) event.detail.oldValue.detachViewport(this);
    event.detail.value.attachViewport(this, this.camera);
  }
  selectionMutated(event) {
    console.log('!!!! selection mutated', event.detail, this);
    this.render();
  }
  dispose() {
    // TODO
    this.cameraTool.detachViewport(this, this.camera);
    this.selectionTool.detachViewport(this, this.camera);
  }
  preRender() {
  }
  postRender() {
    this.renderer.clearDepth();
    if (this.cameraTool.helperScene) this.renderer.render(this.cameraTool.helperScene, this.camera);
    if (this.selectionTool.helperScene) this.renderer.render(this.selectionTool.helperScene, this.camera);
  }
}

ThreeViewport.Register();

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

class ThreeEditor extends IoElement {
  static get style() {
    return html`
    <style>
      :host {
        display: grid;
        grid-template-columns: 50% 50%;
      }
      :host > three-viewport {
        display: flex;
        flex: 1 1 auto;
      }
    </style>
    `;
  }
  static get properties() {
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
      selectTool: this.selectionControls,
      // editTool: this.transformControls,
    };
    this.template([
      ['three-viewport', Object.assign({id: 'viewport0', camera: perspCamera}, viewportProps)],
      ['three-viewport', Object.assign({id: 'viewport1', camera: topCamera}, viewportProps)],
      ['three-viewport', Object.assign({id: 'viewport2', camera: leftCamera}, viewportProps)],
      ['three-viewport', Object.assign({id: 'viewport3', camera: frontCamera}, viewportProps)],
    ]);
  }
  selectionMutated(event) {
    console.log('EDITOR !!!! selection mutated', event.detail, this);
  }
}

ThreeEditor.Register();

//TODO: test

class ThreeEuler extends IoProperties {
  static get style() {
    return html`<style>
      :host {
        display: flex;
        flex-direction: row;
      }
      :host > *:not(:last-child) {
        margin-right: 2px;
      }
      :host > io-number {
        flex: 1 0;
      }
    </style>`;
  }
  valueChanged() {
    this.template([
      ['io-number', {id: 'x', conversion: 180 / Math.PI, value: this.value.x, 'on-value-set': this._onValueSet}],
      ['io-number', {id: 'y', conversion: 180 / Math.PI, value: this.value.y, 'on-value-set': this._onValueSet}],
      ['io-number', {id: 'z', conversion: 180 / Math.PI, value: this.value.z, 'on-value-set': this._onValueSet}],
      ['io-option', {id: 'order', value: this.value.order, options: ['XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX'], 'on-value-set': this._onValueSet}]
    ]);
  }
}

ThreeEuler.Register();

class ThreeInspector extends IoInspector {
  static get listeners() {
    return {
      'object-mutated': 'onObjectMutated'
    };
  }
  onObjectMutated(event) {
    const obj = event.detail.object;
    for (let i = this.crumbs.length; i--;) {
      if ((obj instanceof Uint16Array || obj instanceof Float32Array) && this.crumbs[i].isBufferAttribute) {
        this.crumbs[i].needsUpdate = true;
      }
    }
    if (event.detail.object.isCamera) {
      event.detail.object.updateProjectionMatrix();
    }
  }
}

ThreeInspector.Register();

ThreeInspector.RegisterConfig({

  "Object|main": ["name", "visible"],
  "Object|transform": [],
  "Object|rendering": [/[S,s]hadow/, /[R,r]ender/, /[D,d]raw/, /bounding/, "fog"],
  "Object|hidden": ["type", /(is[A-Z])\w+/],

  "Object3D|transform": ["position", "rotation", "scale", "up", "quaternion", /[M,m]atrix/],
  "Object3D|rendering": ["layers", "frustumCulled"],
  "Object3D|scenegraph": ["parent", "children", "target"],

  "Mesh|main": ["geometry", "material"],

  "BufferGeometry|main": ["parameters", "index", "attributes"],

  "Texture|main": ["offset", "repeat", "center", "rotation"],

  "Material|main": [
    "color", "specular", "shininess", "opacity", "wireframe", "map", "specularMap",
    "alphaMap", "envMap", "lightMap", "lightMapIntensity", "aoMap", "aoMapIntensity",
    "emissive", "emissiveMap", "emissiveIntensity", "bumpMap", "bumpScale",
    "normalMap", "normalScale", "displacementMap", "displacementScale",
    "displacementBias", "reflectivity", "refractionRatio",
  ],
  // TODO: optimize for non-regex
  "Material|rendering": [
    /(depth[A-Z])\w+/, /(blend.)\w+/, "transparent", "dithering", "flatShading", "lights", "vertexColors",
    "side", "blending", "colorWrite", "alphaTest", "combine",
    "premultipliedAlpha",
  ],

  "Camera|main": ["near", "far", "zoom", "focus", "top", "bottom", "left", "right", "fov", "aspect", "filmGauge", "filmOffset"],

  "Light|main": ["intensity", "color"],
});

IoProperties.RegisterConfig({
  // "Object|type:object": ["io-inspector-link"], // TODO: why not inherited?

  "constructor:Vector2": ["three-vector"],
  "constructor:Vector3": ["three-vector"],
  "constructor:Vector4": ["three-vector"],
  "constructor:Quaternion": ["three-vector"],
  "constructor:Euler": ["three-euler"], // TODO: setter attributes
  "constructor:Color": ["three-color"],
  "intensity": ["io-slider", {"min": 0,"max": 1}],
  "constructor:Matrix2": ["three-matrix"],
  "constructor:Matrix3": ["three-matrix"],
  "constructor:Matrix4": ["three-matrix"],
  // Object3D
  "Object3D|scale": ["three-vector", {canlink: true}],
  "Object3D|children": ["io-properties", {labeled: false, config: {'type:object': ['io-inspector-link']}}],
  // Camera
  "Camera|fov": ["io-slider", {min: 0.001, max: 180}],
  "Camera|zoom": ["io-slider", {min: 0.001, max: 100}],
  "Camera|near": ["io-slider", {min: 0.001, max: 100000}], // TODO: log
  "Camera|far": ["io-slider", {min: 0.001, max: 100000}], // TODO: log
  // BufferGeometry
  "BufferGeometry|parameters": ["io-properties"],
  "BufferGeometry|index": ["three-attributes"],
  "BufferGeometry|attributes": ["three-attributes"],
  // WebGLRenderer
  "WebGLRenderer|toneMapping": ["io-option", {"options": [
    {"value": 0, "label": "NoToneMapping"},
    {"value": 1, "label": "LinearToneMapping"},
    {"value": 2, "label": "ReinhardToneMapping"},
    {"value": 3, "label": "Uncharted2ToneMapping"},
    {"value": 4, "label": "CineonToneMapping"}]}],
  // WebGLShadowMap
  "WebGLShadowMap|type": ["io-option", {"options": [
    {"value": 0, "label": "BasicShadowMap"},
    {"value": 1, "label": "PCFShadowMap"},
    {"value": 2, "label": "PCFSoftShadowMap"}]}],
  // MeshDepthMaterial
  "MeshDepthMaterial|depthPacking": ["io-option", {"options": [
    {"value": 3200, "label": "BasicDepthPacking"},
    {"value": 3201, "label": "RGBADepthPacking"}]}],
  // Texture
  "Texture|mapping": ["io-option", {"options": [
    {"value": 300, "label": "UVMapping"},
    {"value": 301, "label": "CubeReflectionMapping"},
    {"value": 302, "label": "CubeRefractionMapping"},
    {"value": 303, "label": "EquirectangularReflectionMapping"},
    {"value": 304, "label": "EquirectangularRefractionMapping"},
    {"value": 305, "label": "SphericalReflectionMapping"},
    {"value": 306, "label": "CubeUVReflectionMapping"},
    {"value": 307, "label": "CubeUVRefractionMapping"}]}],
  "Texture|minFilter": ["io-option", {"options": [
    {"value": 1003, "label": "NearestFilter"},
    {"value": 1004, "label": "NearestMipMapNearestFilter"},
    {"value": 1005, "label": "NearestMipMapLinearFilter"},
    {"value": 1006, "label": "LinearFilter"},
    {"value": 1007, "label": "LinearMipMapNearestFilter"},
    {"value": 1008, "label": "LinearMipMapLinearFilter"}]}],
  "Texture|magFilter": ["io-option", {"options": [
    {"value": 1003, "label": "NearestFilter"},
    {"value": 1004, "label": "NearestMipMapNearestFilter"},
    {"value": 1005, "label": "NearestMipMapLinearFilter"},
    {"value": 1006, "label": "LinearFilter"},
    {"value": 1007, "label": "LinearMipMapNearestFilter"},
    {"value": 1008, "label": "LinearMipMapLinearFilter"}]}],
  "Texture|wrapS": ["io-option", {"options": [
    {"value": 1000, "label": "RepeatWrapping"},
    {"value": 1001, "label": "ClampToEdgeWrapping"},
    {"value": 1002, "label": "MirroredRepeatWrapping"}]}],
  "Texture|wrapT": ["io-option", {"options": [
    {"value": 1000, "label": "RepeatWrapping"},
    {"value": 1001, "label": "ClampToEdgeWrapping"},
    {"value": 1002, "label": "MirroredRepeatWrapping"}]}],
  "Texture|encoding": ["io-option", {"options": [
    {"value": 3000, "label": "LinearEncoding"},
    {"value": 3001, "label": "sRGBEncoding"},
    {"value": 3007, "label": "GammaEncoding"},
    {"value": 3002, "label": "RGBEEncoding"},
    {"value": 3003, "label": "LogLuvEncoding"},
    {"value": 3004, "label": "RGBM7Encoding"},
    {"value": 3005, "label": "RGBM16Encoding"},
    {"value": 3006, "label": "RGBDEncoding"}]}],
  "Texture|type": ["io-option", {"options": [
    {"value": 1009, "label": "UnsignedByteType"},
    {"value": 1010, "label": "ByteType"},
    {"value": 1011, "label": "ShortType"},
    {"value": 1012, "label": "UnsignedShortType"},
    {"value": 1013, "label": "IntType"},
    {"value": 1014, "label": "UnsignedIntType"},
    {"value": 1015, "label": "FloatType"},
    {"value": 1016, "label": "HalfFloatType"},
    {"value": 1017, "label": "UnsignedShort4444Type"},
    {"value": 1018, "label": "UnsignedShort5551Type"},
    {"value": 1019, "label": "UnsignedShort565Type"},
    {"value": 1020, "label": "UnsignedInt248Type"}]}],
  "Texture|format": ["io-option", {"options": [
    {"value": 1021, "label": "AlphaFormat"},
    {"value": 1022, "label": "RGBFormat"},
    {"value": 1023, "label": "RGBAFormat"},
    {"value": 1024, "label": "LuminanceFormat"},
    {"value": 1025, "label": "LuminanceAlphaFormat"},
    {"value": 1023, "label": "RGBEFormat"},
    {"value": 1026, "label": "DepthFormat"},
    {"value": 1027, "label": "DepthStencilFormat"},
    {"value": 33776, "label": "RGB_S3TC_DXT1_Format"},
    {"value": 33777, "label": "RGBA_S3TC_DXT1_Format"},
    {"value": 33778, "label": "RGBA_S3TC_DXT3_Format"},
    {"value": 33779, "label": "RGBA_S3TC_DXT5_Format"},
    {"value": 35840, "label": "RGB_PVRTC_4BPPV1_Format"},
    {"value": 35841, "label": "RGB_PVRTC_2BPPV1_Format"},
    {"value": 35842, "label": "RGBA_PVRTC_4BPPV1_Format"},
    {"value": 35843, "label": "RGBA_PVRTC_2BPPV1_Format"},
    {"value": 36196, "label": "RGB_ETC1_Format"},
    {"value": 37808, "label": "RGBA_ASTC_4x4_Format"},
    {"value": 37809, "label": "RGBA_ASTC_5x4_Format"},
    {"value": 37810, "label": "RGBA_ASTC_5x5_Format"},
    {"value": 37811, "label": "RGBA_ASTC_6x5_Format"},
    {"value": 37812, "label": "RGBA_ASTC_6x6_Format"},
    {"value": 37813, "label": "RGBA_ASTC_8x5_Format"},
    {"value": 37814, "label": "RGBA_ASTC_8x6_Format"},
    {"value": 37815, "label": "RGBA_ASTC_8x8_Format"},
    {"value": 37816, "label": "RGBA_ASTC_10x5_Format"},
    {"value": 37817, "label": "RGBA_ASTC_10x6_Format"},
    {"value": 37818, "label": "RGBA_ASTC_10x8_Format"},
    {"value": 37819, "label": "RGBA_ASTC_10x10_Format"},
    {"value": 37820, "label": "RGBA_ASTC_12x10_Format"},
    {"value": 37821, "label": "RGBA_ASTC_12x12_Format"}]}],
  "Texture|unpackAlignment": ["io-option", {"options": [
    {"value": 1, "label": "1"},
    {"value": 2, "label": "2"},
    {"value": 4, "label": "4"},
    {"value": 8, "label": "8"}]}],
  // Object3D
  "Object3D|drawMode": ["io-option", {"options": [
    {"value": 0, "label": "TrianglesDrawMode"},
    {"value": 1, "label": "TriangleStripDrawMode"},
    {"value": 2, "label": "TriangleFanDrawMode"}]}],
  // Material
  "Material|shininess": ["io-slider", {"min": 0,"max": 100}],
  "Material|reflectivity": ["io-slider", {"min": 0,"max": 1}],
  "Material|refractionRatio": ["io-slider", {"min": 0,"max": 1}],
  "Material|aoMapIntensity": ["io-slider", {"min": 0,"max": 1}],
  "Material|ightMapIntensity": ["io-slider", {"min": 0,"max": 1}],
  "Material|opacity": ["io-slider", {"min": 0,"max": 1}],
  "Material|blending": ["io-option", {"options": [
    {"value": 0, "label": "NoBlending"},
    {"value": 1, "label": "NormalBlending"},
    {"value": 2, "label": "AdditiveBlending"},
    {"value": 3, "label": "SubtractiveBlending"},
    {"value": 4, "label": "MultiplyBlending"},
    {"value": 5, "label": "CustomBlending"}]}],
  "Material|side": ["io-option", {"options": [
    {"value": 0, "label": "FrontSide"},
    {"value": 1, "label": "BackSide"},
    {"value": 2, "label": "DoubleSide"}]}],
  "Material|vertexColors": ["io-option", {"options": [
    {"value": 0, "label": "NoColors"},
    {"value": 1, "label": "FaceColors"},
    {"value": 2, "label": "VertexColors"}]}],
  "Material|depthFunc": ["io-option", {"options": [
    {"value": 0, "label": "NeverDepth"},
    {"value": 1, "label": "AlwaysDepth"},
    {"value": 2, "label": "LessDepth"},
    {"value": 3, "label": "LessEqualDepth"},
    {"value": 4, "label": "EqualDepth"},
    {"value": 5, "label": "GreaterEqualDepth"},
    {"value": 6, "label": "GreaterDepth"},
    {"value": 7, "label": "NotEqualDepth"}]}],
  "Material|combine": ["io-option", {"options": [
    {"value": 0, "label": "MultiplyOperation"},
    {"value": 1, "label": "MixOperation"},
    {"value": 2, "label": "AddOperation"}]}],
  "Material|blendEquation": ["io-option", {"options": [
    {"value": 100, "label": "AddEquation"},
    {"value": 101, "label": "SubtractEquation"},
    {"value": 102, "label": "ReverseSubtractEquation"},
    {"value": 103, "label": "MinEquation"},
    {"value": 104, "label": "MaxEquation"}]}],
  "Material|blendEquationAlpha": ["io-option", {"options": [
    {"value": 100, "label": "AddEquation"},
    {"value": 101, "label": "SubtractEquation"},
    {"value": 102, "label": "ReverseSubtractEquation"},
    {"value": 103, "label": "MinEquation"},
    {"value": 104, "label": "MaxEquation"}]}],
  "Material|blendSrc": ["io-option", {"options": [
    {"value": 200, "label": "ZeroFactor"},
    {"value": 201, "label": "OneFactor"},
    {"value": 202, "label": "SrcColorFactor"},
    {"value": 203, "label": "OneMinusSrcColorFactor"},
    {"value": 204, "label": "SrcAlphaFactor"},
    {"value": 205, "label": "OneMinusSrcAlphaFactor"},
    {"value": 206, "label": "DstAlphaFactor"},
    {"value": 207, "label": "OneMinusDstAlphaFactor"},
    {"value": 208, "label": "DstColorFactor"},
    {"value": 209, "label": "OneMinusDstColorFactor"},
    {"value": 210, "label": "SrcAlphaSaturateFactor"}]}],
  "Material|blendDst": ["io-option", {"options": [
    {"value": 200, "label": "ZeroFactor"},
    {"value": 201, "label": "OneFactor"},
    {"value": 202, "label": "SrcColorFactor"},
    {"value": 203, "label": "OneMinusSrcColorFactor"},
    {"value": 204, "label": "SrcAlphaFactor"},
    {"value": 205, "label": "OneMinusSrcAlphaFactor"},
    {"value": 206, "label": "DstAlphaFactor"},
    {"value": 207, "label": "OneMinusDstAlphaFactor"},
    {"value": 208, "label": "DstColorFactor"},
    {"value": 209, "label": "OneMinusDstColorFactor"},
    {"value": 210, "label": "SrcAlphaSaturateFactor"}]}],
  "Material|blendSrcAlpha": ["io-option", {"options": [
    {"value": 200, "label": "ZeroFactor"},
    {"value": 201, "label": "OneFactor"},
    {"value": 202, "label": "SrcColorFactor"},
    {"value": 203, "label": "OneMinusSrcColorFactor"},
    {"value": 204, "label": "SrcAlphaFactor"},
    {"value": 205, "label": "OneMinusSrcAlphaFactor"},
    {"value": 206, "label": "DstAlphaFactor"},
    {"value": 207, "label": "OneMinusDstAlphaFactor"},
    {"value": 208, "label": "DstColorFactor"},
    {"value": 209, "label": "OneMinusDstColorFactor"},
    {"value": 210, "label": "SrcAlphaSaturateFactor"}]}],
  "Material|blendDstAlpha": ["io-option", {"options": [
    {"value": 200, "label": "ZeroFactor"},
    {"value": 201, "label": "OneFactor"},
    {"value": 202, "label": "SrcColorFactor"},
    {"value": 203, "label": "OneMinusSrcColorFactor"},
    {"value": 204, "label": "SrcAlphaFactor"},
    {"value": 205, "label": "OneMinusSrcAlphaFactor"},
    {"value": 206, "label": "DstAlphaFactor"},
    {"value": 207, "label": "OneMinusDstAlphaFactor"},
    {"value": 208, "label": "DstColorFactor"},
    {"value": 209, "label": "OneMinusDstColorFactor"},
    {"value": 210, "label": "SrcAlphaSaturateFactor"}]}],
  "Material|shadowSide": ["io-option", {"options": [
    {"value": 0, "label": "BackSide"},
    {"value": 1, "label": "FrontSide"},
    {"value": 2, "label": "DoubleSide"}]}],
  "Material|shading": ["io-option", {"options": [
    {"value": 1, "label": "FlatShading"},
    {"value": 2, "label": "SmoothShading"}]}],
});

class ThreeMatrix extends IoCollapsable {
  static get properties() {
    return {
      value: Object,
    };
  }
  changed() {
    this.template([
      ['io-boolean', {true: 'elements', false: 'elements', value: this.bind('expanded')}],
      this.expanded ? ['div', {className: 'io-collapsable-content'}, [['io-array', {value: this.value.elements}]]] : null
    ]);
  }
}

ThreeMatrix.Register();

// import {OrbitCameraControls} from "../controls/camera/Orbit.js";

class ThreePlayer extends ThreeViewport {
  static get style() {
    return html`
    <style>
      :host:hover:not([playing])::after {
        color: white !important;
      }
      :host:not([loading]):not([playing])::after {
        content: '▶';
        color: var(--io-theme-link-color);
        display: inline-block;
        position: relative;
        top: 50%;
        left: 50%;
        margin-top: -32px;
        margin-left: -24px;
        font-size: 64px;
      }
      :host[loading]::after {
        content: '';
        display: inline-block;
        position: relative;
        top: 50%;
        left: 50%;
        margin-top: -32px;
        margin-left: -32px;
        width: 64px;
        height: 64px;
        background: var(--io-theme-link-color);
        animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
      }
      @keyframes lds-ripple {
        0% {
          width: 0;
        }
        25% {
          margin-left: -32px;
          width: 64px;
        }
        75% {
          margin-left: -32px;
          width: 64px;
        }
        100% {
          margin-left: 32px;
          width: 0;
        }
      }
      :host > canvas {
        transition: opacity 0.8s;
      }
      :host:hover:not([playing]) > canvas {
        opacity: 1;
      }
      :host:not([playing]) > canvas,
      :host[loading] > canvas {
        opacity: 0.2;
      }
    </style>
    `;
  }
  static get properties() {
    return {
      loading: {
        type: Boolean,
        reflect: true
      },
      playing: {
        type: Boolean,
        reflect: true
      },
      autoplay: false,
      time: 0,
      // controls: null,
      clock: Clock,
    };
  }
  static get listeners() {
    return {
      'pointerdown': 'play',
    };
  }
  connectedCallback() {
    if (this.autoplay) this.play();
    super.connectedCallback();
    // this.attachControls(this.controls);
    // this.controls = new OrbitCameraControls();
    // TODO: handle camera change
  }
  disconnectedCallback() {
    this.stop();
    super.disconnectedCallback();
  }
  // controlsChanged(event) {
  //   if (event.detail.oldValue) event.detail.oldValue.dispose();
  //   if (this.controls) {
  //     this.controls.addEventListener('change', this.queueRender);
  //   }
  // }
  autoplayChanged() {
    if (this.autoplay) this.play();
  }
  play() {
    if (this.playing) return;
    this._oldTime = Date.now() / 1000;
    this.playing = true;
    this.update();
  }
  pause() {
  }
  stop() {
    this.playing = false;
  }
  update() {
    if (this.playing) {
      requestAnimationFrame(this.update);
      this.time = (Date.now() / 1000) - this._oldTime;
      this.queueRender();
    }
  }
  preRender() {
  }
  postRender() {
  }
  dispose() {
    this.renderer.dispose();
    this.scene.traverse(child => {
      if (child.material) child.material.dispose();
      if (child.geometry) child.geometry.dispose();
    });
    super.dispose();
  }
}

ThreePlayer.Register();

//TODO: test

const components = {
  x: {},
  y: {},
  z: {},
  w: {}
};

class ThreeVector extends IoProperties {
  static get style() {
    return html`<style>
      :host {
        display: flex;
        flex-direction: row;
      }
      :host > *:not(:last-child) {
        margin-right: 2px;
      }
      :host > io-number {
        flex: 1 0;
      }
    </style>`;
  }
  static get properties() {
    return {
      value: function() { return { x: 0, y: 0 }; },
      conversion: 1,
      step: 0.01,
      min: -Infinity,
      max: Infinity,
      strict: false,
      underslider: false,
      canlink: false,
      linked: false,
    };
  }
  _onValueSet(event) {
    const path = event.composedPath();
    if (path[0] === this) return;
    if (event.detail.object) return; // TODO: unhack
    event.stopPropagation();
    let key = path[0].id;
    if (key && typeof key === 'string') {
      if (this.value[key] !== event.detail.value) {
        this.value[key] = event.detail.value;
      }
      if (this.linked) {
        const change = event.detail.value / event.detail.oldValue;
        for (let key2 in components) {
          if (event.detail.oldValue === 0) {
            if (this.value[key2] !== undefined) {
              this.value[key2] = event.detail.value;
            }
          } else {
            if (this.value[key2] !== undefined && key2 !== key) {
              this.value[key2] *= change;
            }
          }
        }
      }

      let detail = Object.assign({object: this.value, key: this.linked ? '*' : key}, event.detail);
      this.dispatchEvent('object-mutated', detail, false, window);
      this.dispatchEvent('value-set', detail, true); // TODO
    }
  }
  valueChanged() {
    const elements = [];
    for (let key in components) {
      if (this.value[key] !== undefined) {
        elements.push(['io-number', {
          id: key,
          value: this.value[key],
          conversion: this.conversion,
          step: this.step,
          min: this.min,
          max: this.max,
          strict: this.strict,
          'on-value-set': this._onValueSet
        }]);
      }
    }
    if (this.canlink) {
      elements.push(['io-boolean', {value: this.bind('linked'), true: '☑', false: '☐'}]);
    }
    this.template(elements);
  }
}

ThreeVector.Register();

export { ThreeAttributes, ThreeColor, ThreeEditor, ThreeEuler, ThreeInspector, ThreeMatrix, ThreePlayer, ThreeVector, ThreeRenderer, ThreeViewport };

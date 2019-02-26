import { Raycaster, Vector3, Quaternion, Plane, Vector2, BufferGeometry, BufferAttribute, Euler, Matrix4, Float32BufferAttribute, Uint16BufferAttribute, UniformsUtils, Color, FrontSide, ShaderMaterial, DataTexture, RGBAFormat, FloatType, NearestFilter, Sprite, Texture, Object3D, Mesh, CylinderBufferGeometry, TorusBufferGeometry, OctahedronBufferGeometry, PlaneBufferGeometry } from '../../../../three.js/build/three.module.js';

class Binding {
  constructor(source, sourceProp) {
    this.source = source;
    this.sourceProp = sourceProp;
    this.targets = [];
    this.targetsMap = new WeakMap();
    this.updateSource = this.updateSource.bind(this);
    this.updateTargets = this.updateTargets.bind(this);
    this.setSource(this.source);
  }
  get value() {
    return this.source[this.sourceProp];
  }
  setSource() {
    this.source.addEventListener(this.sourceProp + '-changed', this.updateTargets);
    for (let i = this.targets.length; i--;) {
      const targetProps = this.targetsMap.get(this.targets[i]);
      for (let j = targetProps.length; j--;) {
        this.targets[i].__properties[targetProps[j]].value = this.source[this.sourceProp];
        // TODO: test observers on binding hot-swap!
      }
    }
  }
  setTarget(target, targetProp) {
    if (this.targets.indexOf(target) === -1) this.targets.push(target);
    if (this.targetsMap.has(target)) {
      const targetProps = this.targetsMap.get(target);
      if (targetProps.indexOf(targetProp) === -1) { // safe check needed?
        targetProps.push(targetProp);
        target.addEventListener(targetProp + '-changed', this.updateSource);
      }
    } else {
      this.targetsMap.set(target, [targetProp]);
      target.addEventListener(targetProp + '-changed', this.updateSource);
    }
  }
  removeTarget(target, targetProp) {
    if (this.targetsMap.has(target)) {
      const targetProps = this.targetsMap.get(target);
      const index = targetProps.indexOf(targetProp);
      if (index !== -1) {
        targetProps.splice(index, 1);
      }
      if (targetProps.length === 0) this.targets.splice(this.targets.indexOf(target), 1);
      target.removeEventListener(targetProp + '-changed', this.updateSource);
    }
  }
  updateSource(event) {
    if (this.targets.indexOf(event.target) === -1) return;
    const value = event.detail.value;
    if (this.source[this.sourceProp] !== value) {
      this.source[this.sourceProp] = value;
    }
  }
  updateTargets(event) {
    if (event.target != this.source) return;
    const value = event.detail.value;
    for (let i = this.targets.length; i--;) {
      const targetProps = this.targetsMap.get(this.targets[i]);
      for (let j = targetProps.length; j--;) {
        let oldValue = this.targets[i][targetProps[j]];
        if (oldValue !== value) {
          // JavaScript is weird NaN != NaN
          if (typeof value == 'number' && typeof oldValue == 'number' && isNaN(value) && isNaN(oldValue)) continue;
          this.targets[i][targetProps[j]] = value;
        }
      }
    }
  }
  // TODO: dispose bindings correctly
}

// Creates a list of functions defined in prototype chain (for the purpose of binding to instance).
// TODO: consider improving
class Functions extends Array {
  constructor(protochain) {
    super();
    for (let i = protochain.length; i--;) {
      const names = Object.getOwnPropertyNames(protochain[i]);
      for (let j = 0; j < names.length; j++) {
        if (names[j] === 'constructor') continue;
        const p = Object.getOwnPropertyDescriptor(protochain[i], names[j]);
        if (p.get || p.set) continue;
        if (typeof protochain[i][names[j]] !== 'function') continue;
        if (protochain[i][names[j]].name === 'anonymous') continue;
        if (this.indexOf(names[j]) === -1) this.push(names[j]);
        if (names[j] === 'value') console.log(protochain[i][names[j]]);
      }
    }
  }
  bind(element) {
    for (let i = 0; i < this.length; i++) {
      element[this[i]] = element[this[i]].bind(element);
    }
  }
}

// Creates a list of listeners passed to element instance as arguments.
// Creates a list of listeners defined in prototype chain.
class Listeners {
  constructor(protochain) {
    if (protochain) {
      for (let i = protochain.length; i--;) {
        const prop = protochain[i].constructor.listeners;
        for (let j in prop) this[j] = prop[j];
      }
    }
  }
  setListeners(props) {
    // TODO remove old listeners
    for (let l in props) {
      if (l.startsWith('on-')) {
        this[l.slice(3, l.length)] = props[l];
      }
    }
  }
  connect(element) {
    for (let i in this) {
      const listener = typeof this[i] === 'function' ? this[i] : element[this[i]];
      element.addEventListener(i, listener);
    }
  }
  disconnect(element) {
    for (let i in this) {
      const listener = typeof this[i] === 'function' ? this[i] : element[this[i]];
      element.removeEventListener(i, listener);
    }
  }
}

// Creates a properties object with configurations inherited from protochain.
// TODO: make test

class Properties {
  constructor(protochain) {
    const propertyDefs = {};
    for (let i = protochain.length; i--;) {
      const prop = protochain[i].constructor.properties;
      for (let key in prop) {
        const propDef = new Property(prop[key], true);
        if (propertyDefs[key]) propertyDefs[key].assign(propDef);
        else propertyDefs[key] = propDef;
      }
    }
    for (let key in propertyDefs) {
      this[key] = new Property(propertyDefs[key]);
    }
  }
  clone() {
    const properties = new Properties([]);
    for (let prop in this) {
      properties[prop] = this[prop].clone();
    }
    return properties;
  }
}

/*
 Creates a property configuration object with following properties:
 {
   value: property value
   type: constructor of the value
   reflect: reflect to HTML element attribute
   binding: binding object if bound (internal)
 }
 */
class Property {
  constructor(propDef) {
    if (propDef === null || propDef === undefined) {
      propDef = {value: propDef};
    } else if (typeof propDef === 'function') {
      propDef = {type: propDef};
    } else if (propDef instanceof Array) {
      propDef = {type: Array, value: [...propDef]};
    } else if (typeof propDef !== 'object') {
      propDef = {value: propDef, type: propDef.constructor};
    }
    this.value = propDef.value;
    this.type = propDef.type;
    this.reflect = propDef.reflect;
    this.binding = propDef.binding;
    this.config = propDef.config;
    this.enumerable = propDef.enumerable !== undefined ? propDef.enumerable : true;
  }
  // Helper function to assign new values as we walk up the inheritance chain.
  assign(propDef) {
    if (propDef.value !== undefined) this.value = propDef.value;
    if (propDef.type !== undefined) this.type = propDef.type;
    if (propDef.reflect !== undefined) this.reflect = propDef.reflect;
    if (propDef.binding !== undefined) this.binding = propDef.binding;
    if (propDef.config !== undefined) this.config = propDef.config;
    if (propDef.enumerable !== undefined) this.enumerable = propDef.enumerable;
  }
  // Clones the property. If property value is objects it does one level deep object clone.
  clone() {
    const prop = new Property(this);

    if (prop.type === Array && prop.value) {
      prop.value = [...prop.value];
    }

    // TODO: test
    if (prop.type === undefined && prop.value !== undefined && prop.value !== null) {
      prop.type = prop.value.constructor;
    }

    // Set default values.
    if (prop.value === undefined && prop.type) {
      if (prop.type === Boolean) prop.value = false;
      else if (prop.type === String) prop.value = '';
      else if (prop.type === Number) prop.value = 0;
      else if (prop.type === Array) prop.value = [];
      else if (prop.type === Object) prop.value = {};
      else if (prop.type !== HTMLElement && prop.type !== Function) {
        prop.value = new prop.type();
      }
    }

    return prop;
  }
}

const IoCoreMixin = (superclass) => class extends superclass {
  static get properties() {
    return {};
  }
  get bindings() {
    return;
  }
  constructor(initProps = {}) {
    super();

    if (!this.constructor.prototype.__registered) this.constructor.Register();

    Object.defineProperty(this, '__bindings', {value: {}});
    Object.defineProperty(this, '__activeListeners', {value: {}});
    Object.defineProperty(this, '__queue', {value: []});

    this.__functions.bind(this);

    Object.defineProperty(this, '__propListeners', {value: new Listeners()});
    this.__propListeners.setListeners(initProps);

    Object.defineProperty(this, '__properties', {value: this.__properties.clone()});

    // This triggers change events for object values initialized from type constructor.
    for (let i = 0; i < this.__objectProps.length; i++) {
      const p = this.__objectProps[i];
      if (this.__properties[p].value) this.queue(p, this.__properties[p].value, undefined);
    }

    if (this.bindings) {
      this._bindNodes(this.bindings);
    }

    this.setProperties(initProps);

    if (superclass !== HTMLElement) this.connect(); // TODO: test
  }
  connect() {
    this.connectedCallback();
  }
  disconnect() {
    this.disconnectedCallback();
  }
  preventDefault(event) {
    event.preventDefault();
  }
  changed() {}
  bind(prop) {
    this.__bindings[prop] = this.__bindings[prop] || new Binding(this, prop);
    return this.__bindings[prop];
  }
  set(prop, value) {
    if (this[prop] !== value) {
      const oldValue = this[prop];
      this[prop] = value;
      this.dispatchEvent(prop + '-set', {property: prop, value: value, oldValue: oldValue}, false);
    }
  }
  setProperties(props) {

    for (let p in props) {

      if (this.__properties[p] === undefined) continue;

      let oldBinding = this.__properties[p].binding;
      let oldValue = this.__properties[p].value;

      let binding;
      let value;

      if (props[p] instanceof Binding) {
        binding = props[p];
        value = props[p].source[props[p].sourceProp];
      } else {
        value = props[p];
      }

      this.__properties[p].binding = binding;
      this.__properties[p].value = value;

      if (value !== oldValue) {
        if (this.__properties[p].reflect) this.setAttribute(p, value);
        this.queue(p, value, oldValue);
      }

      if (binding !== oldBinding) {
        if (binding) binding.setTarget(this, p);
        if (oldBinding) {
          oldBinding.removeTarget(this, p); // TODO: test extensively
        }
      }
    }

    this.className = props['className'] || '';

    if (props['style']) {
      for (let s in props['style']) {
        this.style[s] = props['style'][s];
        this.style.setProperty(s, props['style'][s]);
      }
    }

    this.queueDispatch();
  }
  // TODO: test extensively
  _bindNodes(nodes) {
    for (let n in nodes) {
      const properties = nodes[n];
      this[n].setProperties(properties);
      this.addEventListener(n + '-changed', (event) => {
        if (event.detail.oldValue) {
          event.detail.oldValue.dispose(); // TODO: test
        }
        event.detail.value.setProperties(properties);
      });
    }
  }
  connectedCallback() {
    this.__protoListeners.connect(this);
    this.__propListeners.connect(this);
    this.__connected = true;
    this.queueDispatch();
    for (let p in this.__properties) {
      if (this.__properties[p].binding) {
        this.__properties[p].binding.setTarget(this, p); //TODO: test
      }
    }
    if (this.__objectProps.length) {
      window.addEventListener('object-mutated', this._onObjectMutation);
    }
  }
  disconnectedCallback() {
    this.__protoListeners.disconnect(this);
    this.__propListeners.disconnect(this);
    this.__connected = false;
    for (let p in this.__properties) {
      if (this.__properties[p].binding) {
        this.__properties[p].binding.removeTarget(this, p);
        // TODO: this breaks binding for transplanted elements.
        // delete this.__properties[p].binding;
        // TODO: possible memory leak!
      }
    }
    if (this.__objectProps.length) {
      window.removeEventListener('object-mutated', this._onObjectMutation);
    }
  }
  dispose() {
    // TODO: test dispose!
    // TODO: dispose bindings correctly
    this.__protoListeners.disconnect(this);
    this.__propListeners.disconnect(this);
    // TODO: test
    for (let i in this.__activeListeners) {
      for (let j = this.__activeListeners[i].length; j--;) {
        if (superclass === HTMLElement) HTMLElement.prototype.removeEventListener.call(this, i, this.__activeListeners[i][j]);
        this.__activeListeners[i].splice(j, 1);
      }
    }
    for (let p in this.__properties) {
      if (this.__properties[p].binding) {
        this.__properties[p].binding.removeTarget(this, p);
        // TODO: this breaks binding for transplanted elements.
        // TODO: possible memory leak!
        delete this.__properties[p].binding;
      }
    }
    for (let l in this.__listeners) this.__listeners[l].lenght = 0; // TODO: test
    for (let p in this.__properties) delete this.__properties[p]; // TODO: test
  }
  addEventListener(type, listener) {
    this.__activeListeners[type] = this.__activeListeners[type] || [];
    const i = this.__activeListeners[type].indexOf(listener);
    if (i === - 1) {
      if (superclass === HTMLElement) HTMLElement.prototype.addEventListener.call(this, type, listener);
      this.__activeListeners[type].push(listener);
    }
  }
  removeEventListener(type, listener) {
    if (this.__activeListeners[type] !== undefined) {
      const i = this.__activeListeners[type].indexOf(listener);
      if (i !== - 1) {
        if (superclass === HTMLElement) HTMLElement.prototype.removeEventListener.call(this, type, listener);
        this.__activeListeners[type].splice(i, 1);
      }
    }
  }
  dispatchEvent(type, detail = {}, bubbles = true, src = this) {
    if (src instanceof HTMLElement || src === window) {
      HTMLElement.prototype.dispatchEvent.call(src, new CustomEvent(type, {type: type, detail: detail, bubbles: bubbles, composed: true}));
    } else {
      if (this.__activeListeners[type] !== undefined) {
        const array = this.__activeListeners[type].slice(0);
        for (let i = 0; i < array.length; i ++) {
          array[i].call(this, {detail: detail, target: this, path: [this]});
          // TODO: consider bubbling
        }
      }
    }
  }
  queue(prop, value, oldValue) {
    const i = this.__queue.indexOf(prop);
    if (i === -1) {
      this.__queue.push(prop, {property: prop, value: value, oldValue: oldValue});
    } else {
      this.__queue[i + 1].value = value;
    }
  }
  queueDispatch() {
    if (this.__queue.length) {
      for (let j = 0; j < this.__queue.length; j += 2) {
        const prop = this.__queue[j];
        const payload = {detail: this.__queue[j + 1]};
        if (this[prop + 'Changed']) this[prop + 'Changed'](payload);
        this.dispatchEvent(prop + '-changed', payload.detail);
      }
      if (this.changed) this.changed();
      this.__queue.length = 0;
    }
  }
  _onObjectMutation(event) {
    for (let i = this.__objectProps.length; i--;) {
      const prop = this.__objectProps[i];
      const value = this.__properties[prop].value;
      if (value === event.detail.object) {
        if (this[prop + 'Mutated']) this[prop + 'Mutated'](event);
        return;
      }
    }
  }
};

IoCoreMixin.Register = function () {
  Object.defineProperty(this.prototype, '__registered', {value: true});
  Object.defineProperty(this.prototype, '__protochain', {value: []});

  let proto = this.prototype;
  while (proto && proto.constructor !== HTMLElement && proto.constructor !== Object) {
    this.prototype.__protochain.push(proto); proto = proto.__proto__;
  }

  Object.defineProperty(this.prototype, '__properties', {value: new Properties(this.prototype.__protochain)});
  Object.defineProperty(this.prototype, '__functions', {value: new Functions(this.prototype.__protochain)});
  Object.defineProperty(this.prototype, '__protoListeners', {value: new Listeners(this.prototype.__protochain)});

  // TODO: rewise
  Object.defineProperty(this.prototype, '__objectProps', {value: []});
  const ignore = [Boolean, String, Number, HTMLElement, Function, undefined];
  for (let prop in this.prototype.__properties) {
    let type = this.prototype.__properties[prop].type;
    if (ignore.indexOf(type) == -1) this.prototype.__objectProps.push(prop);
  }

  for (let prop in this.prototype.__properties) {
    const isPublic = prop.charAt(0) !== '_';
    const isEnumerable = !(this.prototype.__properties[prop].enumerable === false);
    Object.defineProperty(this.prototype, prop, {
      get: function() {
        return this.__properties[prop].value;
      },
      set: function(value) {
        if (this.__properties[prop].value === value) return;
        const oldValue = this.__properties[prop].value;
        if (value instanceof Binding) {
          const binding = value;
          value = value.source[value.sourceProp];
          binding.setTarget(this, prop);
          this.__properties[prop].binding = binding;
        }
        this.__properties[prop].value = value;
        if (this.__properties[prop].reflect) this.setAttribute(prop, this.__properties[prop].value);
        if (isPublic && this.__connected) {
          this.queue(prop, value, oldValue);
          this.queueDispatch();
        }
      },
      enumerable: isEnumerable && isPublic,
      configurable: true,
    });
  }
};

class IoCore extends IoCoreMixin(Object) {}

IoCore.Register = IoCoreMixin.Register;

const warning = document.createElement('div');
warning.innerHTML = `
No support for custom elements detected! <br />
Sorry, modern browser is required to view this page.<br />
Please try <a href="https://www.mozilla.org/en-US/firefox/new/">Firefox</a>,
<a href="https://www.google.com/chrome/">Chrome</a> or
<a href="https://www.apple.com/lae/safari/">Safari</a>`;

let ro;
if (window.ResizeObserver !== undefined) {
  ro = new ResizeObserver(entries => {
    for (let entry of entries) entry.target.resized();
  });
}

const _stagingElement = document.createElement('div');

/**
 * @author arodic / https://github.com/arodic
 */

// Reusable utility variables
const _ray = new Raycaster();
const _rayTarget = new Vector3();
const _tempVector = new Vector3();

const TransformControlsMixin = (superclass) => class extends IoCoreMixin(superclass) {
  constructor(props) {
    super(props);

    this.pointStart = new Vector3();
    this.pointEnd = new Vector3();

    this.positionStart = new Vector3();
    this.quaternionStart = new Quaternion();
    this.scaleStart = new Vector3();

    this.parentPosition = new Vector3();
    this.parentQuaternion = new Quaternion();
    this.parentQuaternionInv = new Quaternion();
    this.parentScale = new Vector3();

    this.worldPosition = new Vector3();
    this.worldQuaternion = new Quaternion();
    this.worldQuaternionInv = new Quaternion();
    this.worldScale = new Vector3();

    this._plane = new Plane();
    this.objectChanged();

    // this.add(this._planeDebugMesh = new Mesh(new PlaneBufferGeometry(1000, 1000, 10, 10), new MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.2})));
  }
  objectChanged() {
    super.objectChanged();
    let hasObject = this.object ? true : false;
    this.visible = hasObject;
    this.enabled = hasObject;
    if (!hasObject) {
      this.active = false;
      this.axis = null;
    }
    this.animation.startAnimation(1.5);
  }
  enabledChanged(value) {
    super.enabledChanged(value);
    this.animation.startAnimation(0.5);
  }
  axisChanged() {
    super.axisChanged();
    this.updatePlane();
  }
  activeChanged() {
    this.animation.startAnimation(0.5);
  }
  onPointerHover(pointers) {
    if (!this.object || this.active === true) return;

    _ray.setFromCamera(pointers[0].position, this.camera);
    const intersect = _ray.intersectObjects(this.pickers, true)[0] || false;

    this.axis = intersect ? intersect.object.name : null;
  }
  onPointerDown(pointers) {
    if (this.axis === null || !this.object || this.active === true || pointers[0].button !== 0) return;

    _ray.setFromCamera(pointers[0].position, this.camera);
    const planeIntersect = _ray.ray.intersectPlane(this._plane, _rayTarget);

    if (planeIntersect) {
      this.object.updateMatrixWorld();
      this.object.matrix.decompose(this.positionStart, this.quaternionStart, this.scaleStart);
      this.object.parent.matrixWorld.decompose(this.parentPosition, this.parentQuaternion, this.parentScale);
      this.object.matrixWorld.decompose(this.worldPosition, this.worldQuaternion, this.worldScale);

      this.parentQuaternionInv.copy(this.parentQuaternion).inverse();
      this.worldQuaternionInv.copy(this.worldQuaternion).inverse();

      this.pointStart.copy(planeIntersect).sub(this.worldPosition);
      this.active = true;
    }
  }
  onPointerMove(pointers) {
    if (this.object === undefined || this.axis === null || this.active === false || pointers[0].button !== 0) return;

    _ray.setFromCamera(pointers[0].position, this.camera);
    const planeIntersect = _ray.ray.intersectPlane(this._plane, _tempVector);

    if (planeIntersect) {
      this.pointEnd.copy(planeIntersect).sub(this.worldPosition);
      this.transform();
      this.object.updateMatrixWorld();
      this.dispatchEvent('change');
      // TODO: impement events in Camera.js
      window.dispatchEvent(new CustomEvent('object-mutated', {detail: {object: this.object.position}, bubbles: false, composed: true}));
      window.dispatchEvent(new CustomEvent('object-mutated', {detail: {object: this.object.rotation}, bubbles: false, composed: true}));
      window.dispatchEvent(new CustomEvent('object-mutated', {detail: {object: this.object.quaternion}, bubbles: false, composed: true}));
      window.dispatchEvent(new CustomEvent('object-mutated', {detail: {object: this.object.scale}, bubbles: false, composed: true}));
      window.dispatchEvent(new CustomEvent('object-mutated', {detail: {object: this.object.matrix.elements}, bubbles: false, composed: true}));
      window.dispatchEvent(new CustomEvent('object-mutated', {detail: {object: this.object.matrixWorld.elements}, bubbles: false, composed: true}));
    }

  }
  onPointerUp(pointers) {
    if (pointers.length === 0) {
      if (pointers.removed[0].pointerType === 'touch') this.axis = null;
      this.active = false;
    } else if (pointers[0].button === -1) {
      this.axis = null;
      this.active = false;
    }
  }
  transform() {}
  updateAxis(axis) {
    super.updateAxis(axis);
    if (!this.enabled) axis.material.highlight = (10 * axis.material.highlight - 1.7) / 11;
  }
  updateGuide(axis) {
    super.updateGuide(axis);
    if (this.active === true) {
      let offset = new Vector3().copy(this.positionStart).sub(this.object.position).divide(this.scale);
      axis.position.copy(offset);
      if (this.space === 'local') {
        axis.position.applyQuaternion(this.worldQuaternionInv);
        let quatOffset = new Quaternion().copy(this.quaternionStart.clone().inverse()).multiply(this.object.quaternion);
        axis.quaternion.copy(quatOffset.clone().inverse());
      }
    } else {
      axis.position.set(0, 0, 0);
      axis.quaternion.set(0, 0, 0, 1);
    }
  }
  updatePlane() {
    const normal = this._plane.normal;
    const axis = this.axis ? this.axis.split('_').pop() : null;

    if (axis === 'X') normal.copy(this.worldX).cross(_tempVector.copy(this.eye).cross(this.worldX));
    if (axis === 'Y') normal.copy(this.worldY).cross(_tempVector.copy(this.eye).cross(this.worldY));
    if (axis === 'Z') normal.copy(this.worldZ).cross(_tempVector.copy(this.eye).cross(this.worldZ));
    if (axis === 'XY') normal.copy(this.worldZ);
    if (axis === 'YZ') normal.copy(this.worldX);
    if (axis === 'XZ') normal.copy(this.worldY);
    if (axis === 'XYZ' || axis === 'E') this.camera.getWorldDirection(normal);

    this._plane.setFromNormalAndCoplanarPoint(normal, this.position);

    // this.parent.add(this._planeDebugMesh);
    // this._planeDebugMesh.position.set(0,0,0);
    // this._planeDebugMesh.lookAt(normal);
    // this._planeDebugMesh.position.copy(this.position);
  }
};

/**
 * @author mrdoob / http://mrdoob.com/
 */

const BufferGeometryUtils = {

	computeTangents: function ( geometry ) {

		let index = geometry.index;
		let attributes = geometry.attributes;

		// based on http://www.terathon.com/code/tangent.html
		// (per vertex tangents)

		if ( index === null ||
			attributes.position === undefined ||
			attributes.normal === undefined ||
			attributes.uv === undefined ) {

			console.warn( 'BufferGeometry: Missing required attributes (index, position, normal or uv) in BufferGeometry.computeTangents()' );
			return;

		}

		let indices = index.array;
		let positions = attributes.position.array;
		let normals = attributes.normal.array;
		let uvs = attributes.uv.array;

		let nVertices = positions.length / 3;

		if ( attributes.tangent === undefined ) {

			geometry.addAttribute( 'tangent', new BufferAttribute( new Float32Array( 4 * nVertices ), 4 ) );

		}

		let tangents = attributes.tangent.array;

		let tan1 = [], tan2 = [];

		for ( let i = 0; i < nVertices; i ++ ) {

			tan1[ i ] = new Vector3();
			tan2[ i ] = new Vector3();

		}

		let vA = new Vector3(),
			vB = new Vector3(),
			vC = new Vector3(),

			uvA = new Vector2(),
			uvB = new Vector2(),
			uvC = new Vector2(),

			sdir = new Vector3(),
			tdir = new Vector3();

		function handleTriangle( a, b, c ) {

			vA.fromArray( positions, a * 3 );
			vB.fromArray( positions, b * 3 );
			vC.fromArray( positions, c * 3 );

			uvA.fromArray( uvs, a * 2 );
			uvB.fromArray( uvs, b * 2 );
			uvC.fromArray( uvs, c * 2 );

			let x1 = vB.x - vA.x;
			let x2 = vC.x - vA.x;

			let y1 = vB.y - vA.y;
			let y2 = vC.y - vA.y;

			let z1 = vB.z - vA.z;
			let z2 = vC.z - vA.z;

			let s1 = uvB.x - uvA.x;
			let s2 = uvC.x - uvA.x;

			let t1 = uvB.y - uvA.y;
			let t2 = uvC.y - uvA.y;

			let r = 1.0 / ( s1 * t2 - s2 * t1 );

			sdir.set(
				( t2 * x1 - t1 * x2 ) * r,
				( t2 * y1 - t1 * y2 ) * r,
				( t2 * z1 - t1 * z2 ) * r
			);

			tdir.set(
				( s1 * x2 - s2 * x1 ) * r,
				( s1 * y2 - s2 * y1 ) * r,
				( s1 * z2 - s2 * z1 ) * r
			);

			tan1[ a ].add( sdir );
			tan1[ b ].add( sdir );
			tan1[ c ].add( sdir );

			tan2[ a ].add( tdir );
			tan2[ b ].add( tdir );
			tan2[ c ].add( tdir );

		}

		let groups = geometry.groups;

		if ( groups.length === 0 ) {

			groups = [ {
				start: 0,
				count: indices.length
			} ];

		}

		for ( let i = 0, il = groups.length; i < il; ++ i ) {

			let group = groups[ i ];

			let start = group.start;
			let count = group.count;

			for ( let j = start, jl = start + count; j < jl; j += 3 ) {

				handleTriangle(
					indices[ j + 0 ],
					indices[ j + 1 ],
					indices[ j + 2 ]
				);

			}

		}

		let tmp = new Vector3(), tmp2 = new Vector3();
		let n = new Vector3(), n2 = new Vector3();
		let w, t, test;

		function handleVertex( v ) {

			n.fromArray( normals, v * 3 );
			n2.copy( n );

			t = tan1[ v ];

			// Gram-Schmidt orthogonalize

			tmp.copy( t );
			tmp.sub( n.multiplyScalar( n.dot( t ) ) ).normalize();

			// Calculate handedness

			tmp2.crossVectors( n2, t );
			test = tmp2.dot( tan2[ v ] );
			w = ( test < 0.0 ) ? - 1.0 : 1.0;

			tangents[ v * 4 ] = tmp.x;
			tangents[ v * 4 + 1 ] = tmp.y;
			tangents[ v * 4 + 2 ] = tmp.z;
			tangents[ v * 4 + 3 ] = w;

		}

		for ( let i = 0, il = groups.length; i < il; ++ i ) {

			let group = groups[ i ];

			let start = group.start;
			let count = group.count;

			for ( let j = start, jl = start + count; j < jl; j += 3 ) {

				handleVertex( indices[ j + 0 ] );
				handleVertex( indices[ j + 1 ] );
				handleVertex( indices[ j + 2 ] );

			}

		}

	},

	/**
	* @param  {Array<BufferGeometry>} geometries
	* @return {BufferGeometry}
	*/
	mergeBufferGeometries: function ( geometries, useGroups, mergedGeometry ) {

		let isIndexed = geometries[ 0 ].index !== null;

		let attributesUsed = new Set( Object.keys( geometries[ 0 ].attributes ) );
		let morphAttributesUsed = new Set( Object.keys( geometries[ 0 ].morphAttributes ) );

		let attributes = {};
		let morphAttributes = {};

		// mergedGeometry = mergedGeometry || new BufferGeometry();

		let offset = 0;

		for ( let i = 0; i < geometries.length; ++ i ) {

			let geometry = geometries[ i ];

			// ensure that all geometries are indexed, or none

			if ( isIndexed !== ( geometry.index !== null ) ) return null;

			// gather attributes, exit early if they're different

			for ( let name in geometry.attributes ) {

				if ( ! attributesUsed.has( name ) ) return null;

				if ( attributes[ name ] === undefined ) attributes[ name ] = [];

				attributes[ name ].push( geometry.attributes[ name ] );

			}

			// gather morph attributes, exit early if they're different

			for ( let name in geometry.morphAttributes ) {

				if ( ! morphAttributesUsed.has( name ) ) return null;

				if ( morphAttributes[ name ] === undefined ) morphAttributes[ name ] = [];

				morphAttributes[ name ].push( geometry.morphAttributes[ name ] );

			}

			// gather .userData

			mergedGeometry.userData.mergedUserData = mergedGeometry.userData.mergedUserData || [];
			mergedGeometry.userData.mergedUserData.push( geometry.userData );

			if ( useGroups ) {

				let count;

				if ( isIndexed ) {

					count = geometry.index.count;

				} else if ( geometry.attributes.position !== undefined ) {

					count = geometry.attributes.position.count;

				} else {

					return null;

				}

				mergedGeometry.addGroup( offset, count, i );

				offset += count;

			}

		}

		// merge indices

		if ( isIndexed ) {

			let indexOffset = 0;
			let mergedIndex = [];

			for ( let i = 0; i < geometries.length; ++ i ) {

				let index = geometries[ i ].index;

				for ( let j = 0; j < index.count; ++ j ) {

					mergedIndex.push( index.getX( j ) + indexOffset );

				}

				indexOffset += geometries[ i ].attributes.position.count;

			}

			mergedGeometry.setIndex( mergedIndex );

		}

		// merge attributes

		for ( let name in attributes ) {

			let mergedAttribute = this.mergeBufferAttributes( attributes[ name ] );

			if ( ! mergedAttribute ) return null;

			mergedGeometry.addAttribute( name, mergedAttribute );

		}

		// merge morph attributes

		for ( let name in morphAttributes ) {

			let numMorphTargets = morphAttributes[ name ][ 0 ].length;

			if ( numMorphTargets === 0 ) break;

			mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
			mergedGeometry.morphAttributes[ name ] = [];

			for ( let i = 0; i < numMorphTargets; ++ i ) {

				let morphAttributesToMerge = [];

				for ( let j = 0; j < morphAttributes[ name ].length; ++ j ) {

					morphAttributesToMerge.push( morphAttributes[ name ][ j ][ i ] );

				}

				let mergedMorphAttribute = this.mergeBufferAttributes( morphAttributesToMerge );

				if ( ! mergedMorphAttribute ) return null;

				mergedGeometry.morphAttributes[ name ].push( mergedMorphAttribute );

			}

		}

		return mergedGeometry;

	},

	/**
	* @param {Array<BufferAttribute>} attributes
	* @return {BufferAttribute}
	*/
	mergeBufferAttributes: function ( attributes ) {

		let TypedArray;
		let itemSize;
		let normalized;
		let arrayLength = 0;

		for ( let i = 0; i < attributes.length; ++ i ) {

			let attribute = attributes[ i ];

			if ( attribute.isInterleavedBufferAttribute ) return null;

			if ( TypedArray === undefined ) TypedArray = attribute.array.constructor;
			if ( TypedArray !== attribute.array.constructor ) return null;

			if ( itemSize === undefined ) itemSize = attribute.itemSize;
			if ( itemSize !== attribute.itemSize ) return null;

			if ( normalized === undefined ) normalized = attribute.normalized;
			if ( normalized !== attribute.normalized ) return null;

			arrayLength += attribute.array.length;

		}

		let array = new TypedArray( arrayLength );
		let offset = 0;

		for ( let i = 0; i < attributes.length; ++ i ) {

			array.set( attributes[ i ].array, offset );

			offset += attributes[ i ].array.length;

		}

		return new BufferAttribute( array, itemSize, normalized );

	}

};

// Reusable utility variables
const _position = new Vector3();
const _euler = new Euler();
const _quaternion = new Quaternion();
const _scale = new Vector3();
const _matrix = new Matrix4();

const colors = {
  'white': [1, 1, 1],
  'whiteTransparent': [1, 1, 1, 0.25],
  'gray': [0.75, 0.75, 0.75],
  'red': [1, 0.3, 0.2],
  'green': [0.2, 1, 0.2],
  'blue': [0.2, 0.3, 1],
  'cyan': [0.2, 1, 1],
  'magenta': [1, 0.3, 1],
  'yellow': [1, 1, 0.2],
};

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

// Reusable utility variables
const PI = Math.PI;
const HPI = PI / 2;
const EPS = 0.000001;
const AXIS_HIDE_TRESHOLD = 0.99;
const PLANE_HIDE_TRESHOLD = 0.1;
const AXIS_FLIP_TRESHOLD = 0;

function hasAxisAny(str, chars) {
  let has = true;
  str.split('').some(a => { if (chars.indexOf(a) === -1) has = false; });
  return has;
}

const handleGeometry = {
  XYZ: new HelperGeometry([
    [new CylinderBufferGeometry(EPS, EPS, 1, 4, 2, true), {color: [1, 0, 0], position: [0.5, 0, 0], rotation: [0, 0, HPI], thickness: 1}],
    [new CylinderBufferGeometry(EPS, EPS, 1, 4, 2, true), {color: [0, 1, 0], position: [0, 0.5, 0], rotation: [0, HPI, 0], thickness: 1}],
    [new CylinderBufferGeometry(EPS, EPS, 1, 4, 2, true), {color: [0, 0, 1], position: [0, 0, 0.5], rotation: [HPI, 0, 0], thickness: 1}],
  ])
};

class TransformHelper extends Helper {
  static get properties() {
    return {
      showX: true,
      showY: true,
      showZ: true,
      axis: null,
      active: false,
      doHide: true,
      doFlip: true,
      hideX: false,
      hideY: false,
      hideZ: false,
      hideXY: false,
      hideYZ: false,
      hideXZ: false,
      flipX: false,
      flipY: false,
      flipZ: false,
      size: 0.05,
    };
  }
  get handleGeometry() {
    return handleGeometry;
  }
  get pickerGeometry() {
    return {};
  }
  get guideGeometry() {
    return {};
  }
  get textGeometry() {
    return {};
  }
  constructor(props) {
    super(props);

    this.worldX = new Vector3();
    this.worldY = new Vector3();
    this.worldZ = new Vector3();
    this.axisDotEye = new Vector3();

    this.handles = this.addGeometries(this.handleGeometry);
    this.pickers = this.addGeometries(this.pickerGeometry, {isPicker: true});
    this.guides = this.addGeometries(this.guideGeometry, {isGuide: true, highlight: -2});
    this.texts = this.addTextSprites(this.textGeometry);

    this.setAxis = this.setAxis.bind(this);
    this.setGuide = this.setGuide.bind(this);
    this.setInfo = this.setInfo.bind(this);

    this.updateAxis = this.updateAxis.bind(this);
    this.updateGuide = this.updateGuide.bind(this);
    this.updateText = this.updateText.bind(this);

    this.animation = new Animation();

    this.animation.addEventListener('update', () => {
      this.dispatchEvent('change');
    });
  }
  traverseAxis(callback) {
    for (let i = this.handles.length; i--;) callback(this.handles[i]);
    for (let i = this.pickers.length; i--;) callback(this.pickers[i]);
  }
  traverseGuides(callback) {
    for (let i = this.guides.length; i--;) callback(this.guides[i]);
  }
  traverseInfos(callback) {
    for (let i = this.texts.length; i--;) callback(this.texts[i]);
  }
  spaceChanged() {
    super.spaceChanged();
    this.changed();
    this.animateScaleUp();
  }
  objectChanged() {
    super.objectChanged();
    this.axis = null;
    this.active = false;
    this.hideX = false;
    this.hideY = false;
    this.hideZ = false;
    this.hideXY = false;
    this.hideYZ = false;
    this.hideXZ = false;
    this.flipX = false;
    this.flipY = false;
    this.flipZ = false;
    this.animateScaleUp();
  }
  animateScaleUp() {
    this.traverseAxis(axis => {
      axis.scale.set(0.0001, 0.0001, 0.0001);
      axis.scaleTarget.set(1, 1, 1);
    });
    this.animation.startAnimation(0.5);
  }
  axisChanged() {}
  changed() {
    this.traverseAxis(this.setAxis);
    this.traverseGuides(this.setGuide);
    this.traverseInfos(this.setInfo);
    this.animation.startAnimation(1.5);
  }
  updateHelperMatrix() {
    super.updateHelperMatrix();
    this.worldX.set(1, 0, 0).applyQuaternion(this.quaternion);
    this.worldY.set(0, 1, 0).applyQuaternion(this.quaternion);
    this.worldZ.set(0, 0, 1).applyQuaternion(this.quaternion);
    this.axisDotEye.set(this.worldX.dot(this.eye), this.worldY.dot(this.eye), this.worldZ.dot(this.eye));
    const xDotE = this.axisDotEye.x;
    const yDotE = this.axisDotEye.y;
    const zDotE = this.axisDotEye.z;
    // Hide axis facing the camera
    if (!this.active) {
      this.hideX = Math.abs(xDotE) > AXIS_HIDE_TRESHOLD;
      this.hideY = Math.abs(yDotE) > AXIS_HIDE_TRESHOLD;
      this.hideZ = Math.abs(zDotE) > AXIS_HIDE_TRESHOLD;
      this.hideXY = Math.abs(zDotE) < PLANE_HIDE_TRESHOLD;
      this.hideYZ = Math.abs(xDotE) < PLANE_HIDE_TRESHOLD;
      this.hideXZ = Math.abs(yDotE) < PLANE_HIDE_TRESHOLD;
      this.flipX = xDotE < AXIS_FLIP_TRESHOLD;
      this.flipY = yDotE < AXIS_FLIP_TRESHOLD;
      this.flipZ = zDotE < AXIS_FLIP_TRESHOLD;
    }
    if (this.object) {
      this.traverseAxis(this.updateAxis);
      this.traverseGuides(this.updateGuide);
      this.traverseInfos(this.updateText);
    }
  }
  // TODO: optimize, make less ugly and framerate independent!
  setAxis(axis) {
    axis.hidden = false;
    const name = axis.name.split('_').pop() || null;
    const dimmed = this.active ? -2 : -0.75;
    axis.highlight = this.axis ? hasAxisAny(axis.name, this.axis) ? 1 : dimmed : 0;
    // Hide by show[axis] parameter
    if (this.doHide) {
      if (name.indexOf('X') !== -1 && !this.showX) axis.hidden = true;
      if (name.indexOf('Y') !== -1 && !this.showY) axis.hidden = true;
      if (name.indexOf('Z') !== -1 && !this.showZ) axis.hidden = true;
      if (name.indexOf('E') !== -1 && (!this.showX || !this.showY || !this.showZ)) axis.hidden = true;
      // Hide axis facing the camera
      if ((name == 'X' || name == 'XYZ') && this.hideX) axis.hidden = true;
      if ((name == 'Y' || name == 'XYZ') && this.hideY) axis.hidden = true;
      if ((name == 'Z' || name == 'XYZ') && this.hideZ) axis.hidden = true;
      if (name == 'XY' && this.hideXY) axis.hidden = true;
      if (name == 'YZ' && this.hideYZ) axis.hidden = true;
      if (name == 'XZ' && this.hideXZ) axis.hidden = true;
    }
    // Flip axis
    if (this.doFlip) {
      if (name.indexOf('X') !== -1 || axis.name.indexOf('R') !== -1) axis.scaleTarget.x = this.flipX ? -1 : 1;
      if (name.indexOf('Y') !== -1 || axis.name.indexOf('R') !== -1) axis.scaleTarget.y = this.flipY ? -1 : 1;
      if (name.indexOf('Z') !== -1 || axis.name.indexOf('R') !== -1) axis.scaleTarget.z = this.flipZ ? -1 : 1;
    }
  }
  setGuide(guide) {
    guide.highlight = this.axis ? hasAxisAny(guide.name, this.axis) ? 0 : -2 : -2;
    // Flip axis
    if (this.doFlip) {
      const name = guide.name.split('_').pop() || null;
      if (name.indexOf('X') !== -1 || guide.name.indexOf('R') !== -1) guide.scaleTarget.x = this.flipX ? -1 : 1;
      if (name.indexOf('Y') !== -1 || guide.name.indexOf('R') !== -1) guide.scaleTarget.y = this.flipY ? -1 : 1;
      if (name.indexOf('Z') !== -1 || guide.name.indexOf('R') !== -1) guide.scaleTarget.z = this.flipZ ? -1 : 1;
    }
  }
  setInfo(text) {
    text.highlight = this.axis ? hasAxisAny(text.name, this.axis) ? 1 : 0 : 0;
    // Flip axis
    if (this.doFlip) {
      const name = text.name.split('_').pop() || null;
      if (name.indexOf('X') !== -1) text.positionTarget.x = this.flipX ? -1.2 : 1.2;
      if (name.indexOf('Y') !== -1) text.positionTarget.y = this.flipY ? -1.2 : 1.2;
      if (name.indexOf('Z') !== -1) text.positionTarget.z = this.flipZ ? -1.2 : 1.2;
    }
  }
  updateAxis(axis) {
    axis.visible = true;
    const highlight = (axis.hidden || axis.isPicker) ? -2 : axis.highlight || 0;
    axis.material.highlight = (8 * axis.material.highlight + highlight) / 9;
    axis.material.visible = axis.material.highlight > -1.99;
    axis.scale.multiplyScalar(5).add(axis.scaleTarget).divideScalar(6);
  }
  updateGuide(guide) {
    guide.visible = true;
    const highlight = guide.hidden ? -2 : guide.highlight || 0;
    guide.material.highlight = (8 * guide.material.highlight + highlight) / 9;
    guide.material.visible = guide.material.highlight > -1.99;
    guide.scale.multiplyScalar(5).add(guide.scaleTarget).divideScalar(6);
  }
  updateText(text) {
    text.visible = true;
    text.material.opacity = (8 * text.material.opacity + text.highlight) / 9;
    text.material.visible = text.material.opacity < 0.01;
    if (text.name === 'X') text.text = Math.round(this.object.position.x * 100) / 100;
    if (text.name === 'Y') text.text = Math.round(this.object.position.y * 100) / 100;
    if (text.name === 'Z') text.text = Math.round(this.object.position.z * 100) / 100;
    text.position.multiplyScalar(5).add(text.positionTarget).divideScalar(6);
  }

}

// Reusable utility variables
const PI$1 = Math.PI;
const HPI$1 = PI$1 / 2;
const QPI = HPI$1 / 2;
const EPS$1 = 0.000001;

const planeGeometry = new PlaneBufferGeometry(1, 1, 1, 1);

const coneGeometry = new HelperGeometry([
  [new OctahedronBufferGeometry(0.03, 2)],
  [new CylinderBufferGeometry(0, 0.03, 0.2, 8, 1, true), {position: [0, 0.1, 0]}],
]);

const translateArrowGeometry = new HelperGeometry([
  [coneGeometry, {position: [0, 0.7, 0]}],
  [new CylinderBufferGeometry(EPS$1, EPS$1, 0.45, 5, 1, true), {position: [0, 0.5, 0], thickness: 1}],
]);

const scaleArrowGeometry = new HelperGeometry([
  [new OctahedronBufferGeometry(0.03, 2), {position: [0, 0.9, 0]}],
  [new CylinderBufferGeometry(EPS$1, EPS$1, 0.65, 5, 1, true), {position: [0, 0.6, 0], thickness: 1}],
]);

const scaleUniformArrowGeometry = new HelperGeometry([
  [new CylinderBufferGeometry(EPS$1, EPS$1, 0.2, 5, 1, true), {position: [0, -0.13, 0], thickness: 1}],
  [new OctahedronBufferGeometry(0.04, 2)],
]);

const translateCornerGeometry = new HelperGeometry([
  [planeGeometry, {color: colors['whiteTransparent'], position: [-0.1, -0.1, 0], scale: 0.2, outlineThickness: 0}],
  [new CylinderBufferGeometry(EPS$1, EPS$1, 0.2, 4, 2, true), {position: [0, -0.1, 0], rotation: [0, 0, 0], thickness: 1}],
  [new CylinderBufferGeometry(EPS$1, EPS$1, 0.2, 4, 2, true), {position: [-0.1, 0, 0], rotation: [0, 0, HPI$1], thickness: 1}],
]);

const scaleCornerGeometry = new HelperGeometry([
  [new OctahedronBufferGeometry(0.03, 2)],
  [planeGeometry, {color: colors['whiteTransparent'], position: [0, -0.06, 0], scale: [0.06, 0.1, 0.06], outlineThickness: 0}],
  [planeGeometry, {color: colors['whiteTransparent'], position: [-0.06, 0, 0], scale: [0.1, 0.06, 0.06], outlineThickness: 0}],
]);

const rotateHandleGeometry = new HelperGeometry([
  [new TorusBufferGeometry( 1, EPS$1, 4, 6, HPI$1/2 ), {thickness: 1, rotation: [0, 0, HPI$1 - HPI$1/4]}],
  [new TorusBufferGeometry( 0.96, 0.04, 2, 2, HPI$1/2/3 ), {color: [1, 1, 1, 0.25], rotation: [0, 0, HPI$1 - HPI$1/4/3], scale: [1, 1, 0.01], outlineThickness: 0}],
  [coneGeometry, {position: [0.37, 0.93, 0], rotation: [0, 0, -2.035], scale: 0.75}],
  [coneGeometry, {position: [-0.37, 0.93, 0], rotation: [0, 0, 2.035], scale: 0.75}],
]);

const translatePickerGeometry = new HelperGeometry(new CylinderBufferGeometry(0.15, 0, 0.6, 4, 1, true), {color: colors['whiteTransparent'], position: [0, 0.5, 0]});

const scalePickerGeometry = new HelperGeometry(new OctahedronBufferGeometry(0.1, 0), {color: colors['whiteTransparent']});

const rotatePickerGeometry = new HelperGeometry(new TorusBufferGeometry( 1, 0.1, 4, 4, HPI$1/1.5 ), {color: colors['whiteTransparent'], rotation: [0, 0, HPI$1 - HPI$1/3]});

const cornerPickerGeometry = new HelperGeometry(planeGeometry, {color: colors['whiteTransparent'], scale: 0.3, outlineThickness: 0});

const translateGuideGeometry = new HelperGeometry([
  [new CylinderBufferGeometry(EPS$1, EPS$1, 25, 5, 1, true), {thickness: 1, outlineThickness: 0}],
]);

const rotateGuideGeometry = new HelperGeometry([
  [new TorusBufferGeometry( 1, EPS$1, 4, 64 ), {thickness: 1, outlineThickness: 0}],
  [new CylinderBufferGeometry(EPS$1, EPS$1, 10, 5, 1, true), {position: [0, 1, 0], rotation: [0, 0, HPI$1], thickness: 1, outlineThickness: 0}],
]);

const handleGeometry$1 = {
  T_X: new HelperGeometry(translateArrowGeometry, {color: colors['red'], rotation: [0, 0, -HPI$1]}),
  T_Y: new HelperGeometry(translateArrowGeometry, {color: colors['green']}),
  T_Z: new HelperGeometry(translateArrowGeometry, {color: colors['blue'], rotation: [HPI$1, 0, 0]}),
  T_XY: new HelperGeometry(translateCornerGeometry, {color: colors['yellow'], position: [0.25, 0.25, 0]}),
  T_YZ: new HelperGeometry(translateCornerGeometry, {color: colors['cyan'], position: [0, 0.25, 0.25], rotation: [0, -HPI$1, 0]}),
  T_XZ: new HelperGeometry(translateCornerGeometry, {color: colors['magenta'], position: [0.25, 0, 0.25], rotation: [HPI$1, 0, 0]}),

  R_X: new HelperGeometry(rotateHandleGeometry, {color: colors['red'], rotation: [QPI, HPI$1, 0]}),
  R_Y: new HelperGeometry(rotateHandleGeometry, {color: colors['green'], rotation: [HPI$1, 0, -HPI$1/2]}),
  R_Z: new HelperGeometry(rotateHandleGeometry, {color: colors['blue'], rotation: [0, 0, -QPI]}),

  S_X: new HelperGeometry(scaleArrowGeometry, {color: colors['red'], rotation: [0, 0, -HPI$1]}),
  S_Y: new HelperGeometry(scaleArrowGeometry, {color: colors['green']}),
  S_Z: new HelperGeometry(scaleArrowGeometry, {color: colors['blue'], rotation: [HPI$1, 0, 0]}),
  S_XY: new HelperGeometry(scaleCornerGeometry, {color: colors['yellow'], position: [0.9, 0.9, 0]}),
  S_YZ: new HelperGeometry(scaleCornerGeometry, {color: colors['cyan'], position: [0, 0.9, 0.9], rotation: [0, -HPI$1, 0]}),
  S_XZ: new HelperGeometry(scaleCornerGeometry, {color: colors['magenta'], position: [0.9, 0, 0.9], rotation: [HPI$1, 0, 0]}),
  S_XYZ: new HelperGeometry([
    [scaleUniformArrowGeometry, {color: colors['gray'], position: [1.1, 0, 0], rotation: [0, 0, -HPI$1]}],
    [scaleUniformArrowGeometry, {color: colors['gray'], position: [0, 1.1, 0]}],
    [scaleUniformArrowGeometry, {color: colors['gray'], position: [0, 0, 1.1], rotation: [HPI$1, 0, 0]}],
  ]),
};

const pickerGeometry = {
  T_X: new HelperGeometry(translatePickerGeometry, {color: colors['red'], rotation: [0, 0, -HPI$1]}),
  T_Y: new HelperGeometry(translatePickerGeometry, {color: colors['green']}),
  T_Z: new HelperGeometry(translatePickerGeometry, {color: colors['blue'], rotation: [HPI$1, 0, 0]}),
  T_XY: new HelperGeometry(cornerPickerGeometry, {color: colors['yellow'], position: [0.15, 0.15, 0]}),
  T_YZ: new HelperGeometry(cornerPickerGeometry, {color: colors['cyan'], position: [0, 0.15, 0.15], rotation: [0, -HPI$1, 0]}),
  T_XZ: new HelperGeometry(cornerPickerGeometry, {color: colors['magenta'], position: [0.15, 0, 0.15], rotation: [HPI$1, 0, 0]}),
  T_XYZ: new HelperGeometry(new OctahedronBufferGeometry(0.2, 0), {color: colors['whiteTransparent']}),

  R_X: new HelperGeometry(rotatePickerGeometry, {color: colors['red'], rotation: [QPI, HPI$1, 0]}),
  R_Y: new HelperGeometry(rotatePickerGeometry, {color: colors['green'], rotation: [HPI$1, 0, -HPI$1/2]}),
  R_Z: new HelperGeometry(rotatePickerGeometry, {color: colors['blue'], rotation: [0, 0, -QPI]}),

  S_X: new HelperGeometry(scalePickerGeometry, {color: colors['red'], position: [0.9, 0, 0], rotation: [0, 0, -HPI$1], scale: 1.5}),
  S_Y: new HelperGeometry(scalePickerGeometry, {color: colors['green'], position: [0, 0.9, 0], scale: 1.5}),
  S_Z: new HelperGeometry(scalePickerGeometry, {color: colors['blue'], position: [0, 0, 0.9], rotation: [HPI$1, 0, 0], scale: 1.5}),
  S_XY: new HelperGeometry(scalePickerGeometry, {color: colors['yellow'], position: [0.9, 0.9, 0]}),
  S_YZ: new HelperGeometry(scalePickerGeometry, {color: colors['cyan'], position: [0, 0.9, 0.9], rotation: [0, -HPI$1, 0]}),
  S_XZ: new HelperGeometry(scalePickerGeometry, {color: colors['magenta'], position: [0.9, 0, 0.9], rotation: [HPI$1, 0, 0]}),
  S_XYZ: new HelperGeometry([
    [scalePickerGeometry, {color: colors['gray'], position: [1.1, 0, 0]}],
    [scalePickerGeometry, {color: colors['gray'], position: [0, 1.1, 0]}],
    [scalePickerGeometry, {color: colors['gray'], position: [0, 0, 1.1]}],
  ]),
};

const guideGeometry = {
  T_X: new HelperGeometry(translateGuideGeometry, {color: colors['red'], opacity: 0.5, rotation: [0, 0, -HPI$1]}),
  T_Y: new HelperGeometry(translateGuideGeometry, {color: colors['green'], opacity: 0.5}),
  T_Z: new HelperGeometry(translateGuideGeometry, {color: colors['blue'], opacity: 0.5, rotation: [HPI$1, 0, 0]}),

  R_X: new HelperGeometry(rotateGuideGeometry, {color: colors['red'], opacity: 0.5, rotation: [QPI, HPI$1, 0]}),
  R_Y: new HelperGeometry(rotateGuideGeometry, {color: colors['green'], opacity: 0.5, rotation: [HPI$1, 0, -HPI$1/2]}),
  R_Z: new HelperGeometry(rotateGuideGeometry, {color: colors['blue'], opacity: 0.5, rotation: [0, 0, -QPI]}),

  S_X: new HelperGeometry(translateGuideGeometry, {color: colors['red'], opacity: 0.5, rotation: [0, 0, -HPI$1]}),
  S_Y: new HelperGeometry(translateGuideGeometry, {color: colors['green'], opacity: 0.5}),
  S_Z: new HelperGeometry(translateGuideGeometry, {color: colors['blue'], opacity: 0.5, rotation: [HPI$1, 0, 0]}),
};

class CombinedTransformHelper extends TransformHelper {
  get handleGeometry() {
    return handleGeometry$1;
  }
  get pickerGeometry() {
    return pickerGeometry;
  }
  get guideGeometry() {
    return guideGeometry;
  }
  setAxis(axis) {
    super.setAxis(axis);
    // Hide per-axis scale in world mode
    if ((axis.name == 'S_X' || axis.name == 'S_Y' || axis.name == 'S_Z') && this.space === 'world') axis.hidden = true;
    if ((axis.name == 'S_XY' || axis.name == 'S_YZ' || axis.name == 'S_XZ') && this.space === 'world') axis.hidden = true;

    if (axis.name == 'R_Z' && this.hideXY) axis.hidden = true;
    if (axis.name == 'R_X' && this.hideYZ) axis.hidden = true;
    if (axis.name == 'R_Y' && this.hideXZ) axis.hidden = true;
  }
}

/**
 * @author arodic / https://github.com/arodic
 */

const offset = new Vector3();
const scaleFactor = new Vector3();
const EPS$2 = 0.000001;

const tempVector = new Vector3();
const tempQuaternion = new Quaternion();
const unit = {
  X: new Vector3(1, 0, 0),
  Y: new Vector3(0, 1, 0),
  Z: new Vector3(0, 0, 1)
};
const rotationAxis = new Vector3();
let rotationAngle = 0;

class CombinedTransformControls extends TransformControlsMixin(CombinedTransformHelper) {
  transform() {

    if (this.axis.indexOf('T') !== -1) {

      offset.copy(this.pointEnd).sub(this.pointStart);

      if (this.space === 'local' && this.axis !== 'XYZ') {
        offset.applyQuaternion(this.worldQuaternionInv);
      }

      if (this.axis.indexOf('X') === -1) offset.x = 0;
      if (this.axis.indexOf('Y') === -1) offset.y = 0;
      if (this.axis.indexOf('Z') === -1) offset.z = 0;

      if (this.space === 'local' && this.axis !== 'XYZ') {
        offset.applyQuaternion(this.quaternionStart).divide(this.parentScale);
      } else {
        offset.applyQuaternion(this.parentQuaternionInv).divide(this.parentScale);
      }

      this.object.position.copy(offset).add(this.positionStart);

    }

    if (this.axis.indexOf('S') !== -1) {

      if (this.axis === 'S_XYZ') {

        let refVector = this.pointStart.clone().normalize();
        let factor = this.pointEnd.dot(refVector) / this.pointStart.dot(refVector);
        scaleFactor.set(factor, factor, factor);

      } else {

        scaleFactor.set(
          this.pointEnd.dot(this.worldX) / this.pointStart.dot(this.worldX),
          this.pointEnd.dot(this.worldY) / this.pointStart.dot(this.worldY),
          this.pointEnd.dot(this.worldZ) / this.pointStart.dot(this.worldZ),
        );

        if (this.axis.indexOf('X') === -1) scaleFactor.x = 1;
        if (this.axis.indexOf('Y') === -1) scaleFactor.y = 1;
        if (this.axis.indexOf('Z') === -1) scaleFactor.z = 1;

      }

      this.object.scale.copy(this.scaleStart).multiply(scaleFactor);
      this.object.scale.set(
        Math.max(this.object.scale.x, EPS$2),
        Math.max(this.object.scale.y, EPS$2),
        Math.max(this.object.scale.z, EPS$2),
      );

    }

    if (this.axis.indexOf('R') !== -1) {

      offset.copy(this.pointEnd).sub(this.pointStart);

      const ROTATION_SPEED = 5 / this.scale.length();

      if (this.axis === 'R_X' || this.axis === 'R_Y' || this.axis === 'R_Z') {

        rotationAxis.copy(unit[this.axis[2]]);

        tempVector.copy(unit[this.axis[2]]);

        if (this.space === 'local') {
          tempVector.applyQuaternion(this.worldQuaternion);
        }

        rotationAngle = offset.dot(tempVector.cross(this.eye).normalize()) * ROTATION_SPEED;

      }

      // Apply rotate
      if (this.space === 'local') {
        this.object.quaternion.copy(this.quaternionStart);
        this.object.quaternion.multiply(tempQuaternion.setFromAxisAngle(rotationAxis, rotationAngle)).normalize();
      } else {
        rotationAxis.applyQuaternion(this.parentQuaternionInv);
        this.object.quaternion.copy(tempQuaternion.setFromAxisAngle(rotationAxis, rotationAngle));
        this.object.quaternion.multiply(this.quaternionStart).normalize();
      }

    }
  }
}

CombinedTransformControls.Register = TransformControlsMixin.Register;

export { CombinedTransformControls };

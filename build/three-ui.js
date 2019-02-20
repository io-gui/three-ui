import { Scene, PerspectiveCamera, Vector3, OrthographicCamera, HemisphereLight, Clock, WebGLRenderer, Quaternion, Spherical, Raycaster, Vector2, MOUSE, Matrix4, CylinderBufferGeometry, Plane, TorusBufferGeometry, OctahedronBufferGeometry, PlaneBufferGeometry, Mesh, BoxBufferGeometry, Euler, BufferGeometry, Float32BufferAttribute, Uint16BufferAttribute, BufferAttribute, DefaultLoadingManager, LoaderUtils, FileLoader, DDSLoader, Color, DirectionalLight, PointLight, SpotLight, MeshBasicMaterial, ShaderMaterial, ShaderLib, UniformsUtils, Interpolant, Texture, NearestFilter, LinearFilter, NearestMipMapNearestFilter, LinearMipMapNearestFilter, NearestMipMapLinearFilter, LinearMipMapLinearFilter, ClampToEdgeWrapping, MirroredRepeatWrapping, RepeatWrapping, FrontSide, InterpolateSmooth, InterpolateLinear, InterpolateDiscrete, RGBAFormat, RGBFormat, MeshStandardMaterial, TextureLoader, InterleavedBuffer, InterleavedBufferAttribute, Loader, DoubleSide, sRGBEncoding, BufferGeometryUtils, SkinnedMesh, TriangleStripDrawMode, TriangleFanDrawMode, LineSegments, Line, LineLoop, Points, PointsMaterial, Material, LineBasicMaterial, VertexColors, Group, Math as Math$1, NumberKeyframeTrack, QuaternionKeyframeTrack, VectorKeyframeTrack, AnimationUtils, AnimationClip, Bone, Object3D, PropertyBinding, Skeleton, Box3, TrianglesDrawMode, Int8BufferAttribute, Int16BufferAttribute, Int32BufferAttribute, Uint8BufferAttribute, Uint32BufferAttribute, DataTexture, FloatType, Sprite } from '../../three.js/build/three.module.js';

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
  // Binds all functions to instance.
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
   change: neme of the function to be called when value changes
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
      propDef = {value: [...propDef]};
    } else if (typeof propDef !== 'object') {
      propDef = {value: propDef, type: propDef.constructor};
    }
    this.value = propDef.value;
    this.type = propDef.type;
    this.change = propDef.change;
    this.reflect = propDef.reflect;
    this.binding = propDef.binding;
    this.config = propDef.config;
    this.enumerable = propDef.enumerable !== undefined ? propDef.enumerable : true;
  }
  // Helper function to assign new values as we walk up the inheritance chain.
  assign(propDef) {
    if (propDef.value !== undefined) this.value = propDef.value;
    if (propDef.type !== undefined) this.type = propDef.type;
    if (propDef.change !== undefined) this.change = propDef.change;
    if (propDef.reflect !== undefined) this.reflect = propDef.reflect;
    if (propDef.binding !== undefined) this.binding = propDef.binding;
    if (propDef.config !== undefined) this.config = propDef.config;
    if (propDef.enumerable !== undefined) this.enumerable = propDef.enumerable;
  }
  // Clones the property. If property value is objects it does one level deep object clone.
  clone() {
    const prop = new Property(this);

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

// Creates an array of constructors found in the prototype chain terminating before `Object` and `HTMLElement`.

class Protochain extends Array {
  constructor(constructorClass) {
    super();
    let proto = constructorClass;
    while (proto && proto.constructor !== HTMLElement && proto.constructor !== Object) {
      this.push(proto);
      proto = proto.__proto__;
    }
  }
}

const IoCoreMixin = (superclass) => class extends superclass {
  constructor(initProps = {}) {
    super();
    Object.defineProperty(this, '__bindings', {value: {}});
    Object.defineProperty(this, '__activeListeners', {value: {}});
    Object.defineProperty(this, '__observeQueue', {value: []});
    Object.defineProperty(this, '__notifyQueue', {value: []});

    Object.defineProperty(this, '__properties', {value: this.__properties.clone()});

    this.__functions.bind(this);

    Object.defineProperty(this, '__propListeners', {value: new Listeners()});
    this.__propListeners.setListeners(initProps);

    this.setProperties(initProps);

    if (this.__observeQueue.indexOf('changed') === -1) this.__observeQueue.push('changed', {detail: {}});

    // TODO: test with differect element and object classes
    if (superclass !== HTMLElement) this.connect();
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
  dispose() {
    // TODO: test dispose!
    // TODO: dispose bindings correctly
    this.__protoListeners.disconnect(this);
    this.__propListeners.disconnect(this);
    this.removeListeners();
    for (let p in this.__properties) {
      if (this.__properties[p].binding) {
        this.__properties[p].binding.removeTarget(this, p);
        // TODO: this breaks binding for transplanted elements.
        // TODO: possible memory leak!
        delete this.__properties[p].binding;
      }
    }
    // TODO implement properly and test on both elements and objects
    // for (let l in this.__listeners) this.__listeners[l].lenght = 0;
    // for (let p in this.__properties) delete this.__properties[p];
  }
  bind(prop) {
    this.__bindings[prop] = this.__bindings[prop] || new Binding(this, prop);
    return this.__bindings[prop];
  }
  set(prop, value) {
    let oldValue = this[prop];
    this[prop] = value;
    if (oldValue !== value) {
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
        this.queue(this.__properties[p].change, p, value, oldValue);
        if (this.__properties[p].change) this.queue(this.__properties[p].change, p, value, oldValue);
        // TODO: decouple change and notify queue // if (this[p + 'Changed'])
        this.queue(p + 'Changed', p, value, oldValue);
      }

      if (binding !== oldBinding) {
        if (binding) binding.setTarget(this, p);
        if (oldBinding) {
          oldBinding.removeTarget(this, p);
          // TODO: test extensively
          // console.warn('Disconnect!', oldBinding);
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

    // if (this.__observeQueue.length) {
      if (this.__observeQueue.indexOf('changed') === -1) {
        this.__observeQueue.push('changed', {});
      }
    // }
    this.queueDispatch();
  }
  objectMutated(event) {
    for (let i = this.__objectProps.length; i--;) {
      const prop = this.__objectProps[i];
      if (this.__properties[prop].value === event.detail.object) {
        this.changed();
        // TODO: test
        if (this.__properties[prop].change) this[this.__properties[prop].change](event.detail);
        if (this[prop + 'Changed']) this[prop + 'Changed'](event.detail);
      }
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
      window.addEventListener('object-mutated', this.objectMutated);
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
      window.removeEventListener('object-mutated', this.objectMutated);
    }
  }
  addEventListener(type, listener) {
    this.__activeListeners[type] = this.__activeListeners[type] || [];
    let i = this.__activeListeners[type].indexOf(listener);
    if (i === - 1) {
      if (superclass === HTMLElement) HTMLElement.prototype.addEventListener.call(this, type, listener);
      this.__activeListeners[type].push(listener);
    }
  }
  hasEventListener(type, listener) {
    return this.__activeListeners[type] !== undefined && this.__activeListeners[type].indexOf(listener) !== - 1;
  }
  removeEventListener(type, listener) {
    if (this.__activeListeners[type] !== undefined) {
      let i = this.__activeListeners[type].indexOf(listener);
      if (i !== - 1) {
        if (superclass === HTMLElement) HTMLElement.prototype.removeEventListener.call(this, type, listener);
        this.__activeListeners[type].splice(i, 1);
      }
    }
  }
  removeListeners() {
    // TODO: test
    for (let i in this.__activeListeners) {
      for (let j = this.__activeListeners[i].length; j--;) {
        if (superclass === HTMLElement) HTMLElement.prototype.removeEventListener.call(this, i, this.__activeListeners[i][j]);
        this.__activeListeners[i].splice(j, 1);
      }
    }
  }
  dispatchEvent(type, detail = {}, bubbles = true, src = this) {
    if (src instanceof HTMLElement || src === window) {
      HTMLElement.prototype.dispatchEvent.call(src, new CustomEvent(type, {
        type: type,
        detail: detail,
        bubbles: bubbles,
        composed: true
      }));
    } else {
      // TODO: fix path/src argument
      let path = [src];
      if (this.__activeListeners[type] !== undefined) {
        let array = this.__activeListeners[type].slice(0);
        for (let i = 0, l = array.length; i < l; i ++) {
          path = path || [this];
          const payload = {detail: detail, target: this, bubbles: bubbles, path: path};
          array[i].call(this, payload);
          // TODO: test bubbling
          if (bubbles) {
            let parent = this.parent;
            while (parent) {
              path.push(parent);
              parent.dispatchEvent(type, detail, true, path);
              parent = parent.parent;
            }
          }
        }
      }
    }
  }
  queue(change, prop, value, oldValue) {
    // JavaScript is weird NaN != NaN
    if (typeof value == 'number' && typeof oldValue == 'number' && isNaN(value) && isNaN(oldValue)) {
      return;
    }
    if (change && this[change]) {
      if (this.__observeQueue.indexOf(change) === -1) {
        this.__observeQueue.push(change, {detail: {property: prop, value: value, oldValue: oldValue}});
      }
    }
    if (this.__notifyQueue.indexOf(prop + '-changed') === -1) {
      this.__notifyQueue.push(prop + '-changed', {property: prop, value: value, oldValue: oldValue});
    }
  }
  queueDispatch() {
    // TODO: consider unifying observe and notify queue
    for (let j = 0; j < this.__observeQueue.length; j+=2) {
      this[this.__observeQueue[j]](this.__observeQueue[j+1]);
    }
    for (let j = 0; j < this.__notifyQueue.length; j+=2) {
      this.dispatchEvent(this.__notifyQueue[j], this.__notifyQueue[j+1]);
    }
    this.__observeQueue.length = 0;
    this.__notifyQueue.length = 0;
  }
};

function defineProperties(prototype) {
  for (let prop in prototype.__properties) {
    const change = prop + 'Changed';
    const changeEvent = prop + '-changed';
    const isPublic = prop.charAt(0) !== '_';
    const isEnumerable = !(prototype.__properties[prop].enumerable === false);
    Object.defineProperty(prototype, prop, {
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
          const payload = {detail: {property: prop, value: value, oldValue: oldValue}};
          if (this.__properties[prop].change) this[this.__properties[prop].change](payload);
          if (this[change]) this[change](payload);
          this.changed();
          // TODO: consider not dispatching always (only for binding)
          // TODO: test
          this.dispatchEvent(changeEvent, payload.detail, false);
        }
      },
      enumerable: isEnumerable && isPublic,
      configurable: true,
    });
  }
}

IoCoreMixin.Register = function () {
  Object.defineProperty(this.prototype, '__protochain', {value: new Protochain(this.prototype)});
  Object.defineProperty(this.prototype, '__properties', {value: new Properties(this.prototype.__protochain)});
  Object.defineProperty(this.prototype, '__functions', {value: new Functions(this.prototype.__protochain)});
  Object.defineProperty(this.prototype, '__protoListeners', {value: new Listeners(this.prototype.__protochain)});

  // TODO: rewise
  Object.defineProperty(this.prototype, '__objectProps', {value: []});
  const ignore = [Boolean, String, Number, HTMLElement, Function, undefined];
  for (let prop in this.prototype.__properties) {
    let type = this.prototype.__properties[prop].type;
    if (ignore.indexOf(type) == -1) {
      this.prototype.__objectProps.push(prop);
    }
  }

  defineProperties(this.prototype);
};

class IoCore extends IoCoreMixin(Object) {}

IoCore.Register = IoCoreMixin.Register;
IoCore.Register();

class IoElement extends IoCoreMixin(HTMLElement) {
  static get properties() {
    return {
      id: {
        type: String,
        enumerable: false
      },
      tabindex: {
        type: String,
        reflect: true,
        enumerable: false
      },
      contenteditable: {
        type: Boolean,
        reflect: true,
        enumerable: false
      },
      title: {
        type: String,
        reflect: true,
        enumerable: false
      },
      $: {
        type: Object,
      },
    };
  }
  connectedCallback() {
    super.connectedCallback();
    for (let prop in this.__properties) {
      if (this.__properties[prop].reflect) {
        this.setAttribute(prop, this.__properties[prop].value);
      }
    }
    if (typeof this.resized == 'function') {
      this.resized();
      if (ro) {
        ro.observe(this);
      } else {
        window.addEventListener('resize', this.resized);
      }
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (typeof this.resized == 'function') {
      if (ro) {
        ro.unobserve(this);
      } else {
        window.removeEventListener('resize', this.resized);
      }
    }
  }
  dispose() {
    super.dispose();
    delete this.parent;
    this.children.lenght = 0;
    // this.__properties.$.value = {};
  }
  template(children, host) {
    // this.__properties.$.value = {};
    this.traverse(buildTree()(['root', children]).children, host || this);
  }
  traverse(vChildren, host) {
    const children = host.children;
    // remove trailing elements
    while (children.length > vChildren.length) {
      const child = children[children.length - 1];
      let nodes = Array.from(child.querySelectorAll('*'));
      for (let i = nodes.length; i--;) {
        if (nodes[i].dispose) nodes[i].dispose();
      }
      if (child.dispose) child.dispose();
      host.removeChild(child);
    }
    // create new elements after existing
    const frag = document.createDocumentFragment();
    for (let i = children.length; i < vChildren.length; i++) {
      frag.appendChild(constructElement(vChildren[i]));
    }
    host.appendChild(frag);

    for (let i = 0; i < children.length; i++) {

      // replace existing elements
      if (children[i].localName !== vChildren[i].name) {
        const oldElement = children[i];
        host.insertBefore(constructElement(vChildren[i]), oldElement);
        let nodes = Array.from(oldElement.querySelectorAll('*'));
        for (let i = nodes.length; i--;) {
          if (nodes[i].dispose) nodes[i].dispose();
        }
        if (oldElement.dispose) oldElement.dispose();
        host.removeChild(oldElement);

      // update existing elements
      } else {
        children[i].className = '';
        // Io Elements
        if (children[i].hasOwnProperty('__properties')) {
          // WARNING TODO: better property and listeners reset.
          // WARNING TODO: test property and listeners reset
          children[i].setProperties(vChildren[i].props);
          children[i].queueDispatch();
          children[i].__propListeners.setListeners(vChildren[i].props);
          children[i].__propListeners.connect(children[i]);
        // Native HTML Elements
        } else {
          for (let prop in vChildren[i].props) {
            if (prop === 'style') {
              for (let s in vChildren[i].props['style']) {
                // children[i].style[s] = vChildren[i].props[prop][s];
                children[i].style.setProperty(s, vChildren[i].props[prop][s]);
              }
            }
            else children[i][prop] = vChildren[i].props[prop];
          }
          // TODO: refactor for native elements
          children[i].__propListeners.setListeners(vChildren[i].props);
          children[i].__propListeners.connect(children[i]);
          ///
        }
      }
    }

    for (let i = 0; i < vChildren.length; i++) {
      if (vChildren[i].props.id) {
        this.$[vChildren[i].props.id] = children[i];
      }
      if (vChildren[i].children && typeof vChildren[i].children === 'string') {
        children[i].innerText = vChildren[i].children;
      } else if (vChildren[i].children && typeof vChildren[i].children === 'object') {
        this.traverse(vChildren[i].children, children[i]);
      }
    }
  }
  // fixup for setAttribute
  setAttribute(attr, value) {
    if (value === true) {
      HTMLElement.prototype.setAttribute.call(this, attr, '');
    } else if (value === false || value === '') {
      this.removeAttribute(attr);
    } else if (typeof value == 'string' || typeof value == 'number') {
      if (this.getAttribute(attr) !== String(value)) HTMLElement.prototype.setAttribute.call(this, attr, value);
    }
  }
}

IoElement.Register = function() {

  IoCoreMixin.Register.call(this);

  // window[this.name] = this; // TODO: consider

  const localName = this.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

  Object.defineProperty(this, 'localName', {value: localName});
  Object.defineProperty(this.prototype, 'localName', {value: localName});

  customElements.define(localName, this);

  initStyle(this.prototype.__protochain);

};

IoElement.Register();

let ro;
if (window.ResizeObserver !== undefined) {
  ro = new ResizeObserver(entries => {
    for (let entry of entries) entry.target.resized();
  });
}

function html(parts) {
  let result = {
    string: '',
    vars: {},
  };
  for (let i = 0; i < parts.length; i++) {
    result.string += parts[i] + (arguments[i + 1] || '');
  }
  let vars = result.string.match(/-{2}?([a-z][a-z0-9]*)\b[^;]*;?/gi);
  if (vars) {
    for (let i = 0; i < vars.length; i++) {
      let v = vars[i].split(':');
      if (v.length === 2) {
        result.vars[v[0].trim()] = v[1].trim();
      }
    }
  }
  return result;
}

const constructElement = function(vDOMNode) {
 let ConstructorClass = customElements.get(vDOMNode.name);
 if (ConstructorClass) return new ConstructorClass(vDOMNode.props);

 let element = document.createElement(vDOMNode.name);
 for (let prop in vDOMNode.props) {
   if (prop === 'style') {
     for (let s in vDOMNode.props[prop]) {
       element.style[s] = vDOMNode.props[prop][s];
     }
   } else element[prop] = vDOMNode.props[prop];
 }
 /// TODO: refactor for native elements
 Object.defineProperty(element, '__propListeners', {value: new Listeners()});
 element.__propListeners.setListeners(vDOMNode.props);
 element.__propListeners.connect(element);
 ///
 return element;
};

// https://github.com/lukejacksonn/ijk
const clense = (a, b) => !b ? a : typeof b[0] === 'string' ? [...a, b] : [...a, ...b];
const buildTree = () => node => !!node && typeof node[1] === 'object' && !Array.isArray(node[1]) ? {
   ['name']: node[0],
   ['props']: node[1],
   ['children']: Array.isArray(node[2]) ? node[2].reduce(clense, []).map(buildTree()) : node[2] || ''
 } : buildTree()([node[0], {}, node[1] || '']);

const _stagingElement = document.createElement('div');

function initStyle(prototypes) {
  let localName = prototypes[0].constructor.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  for (let i = prototypes.length; i--;) {
    let style = prototypes[i].constructor.style;
    if (style) {
      style.string = style.string.replace(new RegExp(':host', 'g'), localName);
      for (let v in style.vars) {
        style.string = style.string.replace(new RegExp(v, 'g'), v.replace('--', '--' + localName + '-'));
      }
      _stagingElement.innerHTML = style.string;
      let element = _stagingElement.querySelector('style');
      element.setAttribute('id', 'io-style-' + localName + '-' + i);
      document.head.appendChild(element);
    }

  }
}

const IoLiteMixin = (superclass) => class extends superclass {
  set(prop, value) {
    let oldValue = this[prop];
    this[prop] = value;
    if (oldValue !== value) {
      this.dispatchEvent(prop + '-set', {property: prop, value: value, oldValue: oldValue}, false);
    }
  }
  addEventListener(type, listener) {
    this._listeners = this._listeners || {};
    this._listeners[type] = this._listeners[type] || [];
    if (this._listeners[type].indexOf(listener) === -1) {
      this._listeners[type].push(listener);
    }
  }
  hasEventListener(type, listener) {
    if (this._listeners === undefined) return false;
    return this._listeners[type] !== undefined && this._listeners[type].indexOf(listener) !== -1;
  }
  removeEventListener(type, listener) {
    if (this._listeners === undefined) return;
    if (this._listeners[type] !== undefined) {
      let index = this._listeners[type].indexOf(listener);
      if (index !== -1) this._listeners[type].splice(index, 1);
    }
  }
  removeListeners() {
    // TODO: test
    for (let i in this._listeners) {
      for (let j = this._listeners[i].length; j--;) {
        if (superclass === HTMLElement) HTMLElement.prototype.removeEventListener.call(this, i, this._listeners[i][j]);
        this._listeners[i].splice(j, 1);
      }
    }
  }
  dispatchEvent(type, detail = {}) {
    const event = {
      path: [this],
      target: this,
      detail: detail,
    };
    if (this._listeners && this._listeners[type] !== undefined) {
      const array = this._listeners[type].slice(0);
      for (let i = 0, l = array.length; i < l; i ++) {
        array[i].call(this, event);
      }
    }
    // TODO: bubbling
    // else if (this.parent && event.bubbles) {}
  }
  changed() {}
  defineProperties(props) {
    if (!this.hasOwnProperty('_properties')) {
      Object.defineProperty(this, '_properties', {
        value: {},
        enumerable: false
      });
    }
    for (let prop in props) {
      let propDef = props[prop];
      if (propDef === null || propDef === undefined) {
        propDef = {value: propDef};
      } else if (typeof propDef !== 'object') {
        propDef = {value: propDef};
      } else if (typeof propDef === 'object' && propDef.constructor.name !== 'Object') {
        propDef = {value: propDef};
      } else if (typeof propDef === 'object' && propDef.value === undefined) {
        propDef = {value: propDef};
      }
      defineProperty(this, prop, propDef);
    }
  }
  // TODO: dispose
};

const defineProperty = function(scope, prop, def) {
  const change = prop + 'Changed';
  const changeEvent = prop + '-changed';
  const isPublic = prop.charAt(0) !== '_';
  const isEnumerable = !(def.enumerable === false);
  scope._properties[prop] = def.value;
  if (!scope.hasOwnProperty(prop)) { // TODO: test
    Object.defineProperty(scope, prop, {
      get: function() {
        return scope._properties[prop];// !== undefined ? scope._properties[prop] : initValue;
      },
      set: function(value) {
        if (scope._properties[prop] === value) return;
        const oldValue = scope._properties[prop];
        scope._properties[prop] = value;
        if (isPublic) {
          const detail = {property: prop, value: value, oldValue: oldValue};
          if (def.change) scope[def.change](detail);
          if (typeof scope[change] === 'function') scope[change](detail);
          scope.changed.call(scope);
          scope.dispatchEvent(changeEvent, detail);
        }
      },
      enumerable: isEnumerable && isPublic,
      configurable: true,
    });
  }
  scope[prop] = def.value;
};

/**
 * @author arodic / https://github.com/arodic
 *
 * Minimal implementation of io mixin: https://github.com/arodic/io
 * Includes event listener/dispatcher and defineProperties() method.
 * Changed properties trigger "[prop]-changed" event, and execution of changed() and [prop]Changed() functions.
 */

class IoProperties extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: flex;
        flex-direction: column;
        flex: 0 0;
        line-height: 1em;
      }
      :host > .io-property {
        display: flex !important;
        flex-direction: row;
      }
      :host > .io-property > .io-property-label {
        padding: 0 0.2em 0 0.5em;
        flex: 0 0 auto;
        color: var(--io-theme-color);
      }
      :host > .io-property > .io-property-editor {
        margin: 0;
        padding: 0;
      }
      :host > .io-property > io-object,
      :host > .io-property > io-object > io-boolean,
      :host > .io-property > io-object > io-properties {
        padding: 0 !important;
        border: none !important;
        background: none !important;
      }
      :host > .io-property > io-number,
      :host > .io-property > io-string,
      :host > .io-property > io-boolean {
        border: none;
        background: none;
      }
      :host > .io-property > io-number {
        color: var(--io-theme-number-color);
      }
      :host > .io-property > io-string {
        color: var(--io-theme-string-color);
      }
      :host > .io-property > io-boolean {
        color: var(--io-theme-boolean-color);
      }
    </style>`;
  }
  static get properties() {
    return {
      value: Object,
      config: Object,
      props: Array,
      labeled: true,
    };
  }
  get _config() {
    return this.__proto__.__config.getConfig(this.value, this.config);
  }
  _onValueSet(event) {
    const path = event.composedPath();
    if (path[0] === this) return;
    if (event.detail.object) return; // TODO: unhack
    event.stopPropagation();
    const key = path[0].id;
    if (key !== null) {
      this.value[key] = event.detail.value;
      const detail = Object.assign({object: this.value, key: key}, event.detail);
      this.dispatchEvent('object-mutated', detail, true); // TODO: test
      // this.dispatchEvent('object-mutated', detail, false, window);
      this.dispatchEvent('value-set', detail, false);
    }
  }
  valueChanged() {
    const config = this._config;
    const elements = [];
    for (let c in config) {
      if (!this.props.length || this.props.indexOf(c) !== -1) {
        // if (config[c]) {
        const tag = config[c][0];
        const protoConfig = config[c][1];
        const label = config[c].label || c;
        const itemConfig = {className: 'io-property-editor', title: label, id: c, value: this.value[c], 'on-value-set': this._onValueSet};
        elements.push(
          ['div', {className: 'io-property'}, [
            this.labeled ? ['span', {className: 'io-property-label', title: label}, label + ':'] : null,
            [tag, Object.assign(itemConfig, protoConfig)]
          ]]);
        // }
      }
    }
    this.template(elements);
  }
  static get config() {
    return {
      'type:string': ['io-string', {}],
      'type:number': ['io-number', {step: 0.01}],
      'type:boolean': ['io-boolean', {true: '☑ true', false: '☐ false'}],
      'type:object': ['io-object', {}],
      'type:null': ['io-string', {}],
      'type:undefined': ['io-string', {}],
    };
  }
}

class Config {
  constructor(prototypes) {
    for (let i = 0; i < prototypes.length; i++) {
      this.registerConfig(prototypes[i].constructor.config || {});
    }
  }
  registerConfig(config) {
    for (let c in config) {
      this[c] = this[c] || [];
      this[c] = [config[c][0] || this[c][0], Object.assign(this[c][1] || {}, config[c][1] || {})];
    }
  }
  getConfig(object, customConfig) {
    const keys = Object.keys(object);
    const prototypes = [];

    let proto = object.__proto__;
    while (proto) {
      keys.push(...Object.keys(proto));
      prototypes.push(proto.constructor.name);
      proto = proto.__proto__;
    }

    const protoConfigs = {};

    for (let i in this) {
      const cfg = i.split('|');
      if (cfg.length === 1) cfg.splice(0, 0, 'Object');
      if (prototypes.indexOf(cfg[0]) !== -1) protoConfigs[cfg[1]] = this[i];
    }

    for (let i in customConfig) {
      const cfg = i.split('|');
      if (cfg.length === 1) cfg.splice(0, 0, 'Object');
      if (prototypes.indexOf(cfg[0]) !== -1) protoConfigs[cfg[1]] = customConfig[i];
    }

    const config = {};

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const value = object[k];
      const type = value === null ? 'null' : typeof value;
      const cstr = (value != undefined && value.constructor) ? value.constructor.name : 'null';

      if (type == 'function') continue;

      const typeStr = 'type:' + type;
      const cstrStr = 'constructor:' + cstr;
      const keyStr = k;

      config[k] = {};

      if (protoConfigs[typeStr]) config[k] = protoConfigs[typeStr];
      if (protoConfigs[cstrStr]) config[k] = protoConfigs[cstrStr];
      if (protoConfigs[keyStr]) config[k] = protoConfigs[keyStr];
    }

    return config;
  }
}

IoProperties.Register = function() {
  IoElement.Register.call(this);
  Object.defineProperty(this.prototype, '__config', {value: new Config(this.prototype.__protochain)});
};

IoProperties.Register();
IoProperties.RegisterConfig = function(config) {
  this.prototype.__config.registerConfig(config);
};

class IoArray extends IoProperties {
  static get style() {
    return html`<style>
      :host {
        display: grid;
        grid-row-gap: var(--io-theme-spacing);
        grid-column-gap: var(--io-theme-spacing);
      }
      :host[columns="2"] {
        grid-template-columns: auto auto;
      }
      :host[columns="3"] {
        grid-template-columns: auto auto auto;
      }
      :host[columns="4"] {
        grid-template-columns: auto auto auto auto;
      }
    </style>`;
  }
  changed() {
    const elements = [];
    this.setAttribute('columns', this.columns || Math.sqrt(this.value.length) || 1);
    for (let i = 0; i < this.value.length; i++) {
      elements.push(['io-number', {id: i, value: this.value[i], 'on-value-set': this._onValueSet}]);
    }
    this.template(elements);
  }
}

IoArray.Register();

class IoButton extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: inline-block;
        cursor: pointer;
        white-space: nowrap;
        -webkit-tap-highlight-color: transparent;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1em;
        border: var(--io-theme-button-border);
        border-radius: var(--io-theme-border-radius);
        padding: var(--io-theme-padding);
        padding-left: calc(3 * var(--io-theme-padding));
        padding-right: calc(3 * var(--io-theme-padding));
        background: var(--io-theme-button-bg);
        transition: background-color 0.4s;
        color: var(--io-theme-color);
        user-select: none;
      }
      :host:focus {
        outline: none;
        background: var(--io-theme-focus-bg);
      }
      :host:hover {
        background: var(--io-theme-hover-bg);
      }
      :host[pressed] {
        background: var(--io-theme-active-bg);
      }
    </style>`;
  }
  static get properties() {
    return {
      value: undefined,
      label: 'Button',
      pressed: {
        type: Boolean,
        reflect: true
      },
      action: Function,
      tabindex: 0
    };
  }
  static get listeners() {
    return {
      'keydown': 'onKeydown',
      'click': 'onClick',
    };
  }
  onKeydown(event) {
    if (!this.pressed && (event.which === 13 || event.which === 32)) {
      event.stopPropagation();
      this.pressed = true;
      this.addEventListener('keyup', this.onKeyup);
    }
  }
  onKeyup() {
    this.removeEventListener('keyup', this.onKeyup);
    this.pressed = false;
    if (this.action) this.action(this.value);
    this.dispatchEvent('io-button-clicked', {value: this.value, action: this.action});
  }
  onClick() {
    this.pressed = false;
    if (this.action) this.action(this.value);
    this.dispatchEvent('io-button-clicked', {value: this.value, action: this.action});
  }
  changed() {
    this.title = this.label;
    this.innerText = this.label;
  }
}

IoButton.Register();

class IoBoolean extends IoButton {
  static get style() {
    return html`<style>
      :host {
        display: inline;
        background: none;
      }
    </style>`;
  }
  static get properties() {
    return {
      value: {
        type: Boolean,
        reflect: true
      },
      true: 'true',
      false: 'false'
    };
  }
  constructor(props) {
    super(props);
    this.action = this.toggle;
  }
  toggle() {
    this.set('value', !this.value);
  }
  changed() {
    this.innerText = this.value ? this.true : this.false;
  }
}

IoBoolean.Register();

// TODO: document, demo, test

const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl', {antialias: true, premultipliedAlpha: false});

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.disable(gl.DEPTH_TEST);

const positionBuff = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuff);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,0.0,-1,-1,0.0,1,-1,0.0,1,1,0.0]), gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

const uvBuff = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, uvBuff);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,1,0,0,1,0,1,1]), gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

const indexBuff = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuff);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([3,2,1,3,1,0]), gl.STATIC_DRAW);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

const vertCode = `
attribute vec3 position;
attribute vec2 uv;
varying vec2 vUv;
void main(void) {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}`;

const vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vertCode);
gl.compileShader(vertShader);

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuff);

const shadersCache = new WeakMap();

class IoCanvas extends IoElement {
  static get style() {
    return html`<style>
      :host {
        box-sizing: border-box;
        overflow: hidden;
        position: relative;
        border: 1px solid black;
      }
      :host canvas {
        position: absolute;
        top: 0px;
        left: 0px;
        touch-action: none;
        user-select: none;
      }
    </style>`;
  }
  static get properties() {
    return {
      bg: [0, 0, 0, 1],
      color: [1, 1, 1, 1],
      size: [1, 1],
    };
  }
  static get frag() {
    return `
    varying vec2 vUv;
    void main(void) {
      vec2 px = size * vUv;
      px = mod(px, 5.0);
      if (px.x > 1.0 && px.y > 1.0) discard;
      gl_FragColor = color;
    }`;
  }
  constructor(props) {
    super(props);

    let frag = 'precision mediump float;';

    for (let prop in this.__properties) {
      let type = this.__properties[prop].type;
      let value = this.__properties[prop].value;
      if (type === Number) {
        frag += 'uniform float ' + prop + ';\n';
      } else if (type === Array) {
        frag += 'uniform vec' + value.length + ' ' + prop + ';\n';
      }
      // TODO: implement bool and matrices.
    }

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, frag + this.constructor.frag);
    gl.compileShader(fragShader);

    if (shadersCache.has(this.constructor)) {
      this._shader = shadersCache.get(this.constructor);
    } else {
      this._shader = gl.createProgram();
      gl.attachShader(this._shader, vertShader);
      gl.attachShader(this._shader, fragShader);
      shadersCache.set(this.constructor, this._shader);
    }

    gl.linkProgram(this._shader);

    const position = gl.getAttribLocation(this._shader, "position");
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuff);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(position);

    const uv = gl.getAttribLocation(this._shader, "uv");
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuff);
    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(uv);

    this.template([['canvas', {id: 'canvas'}]]);
    this._context2d = this.$.canvas.getContext('2d');

    this.render();
  }
  resized() {
    const rect = this.getBoundingClientRect();
    this.size[0] = rect.width;
    this.size[1] = rect.height;
    this.render();
  }
  changed() {
    this.render();
  }
  render() {
    if (!this._shader) return;


    canvas.width = this.size[0];
    canvas.height = this.size[1];

    gl.viewport(0, 0, this.size[0], this.size[1]);
    gl.clearColor(this.bg[0], this.bg[1], this.bg[2], this.bg[3]);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this._shader);

    for (let prop in this.__properties) {
      let type = this.__properties[prop].type;
      let value = this.__properties[prop].value;
      if (type === Number) {
        const uniform = gl.getUniformLocation(this._shader, prop);
        gl.uniform1f(uniform, value);
      } else if (type === Array) {
        const uniform = gl.getUniformLocation(this._shader, prop);
        switch (value.length) {
          case 2:
            gl.uniform2f(uniform, value[0], value[1]);
            break;
          case 3:
            gl.uniform3f(uniform, value[0], value[1], value[2]);
            break;
          case 4:
            gl.uniform4f(uniform, value[0], value[1], value[2], value[3]);
            break;
          default:
        }
      }
    }

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    if (this._context2d && canvas.width && canvas.height) {
      this.$.canvas.width = canvas.width;
      this.$.canvas.height = canvas.height;
      this._context2d.drawImage(canvas, 0, 0, canvas.width, canvas.height);
    }
  }
}

IoCanvas.Register();

class IoCollapsable extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: flex;
        flex-direction: column;
        border: var(--io-theme-frame-border);
        border-radius: var(--io-theme-border-radius);
        padding: var(--io-theme-padding);
        background: var(--io-theme-frame-bg);
      }
      :host > io-boolean {
        border: none;
        border-radius: 0;
        background: none;
      }
      :host > io-boolean:focus {
        border: none;
      }
      :host > io-boolean::before {
        content: '▸';
        display: inline-block;
        width: 0.65em;
        margin: 0 0.25em;
      }
      :host[expanded] > io-boolean{
        margin-bottom: var(--io-theme-padding);
      }
      :host[expanded] > io-boolean::before{
        content: '▾';
      }
      :host > .io-collapsable-content {
        display: block;
        border: var(--io-theme-content-border);
        border-radius: var(--io-theme-border-radius);
        padding: var(--io-theme-padding);
        background: var(--io-theme-content-bg);
      }
    </style>`;
  }
  static get properties() {
    return {
      label: String,
      expanded: {
        type: Boolean,
        reflect: true
      },
      elements: Array,
    };
  }
  changed() {
    this.template([
      ['io-boolean', {true: this.label, false: this.label, value: this.bind('expanded')}],
      this.expanded ? ['div', {className: 'io-collapsable-content'}, this.elements] : null
    ]);
  }
}

IoCollapsable.Register();

// TODO: document and test

const stagingElement = document.createElement('div');

class IoElementCache extends IoElement {
  static get properties() {
    return {
      selected: Number,
      elements:  Array,
      precache: Boolean,
      cache: Boolean,
      _cache: Object,
    };
  }
  precacheChanged() {
    if (this.precache) {
      this.template(this.elements, stagingElement);
      for (let i = 0; i < stagingElement.childNodes.length; i++) {
        this._cache[i] = stagingElement.childNodes[i];
      }
      stagingElement.innerHTML = '';
    }
  }
  dispose() {
    super.dispose();
    this.innerHTML = '';
    stagingElement.innerHTML = '';
    delete this._cache;
  }
  changed() {
    if (!this.elements[this.selected]) return;
    if ((this.precache || this.cache) && this._cache[this.selected]) {
      this.innerHTML = '';
      this.appendChild(this._cache[this.selected]);
    } else {
      if (this.cache) {
        this.innerHTML = '';
        this.template([this.elements[this.selected]], stagingElement);
        this._cache[this.selected] = stagingElement.childNodes[0];
        this.appendChild(this._cache[this.selected]);
        stagingElement.innerHTML = '';
      } else {
        this.template([this.elements[this.selected]]);
      }
    }
  }
}

IoElementCache.Register();

const nodes = {};
let hashes = {};

const parseHashes = function() {
  return window.location.hash.substr(1).split('&').reduce(function (result, item) {
    const parts = item.split('=');
    result[parts[0]] = parts[1];
    return result;
  }, {});
};

const getHashes = function() {
  hashes = parseHashes();
  for (let hash in hashes) {
    if (nodes[hash]) {
      if (nodes[hash] !== '') {
        if (!isNaN(hashes[hash])) {
          nodes[hash].value = JSON.parse(hashes[hash]);
        } else if (hashes[hash] === 'true' || hashes[hash] === 'false') {
          nodes[hash].value = JSON.parse(hashes[hash]);
        } else {
          nodes[hash].value = hashes[hash];
        }
      }
    }
  }
};

const setHashes = function(force) {
  let hashString = '';
  for (let node in nodes) {
    if ((nodes[node].hash || force) && nodes[node].value !== undefined && nodes[node].value !== '' && nodes[node].value !== nodes[node].defValue) {
      if (typeof nodes[node].value === 'string') {
        hashString += node + '=' + nodes[node].value + '&';
      } else {
        hashString += node + '=' + JSON.stringify(nodes[node].value) + '&';
      }
    }
  }
  window.location.hash = hashString.slice(0, -1);
  if (!window.location.hash) history.replaceState({}, document.title, ".");
};

window.addEventListener("hashchange", getHashes, false);
getHashes();

class IoStorageNode extends IoCore {
  static get properties() {
    return {
      key: String,
      value: undefined,
      defValue: undefined,
      hash: Boolean,
    };
  }
  constructor(props, defValue) {
    super(props);
    this.defValue = defValue;
    const hashValue = hashes[this.key];
    const localValue = localStorage.getItem(this.key);
    if (hashValue !== undefined) {
      this.value = JSON.parse(hashValue);
    } else {
      if (localValue !== null && localValue !== undefined) {
        this.value = JSON.parse(localValue);
      } else {
        this.value = defValue;
      }
    }
  }
  valueChanged() {
    setHashes();
    if (this.value === null || this.value === undefined) {
      localStorage.removeItem(this.key);
    } else {
      localStorage.setItem(this.key, JSON.stringify(this.value));
    }
  }
}

IoStorageNode.Register();

function IoStorage(key, defValue, hash) {
  if (!nodes[key]) {
    nodes[key] = new IoStorageNode({key: key, hash: hash}, defValue);
    nodes[key].binding = nodes[key].bind('value');
    nodes[key].valueChanged();
  }
  return nodes[key].binding;
}

class IoInspectorBreadcrumbs extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: flex;
        flex: 1 0;
        flex-direction: row;
        border: var(--io-theme-field-border);
        border-radius: var(--io-theme-border-radius);
        padding: var(--io-theme-padding);
        color: var(--io-theme-field-color);
        background: var(--io-theme-field-bg);
      }
      :host > io-inspector-link {
        border: none;
        overflow: hidden;
        text-overflow: ellipsis;
        background: none;
        padding: 0;
        padding: var(--io-theme-padding);
      }
      :host > io-inspector-link:first-of-type {
        color: var(--io-theme-color);
        overflow: visible;
        text-overflow: clip;
        margin-left: 0.5em;
      }
      :host > io-inspector-link:last-of-type {
        overflow: visible;
        text-overflow: clip;
        margin-right: 0.5em;
      }
      :host > io-inspector-link:not(:first-of-type):before {
        content: '>';
        margin: 0 0.5em;
        opacity: 0.25;
      }
    </style>`;
  }
  static get properties() {
    return {
      crumbs: Array,
    };
  }
  changed() {
    this.template([this.crumbs.map(i => ['io-inspector-link', {value: i}])]);
  }
}

IoInspectorBreadcrumbs.Register();

class IoInspectorLink extends IoButton {
  static get style() {
    return html`<style>
      :host {
        border: none;
        overflow: hidden;
        text-overflow: ellipsis;
        background: none;
        padding: 0;
        border: 1px solid transparent;
        color: var(--io-theme-link-color);
        padding: var(--io-theme-padding) !important;
      }
      :host:focus {
        outline: none;
        background: none;
        text-decoration: underline;
      }
      :host:hover {
        background: none;
        text-decoration: underline;
      }
      :host[pressed] {
        background: none;
      }
    </style>`;
  }
  changed() {
    let name = this.value.constructor.name;
    if (this.value.name) name += ' (' + this.value.name + ')';
    else if (this.value.label) name += ' (' + this.value.label + ')';
    else if (this.value.title) name += ' (' + this.value.title + ')';
    else if (this.value.id) name += ' (' + this.value.id + ')';
    this.title = name;
    this.innerText = name;
  }
}

IoInspectorLink.Register();

function isValueOfPropertyOf(prop, object) {
  for (let key in object) if (object[key] === prop) return key;
  return null;
}

class IoInspector extends IoElement {
  static get style() {
    return html`<style>
    :host {
      display: flex;
      flex-direction: column;
      border: var(--io-theme-content-border);
      border-radius: var(--io-theme-border-radius);
      padding: var(--io-theme-padding);
      background: var(--io-theme-content-bg);
    }
    :host > io-inspector-breadcrumbs {
      margin: var(--io-theme-spacing);
    }
    :host > io-collapsable {
      margin: var(--io-theme-spacing);
    }
    :host > io-collapsable > div io-properties > .io-property {
      overflow: hidden;
      padding: var(--io-theme-padding);
    }
    :host > io-collapsable > div io-properties > .io-property:not(:last-of-type) {
      border-bottom: var(--io-theme-border);
    }
    :host > io-collapsable > div io-properties > .io-property > :nth-child(1) {
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: right;
      flex: 0 1 8em;
      min-width: 3em;
      padding: var(--io-theme-padding);
      margin: calc(0.25 * var(--io-theme-spacing));
    }
    :host > io-collapsable > div io-properties > .io-property > :nth-child(2) {
      flex: 1 0 8em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 2em;
    }

    /* :host > .io-property > io-object,
    :host > .io-property > io-object > io-boolean,
    :host > .io-property > io-object > io-properties {
      padding: 0 !important;
      border: none !important;
      background: none !important;
    } */

    :host div io-properties > .io-property > io-object,
    :host div io-properties > .io-property > io-number,
    :host div io-properties > .io-property > io-string,
    :host div io-properties > .io-property > io-boolean {
      border: 1px solid transparent;
      padding: var(--io-theme-padding) !important;
    }
    :host div io-properties > .io-property > io-boolean:not([value]) {
      opacity: 0.5;
    }
    :host div io-properties > .io-property > io-option {
      flex: 0 1 auto !important;
      padding: var(--io-theme-padding) !important;
    }
    :host div io-properties > .io-property > io-number,
    :host div io-properties > .io-property > io-string {
      border: var(--io-theme-field-border);
      color: var(--io-theme-field-color);
      background: var(--io-theme-field-bg);
    }

    :host io-properties > .io-property > io-properties {
      border: var(--io-theme-field-border);
      background: rgba(127, 127, 127, 0.125);
    }
    </style>`;
  }
  static get properties() {
    return {
      value: Object,
      props: Array,
      config: Object,
      labeled: true,
      crumbs: Array,
    };
  }
  static get listeners() {
    return {
      'io-button-clicked': 'onLinkClicked',
    };
  }
  onLinkClicked(event) {
    event.stopPropagation();
    if (event.path[0].localName === 'io-inspector-link') {
      this.value = event.detail.value;
    }
  }
  get groups() {
    return this.__proto__.__config.getConfig(this.value, this.config);
  }
  valueChanged() {
    let crumb = this.crumbs.find((crumb) => { return crumb === this.value; });
    let lastrumb = this.crumbs[this.crumbs.length - 1];
    if (crumb) {
      this.crumbs.length = this.crumbs.indexOf(crumb) + 1;
    } else {
      if (!lastrumb || !isValueOfPropertyOf(this.value, lastrumb)) this.crumbs.length = 0;
      this.crumbs.push(this.value);
    }
    this.crumbs = [...this.crumbs];
  }
  changed() {
    const elements = [
      ['io-inspector-breadcrumbs', {crumbs: this.crumbs}],
      // TODO: add search
    ];
    // TODO: rewise and document use of storage
    let uuid = this.value.constructor.name;
    uuid += this.value.guid || this.value.uuid || this.value.id || '';
    for (let group in this.groups) {
      elements.push(
        ['io-collapsable', {
          label: group,
          expanded: IoStorage('io-inspector-group-' + uuid + '-' + group, false),
          elements: [
            ['io-properties', {
              value: this.value,
              props: this.groups[group],
              config: {
                'type:object': ['io-inspector-link']
              },
              labeled: true,
            }]
          ]
        }],
      );
    }
    this.template(elements);
  }
  static get config() {
    return {
      'Object|hidden': [/^_/],
      'HTMLElement|hidden': [/^_/, 'innerText', 'outerText', 'innerHTML', 'outerHTML', 'textContent'],
    };
  }
}

class Config$1 {
  constructor(prototypes) {
    for (let i = 0; i < prototypes.length; i++) {
      this.registerConfig(prototypes[i].constructor.config || {});
    }
  }
  registerConfig(config) {
    for (let g in config) {
      this[g] = this[g] || [];
      this[g] = [...this[g], ...config[g]];
    }
  }
  getConfig(object, customGroups) {
    const keys = Object.keys(object);
    const prototypes = [];

    let proto = object.__proto__;
    while (proto) {
      keys.push(...Object.keys(proto));
      prototypes.push(proto.constructor.name);
      proto = proto.__proto__;
    }

    const protoGroups = {};

    for (let i in this) {
      const grp = i.split('|');
      if (grp.length === 1) grp.splice(0, 0, 'Object');
      if (prototypes.indexOf(grp[0]) !== -1) {
        protoGroups[grp[1]] = protoGroups[grp[1]] || [];
        protoGroups[grp[1]].push(...this[i]);
      }
    }

    for (let i in customGroups) {
      const grp = i.split('|');
      if (grp.length === 1) grp.splice(0, 0, 'Object');
      if (prototypes.indexOf(grp[0]) !== -1) {
        protoGroups[grp[1]] = protoGroups[grp[1]] || [];
        protoGroups[grp[1]].push(customGroups[i]);
      }
    }

    const groups = {};
    const assigned = [];

    for (let g in protoGroups) {
      groups[g] = groups[g] || [];
      for (let gg in protoGroups[g]) {
        const gKey = protoGroups[g][gg];
        const reg = new RegExp(gKey);
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          if (typeof gKey === 'string') {
            if (k == gKey) {
              groups[g].push(k);
              assigned.push(k);
            }
          } else if (typeof gKey === 'object') {
            if (reg.exec(k)) {
              groups[g].push(k);
              assigned.push(k);
            }
          }
        }
      }
    }

    if (assigned.length === 0) {
      groups['properties'] = keys;
    } else {
      for (let i = 0; i < keys.length; i++) {
        groups['properties'] = groups['properties'] || [];
        if (assigned.indexOf(keys[i]) === -1) groups['properties'].push(keys[i]);
      }
    }

    for (let group in groups) { if (groups[group].length === 0) delete groups[group]; }
    delete groups.hidden;

    return groups;
  }
}

IoInspector.Register = function() {
  IoElement.Register.call(this);
  Object.defineProperty(this.prototype, '__config', {value: new Config$1(this.prototype.__protochain)});
};

IoInspector.Register();
IoInspector.RegisterConfig = function(config) {
  this.prototype.__config.registerConfig(config);
};

let previousOption;
let previousParent;
let timeoutOpen;
let timeoutReset;
let WAIT_TIME = 1200;
// let lastFocus;

// TODO: implement search

class IoMenuLayer extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: block;
        visibility: hidden;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        z-index: 100000;
        background: rgba(0, 0, 0, 0.2);
        user-select: none;
        overflow: hidden;
        pointer-events: none;
        touch-action: none;
      }
      :host[expanded] {
        visibility: visible;
        pointer-events: all;
      }
      :host io-menu-options:not([expanded]) {
        display: none;
      }
      :host io-menu-options {
        position: absolute;
        transform: translateZ(0);
        top: 0;
        left: 0;
        min-width: 6em;
      }
    </style>`;
  }
  static get properties() {
    return {
      expanded: {
        type: Boolean,
        reflect: true,
        change: 'onScrollAnimateGroup'
      },
      $options: Array
    };
  }
  static get listeners() {
    return {
      'pointerup': 'onPointerup',
      'pointermove': 'onPointermove',
      'dragstart': 'preventDefault',
      'contextmenu': 'preventDefault',
    };
  }
  constructor(props) {
    super(props);
    this._hoveredItem = null;
    this._hoveredGroup = null;
    this._x = 0;
    this._y = 0;
    this._v = 0;
    window.addEventListener('scroll', this.onScroll);
    // window.addEventListener('focusin', this.onWindowFocus);
  }
  registerGroup(group) {
    this.$options.push(group);
    group.addEventListener('focusin', this.onMenuItemFocused);
    group.addEventListener('keydown', this.onKeydown);
    group.addEventListener('expanded-changed', this.onExpandedChanged);
  }
  unregisterGroup(group) {
    this.$options.splice(this.$options.indexOf(group), 1);
    group.removeEventListener('focusin', this.onMenuItemFocused);
    group.removeEventListener('keydown', this.onKeydown);
    group.removeEventListener('expanded-changed', this.onExpandedChanged);
  }
  collapseAllGroups() {
    for (let i = this.$options.length; i--;) {
      this.$options[i].expanded = false;
    }
  }
  runAction(option) {
    if (typeof option.action === 'function') {
      option.action.apply(null, [option.value]);
      this.collapseAllGroups();
      // if (lastFocus) {
      //   lastFocus.focus();
      // }
    } else if (option.button) {
      option.button.click(); // TODO: test
      this.collapseAllGroups();
      // if (lastFocus) {
      //   lastFocus.focus();
      // }
    }
  }
  onScroll() {
    if (this.expanded) {
      this.collapseAllGroups();
      // if (lastFocus) {
      //   lastFocus.focus();
      // }
    }
  }
  // onWindowFocus(event) {
  //   if (event.target.localName !== 'io-menu-item') lastFocus = event.target;
  // }
  onMenuItemFocused(event) {
    const path = event.composedPath();
    const item = path[0];
    const optionschain = item.optionschain;
    for (let i = this.$options.length; i--;) {
      if (optionschain.indexOf(this.$options[i]) === -1) {
        this.$options[i].expanded = false;
      }
    }
  }
  onPointermove(event) {
    event.preventDefault();
    this._x = event.clientX;
    this._y = event.clientY;
    this._v = (2 * this._v + Math.abs(event.movementY) - Math.abs(event.movementX)) / 3;
    let groups = this.$options;
    for (let i = groups.length; i--;) {
      if (groups[i].expanded) {
        let rect = groups[i].getBoundingClientRect();
        if (rect.top < this._y && rect.bottom > this._y && rect.left < this._x && rect.right > this._x) {
          this._hover(groups[i]);
          this._hoveredGroup = groups[i];
          return groups[i];
        }
      }
    }
    this._hoveredItem = null;
    this._hoveredGroup = null;
  }
  onPointerup(event) {
    event.stopPropagation();
    event.preventDefault();
    const path = event.composedPath();
    let elem = path[0];
    if (elem.localName === 'io-menu-item') {
      this.runAction(elem.option);
      elem.menuroot.dispatchEvent('io-menu-item-clicked', elem.option);
    } else if (elem === this) {
      if (this._hoveredItem) {
        this.runAction(this._hoveredItem.option);
        this._hoveredItem.menuroot.dispatchEvent('io-menu-item-clicked', this._hoveredItem.option);
      } else if (!this._hoveredGroup) {
        this.collapseAllGroups();
        // if (lastFocus) {
        //   lastFocus.focus();
        // }
      }
    }
  }
  onKeydown(event) {
    event.preventDefault();
    const path = event.composedPath();
    if (path[0].localName !== 'io-menu-item') return;

    let elem = path[0];
    let group = elem.$parent;
    let siblings = [...group.querySelectorAll('io-menu-item')] || [];
    let children = elem.$options ? [...elem.$options.querySelectorAll('io-menu-item')]  : [];
    let index = siblings.indexOf(elem);

    let command = '';

    if (!group.horizontal) {
      if (event.key == 'ArrowUp') command = 'prev';
      if (event.key == 'ArrowRight') command = 'in';
      if (event.key == 'ArrowDown') command = 'next';
      if (event.key == 'ArrowLeft') command = 'out';
    } else {
      if (event.key == 'ArrowUp') command = 'out';
      if (event.key == 'ArrowRight') command = 'next';
      if (event.key == 'ArrowDown') command = 'in';
      if (event.key == 'ArrowLeft') command = 'prev';
    }
    if (event.key == 'Tab') command = 'next';
    if (event.key == 'Escape') command = 'exit';
    if (event.key == 'Enter' || event.which == 32) command = 'action';

    switch (command) {
      case 'action':
        this.onPointerup(event); // TODO: test
        break;
      case 'prev':
        siblings[(index + siblings.length - 1) % (siblings.length)].focus();
        break;
      case 'next':
        siblings[(index + 1) % (siblings.length)].focus();
        break;
      case 'in':
        if (children.length) children[0].focus();
        break;
      case 'out':
        if (group && group.$parent) group.$parent.focus();
        break;
      case 'exit':
        this.collapseAllGroups();
        break;
      default:
        break;
    }
  }
  _hover(group) {
    let items = group.querySelectorAll('io-menu-item');
    for (let i = items.length; i--;) {
      let rect = items[i].getBoundingClientRect();
      if (rect.top < this._y && rect.bottom > this._y && rect.left < this._x && rect.right > this._x) {
        let force = group.horizontal;
        this._focus(items[i], force);
        this._hoveredItem = items[i];
        return items[i];
      }
    }
    this._hoveredItem = null;
    this._hoveredItem = null;
  }
  _focus(item, force) {
    if (item !== previousOption) {
      clearTimeout(timeoutOpen);
      clearTimeout(timeoutReset);
      if (this._v > 1 || item.parentNode !== previousParent || force) {
        previousOption = item;
        item.focus();
      } else {
        timeoutOpen = setTimeout(function() {
          previousOption = item;
          item.focus();
        }.bind(this), WAIT_TIME);
      }
      previousParent = item.parentNode;
      timeoutReset = setTimeout(function() {
        previousOption = null;
        previousParent = null;
      }.bind(this), WAIT_TIME + 1);
    }
  }
  onExpandedChanged(event) {
    const path = event.composedPath();
    if (path[0].expanded) this._setGroupPosition(path[0]);
    for (let i = this.$options.length; i--;) {
      if (this.$options[i].expanded) {
        this.expanded = true;
        return;
      }
    }
    setTimeout(() => { this.expanded = false; });
  }
  _setGroupPosition(group) {
    if (!group.$parent) return;
    let rect = group.getBoundingClientRect();
    let pRect = group.$parent.getBoundingClientRect();
     // TODO: unhack horizontal long submenu bug.
    if (group.position === 'bottom' && rect.height > (window.innerHeight - this._y)) group.position = 'right';
    //
    switch (group.position) {
      case 'pointer':
        group._x = this._x - 2 || pRect.x;
        group._y = this._y - 2 || pRect.y;
        break;
      case 'bottom':
        group._x = pRect.x;
        group._y = pRect.bottom;
        break;
      case 'right':
      default:
        group._x = pRect.right;
        group._y = pRect.y;
        if (group._x + rect.width > window.innerWidth) {
          group._x = pRect.x - rect.width;
        }
        break;
    }
    group._x = Math.min(group._x, window.innerWidth - rect.width);
    group._y = Math.min(group._y, window.innerHeight - rect.height);
    group.style.left = group._x + 'px';
    group.style.top = group._y + 'px';
  }
  onScrollAnimateGroup() {
    if (!this.expanded) return;
    let group = this._hoveredGroup;
    if (group) {
      let rect = group.getBoundingClientRect();
      if (rect.height > window.innerHeight) {
        if (this._y < 100 && rect.top < 0) {
          let scrollSpeed = (100 - this._y) / 5000;
          let overflow = rect.top;
          group._y = group._y - Math.ceil(overflow * scrollSpeed) + 1;
        } else if (this._y > window.innerHeight - 100 && rect.bottom > window.innerHeight) {
          let scrollSpeed = (100 - (window.innerHeight - this._y)) / 5000;
          let overflow = (rect.bottom - window.innerHeight);
          group._y = group._y - Math.ceil(overflow * scrollSpeed) - 1;
        }
        group.style.left = group._x + 'px';
        group.style.top = group._y + 'px';
      }
    }
    requestAnimationFrame(this.onScrollAnimateGroup);
  }
}

IoMenuLayer.Register();

IoMenuLayer.singleton = new IoMenuLayer();

document.body.appendChild(IoMenuLayer.singleton);

class IoMenuOptions extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: flex;
        flex-direction: column;
        white-space: nowrap;
        user-select: none;
        touch-action: none;
        background: white;
        color: black;
        padding: var(--io-theme-padding);
        border: var(--io-theme-menu-border);
        border-radius: var(--io-theme-border-radius);
        box-shadow: var(--io-theme-menu-shadow);
      }
      :host[horizontal] {
        flex-direction: row;
      }
      :host[horizontal] > io-menu-item {
        margin-left: 0.5em;
        margin-right: 0.5em;
      }
      :host[horizontal] > io-menu-item > :not(.menu-label) {
        display: none;
      }
    </style>`;
  }
  static get properties() {
    return {
      options: Array,
      expanded: {
        type: Boolean,
        reflect: true
      },
      position: 'right',
      horizontal: {
        type: Boolean,
        reflect: true
      },
      $parent: HTMLElement
    };
  }
  static get listeners() {
    return {
      'focusin': '_onFocus',
    };
  }
  optionsChanged() {
    const itemPosition = this.horizontal ? 'bottom' : 'right';
    this.template([this.options.map((elem, i) =>
      ['io-menu-item', {
        $parent: this,
        option: typeof this.options[i] === 'object' ? this.options[i] : {value: this.options[i], label: this.options[i]},
        position: itemPosition
      }]
    )]);
  }
  connectedCallback() {
    super.connectedCallback();
    IoMenuLayer.singleton.registerGroup(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    IoMenuLayer.singleton.unregisterGroup(this);
  }
  _onFocus(event) {
    const path = event.composedPath();
    const item = path[0];
    IoMenuLayer.singleton._hoveredGroup = this;
    if (item.localName === 'io-menu-item') {
      IoMenuLayer.singleton._hoveredItem = item;
      if (item.option.options) this.expanded = true;
    }
  }
}

IoMenuOptions.Register();

class IoMenuItem extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: flex;
        flex-direction: row;
        cursor: pointer;
        padding: var(--io-theme-padding);
        line-height: 1em;
        touch-action: none;
      }
      :host > * {
        pointer-events: none;
        padding: var(--io-theme-spacing);
      }
      :host > .menu-icon {
        width: 1.25em;
        line-height: 1em;
      }
      :host > .menu-label {
        flex: 1;
      }
      :host > .menu-hint {
        opacity: 0.5;
        padding: 0 0.5em;
      }
      :host > .menu-more {
        opacity: 0.25;
      }
      /* @media (-webkit-min-device-pixel-ratio: 2) {
        :host > * {
          padding: calc(2 * var(--io-theme-spacing));
        }
      } */
    </style>`;
  }
  static get properties() {
    return {
      option: Object,
      position: String,
      $parent: HTMLElement,
      tabindex: 1
    };
  }
  static get listeners() {
    return {
      'focus': 'onFocus',
      'pointerdown': 'onPointerdown',
    };
  }
  get menuroot() {
    let parent = this;
    while (parent && parent.$parent) {
      parent = parent.$parent;
    }
    return parent;
  }
  get optionschain() {
    const chain = [];
    if (this.$options) chain.push(this.$options);
    let parent = this.$parent;
    while (parent) {
      if (parent.localName == 'io-menu-options') chain.push(parent);
      parent = parent.$parent;
    }
    return chain;
  }
  changed() {
    if (this.option.options) {
      let grpProps = {options: this.option.options, $parent: this, position: this.position};
      if (!this.$options) {
        this.$options = new IoMenuOptions(grpProps);
      } else {
        this.$options.setProperties(grpProps); // TODO: test
      }
    }
    this.template([
      this.option.icon ? ['span', {className: 'menu-icon'}, this.option.icon] : null,
      ['span', {className: 'menu-label'}, this.option.label || this.option.value],
      this.option.hint ? ['span', {className: 'menu-hint'}] : null,
      this.option.options ? ['span', {className: 'menu-more'}, '▸'] : null,
    ]);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.$options) {
      if (this.$options.parentNode) {
        IoMenuLayer.singleton.removeChild(this.$options);
      }
    }
  }
  onPointerdown(event) {
    IoMenuLayer.singleton.setPointerCapture(event.pointerId);
    this.focus();
  }
  onFocus() {
    if (this.$options) {
      if (!this.$options.parentNode) {
        IoMenuLayer.singleton.appendChild(this.$options);
      }
      this.$options.expanded = true;
    }
  }
}

IoMenuItem.Register();

// TODO: implement working mousestart/touchstart UX
// TODO: implement keyboard modifiers maybe. Touch alternative?
class IoMenu extends IoElement {
  static get properties() {
    return {
      options: Array,
      expanded: Boolean,
      position: 'pointer',
      ondown: true,
      button: 0,
    };
  }
  constructor(props) {
    super(props);
    this.template([
      ['io-menu-options', {
        id: 'group',
        $parent: this,
        options: this.bind('options'),
        position: this.bind('position'),
        expanded: this.bind('expanded')
      }]
    ]);
    this.$.group.__parent = this;
  }
  connectedCallback() {
    super.connectedCallback();
    this._parent = this.parentElement;
    this._parent.addEventListener('pointerdown', this.onPointerdown);
    this._parent.addEventListener('contextmenu', this.onContextmenu);
    this._parent.style['touch-action'] = 'none';
    IoMenuLayer.singleton.appendChild(this.$['group']);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._parent.removeEventListener('pointerdown', this.onPointerdown);
    this._parent.removeEventListener('contextmenu', this.onContextmenu);
    // TODO: unhack
    if (this.$['group']) IoMenuLayer.singleton.removeChild(this.$['group']);
  }
  getBoundingClientRect() {
    return this._parent.getBoundingClientRect();
  }
  onContextmenu(event) {
    if (this.button === 2) {
      event.preventDefault();
      this.open(event);
    }
  }
  onPointerdown(event) {
    this._parent.setPointerCapture(event.pointerId);
    this._parent.addEventListener('pointerup', this.onPointerup);
    if (this.ondown && event.button === this.button) {
      this.open(event);
    }
  }
  onPointerup(event) {
    this._parent.removeEventListener('pointerup', this.onPointerup);
    if (!this.ondown && event.button === this.button) {
      this.open(event);
    }
  }
  open(event) {
    IoMenuLayer.singleton.collapseAllGroups();
    if (event.pointerId) IoMenuLayer.singleton.setPointerCapture(event.pointerId);
    IoMenuLayer.singleton._x = event.clientX;
    IoMenuLayer.singleton._y = event.clientY;
    this.expanded = true;
  }
}

IoMenu.Register();

const selection = window.getSelection();
const range = document.createRange();

class IoNumber extends IoElement {
  static get style() {
    return html`<style>
      :host {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        border: var(--io-theme-field-border);
        border-radius: var(--io-theme-border-radius);
        padding: var(--io-theme-padding);
        color: var(--io-theme-field-color);
        background: var(--io-theme-field-bg);
      }
      :host:focus {
        overflow: hidden;
        text-overflow: clip;
        outline: none;
        border: var(--io-theme-focus-border);
        background: var(--io-theme-focus-bg);
      }
    </style>`;
  }
  static get properties() {
    return {
      value: Number,
      conversion: 1,
      step: 0.001,
      min: -Infinity,
      max: Infinity,
      strict: true,
      tabindex: 0,
      contenteditable: true
    };
  }
  static get listeners() {
    return {
      'focus': '_onFocus'
    };
  }
  constructor(props) {
    super(props);
    this.setAttribute('spellcheck', 'false');
  }
  _onFocus() {
    this.addEventListener('blur', this._onBlur);
    this.addEventListener('keydown', this._onKeydown);
    this._select();
  }
  _onBlur() {
    this.removeEventListener('blur', this._onBlur);
    this.removeEventListener('keydown', this._onKeydown);
    this.setFromText(this.innerText);
    this.scrollTop = 0;
    this.scrollLeft = 0;
  }
  _onKeydown(event) {
    if (event.which == 13) {
      event.preventDefault();
      this.setFromText(this.innerText);
    }
  }
  _select() {
    range.selectNodeContents(this);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  setFromText(text) {
    // TODO: test conversion
    let value = Math.round(Number(text) / this.step) * this.step / this.conversion;
    if (this.strict) {
      value = Math.min(this.max, Math.max(this.min, value));
    }
    if (!isNaN(value)) this.set('value', value);
  }
  changed() {
    let value = this.value;
    if (typeof value == 'number' && !isNaN(value)) {
      value *= this.conversion;
      value = value.toFixed(-Math.round(Math.log(this.step) / Math.LN10));
      this.innerText = String(value);
    } else {
      this.innerText = 'NaN';
    }
  }
}

IoNumber.Register();

class IoObject extends IoCollapsable {
  static get properties() {
    return {
      value: Object,
      props: Array,
      config: null,
      labeled: true,
    };
  }
  changed() {
    const label = this.label || this.value.constructor.name;
    this.template([
      ['io-boolean', {true: label, false: label, value: this.bind('expanded')}],
      this.expanded ? [
        ['io-properties', {
          className: 'io-collapsable-content',
          value: this.value,
          props: this.props.length ? this.props : Object.keys(this.value),
          config: this.config,
          labeled: this.labeled,
        }]
      ] : null
    ]);
  }
}

IoObject.Register();

class IoOption extends IoButton {
  static get style() {
    return html`<style>
      :host:not([hamburger])::after {
        width: 0.65em;
        margin-left: 0.25em;
        content: '▾';
      }
    </style>`;
  }
  static get properties() {
    return {
      options: Array,
      hamburger: {
        type: Boolean,
        reflect: true,
      },
    };
  }
  static get listeners() {
    return {
      'io-button-clicked': 'onClicked'
    };
  }
  onClicked() {
    this.$['menu'].expanded = true;
    let firstItem = this.$['menu'].$['group'].querySelector('io-menu-item');
    if (firstItem) firstItem.focus();
  }
  onMenu(event) {
    this.$['menu'].expanded = false;
    this.set('value', event.detail.value);
    if (this.action) this.action(this.value);
  }
  changed() {
    let label = this.value;
    if (label instanceof Object) label = label.__proto__.constructor.name;
    if (this.options) {
      for (let i = 0; i < this.options.length; i++) {
        if (this.options[i].value === this.value) {
          label = this.options[i].label || label;
          break;
        }
      }
    }
    this.template([
      ['span', this.hamburger ? '☰' : String(label)],
      ['io-menu', {
        id: 'menu',
        options: this.options,
        position: 'bottom',
        button: 0,
        ondown: false, // TODO: make open ondown and stay open with position:bottom
        'on-io-menu-item-clicked': this.onMenu}]
    ]);
  }
}

IoOption.Register();

// TODO: document and test

class IoTabs extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        overflow: hidden;
      }
      :host > * {
        flex: 0 0 auto;
      }
      :host:not([vertical]) > * {
        margin-right: var(--io-theme-spacing);
      }
      :host[vertical] > * {
        margin-bottom: var(--io-theme-spacing);
      }
      :host[vertical] > io-option {
        padding: calc(var(--io-theme-padding) * 9) var(--io-theme-padding);
      }
      :host[vertical] {
        flex-direction: column;
      }
      :host > * {
        display: none;
      }
      :host[vertical][collapsed] > io-option {
        display: inherit;
      }
      :host[vertical]:not([collapsed]) > :nth-child(n+3) {
        display: inherit;
      }
      :host:not([vertical])[overflow] > :nth-child(-n+2) {
        display: inherit;
      }
      :host:not([vertical]):not([overflow]) > :nth-child(n+3) {
        display: inherit;
      }
      :host:not([vertical])[overflow] > :nth-child(n+3) {
        display: inherit;
        visibility: hidden;
      }
      :host:not([vertical]) > * {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        background-image: linear-gradient(0deg, rgba(0, 0, 0, 0.125), transparent 0.75em);
      }
      :host:not([vertical]) > *.io-selected {
        border-bottom-color: var(--io-theme-content-bg);
        background-image: none;
      }
      :host[vertical] > * {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        background-image: linear-gradient(270deg, rgba(0, 0, 0, 0.125), transparent 0.75em);
      }
      :host[vertical] > *.io-selected {
        border-right-color: var(--io-theme-content-bg);
        background-image: none;
      }
      :host > io-button {
        letter-spacing: 0.145em;
        font-weight: 500;
      }
      :host > io-button:not(.io-selected) {
        color: rgba(0, 0, 0, 0.5);
      }
      :host > io-button.io-selected {
        background: var(--io-theme-content-bg);
        font-weight: 600;
        letter-spacing: 0.11em;
      }
    </style>`;
  }
  static get properties() {
    return {
      options: Array,
      selected: null,
      vertical: {
        type: Boolean,
        reflect: true,
      },
      overflow: {
        type: Boolean,
        reflect: true,
      },
      collapsed: {
        type: Boolean,
        reflect: true
      },
    };
  }
  select(id) {
    this.selected = id;
  }
  resized() {
    const rect = this.getBoundingClientRect();
    const lastButton = this.children[this.children.length-1];
    const rectButton = lastButton.getBoundingClientRect();
    this.overflow = (!this.vertical && this.collapsed) || rect.right < rectButton.right;
  }
  changed() {
    const buttons = [];
    const hamburger = ['io-option', {
      hamburger: true,
      value: this.bind('selected'),
      options: this.options
    }];
    for (let i = 0; i < this.options.length; i++) {
      buttons.push(['io-button', {
        label: this.options[i].label,
        value: this.options[i].value,
        action: this.select,
        className: this.selected === this.options[i].value ? 'io-selected' : ''
      }]);
    }
    this.template([hamburger, buttons[this.selected] || ['span'], ...buttons]);
  }
}

IoTabs.Register();

class IoSelector extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        position: relative;
        overflow: auto;
      }
      :host[vertical] {
        flex-direction: row;
      }
      :host > io-tabs {
        z-index: 2;
      }
      :host:not([vertical]) > io-tabs {
        margin: 0 var(--io-theme-spacing);
        margin-bottom: -1px;
      }
      :host[vertical] > io-tabs {
        flex: 0 0 auto;
        margin: var(--io-theme-spacing) 0;
        margin-right: -1px;
      }
      :host[vertical] > io-tabs > io-button,
      :host[vertical] > io-tabs > io-button.io-selected {
        align-self: flex-end;
        color: var(--io-theme-link-color);
        border: none;
        background: none;
        background-image: none !important;
      }
      :host[vertical] > io-tabs > io-button:hover {
        text-decoration: underline;
      }
      :host > io-element-cache {
        flex: 1 1 auto;
        padding: var(--io-theme-padding);
        border: var(--io-theme-content-border);
        border-radius: var(--io-theme-border-radius);
        background: var(--io-theme-content-bg);
        overflow: auto;
      }
    </style>`;
  }
  static get properties() {
    return {
      elements: Array,
      selected: Number,
      precache: Boolean,
      cache: true,
      collapseWidth: 500,
      vertical: {
        type: Boolean,
        reflect: true
      },
      collapsed: {
        type: Boolean,
        reflect: true
      },
    };
  }
  resized() {
    const rect = this.getBoundingClientRect();
    this.collapsed = this.vertical && rect.width < this.collapseWidth;
  }
  changed() {
    const options = [];
    for (let i = 0; i < this.elements.length; i++) {
      const props = this.elements[i][1] || {};
      const label = props.label || props.title || props.name || this.elements[i][0] + '[' + i + ']';
      options.push({
        value: i,
        label: label,
      });
    }
    this.template([
      ['io-tabs', {
        selected: this.bind('selected'),
        vertical: this.vertical,
        collapsed: this.collapsed,
        options: options,
      }],
      ['io-element-cache', {
        elements: this.elements,
        selected: this.selected,
        cache: this.cache,
        precache: this.precache,
      }],
    ]);
  }
}

IoSelector.Register();

class IoSlider extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: flex;
        flex-direction: row;
        min-width: 12em;
      }
      :host > io-number {
        flex: 0 0 auto;
      }
      :host > io-slider-knob {
        flex: 1 1 auto;
        margin-left: var(--io-theme-spacing);
        border-radius: 2px;
      }
    </style>`;
  }
  static get properties() {
    return {
      value: 0,
      step: 0.001,
      min: 0,
      max: 1,
      strict: true,
    };
  }
  _onValueSet(event) {
    this.dispatchEvent('value-set', event.detail, false);
    this.value = event.detail.value;
  }
  changed() {
    const charLength = (Math.max(Math.max(String(this.min).length, String(this.max).length), String(this.step).length));
    this.template([
      ['io-number', {value: this.value, step: this.step, min: this.min, max: this.max, strict: this.strict, id: 'number', 'on-value-set': this._onValueSet}],
      ['io-slider-knob', {value: this.value, step: this.step, minValue: this.min, maxValue: this.max, id: 'slider', 'on-value-set': this._onValueSet}]
    ]);
    this.$.number.style.setProperty('min-width', charLength + 'em');
  }
}

IoSlider.Register();

class IoSliderKnob extends IoCanvas {
  static get style() {
    return html`<style>
      :host {
        display: flex;
        cursor: ew-resize;
        touch-action: none;
      }
      :host > img {
        pointer-events: none;
        touch-action: none;
      }
    </style>`;
  }
  static get properties() {
    return {
      value: 0,
      step: 0.01,
      minValue: 0,
      maxValue: 1000,
      startColor: [0.3, 0.9, 1, 1],
      endColor: [0.9, 1, 0.5, 1],
      lineColor: [0.3, 0.3, 0.3, 1],
      bg: [0.5, 0.5, 0.5, 1],
      snapWidth: 2,
      slotWidth: 2,
      handleWidth: 4,
    };
  }
  static get listeners() {
    return {
      'pointerdown': 'onPointerdown',
      'pointermove': 'onPointermove',
      'dragstart': 'preventDefault',
    };
  }
  onPointerdown(event) {
    this.setPointerCapture(event.pointerId);
  }
  onPointermove(event) {
    this.setPointerCapture(event.pointerId);
    if (event.buttons !== 0) {
      event.preventDefault();
      const rect = this.getBoundingClientRect();
      const x = (event.clientX - rect.x) / rect.width;
      const pos = Math.max(0,Math.min(1, x));
      let value = this.minValue + (this.maxValue - this.minValue) * pos;
      value = Math.round(value / this.step) * this.step;
      value = Math.min(this.maxValue, Math.max(this.minValue, (value)));
      this.set('value', value);
    }
  }
  // TODO: implement proper sdf shapes.
  static get frag() {
    return `
    varying vec2 vUv;
    void main(void) {

      vec4 finalColor = vec4(0.0, 0.0, 0.0, 0.0);

      float _range = maxValue - minValue;
      float _progress = (value - minValue) / _range;
      float _value = mix(minValue, maxValue, vUv.x);
      float _stepRange = size.x / (_range / step);

      if (_stepRange > snapWidth * 4.0) {
        float pxValue = _value * size.x / _range;
        float pxStep = step * size.x / _range;
        float snap0 = mod(pxValue, pxStep);
        float snap1 = pxStep - mod(pxValue, pxStep);
        float snap = min(snap0, snap1) * 2.0;
        snap -= snapWidth;
        snap = 1.0 - clamp(snap, 0.0, 1.0);
        finalColor = mix(finalColor, lineColor, snap);
      }

      float slot = (abs(0.5 - vUv.y) * 2.0) * size.y;
      slot = (1.0 - slot) + slotWidth;
      slot = clamp(slot, 0.0, 1.0);
      vec4 slotColor = mix(startColor, endColor, vUv.x);

      float progress = (vUv.x - _progress) * size.x;
      progress = clamp(progress, 0.0, 1.0);
      slotColor = mix(slotColor, lineColor, progress);

      float handle = abs(vUv.x - _progress) * size.x;
      handle = (1.0 - handle) + handleWidth;
      handle = clamp(handle, 0.0, 1.0);

      finalColor = mix(finalColor, slotColor, slot);
      finalColor = mix(finalColor, mix(startColor, endColor, _progress), handle);

      gl_FragColor = finalColor;
    }`;
  }
}

IoSliderKnob.Register();

const selection$1 = window.getSelection();
const range$1 = document.createRange();

class IoString extends IoElement {
  static get style() {
    return html`<style>
      :host {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        border: var(--io-theme-field-border);
        border-radius: var(--io-theme-border-radius);
        padding: var(--io-theme-padding);
        color: var(--io-theme-field-color);
        background: var(--io-theme-field-bg);
      }
      :host:focus {
        overflow: hidden;
        text-overflow: clip;
        outline: none;
        border: var(--io-theme-focus-border);
        background: var(--io-theme-focus-bg);
      }
    </style>`;
  }
  static get properties() {
    return {
      value: String,
      tabindex: 0,
      contenteditable: true
    };
  }
  static get listeners() {
    return {
      'focus': '_onFocus'
    };
  }
  _onFocus() {
    this.addEventListener('blur', this._onBlur);
    this.addEventListener('keydown', this._onKeydown);
    this._select();
  }
  _onBlur() {
    this.set('value', this.innerText);
    this.scrollTop = 0;
    this.scrollLeft = 0;
    this.removeEventListener('blur', this._onBlur);
    this.removeEventListener('keydown', this._onKeydown);
  }
  _onKeydown(event) {
    if (event.which == 13) {
      event.preventDefault();
      this.set('value', this.innerText);
    }
  }
  _select() {
    range$1.selectNodeContents(this);
    selection$1.removeAllRanges();
    selection$1.addRange(range$1);
  }
  valueChanged() {
    this.innerText = String(this.value).replace(new RegExp(' ', 'g'), '\u00A0');
  }
}

IoString.Register();

class IoTheme extends IoElement {
  static get style() {
    return html`<style>
      body {
        --bg: #eee;
        --radius: 5px 5px 5px 5px;
        --spacing: 3px;
        --padding: 3px;
        --border-radius: 2px;
        --border: 1px solid rgba(128, 128, 128, 0.25);
        --color: #000;

        --number-color: rgb(28, 0, 207);
        --string-color: rgb(196, 26, 22);
        --boolean-color: rgb(170, 13, 145);

        --link-color: #09d;
        --focus-border: 1px solid #09d;
        --focus-bg: #def;
        --active-bg: #ef8;
        --hover-bg: #fff;

        --frame-border: 1px solid #aaa;
        --frame-bg: #ccc;

        --content-border: 1px solid #aaa;
        --content-bg: #eee;

        --button-border: 1px solid #999;
        --button-bg: #bbb;

        --field-border: 1px solid #ccc;
        --field-color: #333;
        --field-bg: white;

        --menu-border: 1px solid #999;
        --menu-bg: #bbb;
        --menu-shadow: 2px 3px 5px rgba(0,0,0,0.2);
      }
      @media (-webkit-min-device-pixel-ratio: 2) {
        body {
          --radius: 7px 7px 7px 7px;
          --spacing: 4px;
          --padding: 4px;
          --border-radius: 4px;
        }
      }
    </style>`;
  }
}

IoTheme.Register();

/**
 * @author arodic / https://github.com/arodic
 */

// TODO: consider IoLite

class Shot extends IoCore {
  static get properties() {
    return {
      camera: PerspectiveCamera,
      scene: Scene,
      time: {
        value: 0,
        config: {step: 0.01}
      }
    };
  }
  constructor() {
    super();
    this.init();
  }
  init() {
  }
  dispose() {
  }
  onPropertychanged() {

  }
  play() {

  }
  pause() {

  }
  stop() {

  }
  changed() {

  }
  preRender() {

  }
  postRender() {

  }
  path(path, importurl) {
    return new URL(path, importurl).pathname;
  }
}

Shot.Register();

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

// Copyright 2016 The Draco Authors.

function DRACOLoader (manager) {
    this.timeLoaded = 0;
    this.manager = manager || DefaultLoadingManager;
    this.materials = null;
    this.verbosity = 0;
    this.attributeOptions = {};
    this.drawMode = TrianglesDrawMode;
    // Native Draco attribute type to Three.JS attribute type.
    this.nativeAttributeMap = {
      'position' : 'POSITION',
      'normal' : 'NORMAL',
      'color' : 'COLOR',
      'uv' : 'TEX_COORD'
    };
}
DRACOLoader.prototype = {

    constructor: DRACOLoader,

    load: function(url, onLoad, onProgress, onError) {
        var scope = this;
        var loader = new FileLoader(scope.manager);
        loader.setPath(this.path);
        loader.setResponseType('arraybuffer');
        loader.load(url, function(blob) {
            scope.decodeDracoFile(blob, onLoad);
        }, onProgress, onError);
    },

    setPath: function(value) {
        this.path = value;
        return this;
    },

    setVerbosity: function(level) {
        this.verbosity = level;
        return this;
    },

    /**
     *  Sets desired mode for generated geometry indices.
     *  Can be either:
     *      THREE.TrianglesDrawMode
     *      THREE.TriangleStripDrawMode
     */
    setDrawMode: function(drawMode) {
        this.drawMode = drawMode;
        return this;
    },

    /**
     * Skips dequantization for a specific attribute.
     * |attributeName| is the THREE.js name of the given attribute type.
     * The only currently supported |attributeName| is 'position', more may be
     * added in future.
     */
    setSkipDequantization: function(attributeName, skip) {
        var skipDequantization = true;
        if (typeof skip !== 'undefined')
          skipDequantization = skip;
        this.getAttributeOptions(attributeName).skipDequantization =
            skipDequantization;
        return this;
    },

    /**
     * Decompresses a Draco buffer. Names of attributes (for ID and type maps)
     * must be one of the supported three.js types, including: position, color,
     * normal, uv, uv2, skinIndex, skinWeight.
     *
     * @param {ArrayBuffer} rawBuffer
     * @param {Function} callback
     * @param {Object|undefined} attributeUniqueIdMap Provides a pre-defined ID
     *     for each attribute in the geometry to be decoded. If given,
     *     `attributeTypeMap` is required and `nativeAttributeMap` will be
     *     ignored.
     * @param {Object|undefined} attributeTypeMap Provides a predefined data
     *     type (as a typed array constructor) for each attribute in the
     *     geometry to be decoded.
     */
    decodeDracoFile: function(rawBuffer, callback, attributeUniqueIdMap,
                              attributeTypeMap) {
      var scope = this;
      DRACOLoader.getDecoderModule()
          .then( function ( module ) {
            scope.decodeDracoFileInternal( rawBuffer, module.decoder, callback,
              attributeUniqueIdMap, attributeTypeMap);
          });
    },

    decodeDracoFileInternal: function(rawBuffer, dracoDecoder, callback,
                                      attributeUniqueIdMap, attributeTypeMap) {
      /*
       * Here is how to use Draco Javascript decoder and get the geometry.
       */
      var buffer = new dracoDecoder.DecoderBuffer();
      buffer.Init(new Int8Array(rawBuffer), rawBuffer.byteLength);
      var decoder = new dracoDecoder.Decoder();

      /*
       * Determine what type is this file: mesh or point cloud.
       */
      var geometryType = decoder.GetEncodedGeometryType(buffer);
      if (geometryType == dracoDecoder.TRIANGULAR_MESH) {
        if (this.verbosity > 0) {
          console.log('Loaded a mesh.');
        }
      } else if (geometryType == dracoDecoder.POINT_CLOUD) {
        if (this.verbosity > 0) {
          console.log('Loaded a point cloud.');
        }
      } else {
        var errorMsg = 'THREE.DRACOLoader: Unknown geometry type.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      callback(this.convertDracoGeometryTo3JS(dracoDecoder, decoder,
          geometryType, buffer, attributeUniqueIdMap, attributeTypeMap));
    },

    addAttributeToGeometry: function(dracoDecoder, decoder, dracoGeometry,
                                     attributeName, attributeType, attribute,
                                     geometry, geometryBuffer) {
      if (attribute.ptr === 0) {
        var errorMsg = 'THREE.DRACOLoader: No attribute ' + attributeName;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      var numComponents = attribute.num_components();
      var numPoints = dracoGeometry.num_points();
      var numValues = numPoints * numComponents;
      var attributeData;
      var TypedBufferAttribute;

      switch ( attributeType ) {

        case Float32Array:
          attributeData = new dracoDecoder.DracoFloat32Array();
          decoder.GetAttributeFloatForAllPoints(
            dracoGeometry, attribute, attributeData);
          geometryBuffer[ attributeName ] = new Float32Array( numValues );
          TypedBufferAttribute = Float32BufferAttribute;
          break;

        case Int8Array:
          attributeData = new dracoDecoder.DracoInt8Array();
          decoder.GetAttributeInt8ForAllPoints(
            dracoGeometry, attribute, attributeData );
          geometryBuffer[ attributeName ] = new Int8Array( numValues );
          TypedBufferAttribute = Int8BufferAttribute;
          break;

        case Int16Array:
          attributeData = new dracoDecoder.DracoInt16Array();
          decoder.GetAttributeInt16ForAllPoints(
            dracoGeometry, attribute, attributeData);
          geometryBuffer[ attributeName ] = new Int16Array( numValues );
          TypedBufferAttribute = Int16BufferAttribute;
          break;

        case Int32Array:
          attributeData = new dracoDecoder.DracoInt32Array();
          decoder.GetAttributeInt32ForAllPoints(
            dracoGeometry, attribute, attributeData);
          geometryBuffer[ attributeName ] = new Int32Array( numValues );
          TypedBufferAttribute = Int32BufferAttribute;
          break;

        case Uint8Array:
          attributeData = new dracoDecoder.DracoUInt8Array();
          decoder.GetAttributeUInt8ForAllPoints(
            dracoGeometry, attribute, attributeData);
          geometryBuffer[ attributeName ] = new Uint8Array( numValues );
          TypedBufferAttribute = Uint8BufferAttribute;
          break;

        case Uint16Array:
          attributeData = new dracoDecoder.DracoUInt16Array();
          decoder.GetAttributeUInt16ForAllPoints(
            dracoGeometry, attribute, attributeData);
          geometryBuffer[ attributeName ] = new Uint16Array( numValues );
          TypedBufferAttribute = Uint16BufferAttribute;
          break;

        case Uint32Array:
          attributeData = new dracoDecoder.DracoUInt32Array();
          decoder.GetAttributeUInt32ForAllPoints(
            dracoGeometry, attribute, attributeData);
          geometryBuffer[ attributeName ] = new Uint32Array( numValues );
          TypedBufferAttribute = Uint32BufferAttribute;
          break;

        default:
          var errorMsg = 'THREE.DRACOLoader: Unexpected attribute type.';
          console.error( errorMsg );
          throw new Error( errorMsg );

      }

      // Copy data from decoder.
      for (var i = 0; i < numValues; i++) {
        geometryBuffer[attributeName][i] = attributeData.GetValue(i);
      }
      // Add attribute to THREEJS geometry for rendering.
      geometry.addAttribute(attributeName,
          new TypedBufferAttribute(geometryBuffer[attributeName],
            numComponents));
      dracoDecoder.destroy(attributeData);
    },

    convertDracoGeometryTo3JS: function(dracoDecoder, decoder, geometryType,
                                        buffer, attributeUniqueIdMap,
                                        attributeTypeMap) {
        // TODO: Should not assume native Draco attribute IDs apply.
        if (this.getAttributeOptions('position').skipDequantization === true) {
          decoder.SkipAttributeTransform(dracoDecoder.POSITION);
        }
        var dracoGeometry;
        var decodingStatus;
        var start_time = performance.now();
        if (geometryType === dracoDecoder.TRIANGULAR_MESH) {
          dracoGeometry = new dracoDecoder.Mesh();
          decodingStatus = decoder.DecodeBufferToMesh(buffer, dracoGeometry);
        } else {
          dracoGeometry = new dracoDecoder.PointCloud();
          decodingStatus =
              decoder.DecodeBufferToPointCloud(buffer, dracoGeometry);
        }
        if (!decodingStatus.ok() || dracoGeometry.ptr == 0) {
          var errorMsg = 'THREE.DRACOLoader: Decoding failed: ';
          errorMsg += decodingStatus.error_msg();
          console.error(errorMsg);
          dracoDecoder.destroy(decoder);
          dracoDecoder.destroy(dracoGeometry);
          throw new Error(errorMsg);
        }

        var decode_end = performance.now();
        dracoDecoder.destroy(buffer);
        /*
         * Example on how to retrieve mesh and attributes.
         */
        var numFaces;
        if (geometryType == dracoDecoder.TRIANGULAR_MESH) {
          numFaces = dracoGeometry.num_faces();
          if (this.verbosity > 0) {
            console.log('Number of faces loaded: ' + numFaces.toString());
          }
        } else {
          numFaces = 0;
        }

        var numPoints = dracoGeometry.num_points();
        var numAttributes = dracoGeometry.num_attributes();
        if (this.verbosity > 0) {
          console.log('Number of points loaded: ' + numPoints.toString());
          console.log('Number of attributes loaded: ' +
              numAttributes.toString());
        }

        // Verify if there is position attribute.
        // TODO: Should not assume native Draco attribute IDs apply.
        var posAttId = decoder.GetAttributeId(dracoGeometry,
                                              dracoDecoder.POSITION);
        if (posAttId == -1) {
          var errorMsg = 'THREE.DRACOLoader: No position attribute found.';
          console.error(errorMsg);
          dracoDecoder.destroy(decoder);
          dracoDecoder.destroy(dracoGeometry);
          throw new Error(errorMsg);
        }
        var posAttribute = decoder.GetAttribute(dracoGeometry, posAttId);

        // Structure for converting to THREEJS geometry later.
        var geometryBuffer = {};
        // Import data to Three JS geometry.
        var geometry = new BufferGeometry();

        // Do not use both the native attribute map and a provided (e.g. glTF) map.
        if ( attributeUniqueIdMap ) {

          // Add attributes of user specified unique id. E.g. GLTF models.
          for (var attributeName in attributeUniqueIdMap) {
            var attributeType = attributeTypeMap[attributeName];
            var attributeId = attributeUniqueIdMap[attributeName];
            var attribute = decoder.GetAttributeByUniqueId(dracoGeometry,
                                                           attributeId);
            this.addAttributeToGeometry(dracoDecoder, decoder, dracoGeometry,
                attributeName, attributeType, attribute, geometry, geometryBuffer);
          }

        } else {

          // Add native Draco attribute type to geometry.
          for (var attributeName in this.nativeAttributeMap) {
            var attId = decoder.GetAttributeId(dracoGeometry,
                dracoDecoder[this.nativeAttributeMap[attributeName]]);
            if (attId !== -1) {
              if (this.verbosity > 0) {
                console.log('Loaded ' + attributeName + ' attribute.');
              }
              var attribute = decoder.GetAttribute(dracoGeometry, attId);
              this.addAttributeToGeometry(dracoDecoder, decoder, dracoGeometry,
                  attributeName, Float32Array, attribute, geometry, geometryBuffer);
            }
          }

        }

        // For mesh, we need to generate the faces.
        if (geometryType == dracoDecoder.TRIANGULAR_MESH) {
          if (this.drawMode === TriangleStripDrawMode) {
            var stripsArray = new dracoDecoder.DracoInt32Array();
            var numStrips = decoder.GetTriangleStripsFromMesh(
                dracoGeometry, stripsArray);
            geometryBuffer.indices = new Uint32Array(stripsArray.size());
            for (var i = 0; i < stripsArray.size(); ++i) {
              geometryBuffer.indices[i] = stripsArray.GetValue(i);
            }
            dracoDecoder.destroy(stripsArray);
          } else {
            var numIndices = numFaces * 3;
            geometryBuffer.indices = new Uint32Array(numIndices);
            var ia = new dracoDecoder.DracoInt32Array();
            for (var i = 0; i < numFaces; ++i) {
              decoder.GetFaceFromMesh(dracoGeometry, i, ia);
              var index = i * 3;
              geometryBuffer.indices[index] = ia.GetValue(0);
              geometryBuffer.indices[index + 1] = ia.GetValue(1);
              geometryBuffer.indices[index + 2] = ia.GetValue(2);
            }
            dracoDecoder.destroy(ia);
         }
        }

        geometry.drawMode = this.drawMode;
        if (geometryType == dracoDecoder.TRIANGULAR_MESH) {
          geometry.setIndex(new(geometryBuffer.indices.length > 65535 ?
                Uint32BufferAttribute : Uint16BufferAttribute)
              (geometryBuffer.indices, 1));
        }

        // TODO: Should not assume native Draco attribute IDs apply.
        // TODO: Can other attribute types be quantized?
        var posTransform = new dracoDecoder.AttributeQuantizationTransform();
        if (posTransform.InitFromAttribute(posAttribute)) {
          // Quantized attribute. Store the quantization parameters into the
          // THREE.js attribute.
          geometry.attributes['position'].isQuantized = true;
          geometry.attributes['position'].maxRange = posTransform.range();
          geometry.attributes['position'].numQuantizationBits =
              posTransform.quantization_bits();
          geometry.attributes['position'].minValues = new Float32Array(3);
          for (var i = 0; i < 3; ++i) {
            geometry.attributes['position'].minValues[i] =
                posTransform.min_value(i);
          }
        }
        dracoDecoder.destroy(posTransform);
        dracoDecoder.destroy(decoder);
        dracoDecoder.destroy(dracoGeometry);

        this.decode_time = decode_end - start_time;
        this.import_time = performance.now() - decode_end;

        if (this.verbosity > 0) {
          console.log('Decode time: ' + this.decode_time);
          console.log('Import time: ' + this.import_time);
        }
        return geometry;
    },

    isVersionSupported: function(version, callback) {
        DRACOLoader.getDecoderModule()
            .then( function ( module ) {
              callback( module.decoder.isVersionSupported( version ) );
            });
    },

    getAttributeOptions: function(attributeName) {
        if (typeof this.attributeOptions[attributeName] === 'undefined')
          this.attributeOptions[attributeName] = {};
        return this.attributeOptions[attributeName];
    }
};

DRACOLoader.decoderPath = './';
DRACOLoader.decoderConfig = {};
DRACOLoader.decoderModulePromise = null;

/**
 * Sets the base path for decoder source files.
 * @param {string} path
 */
DRACOLoader.setDecoderPath = function ( path ) {
  DRACOLoader.decoderPath = path;
};

/**
 * Sets decoder configuration and releases singleton decoder module. Module
 * will be recreated with the next decoding call.
 * @param {Object} config
 */
DRACOLoader.setDecoderConfig = function ( config ) {
  var wasmBinary = DRACOLoader.decoderConfig.wasmBinary;
  DRACOLoader.decoderConfig = config || {};
  DRACOLoader.releaseDecoderModule();

  // Reuse WASM binary.
  if ( wasmBinary ) DRACOLoader.decoderConfig.wasmBinary = wasmBinary;
};

/**
 * Releases the singleton DracoDecoderModule instance. Module will be recreated
 * with the next decoding call.
 */
DRACOLoader.releaseDecoderModule = function () {
  DRACOLoader.decoderModulePromise = null;
};

/**
 * Gets WebAssembly or asm.js singleton instance of DracoDecoderModule
 * after testing for browser support. Returns Promise that resolves when
 * module is available.
 * @return {Promise<{decoder: DracoDecoderModule}>}
 */
DRACOLoader.getDecoderModule = function () {
  var scope = this;
  var path = DRACOLoader.decoderPath;
  var config = DRACOLoader.decoderConfig;
  var promise = DRACOLoader.decoderModulePromise;

  if ( promise ) return promise;

  // Load source files.
  if ( typeof DracoDecoderModule !== 'undefined' ) {
    // Loaded externally.
    promise = Promise.resolve();
  } else if ( typeof WebAssembly !== 'object' || config.type === 'js' ) {
    // Load with asm.js.
    promise = DRACOLoader._loadScript( path + 'draco_decoder.js' );
  } else {
    // Load with WebAssembly.
    config.wasmBinaryFile = path + 'draco_decoder.wasm';
    promise = DRACOLoader._loadScript( path + 'draco_wasm_wrapper.js' )
        .then( function () {
          return DRACOLoader._loadArrayBuffer( config.wasmBinaryFile );
        } )
        .then( function ( wasmBinary ) {
          config.wasmBinary = wasmBinary;
        } );
  }

  // Wait for source files, then create and return a decoder.
  promise = promise.then( function () {
    return new Promise( function ( resolve ) {
      config.onModuleLoaded = function ( decoder ) {
        scope.timeLoaded = performance.now();
        // Module is Promise-like. Wrap before resolving to avoid loop.
        resolve( { decoder: decoder } );
      };
      DracoDecoderModule( config );
    } );
  } );

  DRACOLoader.decoderModulePromise = promise;
  return promise;
};

/**
 * @param {string} src
 * @return {Promise}
 */
DRACOLoader._loadScript = function ( src ) {
  var prevScript = document.getElementById( 'decoder_script' );
  if ( prevScript !== null ) {
    prevScript.parentNode.removeChild( prevScript );
  }
  var head = document.getElementsByTagName( 'head' )[ 0 ];
  var script = document.createElement( 'script' );
  script.id = 'decoder_script';
  script.type = 'text/javascript';
  script.src = src;
  return new Promise( function ( resolve ) {
    script.onload = resolve;
    head.appendChild( script );
  });
};

/**
 * @param {string} src
 * @return {Promise}
 */
DRACOLoader._loadArrayBuffer = function ( src ) {
  var loader = new FileLoader();
  loader.setResponseType( 'arraybuffer' );
  return new Promise( function( resolve, reject ) {
    loader.load( src, resolve, undefined, reject );
  });
};

/**
 * @author Rich Tibbett / https://github.com/richtr
 * @author mrdoob / http://mrdoob.com/
 * @author Tony Parisi / http://www.tonyparisi.com/
 * @author Takahiro / https://github.com/takahirox
 * @author Don McCurdy / https://www.donmccurdy.com
 */

const GLTFLoader = ( function () {

	function GLTFLoader( manager ) {

		this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;
		this.dracoLoader = null;

	}

	GLTFLoader.prototype = {

		constructor: GLTFLoader,

		crossOrigin: 'anonymous',

		load: function ( url, onLoad, onProgress, onError ) {

			var scope = this;

			var resourcePath;

			if ( this.resourcePath !== undefined ) {

				resourcePath = this.resourcePath;

			} else if ( this.path !== undefined ) {

				resourcePath = this.path;

			} else {

				resourcePath = LoaderUtils.extractUrlBase( url );

			}

			// Tells the LoadingManager to track an extra item, which resolves after
			// the model is fully loaded. This means the count of items loaded will
			// be incorrect, but ensures manager.onLoad() does not fire early.
			scope.manager.itemStart( url );

			var _onError = function ( e ) {

				if ( onError ) {

					onError( e );

				} else {

					console.error( e );

				}

				scope.manager.itemError( url );
				scope.manager.itemEnd( url );

			};

			var loader = new FileLoader( scope.manager );

			loader.setPath( this.path );
			loader.setResponseType( 'arraybuffer' );

			loader.load( url, function ( data ) {

				try {

					scope.parse( data, resourcePath, function ( gltf ) {

						onLoad( gltf );

						scope.manager.itemEnd( url );

					}, _onError );

				} catch ( e ) {

					_onError( e );

				}

			}, onProgress, _onError );

		},

		setCrossOrigin: function ( value ) {

			this.crossOrigin = value;
			return this;

		},

		setPath: function ( value ) {

			this.path = value;
			return this;

		},

		setResourcePath: function ( value ) {

			this.resourcePath = value;
			return this;

		},

		setDRACOLoader: function ( dracoLoader ) {

			this.dracoLoader = dracoLoader;
			return this;

		},

		parse: function ( data, path, onLoad, onError ) {

			var content;
			var extensions = {};

			if ( typeof data === 'string' ) {

				content = data;

			} else {

				var magic = LoaderUtils.decodeText( new Uint8Array( data, 0, 4 ) );

				if ( magic === BINARY_EXTENSION_HEADER_MAGIC ) {

					try {

						extensions[ EXTENSIONS.KHR_BINARY_GLTF ] = new GLTFBinaryExtension( data );

					} catch ( error ) {

						if ( onError ) onError( error );
						return;

					}

					content = extensions[ EXTENSIONS.KHR_BINARY_GLTF ].content;

				} else {

					content = LoaderUtils.decodeText( new Uint8Array( data ) );

				}

			}

			var json = JSON.parse( content );

			if ( json.asset === undefined || json.asset.version[ 0 ] < 2 ) {

				if ( onError ) onError( new Error( 'THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported. Use LegacyGLTFLoader instead.' ) );
				return;

			}

			if ( json.extensionsUsed ) {

				for ( var i = 0; i < json.extensionsUsed.length; ++ i ) {

					var extensionName = json.extensionsUsed[ i ];
					var extensionsRequired = json.extensionsRequired || [];

					switch ( extensionName ) {

						case EXTENSIONS.KHR_LIGHTS_PUNCTUAL:
							extensions[ extensionName ] = new GLTFLightsExtension( json );
							break;

						case EXTENSIONS.KHR_MATERIALS_UNLIT:
							extensions[ extensionName ] = new GLTFMaterialsUnlitExtension( json );
							break;

						case EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS:
							extensions[ extensionName ] = new GLTFMaterialsPbrSpecularGlossinessExtension( json );
							break;

						case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
							extensions[ extensionName ] = new GLTFDracoMeshCompressionExtension( json, this.dracoLoader );
							break;

						case EXTENSIONS.MSFT_TEXTURE_DDS:
							extensions[ EXTENSIONS.MSFT_TEXTURE_DDS ] = new GLTFTextureDDSExtension( json );
							break;

						case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
							extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] = new GLTFTextureTransformExtension( json );
							break;

						default:

							if ( extensionsRequired.indexOf( extensionName ) >= 0 ) {

								console.warn( 'THREE.GLTFLoader: Unknown extension "' + extensionName + '".' );

							}

					}

				}

			}

			var parser = new GLTFParser( json, extensions, {

				path: path || this.resourcePath || '',
				crossOrigin: this.crossOrigin,
				manager: this.manager

			} );

			parser.parse( function ( scene, scenes, cameras, animations, json ) {

				var glTF = {
					scene: scene,
					scenes: scenes,
					cameras: cameras,
					animations: animations,
					asset: json.asset,
					parser: parser,
					userData: {}
				};

				addUnknownExtensionsToUserData( extensions, glTF, json );

				onLoad( glTF );

			}, onError );

		}

	};

	/* GLTFREGISTRY */

	function GLTFRegistry() {

		var objects = {};

		return	{

			get: function ( key ) {

				return objects[ key ];

			},

			add: function ( key, object ) {

				objects[ key ] = object;

			},

			remove: function ( key ) {

				delete objects[ key ];

			},

			removeAll: function () {

				objects = {};

			}

		};

	}

	/*********************************/
	/********** EXTENSIONS ***********/
	/*********************************/

	var EXTENSIONS = {
		KHR_BINARY_GLTF: 'KHR_binary_glTF',
		KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
		KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
		KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS: 'KHR_materials_pbrSpecularGlossiness',
		KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
		KHR_TEXTURE_TRANSFORM: 'KHR_texture_transform',
		MSFT_TEXTURE_DDS: 'MSFT_texture_dds'
	};

	/**
	 * DDS Texture Extension
	 *
	 * Specification:
	 * https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_texture_dds
	 *
	 */
	function GLTFTextureDDSExtension() {

		if ( ! DDSLoader ) {

			throw new Error( 'THREE.GLTFLoader: Attempting to load .dds texture without importing THREE.DDSLoader' );

		}

		this.name = EXTENSIONS.MSFT_TEXTURE_DDS;
		this.ddsLoader = new DDSLoader();

	}

	/**
	 * Lights Extension
	 *
	 * Specification: PENDING
	 */
	function GLTFLightsExtension( json ) {

		this.name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL;

		var extension = ( json.extensions && json.extensions[ EXTENSIONS.KHR_LIGHTS_PUNCTUAL ] ) || {};
		this.lightDefs = extension.lights || [];

	}

	GLTFLightsExtension.prototype.loadLight = function ( lightIndex ) {

		var lightDef = this.lightDefs[ lightIndex ];
		var lightNode;

		var color = new Color( 0xffffff );
		if ( lightDef.color !== undefined ) color.fromArray( lightDef.color );

		var range = lightDef.range !== undefined ? lightDef.range : 0;

		switch ( lightDef.type ) {

			case 'directional':
				lightNode = new DirectionalLight( color );
				lightNode.target.position.set( 0, 0, - 1 );
				lightNode.add( lightNode.target );
				break;

			case 'point':
				lightNode = new PointLight( color );
				lightNode.distance = range;
				break;

			case 'spot':
				lightNode = new SpotLight( color );
				lightNode.distance = range;
				// Handle spotlight properties.
				lightDef.spot = lightDef.spot || {};
				lightDef.spot.innerConeAngle = lightDef.spot.innerConeAngle !== undefined ? lightDef.spot.innerConeAngle : 0;
				lightDef.spot.outerConeAngle = lightDef.spot.outerConeAngle !== undefined ? lightDef.spot.outerConeAngle : Math.PI / 4.0;
				lightNode.angle = lightDef.spot.outerConeAngle;
				lightNode.penumbra = 1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
				lightNode.target.position.set( 0, 0, - 1 );
				lightNode.add( lightNode.target );
				break;

			default:
				throw new Error( 'THREE.GLTFLoader: Unexpected light type, "' + lightDef.type + '".' );

		}

		// Some lights (e.g. spot) default to a position other than the origin. Reset the position
		// here, because node-level parsing will only override position if explicitly specified.
		lightNode.position.set( 0, 0, 0 );

		lightNode.decay = 2;

		if ( lightDef.intensity !== undefined ) lightNode.intensity = lightDef.intensity;

		lightNode.name = lightDef.name || ( 'light_' + lightIndex );

		return Promise.resolve( lightNode );

	};

	/**
	 * Unlit Materials Extension (pending)
	 *
	 * PR: https://github.com/KhronosGroup/glTF/pull/1163
	 */
	function GLTFMaterialsUnlitExtension( json ) {

		this.name = EXTENSIONS.KHR_MATERIALS_UNLIT;

	}

	GLTFMaterialsUnlitExtension.prototype.getMaterialType = function ( material ) {

		return MeshBasicMaterial;

	};

	GLTFMaterialsUnlitExtension.prototype.extendParams = function ( materialParams, material, parser ) {

		var pending = [];

		materialParams.color = new Color( 1.0, 1.0, 1.0 );
		materialParams.opacity = 1.0;

		var metallicRoughness = material.pbrMetallicRoughness;

		if ( metallicRoughness ) {

			if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

				var array = metallicRoughness.baseColorFactor;

				materialParams.color.fromArray( array );
				materialParams.opacity = array[ 3 ];

			}

			if ( metallicRoughness.baseColorTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture ) );

			}

		}

		return Promise.all( pending );

	};
	var BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
	var BINARY_EXTENSION_HEADER_LENGTH = 12;
	var BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };

	function GLTFBinaryExtension( data ) {

		this.name = EXTENSIONS.KHR_BINARY_GLTF;
		this.content = null;
		this.body = null;

		var headerView = new DataView( data, 0, BINARY_EXTENSION_HEADER_LENGTH );

		this.header = {
			magic: LoaderUtils.decodeText( new Uint8Array( data.slice( 0, 4 ) ) ),
			version: headerView.getUint32( 4, true ),
			length: headerView.getUint32( 8, true )
		};

		if ( this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC ) {

			throw new Error( 'THREE.GLTFLoader: Unsupported glTF-Binary header.' );

		} else if ( this.header.version < 2.0 ) {

			throw new Error( 'THREE.GLTFLoader: Legacy binary file detected. Use LegacyGLTFLoader instead.' );

		}

		var chunkView = new DataView( data, BINARY_EXTENSION_HEADER_LENGTH );
		var chunkIndex = 0;

		while ( chunkIndex < chunkView.byteLength ) {

			var chunkLength = chunkView.getUint32( chunkIndex, true );
			chunkIndex += 4;

			var chunkType = chunkView.getUint32( chunkIndex, true );
			chunkIndex += 4;

			if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON ) {

				var contentArray = new Uint8Array( data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength );
				this.content = LoaderUtils.decodeText( contentArray );

			} else if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN ) {

				var byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
				this.body = data.slice( byteOffset, byteOffset + chunkLength );

			}

			// Clients must ignore chunks with unknown types.

			chunkIndex += chunkLength;

		}

		if ( this.content === null ) {

			throw new Error( 'THREE.GLTFLoader: JSON content not found.' );

		}

	}

	/**
	 * DRACO Mesh Compression Extension
	 *
	 * Specification: https://github.com/KhronosGroup/glTF/pull/874
	 */
	function GLTFDracoMeshCompressionExtension( json, dracoLoader ) {

		if ( ! dracoLoader ) {

			throw new Error( 'THREE.GLTFLoader: No DRACOLoader instance provided.' );

		}

		this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;
		this.json = json;
		this.dracoLoader = dracoLoader;
		DRACOLoader.getDecoderModule();

	}

	GLTFDracoMeshCompressionExtension.prototype.decodePrimitive = function ( primitive, parser ) {

		var json = this.json;
		var dracoLoader = this.dracoLoader;
		var bufferViewIndex = primitive.extensions[ this.name ].bufferView;
		var gltfAttributeMap = primitive.extensions[ this.name ].attributes;
		var threeAttributeMap = {};
		var attributeNormalizedMap = {};
		var attributeTypeMap = {};

		for ( var attributeName in gltfAttributeMap ) {

			if ( ! ( attributeName in ATTRIBUTES ) ) continue;

			threeAttributeMap[ ATTRIBUTES[ attributeName ] ] = gltfAttributeMap[ attributeName ];

		}

		for ( attributeName in primitive.attributes ) {

			if ( ATTRIBUTES[ attributeName ] !== undefined && gltfAttributeMap[ attributeName ] !== undefined ) {

				var accessorDef = json.accessors[ primitive.attributes[ attributeName ] ];
				var componentType = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];

				attributeTypeMap[ ATTRIBUTES[ attributeName ] ] = componentType;
				attributeNormalizedMap[ ATTRIBUTES[ attributeName ] ] = accessorDef.normalized === true;

			}

		}

		return parser.getDependency( 'bufferView', bufferViewIndex ).then( function ( bufferView ) {

			return new Promise( function ( resolve ) {

				dracoLoader.decodeDracoFile( bufferView, function ( geometry ) {

					for ( var attributeName in geometry.attributes ) {

						var attribute = geometry.attributes[ attributeName ];
						var normalized = attributeNormalizedMap[ attributeName ];

						if ( normalized !== undefined ) attribute.normalized = normalized;

					}

					resolve( geometry );

				}, threeAttributeMap, attributeTypeMap );

			} );

		} );

	};

	/**
	 * Texture Transform Extension
	 *
	 * Specification:
	 */
	function GLTFTextureTransformExtension( json ) {

		this.name = EXTENSIONS.KHR_TEXTURE_TRANSFORM;

	}

	GLTFTextureTransformExtension.prototype.extendTexture = function ( texture, transform ) {

		texture = texture.clone();

		if ( transform.offset !== undefined ) {

			texture.offset.fromArray( transform.offset );

		}

		if ( transform.rotation !== undefined ) {

			texture.rotation = transform.rotation;

		}

		if ( transform.scale !== undefined ) {

			texture.repeat.fromArray( transform.scale );

		}

		if ( transform.texCoord !== undefined ) {

			console.warn( 'THREE.GLTFLoader: Custom UV sets in "' + this.name + '" extension not yet supported.' );

		}

		texture.needsUpdate = true;

		return texture;

	};

	/**
	 * Specular-Glossiness Extension
	 *
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness
	 */
	function GLTFMaterialsPbrSpecularGlossinessExtension() {

		return {

			name: EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS,

			specularGlossinessParams: [
				'color',
				'map',
				'lightMap',
				'lightMapIntensity',
				'aoMap',
				'aoMapIntensity',
				'emissive',
				'emissiveIntensity',
				'emissiveMap',
				'bumpMap',
				'bumpScale',
				'normalMap',
				'displacementMap',
				'displacementScale',
				'displacementBias',
				'specularMap',
				'specular',
				'glossinessMap',
				'glossiness',
				'alphaMap',
				'envMap',
				'envMapIntensity',
				'refractionRatio',
			],

			getMaterialType: function () {

				return ShaderMaterial;

			},

			extendParams: function ( params, material, parser ) {

				var pbrSpecularGlossiness = material.extensions[ this.name ];

				var shader = ShaderLib[ 'standard' ];

				var uniforms = UniformsUtils.clone( shader.uniforms );

				var specularMapParsFragmentChunk = [
					'#ifdef USE_SPECULARMAP',
					'	uniform sampler2D specularMap;',
					'#endif'
				].join( '\n' );

				var glossinessMapParsFragmentChunk = [
					'#ifdef USE_GLOSSINESSMAP',
					'	uniform sampler2D glossinessMap;',
					'#endif'
				].join( '\n' );

				var specularMapFragmentChunk = [
					'vec3 specularFactor = specular;',
					'#ifdef USE_SPECULARMAP',
					'	vec4 texelSpecular = texture2D( specularMap, vUv );',
					'	texelSpecular = sRGBToLinear( texelSpecular );',
					'	// reads channel RGB, compatible with a glTF Specular-Glossiness (RGBA) texture',
					'	specularFactor *= texelSpecular.rgb;',
					'#endif'
				].join( '\n' );

				var glossinessMapFragmentChunk = [
					'float glossinessFactor = glossiness;',
					'#ifdef USE_GLOSSINESSMAP',
					'	vec4 texelGlossiness = texture2D( glossinessMap, vUv );',
					'	// reads channel A, compatible with a glTF Specular-Glossiness (RGBA) texture',
					'	glossinessFactor *= texelGlossiness.a;',
					'#endif'
				].join( '\n' );

				var lightPhysicalFragmentChunk = [
					'PhysicalMaterial material;',
					'material.diffuseColor = diffuseColor.rgb;',
					'material.specularRoughness = clamp( 1.0 - glossinessFactor, 0.04, 1.0 );',
					'material.specularColor = specularFactor.rgb;',
				].join( '\n' );

				var fragmentShader = shader.fragmentShader
					.replace( 'uniform float roughness;', 'uniform vec3 specular;' )
					.replace( 'uniform float metalness;', 'uniform float glossiness;' )
					.replace( '#include <roughnessmap_pars_fragment>', specularMapParsFragmentChunk )
					.replace( '#include <metalnessmap_pars_fragment>', glossinessMapParsFragmentChunk )
					.replace( '#include <roughnessmap_fragment>', specularMapFragmentChunk )
					.replace( '#include <metalnessmap_fragment>', glossinessMapFragmentChunk )
					.replace( '#include <lights_physical_fragment>', lightPhysicalFragmentChunk );

				delete uniforms.roughness;
				delete uniforms.metalness;
				delete uniforms.roughnessMap;
				delete uniforms.metalnessMap;

				uniforms.specular = { value: new Color().setHex( 0x111111 ) };
				uniforms.glossiness = { value: 0.5 };
				uniforms.specularMap = { value: null };
				uniforms.glossinessMap = { value: null };

				params.vertexShader = shader.vertexShader;
				params.fragmentShader = fragmentShader;
				params.uniforms = uniforms;
				params.defines = { 'STANDARD': '' };

				params.color = new Color( 1.0, 1.0, 1.0 );
				params.opacity = 1.0;

				var pending = [];

				if ( Array.isArray( pbrSpecularGlossiness.diffuseFactor ) ) {

					var array = pbrSpecularGlossiness.diffuseFactor;

					params.color.fromArray( array );
					params.opacity = array[ 3 ];

				}

				if ( pbrSpecularGlossiness.diffuseTexture !== undefined ) {

					pending.push( parser.assignTexture( params, 'map', pbrSpecularGlossiness.diffuseTexture ) );

				}

				params.emissive = new Color( 0.0, 0.0, 0.0 );
				params.glossiness = pbrSpecularGlossiness.glossinessFactor !== undefined ? pbrSpecularGlossiness.glossinessFactor : 1.0;
				params.specular = new Color( 1.0, 1.0, 1.0 );

				if ( Array.isArray( pbrSpecularGlossiness.specularFactor ) ) {

					params.specular.fromArray( pbrSpecularGlossiness.specularFactor );

				}

				if ( pbrSpecularGlossiness.specularGlossinessTexture !== undefined ) {

					var specGlossMapDef = pbrSpecularGlossiness.specularGlossinessTexture;
					pending.push( parser.assignTexture( params, 'glossinessMap', specGlossMapDef ) );
					pending.push( parser.assignTexture( params, 'specularMap', specGlossMapDef ) );

				}

				return Promise.all( pending );

			},

			createMaterial: function ( params ) {

				// setup material properties based on MeshStandardMaterial for Specular-Glossiness

				var material = new ShaderMaterial( {
					defines: params.defines,
					vertexShader: params.vertexShader,
					fragmentShader: params.fragmentShader,
					uniforms: params.uniforms,
					fog: true,
					lights: true,
					opacity: params.opacity,
					transparent: params.transparent
				} );

				material.isGLTFSpecularGlossinessMaterial = true;

				material.color = params.color;

				material.map = params.map === undefined ? null : params.map;

				material.lightMap = null;
				material.lightMapIntensity = 1.0;

				material.aoMap = params.aoMap === undefined ? null : params.aoMap;
				material.aoMapIntensity = 1.0;

				material.emissive = params.emissive;
				material.emissiveIntensity = 1.0;
				material.emissiveMap = params.emissiveMap === undefined ? null : params.emissiveMap;

				material.bumpMap = params.bumpMap === undefined ? null : params.bumpMap;
				material.bumpScale = 1;

				material.normalMap = params.normalMap === undefined ? null : params.normalMap;
				if ( params.normalScale ) material.normalScale = params.normalScale;

				material.displacementMap = null;
				material.displacementScale = 1;
				material.displacementBias = 0;

				material.specularMap = params.specularMap === undefined ? null : params.specularMap;
				material.specular = params.specular;

				material.glossinessMap = params.glossinessMap === undefined ? null : params.glossinessMap;
				material.glossiness = params.glossiness;

				material.alphaMap = null;

				material.envMap = params.envMap === undefined ? null : params.envMap;
				material.envMapIntensity = 1.0;

				material.refractionRatio = 0.98;

				material.extensions.derivatives = true;

				return material;

			},

			/**
			 * Clones a GLTFSpecularGlossinessMaterial instance. The ShaderMaterial.copy() method can
			 * copy only properties it knows about or inherits, and misses many properties that would
			 * normally be defined by MeshStandardMaterial.
			 *
			 * This method allows GLTFSpecularGlossinessMaterials to be cloned in the process of
			 * loading a glTF model, but cloning later (e.g. by the user) would require these changes
			 * AND also updating `.onBeforeRender` on the parent mesh.
			 *
			 * @param  {THREE.ShaderMaterial} source
			 * @return {THREE.ShaderMaterial}
			 */
			cloneMaterial: function ( source ) {

				var target = source.clone();

				target.isGLTFSpecularGlossinessMaterial = true;

				var params = this.specularGlossinessParams;

				for ( var i = 0, il = params.length; i < il; i ++ ) {

					target[ params[ i ] ] = source[ params[ i ] ];

				}

				return target;

			},

			// Here's based on refreshUniformsCommon() and refreshUniformsStandard() in WebGLRenderer.
			refreshUniforms: function ( renderer, scene, camera, geometry, material, group ) {

				if ( material.isGLTFSpecularGlossinessMaterial !== true ) {

					return;

				}

				var uniforms = material.uniforms;
				var defines = material.defines;

				uniforms.opacity.value = material.opacity;

				uniforms.diffuse.value.copy( material.color );
				uniforms.emissive.value.copy( material.emissive ).multiplyScalar( material.emissiveIntensity );

				uniforms.map.value = material.map;
				uniforms.specularMap.value = material.specularMap;
				uniforms.alphaMap.value = material.alphaMap;

				uniforms.lightMap.value = material.lightMap;
				uniforms.lightMapIntensity.value = material.lightMapIntensity;

				uniforms.aoMap.value = material.aoMap;
				uniforms.aoMapIntensity.value = material.aoMapIntensity;

				// uv repeat and offset setting priorities
				// 1. color map
				// 2. specular map
				// 3. normal map
				// 4. bump map
				// 5. alpha map
				// 6. emissive map

				var uvScaleMap;

				if ( material.map ) {

					uvScaleMap = material.map;

				} else if ( material.specularMap ) {

					uvScaleMap = material.specularMap;

				} else if ( material.displacementMap ) {

					uvScaleMap = material.displacementMap;

				} else if ( material.normalMap ) {

					uvScaleMap = material.normalMap;

				} else if ( material.bumpMap ) {

					uvScaleMap = material.bumpMap;

				} else if ( material.glossinessMap ) {

					uvScaleMap = material.glossinessMap;

				} else if ( material.alphaMap ) {

					uvScaleMap = material.alphaMap;

				} else if ( material.emissiveMap ) {

					uvScaleMap = material.emissiveMap;

				}

				if ( uvScaleMap !== undefined ) {

					// backwards compatibility
					if ( uvScaleMap.isWebGLRenderTarget ) {

						uvScaleMap = uvScaleMap.texture;

					}

					if ( uvScaleMap.matrixAutoUpdate === true ) {

						uvScaleMap.updateMatrix();

					}

					uniforms.uvTransform.value.copy( uvScaleMap.matrix );

				}

				if ( material.envMap ) {

					uniforms.envMap.value = material.envMap;
					uniforms.envMapIntensity.value = material.envMapIntensity;

					// don't flip CubeTexture envMaps, flip everything else:
					//  WebGLRenderTargetCube will be flipped for backwards compatibility
					//  WebGLRenderTargetCube.texture will be flipped because it's a Texture and NOT a CubeTexture
					// this check must be handled differently, or removed entirely, if WebGLRenderTargetCube uses a CubeTexture in the future
					uniforms.flipEnvMap.value = material.envMap.isCubeTexture ? - 1 : 1;

					uniforms.reflectivity.value = material.reflectivity;
					uniforms.refractionRatio.value = material.refractionRatio;

					uniforms.maxMipLevel.value = renderer.properties.get( material.envMap ).__maxMipLevel;

				}

				uniforms.specular.value.copy( material.specular );
				uniforms.glossiness.value = material.glossiness;

				uniforms.glossinessMap.value = material.glossinessMap;

				uniforms.emissiveMap.value = material.emissiveMap;
				uniforms.bumpMap.value = material.bumpMap;
				uniforms.normalMap.value = material.normalMap;

				uniforms.displacementMap.value = material.displacementMap;
				uniforms.displacementScale.value = material.displacementScale;
				uniforms.displacementBias.value = material.displacementBias;

				if ( uniforms.glossinessMap.value !== null && defines.USE_GLOSSINESSMAP === undefined ) {

					defines.USE_GLOSSINESSMAP = '';
					// set USE_ROUGHNESSMAP to enable vUv
					defines.USE_ROUGHNESSMAP = '';

				}

				if ( uniforms.glossinessMap.value === null && defines.USE_GLOSSINESSMAP !== undefined ) {

					delete defines.USE_GLOSSINESSMAP;
					delete defines.USE_ROUGHNESSMAP;

				}

			}

		};

	}

	/*********************************/
	/********** INTERPOLATION ********/
	/*********************************/

	// Spline Interpolation
	// Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation
	function GLTFCubicSplineInterpolant( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

		Interpolant.call( this, parameterPositions, sampleValues, sampleSize, resultBuffer );

	}

	GLTFCubicSplineInterpolant.prototype = Object.create( Interpolant.prototype );
	GLTFCubicSplineInterpolant.prototype.constructor = GLTFCubicSplineInterpolant;

	GLTFCubicSplineInterpolant.prototype.copySampleValue_ = function ( index ) {

		// Copies a sample value to the result buffer. See description of glTF
		// CUBICSPLINE values layout in interpolate_() function below.

		var result = this.resultBuffer,
			values = this.sampleValues,
			valueSize = this.valueSize,
			offset = index * valueSize * 3 + valueSize;

		for ( var i = 0; i !== valueSize; i ++ ) {

			result[ i ] = values[ offset + i ];

		}

		return result;

	};

	GLTFCubicSplineInterpolant.prototype.beforeStart_ = GLTFCubicSplineInterpolant.prototype.copySampleValue_;

	GLTFCubicSplineInterpolant.prototype.afterEnd_ = GLTFCubicSplineInterpolant.prototype.copySampleValue_;

	GLTFCubicSplineInterpolant.prototype.interpolate_ = function ( i1, t0, t, t1 ) {

		var result = this.resultBuffer;
		var values = this.sampleValues;
		var stride = this.valueSize;

		var stride2 = stride * 2;
		var stride3 = stride * 3;

		var td = t1 - t0;

		var p = ( t - t0 ) / td;
		var pp = p * p;
		var ppp = pp * p;

		var offset1 = i1 * stride3;
		var offset0 = offset1 - stride3;

		var s2 = - 2 * ppp + 3 * pp;
		var s3 = ppp - pp;
		var s0 = 1 - s2;
		var s1 = s3 - pp + p;

		// Layout of keyframe output values for CUBICSPLINE animations:
		//   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]
		for ( var i = 0; i !== stride; i ++ ) {

			var p0 = values[ offset0 + i + stride ]; // splineVertex_k
			var m0 = values[ offset0 + i + stride2 ] * td; // outTangent_k * (t_k+1 - t_k)
			var p1 = values[ offset1 + i + stride ]; // splineVertex_k+1
			var m1 = values[ offset1 + i ] * td; // inTangent_k+1 * (t_k+1 - t_k)

			result[ i ] = s0 * p0 + s1 * m0 + s2 * p1 + s3 * m1;

		}

		return result;

	};

	/*********************************/
	/********** INTERNALS ************/
	/*********************************/

	/* CONSTANTS */

	var WEBGL_CONSTANTS = {
		FLOAT: 5126,
		//FLOAT_MAT2: 35674,
		FLOAT_MAT3: 35675,
		FLOAT_MAT4: 35676,
		FLOAT_VEC2: 35664,
		FLOAT_VEC3: 35665,
		FLOAT_VEC4: 35666,
		LINEAR: 9729,
		REPEAT: 10497,
		SAMPLER_2D: 35678,
		POINTS: 0,
		LINES: 1,
		LINE_LOOP: 2,
		LINE_STRIP: 3,
		TRIANGLES: 4,
		TRIANGLE_STRIP: 5,
		TRIANGLE_FAN: 6,
		UNSIGNED_BYTE: 5121,
		UNSIGNED_SHORT: 5123
	};

	var WEBGL_COMPONENT_TYPES = {
		5120: Int8Array,
		5121: Uint8Array,
		5122: Int16Array,
		5123: Uint16Array,
		5125: Uint32Array,
		5126: Float32Array
	};

	var WEBGL_FILTERS = {
		9728: NearestFilter,
		9729: LinearFilter,
		9984: NearestMipMapNearestFilter,
		9985: LinearMipMapNearestFilter,
		9986: NearestMipMapLinearFilter,
		9987: LinearMipMapLinearFilter
	};

	var WEBGL_WRAPPINGS = {
		33071: ClampToEdgeWrapping,
		33648: MirroredRepeatWrapping,
		10497: RepeatWrapping
	};

	var WEBGL_TYPE_SIZES = {
		'SCALAR': 1,
		'VEC2': 2,
		'VEC3': 3,
		'VEC4': 4,
		'MAT2': 4,
		'MAT3': 9,
		'MAT4': 16
	};

	var ATTRIBUTES = {
		POSITION: 'position',
		NORMAL: 'normal',
		TEXCOORD_0: 'uv',
		TEXCOORD_1: 'uv2',
		COLOR_0: 'color',
		WEIGHTS_0: 'skinWeight',
		JOINTS_0: 'skinIndex',
	};

	var PATH_PROPERTIES = {
		scale: 'scale',
		translation: 'position',
		rotation: 'quaternion',
		weights: 'morphTargetInfluences'
	};

	var INTERPOLATION = {
		CUBICSPLINE: InterpolateSmooth, // We use custom interpolation GLTFCubicSplineInterpolation for CUBICSPLINE.
		                                      // KeyframeTrack.optimize() can't handle glTF Cubic Spline output values layout,
		                                      // using THREE.InterpolateSmooth for KeyframeTrack instantiation to prevent optimization.
		                                      // See KeyframeTrack.optimize() for the detail.
		LINEAR: InterpolateLinear,
		STEP: InterpolateDiscrete
	};

	var ALPHA_MODES = {
		OPAQUE: 'OPAQUE',
		MASK: 'MASK',
		BLEND: 'BLEND'
	};

	var MIME_TYPE_FORMATS = {
		'image/png': RGBAFormat,
		'image/jpeg': RGBFormat
	};

	/* UTILITY FUNCTIONS */

	function resolveURL( url, path ) {

		// Invalid URL
		if ( typeof url !== 'string' || url === '' ) return '';

		// Absolute URL http://,https://,//
		if ( /^(https?:)?\/\//i.test( url ) ) return url;

		// Data URI
		if ( /^data:.*,.*$/i.test( url ) ) return url;

		// Blob URL
		if ( /^blob:.*$/i.test( url ) ) return url;

		// Relative URL
		return path + url;

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
	 */
	function createDefaultMaterial() {

		return new MeshStandardMaterial( {
			color: 0xFFFFFF,
			emissive: 0x000000,
			metalness: 1,
			roughness: 1,
			transparent: false,
			depthTest: true,
			side: FrontSide
		} );

	}

	function addUnknownExtensionsToUserData( knownExtensions, object, objectDef ) {

		// Add unknown glTF extensions to an object's userData.

		for ( var name in objectDef.extensions ) {

			if ( knownExtensions[ name ] === undefined ) {

				object.userData.gltfExtensions = object.userData.gltfExtensions || {};
				object.userData.gltfExtensions[ name ] = objectDef.extensions[ name ];

			}

		}

	}

	/**
	 * @param {THREE.Object3D|THREE.Material|THREE.BufferGeometry} object
	 * @param {GLTF.definition} gltfDef
	 */
	function assignExtrasToUserData( object, gltfDef ) {

		if ( gltfDef.extras !== undefined ) {

			if ( typeof gltfDef.extras === 'object' ) {

				object.userData = gltfDef.extras;

			} else {

				console.warn( 'THREE.GLTFLoader: Ignoring primitive type .extras, ' + gltfDef.extras );

			}

		}

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
	 *
	 * @param {THREE.BufferGeometry} geometry
	 * @param {Array<GLTF.Target>} targets
	 * @param {GLTFParser} parser
	 * @return {Promise<THREE.BufferGeometry>}
	 */
	function addMorphTargets( geometry, targets, parser ) {

		var hasMorphPosition = false;
		var hasMorphNormal = false;

		for ( var i = 0, il = targets.length; i < il; i ++ ) {

			var target = targets[ i ];

			if ( target.POSITION !== undefined ) hasMorphPosition = true;
			if ( target.NORMAL !== undefined ) hasMorphNormal = true;

			if ( hasMorphPosition && hasMorphNormal ) break;

		}

		if ( ! hasMorphPosition && ! hasMorphNormal ) return Promise.resolve( geometry );

		var pendingPositionAccessors = [];
		var pendingNormalAccessors = [];

		for ( var i = 0, il = targets.length; i < il; i ++ ) {

			var target = targets[ i ];

			if ( hasMorphPosition ) {

				// TODO: Error-prone use of a callback inside a loop.
				var accessor = target.POSITION !== undefined
					? parser.getDependency( 'accessor', target.POSITION )
						.then( function ( accessor ) {
							// Cloning not to pollute original accessor below
							return cloneBufferAttribute( accessor );
						} )
					: geometry.attributes.position;

				pendingPositionAccessors.push( accessor );

			}

			if ( hasMorphNormal ) {

				// TODO: Error-prone use of a callback inside a loop.
				var accessor = target.NORMAL !== undefined
					? parser.getDependency( 'accessor', target.NORMAL )
						.then( function ( accessor ) {
							return cloneBufferAttribute( accessor );
						} )
					: geometry.attributes.normal;

				pendingNormalAccessors.push( accessor );

			}

		}

		return Promise.all( [
			Promise.all( pendingPositionAccessors ),
			Promise.all( pendingNormalAccessors )
		] ).then( function ( accessors ) {

			var morphPositions = accessors[ 0 ];
			var morphNormals = accessors[ 1 ];

			for ( var i = 0, il = targets.length; i < il; i ++ ) {

				var target = targets[ i ];
				var attributeName = 'morphTarget' + i;

				if ( hasMorphPosition ) {

					// Three.js morph position is absolute value. The formula is
					//   basePosition
					//     + weight0 * ( morphPosition0 - basePosition )
					//     + weight1 * ( morphPosition1 - basePosition )
					//     ...
					// while the glTF one is relative
					//   basePosition
					//     + weight0 * glTFmorphPosition0
					//     + weight1 * glTFmorphPosition1
					//     ...
					// then we need to convert from relative to absolute here.

					if ( target.POSITION !== undefined ) {

						var positionAttribute = morphPositions[ i ];
						positionAttribute.name = attributeName;

						var position = geometry.attributes.position;

						for ( var j = 0, jl = positionAttribute.count; j < jl; j ++ ) {

							positionAttribute.setXYZ(
								j,
								positionAttribute.getX( j ) + position.getX( j ),
								positionAttribute.getY( j ) + position.getY( j ),
								positionAttribute.getZ( j ) + position.getZ( j )
							);

						}

					}

				}

				if ( hasMorphNormal ) {

					// see target.POSITION's comment

					if ( target.NORMAL !== undefined ) {

						var normalAttribute = morphNormals[ i ];
						normalAttribute.name = attributeName;

						var normal = geometry.attributes.normal;

						for ( var j = 0, jl = normalAttribute.count; j < jl; j ++ ) {

							normalAttribute.setXYZ(
								j,
								normalAttribute.getX( j ) + normal.getX( j ),
								normalAttribute.getY( j ) + normal.getY( j ),
								normalAttribute.getZ( j ) + normal.getZ( j )
							);

						}

					}

				}

			}

			if ( hasMorphPosition ) geometry.morphAttributes.position = morphPositions;
			if ( hasMorphNormal ) geometry.morphAttributes.normal = morphNormals;

			return geometry;

		} );

	}

	/**
	 * @param {THREE.Mesh} mesh
	 * @param {GLTF.Mesh} meshDef
	 */
	function updateMorphTargets( mesh, meshDef ) {

		mesh.updateMorphTargets();

		if ( meshDef.weights !== undefined ) {

			for ( var i = 0, il = meshDef.weights.length; i < il; i ++ ) {

				mesh.morphTargetInfluences[ i ] = meshDef.weights[ i ];

			}

		}

		// .extras has user-defined data, so check that .extras.targetNames is an array.
		if ( meshDef.extras && Array.isArray( meshDef.extras.targetNames ) ) {

			var targetNames = meshDef.extras.targetNames;

			if ( mesh.morphTargetInfluences.length === targetNames.length ) {

				mesh.morphTargetDictionary = {};

				for ( var i = 0, il = targetNames.length; i < il; i ++ ) {

					mesh.morphTargetDictionary[ targetNames[ i ] ] = i;

				}

			} else {

				console.warn( 'THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.' );

			}

		}

	}

	function isPrimitiveEqual( a, b ) {

		var dracoExtA = a.extensions ? a.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ] : undefined;
		var dracoExtB = b.extensions ? b.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ] : undefined;

		if ( dracoExtA && dracoExtB ) {

			if ( dracoExtA.bufferView !== dracoExtB.bufferView ) return false;

			return isObjectEqual( dracoExtA.attributes, dracoExtB.attributes );

		}

		if ( a.indices !== b.indices ) {

			return false;

		}

		return isObjectEqual( a.attributes, b.attributes );

	}

	function isObjectEqual( a, b ) {

		if ( Object.keys( a ).length !== Object.keys( b ).length ) return false;

		for ( var key in a ) {

			if ( a[ key ] !== b[ key ] ) return false;

		}

		return true;

	}

	function isArrayEqual( a, b ) {

		if ( a.length !== b.length ) return false;

		for ( var i = 0, il = a.length; i < il; i ++ ) {

			if ( a[ i ] !== b[ i ] ) return false;

		}

		return true;

	}

	function getCachedGeometry( cache, newPrimitive ) {

		for ( var i = 0, il = cache.length; i < il; i ++ ) {

			var cached = cache[ i ];

			if ( isPrimitiveEqual( cached.primitive, newPrimitive ) ) return cached.promise;

		}

		return null;

	}

	function getCachedCombinedGeometry( cache, geometries ) {

		for ( var i = 0, il = cache.length; i < il; i ++ ) {

			var cached = cache[ i ];

			if ( isArrayEqual( geometries, cached.baseGeometries ) ) return cached.geometry;

		}

		return null;

	}

	function getCachedMultiPassGeometry( cache, geometry, primitives ) {

		for ( var i = 0, il = cache.length; i < il; i ++ ) {

			var cached = cache[ i ];

			if ( geometry === cached.baseGeometry && isArrayEqual( primitives, cached.primitives ) ) return cached.geometry;

		}

		return null;

	}

	function cloneBufferAttribute( attribute ) {

		if ( attribute.isInterleavedBufferAttribute ) {

			var count = attribute.count;
			var itemSize = attribute.itemSize;
			var array = attribute.array.slice( 0, count * itemSize );

			for ( var i = 0, j = 0; i < count; ++ i ) {

				array[ j ++ ] = attribute.getX( i );
				if ( itemSize >= 2 ) array[ j ++ ] = attribute.getY( i );
				if ( itemSize >= 3 ) array[ j ++ ] = attribute.getZ( i );
				if ( itemSize >= 4 ) array[ j ++ ] = attribute.getW( i );

			}

			return new BufferAttribute( array, itemSize, attribute.normalized );

		}

		return attribute.clone();

	}

	/**
	 * Checks if we can build a single Mesh with MultiMaterial from multiple primitives.
	 * Returns true if all primitives use the same attributes/morphAttributes/mode
	 * and also have index. Otherwise returns false.
	 *
	 * @param {Array<GLTF.Primitive>} primitives
	 * @return {Boolean}
	 */
	function isMultiPassGeometry( primitives ) {

		if ( primitives.length < 2 ) return false;

		var primitive0 = primitives[ 0 ];
		var targets0 = primitive0.targets || [];

		if ( primitive0.indices === undefined ) return false;

		for ( var i = 1, il = primitives.length; i < il; i ++ ) {

			var primitive = primitives[ i ];

			if ( primitive0.mode !== primitive.mode ) return false;
			if ( primitive.indices === undefined ) return false;
			if ( primitive.extensions && primitive.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ] ) return false;
			if ( ! isObjectEqual( primitive0.attributes, primitive.attributes ) ) return false;

			var targets = primitive.targets || [];

			if ( targets0.length !== targets.length ) return false;

			for ( var j = 0, jl = targets0.length; j < jl; j ++ ) {

				if ( ! isObjectEqual( targets0[ j ], targets[ j ] ) ) return false;

			}

		}

		return true;

	}

	/* GLTF PARSER */

	function GLTFParser( json, extensions, options ) {

		this.json = json || {};
		this.extensions = extensions || {};
		this.options = options || {};

		// loader object cache
		this.cache = new GLTFRegistry();

		// BufferGeometry caching
		this.primitiveCache = [];
		this.multiplePrimitivesCache = [];
		this.multiPassGeometryCache = [];

		this.textureLoader = new TextureLoader( this.options.manager );
		this.textureLoader.setCrossOrigin( this.options.crossOrigin );

		this.fileLoader = new FileLoader( this.options.manager );
		this.fileLoader.setResponseType( 'arraybuffer' );

	}

	GLTFParser.prototype.parse = function ( onLoad, onError ) {

		var json = this.json;

		// Clear the loader cache
		this.cache.removeAll();

		// Mark the special nodes/meshes in json for efficient parse
		this.markDefs();

		// Fire the callback on complete
		this.getMultiDependencies( [

			'scene',
			'animation',
			'camera'

		] ).then( function ( dependencies ) {

			var scenes = dependencies.scenes || [];
			var scene = scenes[ json.scene || 0 ];
			var animations = dependencies.animations || [];
			var cameras = dependencies.cameras || [];

			onLoad( scene, scenes, cameras, animations, json );

		} ).catch( onError );

	};

	/**
	 * Marks the special nodes/meshes in json for efficient parse.
	 */
	GLTFParser.prototype.markDefs = function () {

		var nodeDefs = this.json.nodes || [];
		var skinDefs = this.json.skins || [];
		var meshDefs = this.json.meshes || [];

		var meshReferences = {};
		var meshUses = {};

		// Nothing in the node definition indicates whether it is a Bone or an
		// Object3D. Use the skins' joint references to mark bones.
		for ( var skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex ++ ) {

			var joints = skinDefs[ skinIndex ].joints;

			for ( var i = 0, il = joints.length; i < il; i ++ ) {

				nodeDefs[ joints[ i ] ].isBone = true;

			}

		}

		// Meshes can (and should) be reused by multiple nodes in a glTF asset. To
		// avoid having more than one THREE.Mesh with the same name, count
		// references and rename instances below.
		//
		// Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
		for ( var nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex ++ ) {

			var nodeDef = nodeDefs[ nodeIndex ];

			if ( nodeDef.mesh !== undefined ) {

				if ( meshReferences[ nodeDef.mesh ] === undefined ) {

					meshReferences[ nodeDef.mesh ] = meshUses[ nodeDef.mesh ] = 0;

				}

				meshReferences[ nodeDef.mesh ] ++;

				// Nothing in the mesh definition indicates whether it is
				// a SkinnedMesh or Mesh. Use the node's mesh reference
				// to mark SkinnedMesh if node has skin.
				if ( nodeDef.skin !== undefined ) {

					meshDefs[ nodeDef.mesh ].isSkinnedMesh = true;

				}

			}

		}

		this.json.meshReferences = meshReferences;
		this.json.meshUses = meshUses;

	};

	/**
	 * Requests the specified dependency asynchronously, with caching.
	 * @param {string} type
	 * @param {number} index
	 * @return {Promise<THREE.Object3D|THREE.Material|THREE.Texture|THREE.AnimationClip|ArrayBuffer|Object>}
	 */
	GLTFParser.prototype.getDependency = function ( type, index ) {

		var cacheKey = type + ':' + index;
		var dependency = this.cache.get( cacheKey );

		if ( ! dependency ) {

			switch ( type ) {

				case 'scene':
					dependency = this.loadScene( index );
					break;

				case 'node':
					dependency = this.loadNode( index );
					break;

				case 'mesh':
					dependency = this.loadMesh( index );
					break;

				case 'accessor':
					dependency = this.loadAccessor( index );
					break;

				case 'bufferView':
					dependency = this.loadBufferView( index );
					break;

				case 'buffer':
					dependency = this.loadBuffer( index );
					break;

				case 'material':
					dependency = this.loadMaterial( index );
					break;

				case 'texture':
					dependency = this.loadTexture( index );
					break;

				case 'skin':
					dependency = this.loadSkin( index );
					break;

				case 'animation':
					dependency = this.loadAnimation( index );
					break;

				case 'camera':
					dependency = this.loadCamera( index );
					break;

				case 'light':
					dependency = this.extensions[ EXTENSIONS.KHR_LIGHTS_PUNCTUAL ].loadLight( index );
					break;

				default:
					throw new Error( 'Unknown type: ' + type );

			}

			this.cache.add( cacheKey, dependency );

		}

		return dependency;

	};

	/**
	 * Requests all dependencies of the specified type asynchronously, with caching.
	 * @param {string} type
	 * @return {Promise<Array<Object>>}
	 */
	GLTFParser.prototype.getDependencies = function ( type ) {

		var dependencies = this.cache.get( type );

		if ( ! dependencies ) {

			var parser = this;
			var defs = this.json[ type + ( type === 'mesh' ? 'es' : 's' ) ] || [];

			dependencies = Promise.all( defs.map( function ( def, index ) {

				return parser.getDependency( type, index );

			} ) );

			this.cache.add( type, dependencies );

		}

		return dependencies;

	};

	/**
	 * Requests all multiple dependencies of the specified types asynchronously, with caching.
	 * @param {Array<string>} types
	 * @return {Promise<Object<Array<Object>>>}
	 */
	GLTFParser.prototype.getMultiDependencies = function ( types ) {

		var results = {};
		var pending = [];

		for ( var i = 0, il = types.length; i < il; i ++ ) {

			var type = types[ i ];
			var value = this.getDependencies( type );

			// TODO: Error-prone use of a callback inside a loop.
			value = value.then( function ( key, value ) {

				results[ key ] = value;

			}.bind( this, type + ( type === 'mesh' ? 'es' : 's' ) ) );

			pending.push( value );

		}

		return Promise.all( pending ).then( function () {

			return results;

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 * @param {number} bufferIndex
	 * @return {Promise<ArrayBuffer>}
	 */
	GLTFParser.prototype.loadBuffer = function ( bufferIndex ) {

		var bufferDef = this.json.buffers[ bufferIndex ];
		var loader = this.fileLoader;

		if ( bufferDef.type && bufferDef.type !== 'arraybuffer' ) {

			throw new Error( 'THREE.GLTFLoader: ' + bufferDef.type + ' buffer type is not supported.' );

		}

		// If present, GLB container is required to be the first buffer.
		if ( bufferDef.uri === undefined && bufferIndex === 0 ) {

			return Promise.resolve( this.extensions[ EXTENSIONS.KHR_BINARY_GLTF ].body );

		}

		var options = this.options;

		return new Promise( function ( resolve, reject ) {

			loader.load( resolveURL( bufferDef.uri, options.path ), resolve, undefined, function () {

				reject( new Error( 'THREE.GLTFLoader: Failed to load buffer "' + bufferDef.uri + '".' ) );

			} );

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 * @param {number} bufferViewIndex
	 * @return {Promise<ArrayBuffer>}
	 */
	GLTFParser.prototype.loadBufferView = function ( bufferViewIndex ) {

		var bufferViewDef = this.json.bufferViews[ bufferViewIndex ];

		return this.getDependency( 'buffer', bufferViewDef.buffer ).then( function ( buffer ) {

			var byteLength = bufferViewDef.byteLength || 0;
			var byteOffset = bufferViewDef.byteOffset || 0;
			return buffer.slice( byteOffset, byteOffset + byteLength );

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
	 * @param {number} accessorIndex
	 * @return {Promise<THREE.BufferAttribute|THREE.InterleavedBufferAttribute>}
	 */
	GLTFParser.prototype.loadAccessor = function ( accessorIndex ) {

		var parser = this;
		var json = this.json;

		var accessorDef = this.json.accessors[ accessorIndex ];

		if ( accessorDef.bufferView === undefined && accessorDef.sparse === undefined ) {

			// Ignore empty accessors, which may be used to declare runtime
			// information about attributes coming from another source (e.g. Draco
			// compression extension).
			return Promise.resolve( null );

		}

		var pendingBufferViews = [];

		if ( accessorDef.bufferView !== undefined ) {

			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.bufferView ) );

		} else {

			pendingBufferViews.push( null );

		}

		if ( accessorDef.sparse !== undefined ) {

			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.indices.bufferView ) );
			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.values.bufferView ) );

		}

		return Promise.all( pendingBufferViews ).then( function ( bufferViews ) {

			var bufferView = bufferViews[ 0 ];

			var itemSize = WEBGL_TYPE_SIZES[ accessorDef.type ];
			var TypedArray = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];

			// For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
			var elementBytes = TypedArray.BYTES_PER_ELEMENT;
			var itemBytes = elementBytes * itemSize;
			var byteOffset = accessorDef.byteOffset || 0;
			var byteStride = accessorDef.bufferView !== undefined ? json.bufferViews[ accessorDef.bufferView ].byteStride : undefined;
			var normalized = accessorDef.normalized === true;
			var array, bufferAttribute;

			// The buffer is not interleaved if the stride is the item size in bytes.
			if ( byteStride && byteStride !== itemBytes ) {

				var ibCacheKey = 'InterleavedBuffer:' + accessorDef.bufferView + ':' + accessorDef.componentType;
				var ib = parser.cache.get( ibCacheKey );

				if ( ! ib ) {

					// Use the full buffer if it's interleaved.
					array = new TypedArray( bufferView );

					// Integer parameters to IB/IBA are in array elements, not bytes.
					ib = new InterleavedBuffer( array, byteStride / elementBytes );

					parser.cache.add( ibCacheKey, ib );

				}

				bufferAttribute = new InterleavedBufferAttribute( ib, itemSize, byteOffset / elementBytes, normalized );

			} else {

				if ( bufferView === null ) {

					array = new TypedArray( accessorDef.count * itemSize );

				} else {

					array = new TypedArray( bufferView, byteOffset, accessorDef.count * itemSize );

				}

				bufferAttribute = new BufferAttribute( array, itemSize, normalized );

			}

			// https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
			if ( accessorDef.sparse !== undefined ) {

				var itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
				var TypedArrayIndices = WEBGL_COMPONENT_TYPES[ accessorDef.sparse.indices.componentType ];

				var byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
				var byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;

				var sparseIndices = new TypedArrayIndices( bufferViews[ 1 ], byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices );
				var sparseValues = new TypedArray( bufferViews[ 2 ], byteOffsetValues, accessorDef.sparse.count * itemSize );

				if ( bufferView !== null ) {

					// Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
					bufferAttribute.setArray( bufferAttribute.array.slice() );

				}

				for ( var i = 0, il = sparseIndices.length; i < il; i ++ ) {

					var index = sparseIndices[ i ];

					bufferAttribute.setX( index, sparseValues[ i * itemSize ] );
					if ( itemSize >= 2 ) bufferAttribute.setY( index, sparseValues[ i * itemSize + 1 ] );
					if ( itemSize >= 3 ) bufferAttribute.setZ( index, sparseValues[ i * itemSize + 2 ] );
					if ( itemSize >= 4 ) bufferAttribute.setW( index, sparseValues[ i * itemSize + 3 ] );
					if ( itemSize >= 5 ) throw new Error( 'THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.' );

				}

			}

			return bufferAttribute;

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
	 * @param {number} textureIndex
	 * @return {Promise<THREE.Texture>}
	 */
	GLTFParser.prototype.loadTexture = function ( textureIndex ) {

		var parser = this;
		var json = this.json;
		var options = this.options;
		var textureLoader = this.textureLoader;

		var URL = window.URL || window.webkitURL;

		var textureDef = json.textures[ textureIndex ];

		var textureExtensions = textureDef.extensions || {};

		var source;

		if ( textureExtensions[ EXTENSIONS.MSFT_TEXTURE_DDS ] ) {

			source = json.images[ textureExtensions[ EXTENSIONS.MSFT_TEXTURE_DDS ].source ];

		} else {

			source = json.images[ textureDef.source ];

		}

		var sourceURI = source.uri;
		var isObjectURL = false;

		if ( source.bufferView !== undefined ) {

			// Load binary image data from bufferView, if provided.

			sourceURI = parser.getDependency( 'bufferView', source.bufferView ).then( function ( bufferView ) {

				isObjectURL = true;
				var blob = new Blob( [ bufferView ], { type: source.mimeType } );
				sourceURI = URL.createObjectURL( blob );
				return sourceURI;

			} );

		}

		return Promise.resolve( sourceURI ).then( function ( sourceURI ) {

			// Load Texture resource.

			var loader = Loader.Handlers.get( sourceURI );

			if ( ! loader ) {

				loader = textureExtensions[ EXTENSIONS.MSFT_TEXTURE_DDS ]
					? parser.extensions[ EXTENSIONS.MSFT_TEXTURE_DDS ].ddsLoader
					: textureLoader;

			}

			return new Promise( function ( resolve, reject ) {

				loader.load( resolveURL( sourceURI, options.path ), resolve, undefined, reject );

			} );

		} ).then( function ( texture ) {

			// Clean up resources and configure Texture.

			if ( isObjectURL === true ) {

				URL.revokeObjectURL( sourceURI );

			}

			texture.flipY = false;

			if ( textureDef.name !== undefined ) texture.name = textureDef.name;

			// Ignore unknown mime types, like DDS files.
			if ( source.mimeType in MIME_TYPE_FORMATS ) {

				texture.format = MIME_TYPE_FORMATS[ source.mimeType ];

			}

			var samplers = json.samplers || {};
			var sampler = samplers[ textureDef.sampler ] || {};

			texture.magFilter = WEBGL_FILTERS[ sampler.magFilter ] || LinearFilter;
			texture.minFilter = WEBGL_FILTERS[ sampler.minFilter ] || LinearMipMapLinearFilter;
			texture.wrapS = WEBGL_WRAPPINGS[ sampler.wrapS ] || RepeatWrapping;
			texture.wrapT = WEBGL_WRAPPINGS[ sampler.wrapT ] || RepeatWrapping;

			return texture;

		} );

	};

	/**
	 * Asynchronously assigns a texture to the given material parameters.
	 * @param {Object} materialParams
	 * @param {string} mapName
	 * @param {Object} mapDef
	 * @return {Promise}
	 */
	GLTFParser.prototype.assignTexture = function ( materialParams, mapName, mapDef ) {

		var parser = this;

		return this.getDependency( 'texture', mapDef.index ).then( function ( texture ) {

			if ( parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] ) {

				var transform = mapDef.extensions !== undefined ? mapDef.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] : undefined;

				if ( transform ) {

					texture = parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ].extendTexture( texture, transform );

				}

			}

			materialParams[ mapName ] = texture;

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
	 * @param {number} materialIndex
	 * @return {Promise<THREE.Material>}
	 */
	GLTFParser.prototype.loadMaterial = function ( materialIndex ) {

		var parser = this;
		var json = this.json;
		var extensions = this.extensions;
		var materialDef = json.materials[ materialIndex ];

		var materialType;
		var materialParams = {};
		var materialExtensions = materialDef.extensions || {};

		var pending = [];

		if ( materialExtensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ] ) {

			var sgExtension = extensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ];
			materialType = sgExtension.getMaterialType( materialDef );
			pending.push( sgExtension.extendParams( materialParams, materialDef, parser ) );

		} else if ( materialExtensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ] ) {

			var kmuExtension = extensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ];
			materialType = kmuExtension.getMaterialType( materialDef );
			pending.push( kmuExtension.extendParams( materialParams, materialDef, parser ) );

		} else {

			// Specification:
			// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material

			materialType = MeshStandardMaterial;

			var metallicRoughness = materialDef.pbrMetallicRoughness || {};

			materialParams.color = new Color( 1.0, 1.0, 1.0 );
			materialParams.opacity = 1.0;

			if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

				var array = metallicRoughness.baseColorFactor;

				materialParams.color.fromArray( array );
				materialParams.opacity = array[ 3 ];

			}

			if ( metallicRoughness.baseColorTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture ) );

			}

			materialParams.metalness = metallicRoughness.metallicFactor !== undefined ? metallicRoughness.metallicFactor : 1.0;
			materialParams.roughness = metallicRoughness.roughnessFactor !== undefined ? metallicRoughness.roughnessFactor : 1.0;

			if ( metallicRoughness.metallicRoughnessTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'metalnessMap', metallicRoughness.metallicRoughnessTexture ) );
				pending.push( parser.assignTexture( materialParams, 'roughnessMap', metallicRoughness.metallicRoughnessTexture ) );

			}

		}

		if ( materialDef.doubleSided === true ) {

			materialParams.side = DoubleSide;

		}

		var alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;

		if ( alphaMode === ALPHA_MODES.BLEND ) {

			materialParams.transparent = true;

		} else {

			materialParams.transparent = false;

			if ( alphaMode === ALPHA_MODES.MASK ) {

				materialParams.alphaTest = materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;

			}

		}

		if ( materialDef.normalTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'normalMap', materialDef.normalTexture ) );

			materialParams.normalScale = new Vector2( 1, 1 );

			if ( materialDef.normalTexture.scale !== undefined ) {

				materialParams.normalScale.set( materialDef.normalTexture.scale, materialDef.normalTexture.scale );

			}

		}

		if ( materialDef.occlusionTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'aoMap', materialDef.occlusionTexture ) );

			if ( materialDef.occlusionTexture.strength !== undefined ) {

				materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;

			}

		}

		if ( materialDef.emissiveFactor !== undefined && materialType !== MeshBasicMaterial ) {

			materialParams.emissive = new Color().fromArray( materialDef.emissiveFactor );

		}

		if ( materialDef.emissiveTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'emissiveMap', materialDef.emissiveTexture ) );

		}

		return Promise.all( pending ).then( function () {

			var material;

			if ( materialType === ShaderMaterial ) {

				material = extensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ].createMaterial( materialParams );

			} else {

				material = new materialType( materialParams );

			}

			if ( materialDef.name !== undefined ) material.name = materialDef.name;

			// Normal map textures use OpenGL conventions:
			// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#materialnormaltexture
			if ( material.normalScale ) {

				material.normalScale.y = - material.normalScale.y;

			}

			// baseColorTexture, emissiveTexture, and specularGlossinessTexture use sRGB encoding.
			if ( material.map ) material.map.encoding = sRGBEncoding;
			if ( material.emissiveMap ) material.emissiveMap.encoding = sRGBEncoding;
			if ( material.specularMap ) material.specularMap.encoding = sRGBEncoding;

			assignExtrasToUserData( material, materialDef );

			if ( materialDef.extensions ) addUnknownExtensionsToUserData( extensions, material, materialDef );

			return material;

		} );

	};

	/**
	 * @param {THREE.BufferGeometry} geometry
	 * @param {GLTF.Primitive} primitiveDef
	 * @param {GLTFParser} parser
	 * @return {Promise<THREE.BufferGeometry>}
	 */
	function addPrimitiveAttributes( geometry, primitiveDef, parser ) {

		var attributes = primitiveDef.attributes;

		var pending = [];

		function assignAttributeAccessor( accessorIndex, attributeName ) {

			return parser.getDependency( 'accessor', accessorIndex )
				.then( function ( accessor ) {

					geometry.addAttribute( attributeName, accessor );

				} );

		}

		for ( var gltfAttributeName in attributes ) {

			var threeAttributeName = ATTRIBUTES[ gltfAttributeName ];

			if ( ! threeAttributeName ) continue;

			// Skip attributes already provided by e.g. Draco extension.
			if ( threeAttributeName in geometry.attributes ) continue;

			pending.push( assignAttributeAccessor( attributes[ gltfAttributeName ], threeAttributeName ) );

		}

		if ( primitiveDef.indices !== undefined && ! geometry.index ) {

			var accessor = parser.getDependency( 'accessor', primitiveDef.indices ).then( function ( accessor ) {

				geometry.setIndex( accessor );

			} );

			pending.push( accessor );

		}

		assignExtrasToUserData( geometry, primitiveDef );

		return Promise.all( pending ).then( function () {

			return primitiveDef.targets !== undefined
				? addMorphTargets( geometry, primitiveDef.targets, parser )
				: geometry;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
	 *
	 * Creates BufferGeometries from primitives.
	 * If we can build a single BufferGeometry with .groups from multiple primitives, returns one BufferGeometry.
	 * Otherwise, returns BufferGeometries without .groups as many as primitives.
	 *
	 * @param {Array<GLTF.Primitive>} primitives
	 * @return {Promise<Array<THREE.BufferGeometry>>}
	 */
	GLTFParser.prototype.loadGeometries = function ( primitives ) {

		var parser = this;
		var extensions = this.extensions;
		var cache = this.primitiveCache;

		var isMultiPass = isMultiPassGeometry( primitives );
		var originalPrimitives;

		if ( isMultiPass ) {

			originalPrimitives = primitives; // save original primitives and use later

			// We build a single BufferGeometry with .groups from multiple primitives
			// because all primitives share the same attributes/morph/mode and have indices.

			primitives = [ primitives[ 0 ] ];

			// Sets .groups and combined indices to a geometry later in this method.

		}

		function createDracoPrimitive( primitive ) {

			return extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ]
				.decodePrimitive( primitive, parser )
				.then( function ( geometry ) {

					return addPrimitiveAttributes( geometry, primitive, parser );

				} );

		}

		var pending = [];

		for ( var i = 0, il = primitives.length; i < il; i ++ ) {

			var primitive = primitives[ i ];

			// See if we've already created this geometry
			var cached = getCachedGeometry( cache, primitive );

			if ( cached ) {

				// Use the cached geometry if it exists
				pending.push( cached );

			} else {

				var geometryPromise;

				if ( primitive.extensions && primitive.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ] ) {

					// Use DRACO geometry if available
					geometryPromise = createDracoPrimitive( primitive );

				} else {

					// Otherwise create a new geometry
					geometryPromise = addPrimitiveAttributes( new BufferGeometry(), primitive, parser );

				}

				// Cache this geometry
				cache.push( { primitive: primitive, promise: geometryPromise } );

				pending.push( geometryPromise );

			}

		}

		return Promise.all( pending ).then( function ( geometries ) {

			if ( isMultiPass ) {

				var baseGeometry = geometries[ 0 ];

				// See if we've already created this combined geometry
				var cache = parser.multiPassGeometryCache;
				var cached = getCachedMultiPassGeometry( cache, baseGeometry, originalPrimitives );

				if ( cached !== null ) return [ cached.geometry ];

				// Cloning geometry because of index override.
				// Attributes can be reused so cloning by myself here.
				var geometry = new BufferGeometry();

				geometry.name = baseGeometry.name;
				geometry.userData = baseGeometry.userData;

				for ( var key in baseGeometry.attributes ) geometry.addAttribute( key, baseGeometry.attributes[ key ] );
				for ( var key in baseGeometry.morphAttributes ) geometry.morphAttributes[ key ] = baseGeometry.morphAttributes[ key ];

				var pendingIndices = [];

				for ( var i = 0, il = originalPrimitives.length; i < il; i ++ ) {

					pendingIndices.push( parser.getDependency( 'accessor', originalPrimitives[ i ].indices ) );

				}

				return Promise.all( pendingIndices ).then( function ( accessors ) {

					var indices = [];
					var offset = 0;

					for ( var i = 0, il = originalPrimitives.length; i < il; i ++ ) {

						var accessor = accessors[ i ];

						for ( var j = 0, jl = accessor.count; j < jl; j ++ ) indices.push( accessor.array[ j ] );

						geometry.addGroup( offset, accessor.count, i );

						offset += accessor.count;

					}

					geometry.setIndex( indices );

					cache.push( { geometry: geometry, baseGeometry: baseGeometry, primitives: originalPrimitives } );

					return [ geometry ];

				} );

			} else if ( geometries.length > 1 && BufferGeometryUtils !== undefined ) {

				// Tries to merge geometries with BufferGeometryUtils if possible

				for ( var i = 1, il = primitives.length; i < il; i ++ ) {

					// can't merge if draw mode is different
					if ( primitives[ 0 ].mode !== primitives[ i ].mode ) return geometries;

				}

				// See if we've already created this combined geometry
				var cache = parser.multiplePrimitivesCache;
				var cached = getCachedCombinedGeometry( cache, geometries );

				if ( cached ) {

					if ( cached.geometry !== null ) return [ cached.geometry ];

				} else {

					var geometry = BufferGeometryUtils.mergeBufferGeometries( geometries, true );

					cache.push( { geometry: geometry, baseGeometries: geometries } );

					if ( geometry !== null ) return [ geometry ];

				}

			}

			return geometries;

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
	 * @param {number} meshIndex
	 * @return {Promise<THREE.Group|THREE.Mesh|THREE.SkinnedMesh>}
	 */
	GLTFParser.prototype.loadMesh = function ( meshIndex ) {

		var parser = this;
		var json = this.json;
		var extensions = this.extensions;

		var meshDef = json.meshes[ meshIndex ];
		var primitives = meshDef.primitives;

		var pending = [];

		for ( var i = 0, il = primitives.length; i < il; i ++ ) {

			var material = primitives[ i ].material === undefined
				? createDefaultMaterial()
				: this.getDependency( 'material', primitives[ i ].material );

			pending.push( material );

		}

		return Promise.all( pending ).then( function ( originalMaterials ) {

			return parser.loadGeometries( primitives ).then( function ( geometries ) {

				var isMultiMaterial = geometries.length === 1 && geometries[ 0 ].groups.length > 0;

				var meshes = [];

				for ( var i = 0, il = geometries.length; i < il; i ++ ) {

					var geometry = geometries[ i ];
					var primitive = primitives[ i ];

					// 1. create Mesh

					var mesh;

					var material = isMultiMaterial ? originalMaterials : originalMaterials[ i ];

					if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLES ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
						primitive.mode === undefined ) {

						// .isSkinnedMesh isn't in glTF spec. See .markDefs()
						mesh = meshDef.isSkinnedMesh === true
							? new SkinnedMesh( geometry, material )
							: new Mesh( geometry, material );

						if ( mesh.isSkinnedMesh === true ) mesh.normalizeSkinWeights(); // #15319

						if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ) {

							mesh.drawMode = TriangleStripDrawMode;

						} else if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ) {

							mesh.drawMode = TriangleFanDrawMode;

						}

					} else if ( primitive.mode === WEBGL_CONSTANTS.LINES ) {

						mesh = new LineSegments( geometry, material );

					} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_STRIP ) {

						mesh = new Line( geometry, material );

					} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_LOOP ) {

						mesh = new LineLoop( geometry, material );

					} else if ( primitive.mode === WEBGL_CONSTANTS.POINTS ) {

						mesh = new Points( geometry, material );

					} else {

						throw new Error( 'THREE.GLTFLoader: Primitive mode unsupported: ' + primitive.mode );

					}

					if ( Object.keys( mesh.geometry.morphAttributes ).length > 0 ) {

						updateMorphTargets( mesh, meshDef );

					}

					mesh.name = meshDef.name || ( 'mesh_' + meshIndex );

					if ( geometries.length > 1 ) mesh.name += '_' + i;

					assignExtrasToUserData( mesh, meshDef );

					meshes.push( mesh );

					// 2. update Material depending on Mesh and BufferGeometry

					var materials = isMultiMaterial ? mesh.material : [ mesh.material ];

					var useVertexColors = geometry.attributes.color !== undefined;
					var useFlatShading = geometry.attributes.normal === undefined;
					var useSkinning = mesh.isSkinnedMesh === true;
					var useMorphTargets = Object.keys( geometry.morphAttributes ).length > 0;
					var useMorphNormals = useMorphTargets && geometry.morphAttributes.normal !== undefined;

					for ( var j = 0, jl = materials.length; j < jl; j ++ ) {

						var material = materials[ j ];

						if ( mesh.isPoints ) {

							var cacheKey = 'PointsMaterial:' + material.uuid;

							var pointsMaterial = parser.cache.get( cacheKey );

							if ( ! pointsMaterial ) {

								pointsMaterial = new PointsMaterial();
								Material.prototype.copy.call( pointsMaterial, material );
								pointsMaterial.color.copy( material.color );
								pointsMaterial.map = material.map;
								pointsMaterial.lights = false; // PointsMaterial doesn't support lights yet

								parser.cache.add( cacheKey, pointsMaterial );

							}

							material = pointsMaterial;

						} else if ( mesh.isLine ) {

							var cacheKey = 'LineBasicMaterial:' + material.uuid;

							var lineMaterial = parser.cache.get( cacheKey );

							if ( ! lineMaterial ) {

								lineMaterial = new LineBasicMaterial();
								Material.prototype.copy.call( lineMaterial, material );
								lineMaterial.color.copy( material.color );
								lineMaterial.lights = false; // LineBasicMaterial doesn't support lights yet

								parser.cache.add( cacheKey, lineMaterial );

							}

							material = lineMaterial;

						}

						// Clone the material if it will be modified
						if ( useVertexColors || useFlatShading || useSkinning || useMorphTargets ) {

							var cacheKey = 'ClonedMaterial:' + material.uuid + ':';

							if ( material.isGLTFSpecularGlossinessMaterial ) cacheKey += 'specular-glossiness:';
							if ( useSkinning ) cacheKey += 'skinning:';
							if ( useVertexColors ) cacheKey += 'vertex-colors:';
							if ( useFlatShading ) cacheKey += 'flat-shading:';
							if ( useMorphTargets ) cacheKey += 'morph-targets:';
							if ( useMorphNormals ) cacheKey += 'morph-normals:';

							var cachedMaterial = parser.cache.get( cacheKey );

							if ( ! cachedMaterial ) {

								cachedMaterial = material.isGLTFSpecularGlossinessMaterial
									? extensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ].cloneMaterial( material )
									: material.clone();

								if ( useSkinning ) cachedMaterial.skinning = true;
								if ( useVertexColors ) cachedMaterial.vertexColors = VertexColors;
								if ( useFlatShading ) cachedMaterial.flatShading = true;
								if ( useMorphTargets ) cachedMaterial.morphTargets = true;
								if ( useMorphNormals ) cachedMaterial.morphNormals = true;

								parser.cache.add( cacheKey, cachedMaterial );

							}

							material = cachedMaterial;

						}

						materials[ j ] = material;

						// workarounds for mesh and geometry

						if ( material.aoMap && geometry.attributes.uv2 === undefined && geometry.attributes.uv !== undefined ) {

							console.log( 'THREE.GLTFLoader: Duplicating UVs to support aoMap.' );
							geometry.addAttribute( 'uv2', new BufferAttribute( geometry.attributes.uv.array, 2 ) );

						}

						if ( material.isGLTFSpecularGlossinessMaterial ) {

							// for GLTFSpecularGlossinessMaterial(ShaderMaterial) uniforms runtime update
							mesh.onBeforeRender = extensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ].refreshUniforms;

						}

					}

					mesh.material = isMultiMaterial ? materials : materials[ 0 ];

				}

				if ( meshes.length === 1 ) {

					return meshes[ 0 ];

				}

				var group = new Group();

				for ( var i = 0, il = meshes.length; i < il; i ++ ) {

					group.add( meshes[ i ] );

				}

				return group;

			} );

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
	 * @param {number} cameraIndex
	 * @return {Promise<THREE.Camera>}
	 */
	GLTFParser.prototype.loadCamera = function ( cameraIndex ) {

		var camera;
		var cameraDef = this.json.cameras[ cameraIndex ];
		var params = cameraDef[ cameraDef.type ];

		if ( ! params ) {

			console.warn( 'THREE.GLTFLoader: Missing camera parameters.' );
			return;

		}

		if ( cameraDef.type === 'perspective' ) {

			camera = new PerspectiveCamera( Math$1.radToDeg( params.yfov ), params.aspectRatio || 1, params.znear || 1, params.zfar || 2e6 );

		} else if ( cameraDef.type === 'orthographic' ) {

			camera = new OrthographicCamera( params.xmag / - 2, params.xmag / 2, params.ymag / 2, params.ymag / - 2, params.znear, params.zfar );

		}

		if ( cameraDef.name !== undefined ) camera.name = cameraDef.name;

		assignExtrasToUserData( camera, cameraDef );

		return Promise.resolve( camera );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
	 * @param {number} skinIndex
	 * @return {Promise<Object>}
	 */
	GLTFParser.prototype.loadSkin = function ( skinIndex ) {

		var skinDef = this.json.skins[ skinIndex ];

		var skinEntry = { joints: skinDef.joints };

		if ( skinDef.inverseBindMatrices === undefined ) {

			return Promise.resolve( skinEntry );

		}

		return this.getDependency( 'accessor', skinDef.inverseBindMatrices ).then( function ( accessor ) {

			skinEntry.inverseBindMatrices = accessor;

			return skinEntry;

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
	 * @param {number} animationIndex
	 * @return {Promise<THREE.AnimationClip>}
	 */
	GLTFParser.prototype.loadAnimation = function ( animationIndex ) {

		var json = this.json;

		var animationDef = json.animations[ animationIndex ];

		var pendingNodes = [];
		var pendingInputAccessors = [];
		var pendingOutputAccessors = [];
		var pendingSamplers = [];
		var pendingTargets = [];

		for ( var i = 0, il = animationDef.channels.length; i < il; i ++ ) {

			var channel = animationDef.channels[ i ];
			var sampler = animationDef.samplers[ channel.sampler ];
			var target = channel.target;
			var name = target.node !== undefined ? target.node : target.id; // NOTE: target.id is deprecated.
			var input = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.input ] : sampler.input;
			var output = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.output ] : sampler.output;

			pendingNodes.push( this.getDependency( 'node', name ) );
			pendingInputAccessors.push( this.getDependency( 'accessor', input ) );
			pendingOutputAccessors.push( this.getDependency( 'accessor', output ) );
			pendingSamplers.push( sampler );
			pendingTargets.push( target );

		}

		return Promise.all( [

			Promise.all( pendingNodes ),
			Promise.all( pendingInputAccessors ),
			Promise.all( pendingOutputAccessors ),
			Promise.all( pendingSamplers ),
			Promise.all( pendingTargets )

		] ).then( function ( dependencies ) {

			var nodes = dependencies[ 0 ];
			var inputAccessors = dependencies[ 1 ];
			var outputAccessors = dependencies[ 2 ];
			var samplers = dependencies[ 3 ];
			var targets = dependencies[ 4 ];

			var tracks = [];

			for ( var i = 0, il = nodes.length; i < il; i ++ ) {

				var node = nodes[ i ];
				var inputAccessor = inputAccessors[ i ];
				var outputAccessor = outputAccessors[ i ];
				var sampler = samplers[ i ];
				var target = targets[ i ];

				if ( node === undefined ) continue;

				node.updateMatrix();
				node.matrixAutoUpdate = true;

				var TypedKeyframeTrack;

				switch ( PATH_PROPERTIES[ target.path ] ) {

					case PATH_PROPERTIES.weights:

						TypedKeyframeTrack = NumberKeyframeTrack;
						break;

					case PATH_PROPERTIES.rotation:

						TypedKeyframeTrack = QuaternionKeyframeTrack;
						break;

					case PATH_PROPERTIES.position:
					case PATH_PROPERTIES.scale:
					default:

						TypedKeyframeTrack = VectorKeyframeTrack;
						break;

				}

				var targetName = node.name ? node.name : node.uuid;

				var interpolation = sampler.interpolation !== undefined ? INTERPOLATION[ sampler.interpolation ] : InterpolateLinear;

				var targetNames = [];

				if ( PATH_PROPERTIES[ target.path ] === PATH_PROPERTIES.weights ) {

					// node can be THREE.Group here but
					// PATH_PROPERTIES.weights(morphTargetInfluences) should be
					// the property of a mesh object under group.

					node.traverse( function ( object ) {

						if ( object.isMesh === true && object.morphTargetInfluences ) {

							targetNames.push( object.name ? object.name : object.uuid );

						}

					} );

				} else {

					targetNames.push( targetName );

				}

				// KeyframeTrack.optimize() will modify given 'times' and 'values'
				// buffers before creating a truncated copy to keep. Because buffers may
				// be reused by other tracks, make copies here.
				for ( var j = 0, jl = targetNames.length; j < jl; j ++ ) {

					var track = new TypedKeyframeTrack(
						targetNames[ j ] + '.' + PATH_PROPERTIES[ target.path ],
						AnimationUtils.arraySlice( inputAccessor.array, 0 ),
						AnimationUtils.arraySlice( outputAccessor.array, 0 ),
						interpolation
					);

					// Here is the trick to enable custom interpolation.
					// Overrides .createInterpolant in a factory method which creates custom interpolation.
					if ( sampler.interpolation === 'CUBICSPLINE' ) {

						track.createInterpolant = function InterpolantFactoryMethodGLTFCubicSpline( result ) {

							// A CUBICSPLINE keyframe in glTF has three output values for each input value,
							// representing inTangent, splineVertex, and outTangent. As a result, track.getValueSize()
							// must be divided by three to get the interpolant's sampleSize argument.

							return new GLTFCubicSplineInterpolant( this.times, this.values, this.getValueSize() / 3, result );

						};

						// Workaround, provide an alternate way to know if the interpolant type is cubis spline to track.
						// track.getInterpolation() doesn't return valid value for custom interpolant.
						track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;

					}

					tracks.push( track );

				}

			}

			var name = animationDef.name !== undefined ? animationDef.name : 'animation_' + animationIndex;

			return new AnimationClip( name, undefined, tracks );

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
	 * @param {number} nodeIndex
	 * @return {Promise<THREE.Object3D>}
	 */
	GLTFParser.prototype.loadNode = function ( nodeIndex ) {

		var json = this.json;
		var extensions = this.extensions;
		var parser = this;

		var meshReferences = json.meshReferences;
		var meshUses = json.meshUses;

		var nodeDef = json.nodes[ nodeIndex ];

		return ( function () {

			// .isBone isn't in glTF spec. See .markDefs
			if ( nodeDef.isBone === true ) {

				return Promise.resolve( new Bone() );

			} else if ( nodeDef.mesh !== undefined ) {

				return parser.getDependency( 'mesh', nodeDef.mesh ).then( function ( mesh ) {

					var node;

					if ( meshReferences[ nodeDef.mesh ] > 1 ) {

						var instanceNum = meshUses[ nodeDef.mesh ] ++;

						node = mesh.clone();
						node.name += '_instance_' + instanceNum;

						// onBeforeRender copy for Specular-Glossiness
						node.onBeforeRender = mesh.onBeforeRender;

						for ( var i = 0, il = node.children.length; i < il; i ++ ) {

							node.children[ i ].name += '_instance_' + instanceNum;
							node.children[ i ].onBeforeRender = mesh.children[ i ].onBeforeRender;

						}

					} else {

						node = mesh;

					}

					// if weights are provided on the node, override weights on the mesh.
					if ( nodeDef.weights !== undefined ) {

						node.traverse( function ( o ) {

							if ( ! o.isMesh ) return;

							for ( var i = 0, il = nodeDef.weights.length; i < il; i ++ ) {

								o.morphTargetInfluences[ i ] = nodeDef.weights[ i ];

							}

						} );

					}

					return node;

				} );

			} else if ( nodeDef.camera !== undefined ) {

				return parser.getDependency( 'camera', nodeDef.camera );

			} else if ( nodeDef.extensions
				&& nodeDef.extensions[ EXTENSIONS.KHR_LIGHTS_PUNCTUAL ]
				&& nodeDef.extensions[ EXTENSIONS.KHR_LIGHTS_PUNCTUAL ].light !== undefined ) {

				return parser.getDependency( 'light', nodeDef.extensions[ EXTENSIONS.KHR_LIGHTS_PUNCTUAL ].light );

			} else {

				return Promise.resolve( new Object3D() );

			}

		}() ).then( function ( node ) {

			if ( nodeDef.name !== undefined ) {

				node.name = PropertyBinding.sanitizeNodeName( nodeDef.name );

			}

			assignExtrasToUserData( node, nodeDef );

			if ( nodeDef.extensions ) addUnknownExtensionsToUserData( extensions, node, nodeDef );

			if ( nodeDef.matrix !== undefined ) {

				var matrix = new Matrix4();
				matrix.fromArray( nodeDef.matrix );
				node.applyMatrix( matrix );

			} else {

				if ( nodeDef.translation !== undefined ) {

					node.position.fromArray( nodeDef.translation );

				}

				if ( nodeDef.rotation !== undefined ) {

					node.quaternion.fromArray( nodeDef.rotation );

				}

				if ( nodeDef.scale !== undefined ) {

					node.scale.fromArray( nodeDef.scale );

				}

			}

			return node;

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
	 * @param {number} sceneIndex
	 * @return {Promise<THREE.Scene>}
	 */
	GLTFParser.prototype.loadScene = function () {

		// scene node hierachy builder

		function buildNodeHierachy( nodeId, parentObject, json, parser ) {

			var nodeDef = json.nodes[ nodeId ];

			return parser.getDependency( 'node', nodeId ).then( function ( node ) {

				if ( nodeDef.skin === undefined ) return node;

				// build skeleton here as well

				var skinEntry;

				return parser.getDependency( 'skin', nodeDef.skin ).then( function ( skin ) {

					skinEntry = skin;

					var pendingJoints = [];

					for ( var i = 0, il = skinEntry.joints.length; i < il; i ++ ) {

						pendingJoints.push( parser.getDependency( 'node', skinEntry.joints[ i ] ) );

					}

					return Promise.all( pendingJoints );

				} ).then( function ( jointNodes ) {

					var meshes = node.isGroup === true ? node.children : [ node ];

					for ( var i = 0, il = meshes.length; i < il; i ++ ) {

						var mesh = meshes[ i ];

						var bones = [];
						var boneInverses = [];

						for ( var j = 0, jl = jointNodes.length; j < jl; j ++ ) {

							var jointNode = jointNodes[ j ];

							if ( jointNode ) {

								bones.push( jointNode );

								var mat = new Matrix4();

								if ( skinEntry.inverseBindMatrices !== undefined ) {

									mat.fromArray( skinEntry.inverseBindMatrices.array, j * 16 );

								}

								boneInverses.push( mat );

							} else {

								console.warn( 'THREE.GLTFLoader: Joint "%s" could not be found.', skinEntry.joints[ j ] );

							}

						}

						mesh.bind( new Skeleton( bones, boneInverses ), mesh.matrixWorld );

					}
					return node;

				} );

			} ).then( function ( node ) {

				// build node hierachy

				parentObject.add( node );

				var pending = [];

				if ( nodeDef.children ) {

					var children = nodeDef.children;

					for ( var i = 0, il = children.length; i < il; i ++ ) {

						var child = children[ i ];
						pending.push( buildNodeHierachy( child, node, json, parser ) );

					}

				}

				return Promise.all( pending );

			} );

		}

		return function loadScene( sceneIndex ) {

			var json = this.json;
			var extensions = this.extensions;
			var sceneDef = this.json.scenes[ sceneIndex ];
			var parser = this;

			var scene = new Scene();
			if ( sceneDef.name !== undefined ) scene.name = sceneDef.name;

			assignExtrasToUserData( scene, sceneDef );

			if ( sceneDef.extensions ) addUnknownExtensionsToUserData( extensions, scene, sceneDef );

			var nodeIds = sceneDef.nodes || [];

			var pending = [];

			for ( var i = 0, il = nodeIds.length; i < il; i ++ ) {

				pending.push( buildNodeHierachy( nodeIds[ i ], scene, json, parser ) );

			}

			return Promise.all( pending ).then( function () {

				return scene;

			} );

		};

	}();

	return GLTFLoader;

} )();

const renderer = new WebGLRenderer({antialias: true, preserveDrawingBuffer: true, alpha: true});
const gl$1 = renderer.getContext();

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

const animate = function() {
  for (let i = 0; i < renderedQueue.length; i++) renderedQueue[i].rendered = false;
  renderedQueue.length = 0;
  for (let i = 0; i < renderNextQueue.length; i++) {
    renderNextQueue[i].scheduled = false;
    renderNextQueue[i].render();
  }
  renderNextQueue.length = 0;
  requestAnimationFrame(animate);
};
requestAnimationFrame(animate);

class ThreeRenderer extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: block;
        overflow: hidden;
        position: relative;
        touch-action: none;
        user-select: none;
      }
      :host:focus {
        z-index: 2;
      }
      :host > canvas {
        position: absolute;
        top: 0;
        left: 0;
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
  }
  renderableChanged() {
    this.queueRender();
  }
  objectMutated(event) {
    if (event.detail.object === this.scene || event.detail.object === this.camera) {
      this.queueRender();
    }
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
        const ratio =  (window.devicePixelRatio || 1) / host._ctx.backingStorePixelRatio || 1;
        host._ctx.clearRect(0, 0, host.size[0] * ratio, host.size[1] * ratio);
        host._ctx.drawImage(host.renderer.domElement, 0, 0, host.size[0] * ratio, host.size[1] * ratio);
        gl$1.flush();
        host.ishost = false;
      }
      if (this.size[0] && this.size[1]) {
        this.renderer.setSize(this.size[0], this.size[1]);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(this.clearColor, this.clearAlpha);
      }
      host = this;
      this.appendChild(this.renderer.domElement);
      this.ishost = true;
      _performanceCheck();
      // TODO: remove debug
      window._hostrenderer = this;
    }
  }
  resized() {
    const style = getComputedStyle(this, null);
    this.size[0] = Math.round(style.width.substring(0, style.width.length - 2));
    this.size[1] = Math.round(style.height.substring(0, style.height.length - 2));

    const ratio =  (window.devicePixelRatio || 1) / this._ctx.backingStorePixelRatio || 1;
    this.$.canvas.width = this.size[0] * ratio;
    this.$.canvas.height = this.size[1] * ratio;

    if (this.size[0] && this.size[1]) {
      this.renderer.setSize(this.size[0], this.size[1]);
      this.renderer.setPixelRatio(window.devicePixelRatio);
    }
    this.render();
  }
}

ThreeRenderer.Register();

/**
 * @author arodic / https://github.com/arodic
 *
 * This class provides events and related interfaces for handling hardware
 * agnostic pointer input from mouse, touchscreen and keyboard.
 * It is inspired by PointerEvents https://www.w3.org/TR/pointerevents/
 *
 * Please report bugs at https://github.com/arodic/PointerEvents/issues
 *
 * @event contextmenu
 * @event keydown - requires focus
 * @event keyup - requires focus
 * @event wheel
 * @event focus
 * @event blur
 * @event pointerdown
 * @event pointermove
 * @event pointerhover
 * @event pointerup
 */

class PointerEvents {
	constructor(domElement, params = {}) {
		this.domElement = domElement;
		this.pointers = new PointerArray(domElement, params.normalized);

		const scope = this;
		let dragging = false;

		function _onContextmenu(event) {
			event.preventDefault();
			scope.dispatchEvent({ type: "contextmenu" });
		}

		function _onMouseDown(event) {
			event.preventDefault();
			if (!dragging) {
				dragging = true;
				domElement.removeEventListener("mousemove", _onMouseHover, false);
				document.addEventListener("mousemove", _onMouseMove, false);
				document.addEventListener("mouseup", _onMouseUp, false);
				scope.domElement.focus();
				scope.pointers.update(event, "pointerdown");
				scope.dispatchEvent(makePointerEvent("pointerdown", scope.pointers));
			}
		}
		function _onMouseMove(event) {
			event.preventDefault();
			scope.pointers.update(event, "pointermove");
			scope.dispatchEvent(makePointerEvent("pointermove", scope.pointers));
		}
		function _onMouseHover(event) {
			scope.pointers.update(event, "pointerhover");
			// TODO: UNHACK!
			scope.pointers[0].start.copy(scope.pointers[0].position);
			scope.dispatchEvent(makePointerEvent("pointerhover", scope.pointers));
		}
		function _onMouseUp(event) {
			event.preventDefault();
			if (event.buttons === 0) {
				dragging = false;
				domElement.addEventListener("mousemove", _onMouseHover, false);
				document.removeEventListener("mousemove", _onMouseMove, false);
				document.removeEventListener("mouseup", _onMouseUp, false);
				scope.pointers.update(event, "pointerup", true);
				scope.dispatchEvent(makePointerEvent("pointerup", scope.pointers));
			}
		}

		function _onTouchDown(event) {
			event.preventDefault();
			scope.domElement.focus();
			scope.pointers.update(event, "pointerdown");
			scope.dispatchEvent(makePointerEvent("pointerdown", scope.pointers));
		}
		function _onTouchMove(event) {
			event.preventDefault();
			scope.pointers.update(event, "pointermove");
			scope.dispatchEvent(makePointerEvent("pointermove", scope.pointers));
		}
		function _onTouchHover(event) {
			scope.pointers.update(event, "pointerhover");
			scope.dispatchEvent(makePointerEvent("pointerhover", scope.pointers));
		}
		function _onTouchUp(event) {
			scope.pointers.update(event, "pointerup");
			scope.dispatchEvent(makePointerEvent("pointerup", scope.pointers));
		}

		function _onWheel(event) {
			event.preventDefault();
			// TODO: test on multiple platforms/browsers
			// Normalize deltaY due to https://bugzilla.mozilla.org/show_bug.cgi?id=1392460
			const delta = event.deltaY > 0 ? 1 : - 1;
			scope.dispatchEvent({ type: "wheel", delta: delta });
		}

		function _onFocus() {
			domElement.addEventListener("blur", _onBlur, false);
			scope.dispatchEvent({ type: "focus" });
		}
		function _onBlur() {
			domElement.removeEventListener("blur", _onBlur, false);
			scope.dispatchEvent({ type: "blur" });
		}

		{
			domElement.addEventListener("contextmenu", _onContextmenu, false);
			domElement.addEventListener("mousedown", _onMouseDown, false);
			domElement.addEventListener("mousemove", _onMouseHover, false);
			domElement.addEventListener("touchstart", _onTouchHover, false);
			domElement.addEventListener("touchstart", _onTouchDown, false);
			domElement.addEventListener("touchmove", _onTouchMove, false);
			domElement.addEventListener("touchend", _onTouchUp, false);
			domElement.addEventListener("wheel", _onWheel, false);
			domElement.addEventListener("focus", _onFocus, false);
		}

		this.dispose = function () {
			domElement.removeEventListener("contextmenu", _onContextmenu, false);
			domElement.removeEventListener("mousedown", _onMouseDown, false);
			domElement.removeEventListener("mousemove", _onMouseHover, false);
			document.removeEventListener("mousemove", _onMouseMove, false);
			document.removeEventListener("mouseup", _onMouseUp, false);
			domElement.removeEventListener("touchstart", _onTouchHover, false);
			domElement.removeEventListener("touchstart", _onTouchDown, false);
			domElement.removeEventListener("touchmove", _onTouchMove, false);
			domElement.removeEventListener("touchend", _onTouchUp, false);
			domElement.removeEventListener("wheel", _onWheel, false);
			domElement.removeEventListener("focus", _onFocus, false);
			domElement.removeEventListener("blur", _onBlur, false);
			delete this._listeners;
		};
	}
	addEventListener(type, listener) {
		this._listeners = this._listeners || {};
		this._listeners[type] = this._listeners[type] || [];
		if (this._listeners[type].indexOf(listener) === -1) {
			this._listeners[type].push(listener);
		}
	}
	hasEventListener(type, listener) {
		if (this._listeners === undefined) return false;
		return this._listeners[type] !== undefined && this._listeners[type].indexOf(listener) !== -1;
	}
	removeEventListener(type, listener) {
		if (this._listeners === undefined) return;
		if (this._listeners[type] !== undefined) {
			var index = this._listeners[type].indexOf(listener);
			if (index !== -1) this._listeners[type].splice(index, 1);
		}
	}
	dispatchEvent(event) {
		if (this._listeners === undefined) return;
		if (this._listeners[event.type] !== undefined) {
			// event.target = this; // TODO: consider adding target!
			var array = this._listeners[event.type].slice(0);
			for (var i = 0, l = array.length; i < l; i ++) {
				array[i].call(this, event);
			}
		}
	}
}

class Pointer {
	constructor(pointerID, target, type, pointerType) {
		this.pointerID = pointerID;
		this.target = target;
		this.type = type;
		this.pointerType = pointerType;
		this.position = new Vector2$1();
		this.previous = new Vector2$1();
		this.start = new Vector2$1();
		this.movement = new Vector2$1();
		this.distance = new Vector2$1();
		this.button = -1;
		this.buttons = 0;
	}
	update(previous) {
		this.pointerID = previous.pointerID;
		this.previous.copy(previous.position);
		this.start.copy(previous.start);
		this.movement.copy(this.position).sub(previous.position);
		this.distance.copy(this.position).sub(this.start);
	}
}

class PointerArray extends Array {
	constructor(target, normalized) {
		super();
		this.normalized = normalized || false;
		this.target = target;
		this.previous = [];
		this.removed = [];
	}
	update(event, type, remove) {

		this.previous.length = 0;
		this.removed.length = 0;

		for (var i = 0; i < this.length; i++) {
			this.previous.push(this[i]);
		}
		this.length = 0;

		const rect = this.target.getBoundingClientRect();

		let touches = event.touches ? event.touches : [event];
		let pointerType = event.touches ? 'touch' : 'mouse';
		let buttons = event.buttons || 1;

		let id = 0;
		if (!remove) for (let i = 0; i < touches.length; i++) {
			if (isTouchInTarget(touches[i], this.target) || event.touches === undefined) {
				let pointer =  new Pointer(id, this.target, type, pointerType);
				pointer.position.x = touches[i].clientX - rect.x;
				pointer.position.y = touches[i].clientY - rect.y;
				if (this.normalized) {
					pointer.position.x = pointer.position.x / rect.width * 2.0 - 1.0;
					pointer.position.y = pointer.position.y / rect.height * - 2.0 + 1.0;
				}
				pointer.previous.copy(pointer.position);
				pointer.start.copy(pointer.position);
				pointer.buttons = buttons;
				pointer.button = -1;
				if (buttons === 1 || buttons === 3 || buttons === 5 || buttons === 7) pointer.button = 0;
				else if (buttons === 2 || buttons === 6) pointer.button = 1;
				else if (buttons === 4) pointer.button = 2;
				pointer.altKey = event.altKey;
				pointer.ctrlKey = event.ctrlKey;
				pointer.metaKey = event.metaKey;
				pointer.shiftKey = event.shiftKey;
				this.push(pointer);
				id++;
			}
		}

		if (!remove) for (let i = 0; i < this.length; i++) {
			if (this.previous.length) {
				let closest = getClosest(this[i], this.previous);
				if (getClosest(closest, this) !== this[i]) closest = null;
				if (closest) {
					this[i].update(closest);
					this.previous.splice(this.previous.indexOf(closest), 1);
				}
			}
		}

		for (let i = this.previous.length; i--;) {
			this.removed.push(this.previous[i]);
			this.previous.splice(i, 1);
		}
	}
}

function makePointerEvent(type, pointers) {
	const event = Object.assign({ type: type }, pointers);
	event.length = pointers.length;
	return event;
}

function isTouchInTarget(event, target) {
	let eventTarget = event.target;
	while (eventTarget) {
		if (eventTarget === target) return true;
		eventTarget = eventTarget.parentElement;
	}
	return false;
}


function getClosest(pointer, pointers) {
	let closestDist = Infinity;
	let closest;
	for (let i = 0; i < pointers.length; i++) {
		let dist = pointer.position.distanceTo(pointers[i].position);
		if (dist < closestDist) {
			closest = pointers[i];
			closestDist = dist;
		}
	}
	return closest;
}

class Vector2$1 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	copy(v) {
		this.x = v.x;
		this.y = v.y;
		return this;
	}
	add(v) {
		this.x += v.x;
		this.y += v.y;
		return this;
	}
	sub(v) {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}
	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	distanceTo(v) {
		const dx = this.x - v.x;
		const dy = this.y - v.y;
		return Math.sqrt(dx * dx + dy * dy);
	}
}

// TODO: pixel-perfect outlines
class HelperMaterial extends IoLiteMixin(ShaderMaterial) {
	constructor(props = {}) {
		super({
			depthTest: true,
			depthWrite: true,
			transparent: !!props.opacity,
			side: FrontSide,
		});

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

		const res = new Vector3(window.innerWidth, window.innerHeight, window.devicePixelRatio);

		this.defineProperties({
			color: { value: color, change: 'uniformChanged'},
			opacity: { value: opacity, change: 'uniformChanged'},
			depthBias: { value: props.depthBias || 0, change: 'uniformChanged'},
			highlight: { value: props.highlight || 0, change: 'uniformChanged'},
			resolution: { value: res, change: 'uniformChanged'},
		});

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
					pos.z += 0.01;
					pos.z = max(-0.99, pos.z);
				} else {
					extrude -= outline;
					pos.z = max(-1.0, pos.z);
				}

				pos.xy /= pos.w;

				float dx = nor.x * extrude;// * (1.0 + uResolution.z) / 2.0;
				float dy = nor.y * extrude;// * (1.0 + uResolution.z) / 2.0;

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
		this.uniforms.uColor.value = this.color;
		this.uniforms.uOpacity.value = this.opacity;
		this.uniforms.uDepthBias.value = this.depthBias;
		this.uniforms.uHighlight.value = this.highlight;
		this.uniforms.uResolution.value = this.resolution;
		this.uniformsNeedUpdate = true;
	}
}

/**
 * @author arodic / https://github.com/arodic
 */

class TextHelper extends IoLiteMixin(Sprite) {
	constructor(props = {}) {
		super();

		this.defineProperties({
			text: '',
			color: props.color || 'black',
			size: 0.5,
		});

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

class Helper extends IoLiteMixin(Mesh) {
	constructor(props = {}) {
		super();

		this.defineProperties({
			object: props.object || null,
			camera: props.camera || null,
			depthBias: 0,
			space: 'local',
			size: 0
		});

		this.eye = new Vector3();

		this.geometry = new BoxBufferGeometry(1,1,1,1,1,1);
		this.material.colorWrite = false;
		this.material.depthWrite = false;
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

/**
 * @author arodic / https://github.com/arodic
 */

/*
 * Wraps target class with PointerEvent API polyfill for more powerful mouse/touch interactions.
 * Following callbacks will be invoked on pointer events:
 * onPointerDown, onPointerHover, onPointerMove, onPointerUp,
 * onKeyDown, onKeyUp, onWheel, onContextmenu, onFocus, onBlur.
 * onKeyDown, onKeyUp require domElement to be focused (set tabindex attribute).
 *
 * See PointerEvents.js for more details.
 */

// TODO: implement multiple DOM elements / viewports

const InteractiveMixin = (superclass) => class extends superclass {
	constructor(props) {
		super(props);

		this.defineProperties({
			enabled: true,
			domElement: props.domElement
		});

		this._pointerEvents = new PointerEvents(props.domElement, {normalized: true});

		this.onPointerDown = this.onPointerDown.bind(this);
		this.onPointerHover = this.onPointerHover.bind(this);
		this.onPointerMove = this.onPointerMove.bind(this);
		this.onPointerUp = this.onPointerUp.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onWheel = this.onWheel.bind(this);
		this.onContextmenu = this.onContextmenu.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);

		this._addEvents();
	}
	dispose() {
		this._removeEvents();
		this._pointerEvents.dispose();
	}
	_addEvents() {
		if (this._listening) return;
		this._pointerEvents.addEventListener('pointerdown', this.onPointerDown);
		this._pointerEvents.addEventListener('pointerhover', this.onPointerHover);
		this._pointerEvents.addEventListener('pointermove', this.onPointerMove);
		this._pointerEvents.addEventListener('pointerup', this.onPointerUp);
		this._pointerEvents.addEventListener('keydown', this.onKeyDown);
		this._pointerEvents.addEventListener('keyup', this.onKeyUp);
		this._pointerEvents.addEventListener('wheel', this.onWheel);
		this._pointerEvents.addEventListener('contextmenu', this.onContextmenu);
		this._pointerEvents.addEventListener('focus', this.onFocus);
		this._pointerEvents.addEventListener('blur', this.onBlur);
		this._listening = true;
	}
	_removeEvents() {
		if (!this._listening) return;
		this._pointerEvents.removeEventListener('pointerdown', this.onPointerDown);
		this._pointerEvents.removeEventListener('pointerhover', this.onPointerHover);
		this._pointerEvents.removeEventListener('pointermove', this.onPointerMove);
		this._pointerEvents.removeEventListener('pointerup', this.onPointerUp);
		this._pointerEvents.removeEventListener('keydown', this.onKeyDown);
		this._pointerEvents.removeEventListener('keyup', this.onKeyUp);
		this._pointerEvents.removeEventListener('wheel', this.onWheel);
		this._pointerEvents.removeEventListener('contextmenu', this.onContextmenu);
		this._pointerEvents.removeEventListener('focus', this.onFocus);
		this._pointerEvents.removeEventListener('blur', this.onBlur);
		this._listening = false;
	}
	enabledChanged(detail) {
		detail.value ? this._addEvents() : this._removeEvents();
	}
	// Control methods - implemented in subclass!
	onContextmenu(/*event*/) {}
	onPointerHover(/*pointer*/) {}
	onPointerDown(/*pointer*/) {}
	onPointerMove(/*pointer*/) {}
	onPointerUp(/*pointer*/) {}
	onPointerLeave(/*pointer*/) {}
	onKeyDown(/*event*/) {}
	onKeyUp(/*event*/) {}
	onWheel(/*event*/) {}
	onFocus(/*event*/) {}
	onBlur(/*event*/) {}
};

/*
 * Helper class wrapped with PointerEvents API polyfill.
 */

class Interactive extends InteractiveMixin(Helper) {}

/**
 * @author arodic / https://github.com/arodic
 */

/*
 * Creates a single requestAnimationFrame loop.
 * provides methods to control animation and update event to hook into animation updates.
 */

class Animation extends IoLiteMixin(Object) {
	constructor() {
		super();
		this._active = false;
		this._time = 0;
		this._timeRemainging = 0;
		this._rafID = 0;
	}
	startAnimation(duration) {
		this._timeRemainging = Math.max(this._timeRemainging, duration * 1000 || 0);
		if (!this._active) {
			this._active = true;
			this._time = performance.now();
			this._rafID = requestAnimationFrame(() => {
				const time = performance.now();
				const timestep = time - this._time;
				this.animate(timestep, time);
				this._time = time;
				this._timeRemainging = Math.max(this._timeRemainging - timestep, 0);
			});
		}
	}
	animate(timestep, time) {
		if (this._active && this._timeRemainging) {
				this._rafID = requestAnimationFrame(() => {
				const time = performance.now();
				timestep = time - this._time;
				this.animate(timestep, time);
				this._time = time;
				this._timeRemainging = Math.max(this._timeRemainging - timestep, 0);
			});
		} else {
			this.stopAnimation(timestep, time);
		}
		this.dispatchEvent('update', {timestep: timestep});
	}
	stopAnimation() {
		this._active = false;
		cancelAnimationFrame(this._rafID);
	}
}
// TODO: dispose

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

class CameraControls extends Interactive {
	constructor(props) {
		super(props);

		this.defineProperties({
			active: false,
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
			autoOrbit: new Vector2(0.0, 0.0),
			autoDollyPan: new Vector3(0.1, 0.0, 0.0),
			enableDamping: true,
			dampingFactor: 0.05,
			KEYS: {
				PAN_LEFT: 37, // left
				PAN_UP: 38, // up
				PAN_RIGHT: 39, // right
				PAN_DOWN: 40, // down
				ORBIT_LEFT: 65, // A
				ORBIT_RIGHT: 68, // D
				ORBIT_UP: 83, // S
				ORBIT_DOWN: 87, // W
				DOLLY_OUT: 189, // +
				DOLLY_IN: 187, // -
				FOCUS: 70 // F
			},
			BUTTON: {LEFT: MOUSE.LEFT, MIDDLE: MOUSE.MIDDLE, RIGHT: MOUSE.RIGHT}, // Mouse buttons
			state: STATE.NONE,
			_orbitOffset: new Vector2(),
			_orbitInertia: new Vector2(),
			_panOffset: new Vector2(),
			_panInertia: new Vector2(),
			_dollyOffset: 0,
			_dollyInertia: 0
		});

		this.animation = new Animation();

		this.animation.addEventListener('update', event => {
			this.update(event.detail.timestep);
			this.dispatchEvent('change');
		});

		this.cameraChanged();
	}
	cameraChanged() {
		this.camera.target = this.camera.target || new Vector3();
		this.target = this.camera.target;
		this.camera.lookAt(this.target);
		this.animation.startAnimation(0);
	}
	// targetChanged() {
	// 	this.camera.lookAt(this.target);
	// 	this.animation.startAnimation(0);
	// }
	stateChanged() {
		this.active = this.state !== STATE.NONE;
		this.animation.startAnimation(0);
	}
	update(timestep) {
		let dt = timestep / 1000;
		// Apply orbit intertia
		if (this.state !== STATE.ORBIT) {
			if (this.enableDamping) {
				this._orbitInertia.x = dampTo(this._orbitInertia.x, this.autoOrbit.x, this.dampingFactor, dt);
				this._orbitInertia.y = dampTo(this._orbitInertia.y, 0.0, this.dampingFactor, dt);
			}
		} else {
			this._orbitInertia.set(this.autoOrbit.x, 0);
		}

		this._orbitOffset.x += this._orbitInertia.x;
		this._orbitOffset.y += this._orbitInertia.y;

		// Apply pan intertia
		if (this.state !== STATE.PAN) {
			this._panInertia.x = dampTo(this._panInertia.x, 0.0, this.dampingFactor, dt);
			this._panInertia.y = dampTo(this._panInertia.y, 0.0, this.dampingFactor, dt);
		} else {
			this._panInertia.set(0, 0);
		}
		this._panOffset.x += this._panInertia.x;
		this._panOffset.y += this._panInertia.y;

		// Apply dolly intertia
		if (this.state !== STATE.DOLLY) {
			this._dollyInertia = dampTo(this._dollyInertia, 0.0, this.dampingFactor, dt);
		} else {
			this._dollyInertia = 0;
		}
		this._dollyOffset += this._dollyInertia;

		// set inertiae from current offsets
		if (this.enableDamping) {
			if (this.state === STATE.ORBIT) {
				this._orbitInertia.copy(this._orbitOffset);
			}
			if (this.state === STATE.PAN) {
				this._panInertia.copy(this._panOffset);
			}
			if (this.state === STATE.DOLLY) {
				this._dollyInertia = this._dollyOffset;
			}
		}

		this.orbit(orbit.copy(this._orbitOffset));
		this.dolly(this._dollyOffset);
		this.pan(pan.copy(this._panOffset));

		this._orbitOffset.set(0, 0);
		this._panOffset.set(0, 0);
		this._dollyOffset = 0;

		this.camera.lookAt(this.target);

		// Determine if animation needs to continue
		let maxVelocity = 0;
		maxVelocity = Math.max(maxVelocity, Math.abs(this._orbitInertia.x));
		maxVelocity = Math.max(maxVelocity, Math.abs(this._orbitInertia.y));
		maxVelocity = Math.max(maxVelocity, Math.abs(this._panInertia.x));
		maxVelocity = Math.max(maxVelocity, Math.abs(this._panInertia.y));
		maxVelocity = Math.max(maxVelocity, Math.abs(this._dollyInertia));
		if (maxVelocity > EPS) this.animation.startAnimation(0);
	}
	onPointerMove(pointers) {
		let rect = this.domElement.getBoundingClientRect();
		let prevDistance, distance;
		aspectMultiplier.set(rect.width / rect.height, 1);
		switch (pointers.length) {
			case 1:
				direction.copy(pointers[0].movement).multiply(aspectMultiplier);
				switch (pointers[0].button) {
					case this.BUTTON.LEFT:
						if (pointers.ctrlKey) {
							this._setPan(direction.multiplyScalar(this.panSpeed));
						} else if (pointers.altKey) {
							this._setDolly(pointers[0].movement.y * this.dollySpeed);
						} else {
							this._setOrbit(direction.multiplyScalar(this.orbitSpeed));
						}
						break;
					case this.BUTTON.MIDDLE:
						this._setDolly(pointers[0].movement.y * this.dollySpeed);
						break;
					case this.BUTTON.RIGHT:
						this._setPan(direction.multiplyScalar(this.panSpeed));
						break;
				}
				break;
			default: // 2 or more
				// two-fingered touch: dolly-pan
				// TODO: apply aspectMultiplier?
				distance = pointers[0].position.distanceTo(pointers[1].position);
				prevDistance = pointers[0].previous.distanceTo(pointers[1].previous);
				direction.copy(pointers[0].movement).add(pointers[1].movement).multiply(aspectMultiplier);
				this._setDollyPan((prevDistance - distance) * this.dollySpeed, direction.multiplyScalar(this.panSpeed));
				break;
		}
	}
	onPointerUp(pointers) {
		if (pointers.length === 0) {
			this.state = STATE.NONE;
		}
	}
	// onKeyDown(event) {
	// 	TODO: key inertia
	// 	TODO: better state setting
	// 	switch (event.keyCode) {
	// 		case this.KEYS.PAN_UP:
	// 			this._setPan(direction.set(0, -this.keyPanSpeed));
	// 			break;
	// 		case this.KEYS.PAN_DOWN:
	// 			this._setPan(direction.set(0, this.keyPanSpeed));
	// 			break;
	// 		case this.KEYS.PAN_LEFT:
	// 			this._setPan(direction.set(this.keyPanSpeed, 0));
	// 			break;
	// 		case this.KEYS.PAN_RIGHT:
	// 			this._setPan(direction.set(-this.keyPanSpeed, 0));
	// 			break;
	// 		case this.KEYS.ORBIT_LEFT:
	// 			this._setOrbit(direction.set(this.keyOrbitSpeed, 0));
	// 			break;
	// 		case this.KEYS.ORBIT_RIGHT:
	// 			this._setOrbit(direction.set(-this.keyOrbitSpeed, 0));
	// 			break;
	// 		case this.KEYS.ORBIT_UP:
	// 			this._setOrbit(direction.set(0, this.keyOrbitSpeed));
	// 			break;
	// 		case this.KEYS.ORBIT_DOWN:
	// 			this._setOrbit(direction.set(0, -this.keyOrbitSpeed));
	// 			break;
	// 		case this.KEYS.DOLLY_IN:
	// 			this._setDolly(-this.keyDollySpeed);
	// 			break;
	// 		case this.KEYS.DOLLY_OUT:
	// 			this._setDolly(this.keyDollySpeed);
	// 			break;
	// 		case this.KEYS.FOCUS:
	// 			this._setFocus();
	// 			break;
	// 		default:
	// 			break;
	// 	}
	// 	this.active = false;
	// }
	onKeyUp() {
		// TODO: Consider improving for prevent pointer and multi-key interruptions.
		// this.active = false;
	}
	onWheel(event) {
		this.state = STATE.DOLLY;
		this._setDolly(event.detail.delta * this.wheelDollySpeed);
		this.state = STATE.NONE;
		this.animation.startAnimation(0);
	}
	_setPan(dir) {
		this.state = STATE.PAN;
		if (this.enablePan) this._panOffset.copy(dir);
		this.animation.startAnimation(0);
	}
	_setDolly(dir) {
		this.state = STATE.DOLLY;
		if (this.enableDolly) this._dollyOffset = dir;
		this.animation.startAnimation(0);
	}
	_setDollyPan(dollyDir, panDir) {
		this.state = STATE.DOLLY_PAN;
		if (this.enableDolly) this._dollyOffset = dollyDir;
		if (this.enablePan) this._panOffset.copy(panDir);
		this.animation.startAnimation(0);
	}
	_setOrbit(dir) {
		this.state = STATE.ORBIT;
		if (this.enableOrbit) this._orbitOffset.copy(dir);
		this.animation.startAnimation(0);
	}
	_setFocus() {
		this.state = STATE.NONE;
		if (this.object && this.enableFocus) this.focus(this.object);
		this.animation.startAnimation(0);
	}
	// ViewportControl control methods. Implement in subclass!
	pan() {
		console.warn('CameraControls: pan() not implemented!');
	}
	dolly() {
		console.warn('CameraControls: dolly() not implemented!');
	}
	orbit() {
		console.warn('CameraControls: orbit() not implemented!');
	}
	focus() {
		console.warn('CameraControls: focus() not implemented!');
	}
}

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
	constructor(props) {
		super(props);

		this.defineProperties({
			minDistance: 0, // PerspectiveCamera dolly limit
			maxDistance: Infinity, // PerspectiveCamera dolly limit
			minZoom: 0, // OrthographicCamera zoom limit
			maxZoom: Infinity, // OrthographicCamera zoom limit
			minPolarAngle: 0, // radians (0 to Math.PI)
			maxPolarAngle: Math.PI, // radians (0 to Math.PI)
			minAzimuthAngle: - Infinity, // radians (-Math.PI to Math.PI)
			maxAzimuthAngle: Infinity, // radians (-Math.PI to Math.PI)
			screenSpacePanning: false,
			_spherical: new Spherical()
		});
	}
	orbit(orbit) {
		// camera.up is the orbit axis
		tempQuat.setFromUnitVectors(this.camera.up, unitY);
		tempQuatInverse.copy(tempQuat).inverse();
		eye.copy(this.camera.position).sub(this.target);
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
	dolly(dolly) {
		let dollyScale = (dolly > 0) ? 1 - dolly : 1 / (1 + dolly);
		if (this.camera.isPerspectiveCamera) {
			this._spherical.radius /= dollyScale;
		} else if (this.camera.isOrthographicCamera) {
			this.camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.camera.zoom * dollyScale));
		}
		this.camera.updateProjectionMatrix();

		this._spherical.makeSafe();
		// restrict radius to be between desired limits
		this._spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this._spherical.radius));
	}
	pan(pan) {
		// move target to panned location

		let panLeftDist;
		let panUpDist;
		if (this.camera.isPerspectiveCamera) {
			// half of the fov is center to top of screen
			let fovFactor = Math.tan((this.camera.fov / 2) * Math.PI / 180.0);
			panLeftDist = pan.x * eye.length() * fovFactor;
			panUpDist = -pan.y * eye.length() * fovFactor;
		} else if (this.camera.isOrthographicCamera) {
			panLeftDist = pan.x * (this.camera.right - this.camera.left) / this.camera.zoom;
			panUpDist = -pan.y * (this.camera.top - this.camera.bottom) / this.camera.zoom;
		}

		// panLeft
		offset.setFromMatrixColumn(this.camera.matrix, 0);
		offset.multiplyScalar(-panLeftDist);
		offset2.copy(offset);

		// panUp
		if (this.screenSpacePanning) {
			offset.setFromMatrixColumn(this.camera.matrix, 1);
		} else {
			offset.setFromMatrixColumn(this.camera.matrix, 0);
			offset.crossVectors(this.camera.up, offset);
		}
		offset.multiplyScalar(panUpDist);
		offset2.add(offset);


		this.target.add(offset2);
		offset.setFromSpherical(this._spherical);
		// rotate offset back to "camera-up-vector-is-up" space
		offset.applyQuaternion(tempQuatInverse);
		this.camera.position.copy(this.target).add(offset);
		this.camera.lookAt(this.target);
	}
	focus() {
		console.log(this.selection);
	}
	// utility getters
	get polarAngle() {
		return this._spherical.phi;
	}
	get azimuthalAngle() {
		return this._spherical.theta;
	}
}

/**
 * @author mrdoob / http://mrdoob.com/
 */

const BufferGeometryUtils$1 = {

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
				BufferGeometryUtils$1.mergeBufferGeometries([chunkGeo, chunkGeo], false, chunkGeo);

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

		BufferGeometryUtils$1.mergeBufferGeometries(chunkGeometries, false, this);
	}
}

// Reusable utility variables
const PI = Math.PI;
const HPI = PI / 2;
const EPS$1 = 0.000001;
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
		[new CylinderBufferGeometry(EPS$1, EPS$1, 1, 4, 2, true), {color: [1, 0, 0], position: [0.5, 0, 0], rotation: [0, 0, HPI], thickness: 1}],
		[new CylinderBufferGeometry(EPS$1, EPS$1, 1, 4, 2, true), {color: [0, 1, 0], position: [0, 0.5, 0], rotation: [0, HPI, 0], thickness: 1}],
		[new CylinderBufferGeometry(EPS$1, EPS$1, 1, 4, 2, true), {color: [0, 0, 1], position: [0, 0, 0.5], rotation: [HPI, 0, 0], thickness: 1}],
	])
};

class TransformHelper extends Helper {
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

		this.defineProperties({
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
		});

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

/**
 * @author arodic / https://github.com/arodic
 */

// Reusable utility variables
const PI$1 = Math.PI;
const HPI$1 = PI$1 / 2;
const EPS$2 = 0.000001;

// TODO: consider supporting objects with skewed transforms.
const _position$1 = new Vector3();
const _quaternion$1 = new Quaternion();
const _scale$1 = new Vector3();
const _m1 = new Matrix4();
const _m2 = new Matrix4();
const _one = new Vector3(1, 1, 1);

const corner3Geometry = new HelperGeometry([
	[new CylinderBufferGeometry(EPS$2, EPS$2, 1, 4, 2, true), {color: [1, 0, 0], position: [0.5, 0, 0], rotation: [0, 0, HPI$1], thickness: 2, outlineThickness: 2}],
	[new CylinderBufferGeometry(EPS$2, EPS$2, 1, 4, 2, true), {color: [0, 1, 0], position: [0, 0.5, 0], rotation: [0, HPI$1, 0], thickness: 2, outlineThickness: 2}],
	[new CylinderBufferGeometry(EPS$2, EPS$2, 1, 4, 2, true), {color: [0, 0, 1], position: [0, 0, 0.5], rotation: [HPI$1, 0, 0], thickness: 2, outlineThickness: 2}],
]);

const handleGeometry$1 = {
	XYZ: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [HPI$1, 0, PI$1]}),
	XYz: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [HPI$1, 0, HPI$1]}),
	xyz: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [-HPI$1, 0, -HPI$1]}),
	xyZ: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [-HPI$1, 0, 0]}),
	xYZ: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [PI$1/2, 0, -PI$1/2]}),
	xYz: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [PI$1/2, 0, 0]}),
	Xyz: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [0, 0, HPI$1]}),
	XyZ: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [0, PI$1, 0]}),
};

class SelectionHelper extends Helper {
	get handleGeometry() {
		return handleGeometry$1;
	}
	constructor(props) {
		super(props);
		this.corners = this.addGeometries(this.handleGeometry);

		const axis = new TransformHelper({object: this});
		axis.size = 0.01;
		axis.doFlip = false;
		axis.doHide = false;
		super.add(axis);

		if (this.object && this.object.geometry) {
			if (!this.object.geometry.boundingBox) this.object.geometry.computeBoundingBox();
			const bbMax = this.object.geometry.boundingBox.max;
			const bbMin = this.object.geometry.boundingBox.min;

			this.corners['XYZ'].position.set(bbMax.x, bbMax.y, bbMax.z);
			this.corners['XYz'].position.set(bbMax.x, bbMax.y, bbMin.z);
			this.corners['xyz'].position.set(bbMin.x, bbMin.y, bbMin.z);
			this.corners['xyZ'].position.set(bbMin.x, bbMin.y, bbMax.z);
			this.corners['xYZ'].position.set(bbMin.x, bbMax.y, bbMax.z);
			this.corners['xYz'].position.set(bbMin.x, bbMax.y, bbMin.z);
			this.corners['Xyz'].position.set(bbMax.x, bbMin.y, bbMin.z);
			this.corners['XyZ'].position.set(bbMax.x, bbMin.y, bbMax.z);
		}
	}
	updateMatrixWorld() {
		this.updateHelperMatrix();
		this.matrixWorldNeedsUpdate = false;

		this.object.matrixWorld.decompose(_position$1, _quaternion$1, _scale$1);

		_m1.compose(this.position, this.quaternion, _one);

		_scale$1.x = Math.abs(_scale$1.x);
		_scale$1.y = Math.abs(_scale$1.y);
		_scale$1.z = Math.abs(_scale$1.z);

		for (let i = 0; i < 8; i ++) {

			_position$1.copy(this.children[i].position).multiply(_scale$1);

			let __scale = this.scale.clone();

			let dir = this.children[i].position.clone().applyQuaternion(this.quaternion).normalize();

			this.children[i].material.highlight = Math.min(Math.max(3 - Math.abs(dir.dot(this.eye)) * 4, -1), 0.5);

			__scale.x = Math.min(this.scale.x, Math.abs(_position$1.x) / 2);
			__scale.y = Math.min(this.scale.y, Math.abs(_position$1.y) / 2);
			__scale.z = Math.min(this.scale.z, Math.abs(_position$1.z) / 2);

			__scale.x = Math.max(__scale.x, EPS$2);
			__scale.y = Math.max(__scale.y, EPS$2);
			__scale.z = Math.max(__scale.z, EPS$2);

			_m2.compose(_position$1, new Quaternion, __scale);

			this.children[i].matrixWorld.copy(_m1).multiply(_m2);
		}
		this.children[8].updateMatrixWorld();
	}
}

/**
 * @author arodic / http://github.com/arodic
 */

// Reusable utility variables
const pos = new Vector3();
const quat = new Quaternion();
const quatInv = new Quaternion();
const scale = new Vector3();

const posOld = new Vector3();
const quatOld = new Quaternion();
const scaleOld = new Vector3();

const posOffset = new Vector3();
const quatOffset = new Quaternion();
const scaleOffset = new Vector3();

const itemPos = new Vector3();
const itemPosOffset = new Vector3();
const itemQuat = new Quaternion();
const itemQuatInv = new Quaternion();
const itemQuatOffset = new Quaternion();
const itemScale = new Vector3();

const parentPos = new Vector3();
const parentQuat = new Quaternion();
const parentQuatInv = new Quaternion();
const parentScale = new Vector3();

const dist0 = new Vector3();
const dist1 = new Vector3();
const bbox = new Box3();

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

// Temp variables
const raycaster = new Raycaster();

let time = 0, dtime = 0;
const CLICK_DIST = 0.01;
const CLICK_TIME = 250;

/*
 * Selection object stores selection list and implements various methods for selection list manipulation.
 * Selection object transforms all selected objects when moved in either world or local space.
 *
 * @event chang - fired on selection change.
 * @event selected-changed - also fired on selection change (includes selection payload).
 */

class SelectionControls extends Interactive {
	constructor(props) {
		super(props);

		this.defineProperties({
			object_: props.object_ || null, // TODO: remove
			selected: [],
			transformSelection: true,
			transformSpace: 'local',
			boundingBox: new Box3()
			// translationSnap: null,
			// rotationSnap: null
		});
	}
	select(position, add) {

		const camera = this.camera;
		raycaster.setFromCamera(position, camera);

		const intersects = raycaster.intersectObjects(this.object_.children, true);
		if (intersects.length > 0) {
			const object = intersects[0].object;
			// TODO: handle helper selection
			if (add) {
				this.toggle(object);
			} else {
				this.replace(object);
			}
		} else {
			this.clear();
		}
		this.dispatchEvent('change');
	}
	onPointerDown() {
		time = Date.now();
	}
	onPointerUp(pointers) {
		dtime = Date.now() - time;
		if (pointers.length === 0 && dtime < CLICK_TIME) {
			if (pointers.removed[0].distance.length() < CLICK_DIST) {
				this.select(pointers.removed[0].position, pointers.removed[0].ctrlKey);
			}
		}
	}
	transformSpaceChanged() {
		this.update();
	}
	toggle(list, hierarchy, filter) {
		list = filterItems(list, hierarchy, filter);
		selectedOld.push(...this.selected);
		for (let i = list.length; i--;) {
			let index = this.selected.indexOf(list[i]);
			if (index !== -1) this.selected.splice(index, 1);
			else this.selected.push(list[i]);
		}
		this.update();
	}
	add(list, hierarchy, filter) {
		list = filterItems(list, hierarchy, filter);
		selectedOld.push(...this.selected);
		this.selected.concat(...list);
		this.update();
	}
	addFirst(list, hierarchy, filter) {
		list = filterItems(list, hierarchy, filter);
		selectedOld.push(...this.selected);
		this.selected.length = 0;
		this.selected.push(...list);
		this.selected.push(...selectedOld);
		this.update();
	}
	remove(list, hierarchy, filter) {
		list = filterItems(list, hierarchy, filter);
		selectedOld.push(...this.selected);
		for (let i = list.length; i--;) {
			let index = this.selected.indexOf(list[i]);
			if (index !== -1) this.selected.splice(i, 1);
		}
		this.update();
	}
	replace(list, hierarchy, filter) {
		list = filterItems(list, hierarchy, filter);
		selectedOld.push(...this.selected);
		this.selected.length = 0;
		this.selected.push(...list);
		this.update();
	}
	clear() {
		selectedOld.push(...this.selected);
		this.selected.length = 0;
		this.update();
	}
	update() {
		// Reset selection transform.
		this.position.set(0,0,0);
		this.quaternion.set(0,0,0,1);
		this.scale.set(1,1,1);

		// this.boundingBox.makeEmpty();

		if (this.selected.length && this.transformSelection) {

			// Set selection transform to last selected item (not ancestor of selected).
			if (this.transformSpace === 'local') {
				for (let i = this.selected.length; i--;) {
					let item = this.selected[i];
					if (this._isAncestorOfSelected(item)) continue;
					item.updateMatrixWorld();
					item.matrixWorld.decompose(itemPos, itemQuat, itemScale);
					this.position.copy(itemPos);
					this.quaternion.copy(itemQuat);

					if (item.geometry) {
						if (!item.geometry.boundingBox) item.geometry.computeBoundingBox();
						bbox.copy(item.geometry.boundingBox);
						bbox.min.multiply(itemScale);
						bbox.max.multiply(itemScale);
						this.boundingBox.copy(bbox);
					}

					break;
				}
				// Set selection transform to the average of selected items.
			} else if (this.transformSpace === 'world') {
				// TODO: center should be in the center of combined boundging box.
				// TODO: Verify with StretchTransformControls box handles
				pos.set(0,0,0);
				for (let i = 0; i < this.selected.length; i++) {
					let item = this.selected[i];
					item.updateMatrixWorld();
					item.matrixWorld.decompose(itemPos, itemQuat, itemScale);
					pos.add(itemPos);
				}
				this.position.copy(pos).divideScalar(this.selected.length);

				// this.updateMatrixWorld();

				for (let i = 0; i < this.selected.length; i++) {
					let item = this.selected[i];
					item.matrixWorld.decompose(itemPos, itemQuat, itemScale);
					if (item.geometry) {
						if (!item.geometry.boundingBox) item.geometry.computeBoundingBox();
						bbox.copy(item.geometry.boundingBox);
						bbox.min.multiply(itemScale);
						bbox.max.multiply(itemScale);

						bbox.min.add(itemPos.clone().sub(this.position));
						bbox.max.add(itemPos.clone().sub(this.position));

						this.boundingBox.expandByPoint(bbox.min);
						this.boundingBox.expandByPoint(bbox.max);
					}
					else {
						// TODO: test with non-geometric objects
						this.boundingBox.expandByPoint(itemPos); // Doesent make sense
					}
				}

			}
		}

		// TODO: apply snapping
		// Apply translation snap
		// if (this.translationSnap) {
		// 	if (space === 'local') {
		// 		object.position.applyQuaternion(_tempQuaternion.copy(this.quaternionStart).inverse());
		// 		if (axis.hasAxis('X')) object.position.x = Math.round(object.position.x / this.translationSnap) * this.translationSnap;
		// 		if (axis.hasAxis('Y')) object.position.y = Math.round(object.position.y / this.translationSnap) * this.translationSnap;
		// 		if (axis.hasAxis('Z')) object.position.z = Math.round(object.position.z / this.translationSnap) * this.translationSnap;
		// 		object.position.applyQuaternion(this.quaternionStart);
		// 	}
		// 	if (space === 'world') {
		// 		if (object.parent) {
		// 			object.position.add(_tempVector.setFromMatrixPosition(object.parent.matrixWorld));
		// 		}
		// 		if (axis.hasAxis('X')) object.position.x = Math.round(object.position.x / this.translationSnap) * this.translationSnap;
		// 		if (axis.hasAxis('Y')) object.position.y = Math.round(object.position.y / this.translationSnap) * this.translationSnap;
		// 		if (axis.hasAxis('Z')) object.position.z = Math.round(object.position.z / this.translationSnap) * this.translationSnap;
		// 		if (object.parent) {
		// 			object.position.sub(_tempVector.setFromMatrixPosition(object.parent.matrixWorld));
		// 		}
		// 	}
		// }
		// Apply rotation snap
		// if (space === 'local') {
		// 	const snap = this.rotationSnap;
		// 	if (this.axis === 'X' && snap) this.object.rotation.x = Math.round(this.object.rotation.x / snap) * snap;
		// 	if (this.axis === 'Y' && snap) this.object.rotation.y = Math.round(this.object.rotation.y / snap) * snap;
		// 	if (this.axis === 'Z' && snap) this.object.rotation.z = Math.round(this.object.rotation.z / snap) * snap;
		// }
		// if (this.rotationSnap) this.rotationAngle = Math.round(this.rotationAngle / this.rotationSnap) * this.rotationSnap;

		// Add helpers
		// TODO: cache helpers per object
		for (let i = this.children.length; i--;) {
			super.remove(this.children[i]);
		}

		for (let i = 0; i < this.selected.length; i++) {
			const _helper = new SelectionHelper({object: this.selected[i]});
			super.add(_helper);
		}

		super.updateMatrixWorld();

		// gather selection data and emit selection-changed event
		let added = [];
		for (let i = 0; i < this.selected.length; i++) {
			if (selectedOld.indexOf(this.selected[i]) === -1) {
				added.push(this.selected[i]);
			}
		}
		let removed = [];
		for (let i = 0; i < selectedOld.length; i++) {
			if (this.selected.indexOf(selectedOld[i]) === -1) {
				removed.push(selectedOld[i]);
			}
		}
		selectedOld.length = 0;
		this.dispatchEvent('change');
		this.dispatchEvent('selected-changed', {selected: [...this.selected], added: added, removed: removed});
	}
	// TODO: group scale not from selection center!
	updateMatrixWorld(force) {
		// Extract tranformations before and after matrix update.
		this.matrixWorld.decompose(posOld, quatOld, scaleOld);
		super.updateMatrixWorld(force);
		this.matrixWorld.decompose(pos, quat, scale);

		// Get transformation offsets from transform deltas.
		posOffset.copy(pos).sub(posOld);
		quatOffset.copy(quat).multiply(quatOld.inverse());
		scaleOffset.copy(scale).divide(scaleOld);
		quatInv.copy(quat).inverse();

		if (!this.selected.length || !this.transformSelection) return;
		// Apply tranformatio offsets to ancestors.
		for (let i = 0; i < this.selected.length; i++) {
			// get local transformation variables.
			this.selected[i].updateMatrixWorld();
			this.selected[i].matrixWorld.decompose(itemPos, itemQuat, itemScale);
			this.selected[i].parent.matrixWorld.decompose(parentPos, parentQuat, parentScale);
			parentQuatInv.copy(parentQuat).inverse();
			itemQuatInv.copy(itemQuat).inverse();
			// Transform selected in local space.
			if (this.transformSpace === 'local') {
					// Position
					itemPosOffset.copy(posOffset).applyQuaternion(quatInv).divide(parentScale);
					itemPosOffset.applyQuaternion(this.selected[i].quaternion);
					this.selected[i].position.add(itemPosOffset);
					// Rotation
					itemQuatOffset.copy(quatInv).multiply(quatOffset).multiply(quat).normalize();
					this.selected[i].quaternion.multiply(itemQuatOffset);
					// Scale
					if (this._isAncestorOfSelected(this.selected[i])) continue; // lets not go there...
					this.selected[i].scale.multiply(scaleOffset);
			// Transform selected in world space.
			} else if (this.transformSpace === 'world') {
					if (this._isAncestorOfSelected(this.selected[i])) continue;
					// Position
					itemPosOffset.copy(posOffset).applyQuaternion(parentQuatInv).divide(parentScale);
					this.selected[i].position.add(itemPosOffset);
					// Rotation
					dist0.subVectors(itemPos, pos);
					dist1.subVectors(itemPos, pos).applyQuaternion(quatOffset);
					dist1.sub(dist0).applyQuaternion(parentQuatInv).divide(parentScale);
					this.selected[i].position.add(dist1);
					itemQuatOffset.copy(itemQuatInv).multiply(quatOffset).multiply(itemQuat).normalize();
					this.selected[i].quaternion.multiply(itemQuatOffset);
					// Scale
					this.selected[i].scale.multiply(scaleOffset);
				}
				this.selected[i].updateMatrixWorld();
		}
	}
	_isAncestorOfSelected( object ) {
		let parent = object.parent;
		while (parent) {
			if (this.selected.indexOf(parent) !== -1) return true;
			object = parent, parent = object.parent;
		}
		return false;
	}
}

/**
 * @author arodic / https://github.com/arodic
 */

// Reusable utility variables
const _ray = new Raycaster();
const _rayTarget = new Vector3();
const _tempVector = new Vector3();

const TransformControlsMixin = (superclass) => class extends InteractiveMixin(superclass) {
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

// Reusable utility variables
const PI$2 = Math.PI;
const HPI$2 = PI$2 / 2;
const QPI = HPI$2 / 2;
const EPS$3 = 0.000001;

const planeGeometry = new PlaneBufferGeometry(1, 1, 1, 1);

const coneGeometry = new HelperGeometry([
	[new OctahedronBufferGeometry(0.03, 2)],
	[new CylinderBufferGeometry(0, 0.03, 0.2, 8, 1, true), {position: [0, 0.1, 0]}],
]);

const translateArrowGeometry = new HelperGeometry([
	[coneGeometry, {position: [0, 0.7, 0]}],
	[new CylinderBufferGeometry(EPS$3, EPS$3, 0.45, 5, 1, true), {position: [0, 0.5, 0], thickness: 1}],
]);

const scaleArrowGeometry = new HelperGeometry([
	[new OctahedronBufferGeometry(0.03, 2), {position: [0, 0.9, 0]}],
	[new CylinderBufferGeometry(EPS$3, EPS$3, 0.65, 5, 1, true), {position: [0, 0.6, 0], thickness: 1}],
]);

const scaleUniformArrowGeometry = new HelperGeometry([
	[new CylinderBufferGeometry(EPS$3, EPS$3, 0.2, 5, 1, true), {position: [0, -0.13, 0], thickness: 1}],
	[new OctahedronBufferGeometry(0.04, 2)],
]);

const translateCornerGeometry = new HelperGeometry([
	[planeGeometry, {color: colors['whiteTransparent'], position: [-0.1, -0.1, 0], scale: 0.2, outlineThickness: 0}],
	[new CylinderBufferGeometry(EPS$3, EPS$3, 0.2, 4, 2, true), {position: [0, -0.1, 0], rotation: [0, 0, 0], thickness: 1}],
	[new CylinderBufferGeometry(EPS$3, EPS$3, 0.2, 4, 2, true), {position: [-0.1, 0, 0], rotation: [0, 0, HPI$2], thickness: 1}],
]);

const scaleCornerGeometry = new HelperGeometry([
	[new OctahedronBufferGeometry(0.03, 2)],
	[planeGeometry, {color: colors['whiteTransparent'], position: [0, -0.06, 0], scale: [0.06, 0.1, 0.06], outlineThickness: 0}],
	[planeGeometry, {color: colors['whiteTransparent'], position: [-0.06, 0, 0], scale: [0.1, 0.06, 0.06], outlineThickness: 0}],
]);

const rotateHandleGeometry = new HelperGeometry([
	[new TorusBufferGeometry( 1, EPS$3, 4, 6, HPI$2/2 ), {thickness: 1, rotation: [0, 0, HPI$2 - HPI$2/4]}],
	[new TorusBufferGeometry( 0.96, 0.04, 2, 2, HPI$2/2/3 ), {color: [1, 1, 1, 0.25], rotation: [0, 0, HPI$2 - HPI$2/4/3], scale: [1, 1, 0.01], outlineThickness: 0}],
	[coneGeometry, {position: [0.37, 0.93, 0], rotation: [0, 0, -2.035], scale: 0.75}],
	[coneGeometry, {position: [-0.37, 0.93, 0], rotation: [0, 0, 2.035], scale: 0.75}],
]);

const translatePickerGeometry = new HelperGeometry(new CylinderBufferGeometry(0.15, 0, 0.6, 4, 1, true), {color: colors['whiteTransparent'], position: [0, 0.5, 0]});

const scalePickerGeometry = new HelperGeometry(new OctahedronBufferGeometry(0.1, 0), {color: colors['whiteTransparent']});

const rotatePickerGeometry = new HelperGeometry(new TorusBufferGeometry( 1, 0.1, 4, 4, HPI$2/1.5 ), {color: colors['whiteTransparent'], rotation: [0, 0, HPI$2 - HPI$2/3]});

const cornerPickerGeometry = new HelperGeometry(planeGeometry, {color: colors['whiteTransparent'], scale: 0.3, outlineThickness: 0});

const translateGuideGeometry = new HelperGeometry([
	[new CylinderBufferGeometry(EPS$3, EPS$3, 25, 5, 1, true), {thickness: 1, outlineThickness: 0}],
]);

const rotateGuideGeometry = new HelperGeometry([
	[new TorusBufferGeometry( 1, EPS$3, 4, 64 ), {thickness: 1, outlineThickness: 0}],
	[new CylinderBufferGeometry(EPS$3, EPS$3, 10, 5, 1, true), {position: [0, 1, 0], rotation: [0, 0, HPI$2], thickness: 1, outlineThickness: 0}],
]);

const handleGeometry$2 = {
	T_X: new HelperGeometry(translateArrowGeometry, {color: colors['red'], rotation: [0, 0, -HPI$2]}),
	T_Y: new HelperGeometry(translateArrowGeometry, {color: colors['green']}),
	T_Z: new HelperGeometry(translateArrowGeometry, {color: colors['blue'], rotation: [HPI$2, 0, 0]}),
	T_XY: new HelperGeometry(translateCornerGeometry, {color: colors['yellow'], position: [0.25, 0.25, 0]}),
	T_YZ: new HelperGeometry(translateCornerGeometry, {color: colors['cyan'], position: [0, 0.25, 0.25], rotation: [0, -HPI$2, 0]}),
	T_XZ: new HelperGeometry(translateCornerGeometry, {color: colors['magenta'], position: [0.25, 0, 0.25], rotation: [HPI$2, 0, 0]}),

	R_X: new HelperGeometry(rotateHandleGeometry, {color: colors['red'], rotation: [QPI, HPI$2, 0]}),
	R_Y: new HelperGeometry(rotateHandleGeometry, {color: colors['green'], rotation: [HPI$2, 0, -HPI$2/2]}),
	R_Z: new HelperGeometry(rotateHandleGeometry, {color: colors['blue'], rotation: [0, 0, -QPI]}),

	S_X: new HelperGeometry(scaleArrowGeometry, {color: colors['red'], rotation: [0, 0, -HPI$2]}),
	S_Y: new HelperGeometry(scaleArrowGeometry, {color: colors['green']}),
	S_Z: new HelperGeometry(scaleArrowGeometry, {color: colors['blue'], rotation: [HPI$2, 0, 0]}),
	S_XY: new HelperGeometry(scaleCornerGeometry, {color: colors['yellow'], position: [0.9, 0.9, 0]}),
	S_YZ: new HelperGeometry(scaleCornerGeometry, {color: colors['cyan'], position: [0, 0.9, 0.9], rotation: [0, -HPI$2, 0]}),
	S_XZ: new HelperGeometry(scaleCornerGeometry, {color: colors['magenta'], position: [0.9, 0, 0.9], rotation: [HPI$2, 0, 0]}),
	S_XYZ: new HelperGeometry([
		[scaleUniformArrowGeometry, {color: colors['gray'], position: [1.1, 0, 0], rotation: [0, 0, -HPI$2]}],
		[scaleUniformArrowGeometry, {color: colors['gray'], position: [0, 1.1, 0]}],
		[scaleUniformArrowGeometry, {color: colors['gray'], position: [0, 0, 1.1], rotation: [HPI$2, 0, 0]}],
	]),
};

const pickerGeometry = {
	T_X: new HelperGeometry(translatePickerGeometry, {color: colors['red'], rotation: [0, 0, -HPI$2]}),
	T_Y: new HelperGeometry(translatePickerGeometry, {color: colors['green']}),
	T_Z: new HelperGeometry(translatePickerGeometry, {color: colors['blue'], rotation: [HPI$2, 0, 0]}),
	T_XY: new HelperGeometry(cornerPickerGeometry, {color: colors['yellow'], position: [0.15, 0.15, 0]}),
	T_YZ: new HelperGeometry(cornerPickerGeometry, {color: colors['cyan'], position: [0, 0.15, 0.15], rotation: [0, -HPI$2, 0]}),
	T_XZ: new HelperGeometry(cornerPickerGeometry, {color: colors['magenta'], position: [0.15, 0, 0.15], rotation: [HPI$2, 0, 0]}),
	T_XYZ: new HelperGeometry(new OctahedronBufferGeometry(0.2, 0), {color: colors['whiteTransparent']}),

	R_X: new HelperGeometry(rotatePickerGeometry, {color: colors['red'], rotation: [QPI, HPI$2, 0]}),
	R_Y: new HelperGeometry(rotatePickerGeometry, {color: colors['green'], rotation: [HPI$2, 0, -HPI$2/2]}),
	R_Z: new HelperGeometry(rotatePickerGeometry, {color: colors['blue'], rotation: [0, 0, -QPI]}),

	S_X: new HelperGeometry(scalePickerGeometry, {color: colors['red'], position: [0.9, 0, 0], rotation: [0, 0, -HPI$2], scale: 1.5}),
	S_Y: new HelperGeometry(scalePickerGeometry, {color: colors['green'], position: [0, 0.9, 0], scale: 1.5}),
	S_Z: new HelperGeometry(scalePickerGeometry, {color: colors['blue'], position: [0, 0, 0.9], rotation: [HPI$2, 0, 0], scale: 1.5}),
	S_XY: new HelperGeometry(scalePickerGeometry, {color: colors['yellow'], position: [0.9, 0.9, 0]}),
	S_YZ: new HelperGeometry(scalePickerGeometry, {color: colors['cyan'], position: [0, 0.9, 0.9], rotation: [0, -HPI$2, 0]}),
	S_XZ: new HelperGeometry(scalePickerGeometry, {color: colors['magenta'], position: [0.9, 0, 0.9], rotation: [HPI$2, 0, 0]}),
	S_XYZ: new HelperGeometry([
		[scalePickerGeometry, {color: colors['gray'], position: [1.1, 0, 0]}],
		[scalePickerGeometry, {color: colors['gray'], position: [0, 1.1, 0]}],
		[scalePickerGeometry, {color: colors['gray'], position: [0, 0, 1.1]}],
	]),
};

const guideGeometry = {
	T_X: new HelperGeometry(translateGuideGeometry, {color: colors['red'], opacity: 0.5, rotation: [0, 0, -HPI$2]}),
	T_Y: new HelperGeometry(translateGuideGeometry, {color: colors['green'], opacity: 0.5}),
	T_Z: new HelperGeometry(translateGuideGeometry, {color: colors['blue'], opacity: 0.5, rotation: [HPI$2, 0, 0]}),

	R_X: new HelperGeometry(rotateGuideGeometry, {color: colors['red'], opacity: 0.5, rotation: [QPI, HPI$2, 0]}),
	R_Y: new HelperGeometry(rotateGuideGeometry, {color: colors['green'], opacity: 0.5, rotation: [HPI$2, 0, -HPI$2/2]}),
	R_Z: new HelperGeometry(rotateGuideGeometry, {color: colors['blue'], opacity: 0.5, rotation: [0, 0, -QPI]}),

	S_X: new HelperGeometry(translateGuideGeometry, {color: colors['red'], opacity: 0.5, rotation: [0, 0, -HPI$2]}),
	S_Y: new HelperGeometry(translateGuideGeometry, {color: colors['green'], opacity: 0.5}),
	S_Z: new HelperGeometry(translateGuideGeometry, {color: colors['blue'], opacity: 0.5, rotation: [HPI$2, 0, 0]}),
};

class CombinedTransformHelper extends TransformHelper {
	get handleGeometry() {
		return handleGeometry$2;
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

const offset$1 = new Vector3();
const scaleFactor = new Vector3();
const EPS$4 = 0.000001;

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

			offset$1.copy(this.pointEnd).sub(this.pointStart);

			if (this.space === 'local' && this.axis !== 'XYZ') {
				offset$1.applyQuaternion(this.worldQuaternionInv);
			}

			if (this.axis.indexOf('X') === -1) offset$1.x = 0;
			if (this.axis.indexOf('Y') === -1) offset$1.y = 0;
			if (this.axis.indexOf('Z') === -1) offset$1.z = 0;

			if (this.space === 'local' && this.axis !== 'XYZ') {
				offset$1.applyQuaternion(this.quaternionStart).divide(this.parentScale);
			} else {
				offset$1.applyQuaternion(this.parentQuaternionInv).divide(this.parentScale);
			}

			this.object.position.copy(offset$1).add(this.positionStart);

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
				Math.max(this.object.scale.x, EPS$4),
				Math.max(this.object.scale.y, EPS$4),
				Math.max(this.object.scale.z, EPS$4),
			);

		}

		if (this.axis.indexOf('R') !== -1) {

			offset$1.copy(this.pointEnd).sub(this.pointStart);

			const ROTATION_SPEED = 5 / this.scale.length();

			if (this.axis === 'R_X' || this.axis === 'R_Y' || this.axis === 'R_Z') {

				rotationAxis.copy(unit[this.axis[2]]);

				tempVector.copy(unit[this.axis[2]]);

				if (this.space === 'local') {
					tempVector.applyQuaternion(this.worldQuaternion);
				}

				rotationAngle = offset$1.dot(tempVector.cross(this.eye).normalize()) * ROTATION_SPEED;

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

class ThreeViewport extends ThreeRenderer {
  static get properties() {
    return {
      // controls: OrbitCameraControls
      helperScene: Scene
    };
  }
  constructor(props) {
    super(props);
    this.controls = new OrbitCameraControls({domElement: this, camera: this.camera});
    this.controls.addEventListener('change', this.render);

    this.selectionControls = new SelectionControls({domElement: this, camera: this.camera, object_: this.scene});
    this.helperScene.add(this.selectionControls);


    this.transformControls = new CombinedTransformControls({domElement: this, camera: this.camera});
    this.transformControls.addEventListener('change', this.render);
    this.transformControls.size = 0.1;
    this.transformControls.space = 'local';
    this.transformControls.addEventListener('active-changed', transformControlsChanged);
    this.transformControls.addEventListener('space-changed', transformControlsChanged);
    this.transformControls.addEventListener('axis-changed', transformControlsChanged);
    this.helperScene.add(this.transformControls);

    const scope = this;

    function transformControlsChanged(event) {
      if (event.detail.property === 'active') scope.controls.enabled = event.detail.value ? false : true;
      if (event.detail.property === 'space') scope.selectionControls.transformSpace = event.detail.value;
      if (event.detail.property === 'axis') {
        scope.selectionControls.enabled = event.detail.value ? false : true;
        scope.controls.enabled = event.detail.value ? false : true;
      }
    }

    this.selectionControls.addEventListener('change', this.render);
    this.selectionControls.addEventListener('selected-changed', () => {
      // TODO: test with objects and selection
      this.transformControls.object = this.selectionControls;
      // this.transformControls.object = event.detail.selected[0];
    });
  }
  preRender() {
    this.selectionControls.camera = this.camera;
    let res = new Vector3(this.size[0], this.size[1], window.devicePixelRatio);
    this.helperScene.traverse(child => {
      if (child.material) {
        child.material.resolution = res;
      }
    });
  }
  postRender() {
    this.renderer.clearDepth();
    this.renderer.render(this.helperScene, this.camera, false, false);
  }
}

ThreeViewport.Register();

const loader = new GLTFLoader();
const scene = new Scene();

const perspCamera = new PerspectiveCamera(90, 1, 0.0001, 100);
perspCamera.position.set(1, 1, 1);
perspCamera.target = new Vector3(0, 0.75, 0);

const topCamera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.001, 20);
topCamera.position.set(0, 10, 0);
topCamera.target = new Vector3(0, 0.75, 0);

const leftCamera = new OrthographicCamera(-0.75, 0.75, 0.75, -0.75, 0.001, 20);
leftCamera.position.set(10, 0.75, 0);
leftCamera.target = new Vector3(0, 0.75, 0);

const frontCamera = new OrthographicCamera(-0.75, 0.75, 0.75, -0.75, 0.001, 20);
frontCamera.position.set(0, 0.75, 10);
frontCamera.target = new Vector3(0, 0.75, 0);

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
      }
    </style>
    `;
  }
  connectedCallback() {
    super.connectedCallback();
    if (!scene.loaded) {
      loader.load('/three-ui/demo/scene/cubes.gltf', gltf => {
        window.dispatchEvent(new CustomEvent('object-mutated', {detail: {object: scene}}));
        gltf.scene.children.forEach(child => { scene.add( child ); });
        scene.add(new HemisphereLight(0x333333, 0xffffff, 3));
      }, undefined, function ( e ) {
        console.error( e );
      } );
      scene.loaded = true;
    }
  }
  constructor(props) {
    super(props);
    this.template([
      ['three-viewport', {id: 'viewport0', clearAlpha: 0, scene: scene, camera: perspCamera}],
      ['three-viewport', {id: 'viewport1', clearAlpha: 0, scene: scene, camera: topCamera}],
      ['three-viewport', {id: 'viewport2', clearAlpha: 0, scene: scene, camera: leftCamera}],
      ['three-viewport', {id: 'viewport3', clearAlpha: 0, scene: scene, camera: frontCamera}],
    ]);
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

class ThreePlayer extends ThreeRenderer {
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
      controls: null,
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
    this.controls = new OrbitCameraControls({domElement: this, camera: this.camera});
    // TODO: handle camera change
  }
  disconnectedCallback() {
    this.stop();
    super.disconnectedCallback();
  }
  controlsChanged(event) {
    if (event.detail.oldValue) event.detail.oldValue.dispose();
    if (this.controls) {
      this.controls.addEventListener('change', this.queueRender);
    }
  }
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
    if (this.controls) this.controls.dispose();
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

// export {EditorCameraControls} from "./core/cashot.js";

export { Shot, ThreeAttributes, ThreeColor, ThreeEditor, ThreeEuler, ThreeInspector, ThreeMatrix, ThreePlayer, ThreeVector, ThreeRenderer, ThreeViewport };

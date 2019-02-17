import { Vector2, Vector3, MOUSE, Mesh, BoxBufferGeometry, PerspectiveCamera, Scene, Clock, WebGLRenderer, OrthographicCamera, Quaternion, Spherical, ShaderMaterial, FrontSide, DataTexture, RGBAFormat, FloatType, NearestFilter, Color, UniformsUtils, Sprite, Texture } from '../../three.js/build/three.module.js';

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

/**
 * @author arodic / https://github.com/arodic
 *
 * Core classes of io library: https://github.com/arodic/io
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
    if (nodes[hash] && nodes[hash].hash) {
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

const setHashes = function() {
  let hashString = '';
  for (let node in nodes) {
    if (nodes[node].hash && nodes[node].value !== undefined && nodes[node].value !== '') {
      if (typeof nodes[node].value === 'string') {
        hashString += node + '=' + nodes[node].value + '&';
      } else {
        hashString += node + '=' + JSON.stringify(nodes[node].value) + '&';
      }
    }
  }
  window.location.hash = hashString.slice(0, -1);
};

window.addEventListener("hashchange", getHashes, false);
getHashes();

class IoStorageNode extends IoCore {
  static get properties() {
    return {
      key: String,
      value: undefined,
      hash: Boolean,
    };
  }
  constructor(props, defValue) {
    super(props);
    const hashValue = hashes[this.key];
    if (this.hash && hashValue !== undefined) {
      this.value = hashValue;
    } else {
      const localValue = localStorage.getItem(this.key);
      if (localValue !== null && localValue !== undefined) {
        this.value = JSON.parse(localValue);
      } else {
        this.value = defValue;
      }
    }
  }
  valueChanged() {
    if (this.hash) {
      setHashes();
    } else {
      if (this.value === null || this.value === undefined) {
        localStorage.removeItem(this.key);
      } else {
        localStorage.setItem(this.key, JSON.stringify(this.value));
      }
    }
  }
}

IoStorageNode.Register();

function IoStorage(key, defValue, hash) {
  if (!nodes[key]) {
    nodes[key] = new IoStorageNode({key: key, hash: hash}, defValue);
    nodes[key].binding = nodes[key].bind('value');
  }
  setHashes();
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

const renderer = new WebGLRenderer({antialias: false, preserveDrawingBuffer: true, alpha: true});
const gl$1 = renderer.getContext();

renderer.domElement.className = 'canvas3d';
renderer.gammaFactor = 2.2;
renderer.gammaInput = true;
renderer.gammaOutput = true;
renderer.shadowMap.enabled = true;
renderer.setClearColor(0x000000, 0.0);

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
    let aspect = this.size[0] / this.size[1];
    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = aspect;
    }
    if (this.camera instanceof OrthographicCamera) {
      let hh = (this.camera.top - this.camera.bottom) / 2;
      let hw = hh * aspect;
      this.camera.top = hh;
      this.camera.bottom = - hh;
      this.camera.right = hw;
      this.camera.left = - hw;
    }
    this.camera.updateProjectionMatrix();
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
					const rect = this.target.getBoundingClientRect();
					pointer.position.x = (pointer.position.x - rect.left) / rect.width * 2.0 - 1.0;
					pointer.position.y = (pointer.position.y - rect.top) / rect.height * - 2.0 + 1.0;
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
			color: { value: color, changed: 'uniformChanged'},
			opacity: { value: opacity, changed: 'uniformChanged'},
			depthBias: { value: props.depthBias || 0, changed: 'uniformChanged'},
			highlight: { value: props.highlight || 0, changed: 'uniformChanged'},
			resolution: { value: res, changed: 'uniformChanged'},
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
					color = mix(color * vec3(0.25), vec3(1.0), max(0.0, uHighlight) );
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
	enabledChanged(value) {
		value ? this._addEvents() : this._removeEvents();
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

class ThreeViewport extends ThreeRenderer {
  static get properties() {
    return {
      // controls: OrbitCameraControls
    };
  }
  constructor(props) {
    super(props);
    this.controls = new OrbitCameraControls({domElement: this, camera: this.camera});
    this.controls.addEventListener('change', this.render);
  }
  preRender() {}
  postRender() {}
}

ThreeViewport.Register();

// export {EditorCameraControls} from "./core/cashot.js";

export { Shot, ThreeAttributes, ThreeColor, ThreeEuler, ThreeInspector, ThreeMatrix, ThreePlayer, ThreeVector, ThreeRenderer, ThreeViewport };

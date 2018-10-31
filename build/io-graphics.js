import { html, IoObject, IoNumber, IoElement, IoInteractiveMixin } from '../../io/build/io.js';

//TODO: test

class IoArray extends IoObject {
  static get style() {
    return html`<style>:host {display: grid;font-family: monospace;}:host > io-number {margin: 1px;padding: 0.1em 0.2em;border: 1px solid rgba(0,0,0,0.1);}:host[columns="2"] {grid-template-columns: 50% 50%;}:host[columns="3"] {grid-template-columns: 33.3% 33.3% 33.3%;}:host[columns="4"] {grid-template-columns: 25% 25% 25% 25%;}:host[columns="5"] {grid-template-columns: 20% 20% 20% 20% 20%;}</style>`;
  }
  static get properties() {
    return {
      columns: {
        value: 0
      }
      // TODO: labeled?
    };
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

class IoColor extends IoObject {
  static get style() {
    return html`<style>:host {display: flex;flex-direction: row;font-family: monospace;}:host > io-number {flex: 1 1 auto;}:host > io-number,:host > io-color-hex {margin: 1px;padding: 0.1em 0.2em;border: 1px solid rgba(0,0,0,0.1);}:host > io-color-hex {flex: 0 0 auto;}</style>`;}static get properties() {return {hex: Number};}_onIoObjectMutated(event) {if (event.detail.object === this.value) {this.valueChanged();}}valueChanged() {this.hex = rgbToHex(this.value);}hexChanged() {const rgb = hexToRgb(this.hex);this.value.r = rgb.r;this.value.g = rgb.g;this.value.b = rgb.b;}changed() {this.template([['io-number', {value: this.value.r, 'on-value-set': this._onValueSet, id: 'r', step: 0.01, min: 0, max: 1, strict: false}],['io-number', {value: this.value.g, 'on-value-set': this._onValueSet, id: 'g', step: 0.01, min: 0, max: 1, strict: false}],['io-number', {value: this.value.b, 'on-value-set': this._onValueSet, id: 'b', step: 0.01, min: 0, max: 1, strict: false}],['io-color-hex', {value: this.bind('hex'), 'on-value-set': this._onValueSet, id: 'hex'}],]);}}IoColor.Register();class IoColorHex extends IoNumber {static get style() {return html`<style>:host::before {opacity: 0.5;content: '0x';}</style>`;
  }
  setFromText(text) {
    this.set('value', Math.floor(parseInt(text, 16)));
  }
  changed() {
    this.innerText = ( '000000' + this.value.toString( 16 ) ).slice( -6 );
    this.style.backgroundColor = '#' + this.innerText;
  }
}

IoColorHex.Register();

// import {IoInteractive} from "../classes/interactive.js";

class IoFloat extends IoNumber {
  static get style() {
    return html`<style>:host[underslider] {background-image: paint(underslider);cursor: col-resize;}</style>`;
  }
  static get properties() {
    return {
      underslider: {
        value: false,
        reflect: true
      },
    };
  }
  static get listeners() {
    return {
      'io-pointer-start': '_onPointerStart',
      'io-pointer-move': '_onPointerMove',
      'io-pointer-end': '_onPointerEnd'
    };
  }
  _onPointerStart() {
    // TODO: implement floating slider
    event.detail.event.preventDefault();
  }
  _onPointerMove(event) {
    // TODO: implement floating slider
    if (this.underslider) {
      event.detail.event.preventDefault();
      if (event.detail.pointer[0].distance.length() > 2) {
        const rect = this.getBoundingClientRect();
        if (this.min !== -Infinity && this.max !== Infinity && this.max > this.min) {
          const val = Math.min(1, Math.max(0, event.detail.pointer[0].position.x / rect.width));
          this.set('value', this.min + (this.max - this.min) * val);
        }
      }
    }
  }
  _onPointerEnd(event) {
    if (event.detail.pointer[0].distance.length() <= 2 && this !== document.activeElement) {
      event.detail.event.preventDefault();
      this.focus();
    }
  }
}

IoFloat.Register();

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

class IoSlider extends IoElement {
  static get style() {
    return html`<style>:host {display: flex;font-family: monospace;}:host > io-number {flex: 0 0 auto;margin: 1px;padding: 0.1em 0.2em;border: 1px solid rgba(0,0,0,0.1);}:host > io-slider-knob {border: 1px solid rgba(0,0,0,0.1);margin: 1px;flex: 1 1 auto;}</style>`;}static get properties() {return {value: 0,step: 0.001,min: 0,max: 1,strict: true,};}changed() {const charLength = (Math.max(Math.max(String(this.min).length, String(this.max).length), String(this.step).length));this.template([['io-number', {value: this.bind('value'), step: this.step, min: this.min, max: this.max, strict: this.strict, id: 'number'}],['io-slider-knob', {value: this.bind('value'), step: this.step, min: this.min, max: this.max, strict: this.strict, id: 'slider'}]]);this.$.number.style.setProperty('min-width', charLength + 'em');}}IoSlider.Register();class IoSliderKnob extends IoInteractiveMixin(IoElement) {static get style() {return html`<style>:host {display: flex;cursor: ew-resize;overflow: hidden;}:host img {width: 100% !important;}</style>`;
  }
  static get properties() {
    return {
      value: 0,
      step: 0.01,
      min: 0,
      max: 1000,
      strics: true, // TODO: implement
      pointermode: 'absolute',
      cursor: 'ew-resize'
    };
  }
  static get listeners() {
    return {
      'io-pointer-move': '_onPointerMove'
    };
  }
  _onPointerMove(event) {
    event.detail.event.preventDefault();
    let rect = this.getBoundingClientRect();
    let x = (event.detail.pointer[0].position.x - rect.x) / rect.width;
    let pos = Math.max(0,Math.min(1, x));
    let value = this.min + (this.max - this.min) * pos;
    value = Math.round(value / this.step) * this.step;
    value = Math.min(this.max, Math.max(this.min, (Math.round(value / this.step) * this.step)));
    this.set('value', value);
  }
  changed() {
    this.template([['img', {id: 'img'}],]);
    this.$.img.src = this.paint(this.$.img.getBoundingClientRect());
  }

  paint(rect) {
    // TODO: implement in webgl shader
    canvas.width = rect.width;
    canvas.height = rect.height;

    const bgColor = '#888';
    const colorStart = '#2cf';
    const colorEnd = '#2f6';
    const min = this.min;
    const max = this.max;
    const step = this.step;
    const value = this.value;

    if (isNaN(value)) return;

    const w = rect.width, h = rect.height;
    const handleWidth = 4;

    let snap = Math.floor(min / step) * step;
    let pos;

    if (((max - min) / step) < w / 3 ) {
      while (snap < (max - step)) {
        snap += step;
        pos = Math.floor(w * (snap - min) / (max - min));
        ctx.lineWidth = .5;
        ctx.strokeStyle = bgColor;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, h);
        ctx.stroke();
      }
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, h / 2 - 2, w, 4);

    pos = handleWidth / 2 + (w - handleWidth) * (value - min) / (max - min);
    const gradient = ctx.createLinearGradient(0, 0, pos, 0);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, h / 2 - 2, pos, 4);

    ctx.lineWidth = handleWidth;
    ctx.strokeStyle = colorEnd;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, h);
    ctx.stroke();

    return canvas.toDataURL();
  }
}

IoSliderKnob.Register();

//TODO: test

const components = {
  x: {},
  y: {},
  z: {},
  w: {}
};

class IoVector extends IoObject {
  static get style() {
    return html`<style>:host {display: flex;flex-direction: row;font-family: monospace;}:host > io-number {flex: 1 1 auto;margin: 1px;padding: 0.1em 0.2em;border: 1px solid rgba(0,0,0,0.1);}:host > io-boolean {color: inherit;margin: 1px;padding: 0.1em 0.2em;border: 1px solid rgba(0,0,0,0.1);}:host > io-boolean:not([value]) {opacity: 0.25;}</style>`;
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
      this.dispatchEvent('io-object-mutated', detail, false, window);
      this.dispatchEvent('value-set', detail, true); // TODO
    }
  }
  changed() {
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
          underslider: this.underslider,
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

IoVector.Register();

export { IoArray, IoColor, IoFloat, IoSlider, IoVector };

import {html, IoProperties, IoNumber} from "../../../io/src/io.js";

export class IoColor extends IoProperties {
  static get style() {
    return html`<style>
    :host {
      display: flex;
      flex-direction: row;
    }
    :host > *:not(:last-child) {
      margin-right: 2px;
    }
    :host > io-color-hex {
      font-family: monospace;
      flex: 0 1 5.5em;
    }
    :host > io-number {
      flex: 1 1 auto;
    }
    </style>`;
  }
  static get properties() {
    return {
      hex: Number
    };
  }
  _onIoObjectMutated(event) {
    if (event.detail.object === this.value) {
      this.valueChanged();
    }
  }
  valueChanged() {
    this.hex = rgbToHex(this.value);
  }
  hexChanged() {
    const rgb = hexToRgb(this.hex);
    this.value.r = rgb.r;
    this.value.g = rgb.g;
    this.value.b = rgb.b;
  }
  changed() {
    this.template([
      ['io-number', {value: this.value.r, 'on-value-set': this._onValueSet, id: 'r', step: 0.01, min: 0, max: 1, strict: false}],
      ['io-number', {value: this.value.g, 'on-value-set': this._onValueSet, id: 'g', step: 0.01, min: 0, max: 1, strict: false}],
      ['io-number', {value: this.value.b, 'on-value-set': this._onValueSet, id: 'b', step: 0.01, min: 0, max: 1, strict: false}],
      ['io-color-hex', {value: this.bind('hex'), 'on-value-set': this._onValueSet, id: 'hex'}],
    ]);
  }
}

IoColor.Register();

export class IoColorHex extends IoNumber {
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

IoColorHex.Register();

export function rgbToHsv(rgb) {
  const max = Math.max(rgb.r, rgb.g, rgb.b), min = Math.min(rgb.r, rgb.g, rgb.b);
  const d = max - min;
  let h, s, v = max;
  s = max == 0 ? 0 : d / max;
  if (max == min) {
    h = 0;
  } else {
    switch (max) {
      case rgb.r: h = (rgb.g - rgb.b) / d + (rgb.g < rgb.b ? 6 : 0); break;
      case rgb.g: h = (rgb.b - rgb.r) / d + 2; break;
      case rgb.b: h = (rgb.r - rgb.g) / d + 4; break;
    }
    h /= 6;
  }
  return {h: h, s: s, v: v};
}

export function hsvToRgb(hsv) {
  let r, g, b;
  const h = hsv.h;
  const s = hsv.s;
  const v = hsv.v;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  return {r: r, g: g, b: b};
}

export function rgbToHex(rgb) {
  return ((rgb.r * 255) << 16 ^ (rgb.g * 255) << 8 ^ (rgb.b * 255) << 0);
}

export function hexToRgb(hex) {
  return {
    r: (hex >> 16 & 255) / 255,
    g: (hex >> 8 & 255) / 255,
    b: (hex & 255) / 255
  };
}

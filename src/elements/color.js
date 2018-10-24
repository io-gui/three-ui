import {html, IoObject, IoNumber} from "../io.js";
import {rgbToHex, hexToRgb} from "../utils/color.js";

export class IoColor extends IoObject {
  static get style() {
    return html`<style>
    :host {
      display: flex;
      flex-direction: row;
      font-family: monospace;
    }
    :host > io-number {
      flex: 1 1 auto;
    }
    :host > io-number,
    :host > io-color-hex {
      margin: 1px;
      padding: 0.1em 0.2em;
      border: 1px solid rgba(0,0,0,0.1);
    }
    :host > io-color-hex {
      flex: 0 0 auto;
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

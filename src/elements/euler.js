import {html, IoProperties} from "../../../io/dist/io.js";

//TODO: test

export class ThreeEuler extends IoProperties {
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

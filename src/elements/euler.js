import {html, IoObjectProps} from "../../../io/src/io.js";

//TODO: test

export class IoEuler extends IoObjectProps {
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
  changed() {
    this.template([
      ['io-number', {id: 'x', value: this.value.x, 'on-value-set': this._onValueSet}],
      ['io-number', {id: 'y', value: this.value.y, 'on-value-set': this._onValueSet}],
      ['io-number', {id: 'z', value: this.value.z, 'on-value-set': this._onValueSet}],
      ['io-option', {id: 'order', value: this.value.order, options: ['XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX'], 'on-value-set': this._onValueSet}]
    ]);
  }
}

IoEuler.Register();

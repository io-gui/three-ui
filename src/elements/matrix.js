import {html, IoElement} from "../../../io/src/io.js";

export class ThreeMatrix extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: block;
      }
    </style>`;
  }
  static get properties() {
    return {
      value: Object,
    };
  }
  changed() {
    this.template([
      ['io-collapsable', {
        label: 'elements',
        elements: [['io-array', {value: this.value.elements}]]
      }]
    ]);
  }
}

ThreeMatrix.Register();

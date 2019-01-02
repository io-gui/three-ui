import {html, IoElement} from "../../../io/src/io.js";

export class IoMatrix extends IoElement {
  // static get style() {
  //   return html`<style>
  //     :host {
  //       display: block;
  //     }
  //   </style>`;
  // }
  static get properties() {
    return {
      value: Object,
    };
  }
  changed() {
    this.template([
      ['io-array', {value: this.value.elements}]
    ]);
  }
}

IoMatrix.Register();

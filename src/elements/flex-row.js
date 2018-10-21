import {html, IoElement} from "../io.js";

export class IoFlexRow extends IoElement {
  static get style() {
    return html`<style>
    :host {
      display: flex;
      flex-direction: row;
    }
    :host > * {
      flex: 1 1;
    }
    </style>`;
  }
}

IoFlexRow.Register();

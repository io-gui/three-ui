import {html, IoCollapsable} from "../../lib/io.js";

export class ThreeMatrix extends IoCollapsable {
  static get style() {
    return html`<style>
      :host {
        /* display: block; */
        /* display: flex; */
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
      ['io-boolean', {true: 'elements', false: 'elements', value: this.bind('expanded')}],
      this.expanded ? ['div', {className: 'io-collapsable-content'}, [['io-array', {value: this.value.elements}]]] : null
    ]);
  }
}

ThreeMatrix.Register();

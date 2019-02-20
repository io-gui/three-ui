import {IoCollapsable} from "../../../io/build/io.js";

export class ThreeMatrix extends IoCollapsable {
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

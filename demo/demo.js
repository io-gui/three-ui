import {html, IoElement} from "../lib/io.js";
import "../build/io-object.js";

export class IoDemo extends IoElement {
  static get style() {
    return html`<style>
      :host .demo {
        margin: 1em;
        padding: 0.5em;
        background: #eee;
      }
      :host .demoLabel {
        padding: 0.25em;
        margin: -0.5em -0.5em 0.5em -0.5em;
        background: #ccc;
      }
      :host io-string,
      :host io-boolean,
      :host io-number {
        background-color: #ddd;
        margin: 1px;
      }
      :host io-object {
        border: 1px solid #bbb;
      }
    </style>`;
  }
  static get properties() {
    return {
      number: 0,
      string: "hello",
      boolean: true,
      null: null,
      NaN: NaN,
      undefined: undefined,
      array: function() { return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 19]; },
      vec2: function() { return {x:0.2, y:0.8}; },
      vec3: function() { return {x:0.2, y:0.6, z:8}; },
      vec4: function() { return {x:0.2, y:0.5, z:0.8, w:1}; },
      colorRGB: function() { return {r:0, g:1, b:0.5}; }
    };
  }
  static get listeners() {
    return {
      'value-set': '_onValueSet'
    };
  }
  _onValueSet() {
    this.dispatchEvent('io-object-mutated', {object: this, key: '*'}, false, window);
  }
  constructor() {
    super();
    this.selfRef = this;
    this.template([
      ['div', {className: 'demo'}, [
        ['div', {className: 'demoLabel'}, 'io-object'],
        ['io-object', {value: this, expanded: true, labeled: true}]
      ]]
    ]);
  }
}

IoDemo.Register();

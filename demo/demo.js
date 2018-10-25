import {html, IoElement} from "../../io/build/io.js";
import {IoArray} from "../src/elements/array.js";
import {IoColor} from "../src/elements/color.js";
import {IoFloat} from "../src/elements/float.js";
import {IoSlider} from "../src/elements/slider.js";
import {IoVector} from "../src/elements/vector.js";

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
        ['div', {className: 'demoLabel'}, 'io-array'],
        ['io-array', {value: this.array, expanded: true, labeled: true}],
        ['io-array', {value: this.array, expanded: true, labeled: true}],
      ]],
      ['div', {className: 'demo'}, [
        ['div', {className: 'demoLabel'}, 'io-color'],
        ['io-color', {value: this.colorRGB, expanded: true, labeled: true}],
        ['io-color', {value: this.colorRGB, expanded: true, labeled: true}],
      ]],
      ['div', {className: 'demo'}, [
        ['div', {className: 'demoLabel'}, 'io-vector'],
        ['io-vector', {value: this.vec2, labeled: true}],
        ['io-vector', {value: this.vec3, labeled: true}],
        ['io-vector', {value: this.vec4, canlink: true, labeled: true}],
      ]],
      ['div', {className: 'demo'}, [
        ['div', {className: 'demoLabel'}, 'io-slider'],
        ['io-slider', {value: this.bind('number')}],
        ['io-slider', {value: this.bind('number'), step: 0.1, min:-1, max: 1}],
      ]]
    ]);
  }
}

IoDemo.Register();

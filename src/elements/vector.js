import {html, IoProperties} from "../../../io/dist/io.js";

//TODO: test

const components = {
  x: {},
  y: {},
  z: {},
  w: {}
};

export class ThreeVector extends IoProperties {
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
  static get properties() {
    return {
      value: function() { return { x: 0, y: 0 }; },
      conversion: 1,
      step: 0.01,
      min: -Infinity,
      max: Infinity,
      strict: false,
      underslider: false,
      canlink: false,
      linked: false,
    };
  }
  _onValueSet(event) {
    const path = event.composedPath();
    if (path[0] === this) return;
    if (event.detail.object) return; // TODO: unhack
    event.stopPropagation();
    let key = path[0].id;
    if (key && typeof key === 'string') {
      if (this.value[key] !== event.detail.value) {
        this.value[key] = event.detail.value;
      }
      if (this.linked) {
        const change = event.detail.value / event.detail.oldValue;
        for (let key2 in components) {
          if (event.detail.oldValue === 0) {
            if (this.value[key2] !== undefined) {
              this.value[key2] = event.detail.value;
            }
          } else {
            if (this.value[key2] !== undefined && key2 !== key) {
              this.value[key2] *= change;
            }
          }
        }
      }

      let detail = Object.assign({object: this.value, key: this.linked ? '*' : key}, event.detail);
      this.dispatchEvent('object-mutated', detail, false, window);
      this.dispatchEvent('value-set', detail, true); // TODO
    }
  }
  valueChanged() {
    const elements = [];
    for (let key in components) {
      if (this.value[key] !== undefined) {
        elements.push(['io-number', {
          id: key,
          value: this.value[key],
          conversion: this.conversion,
          step: this.step,
          min: this.min,
          max: this.max,
          strict: this.strict,
          'on-value-set': this._onValueSet
        }]);
      }
    }
    if (this.canlink) {
      elements.push(['io-boolean', {value: this.bind('linked'), true: '☑', false: '☐'}]);
    }
    this.template(elements);
  }
}

ThreeVector.Register();

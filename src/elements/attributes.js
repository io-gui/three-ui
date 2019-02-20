import {IoProperties} from "../../../io/build/io.js";

export class ThreeAttributes extends IoProperties {
  // static get listeners() {
  //   return {
  //     'object-mutated': 'onObjectMutated'
  //   }
  // }
  // onObjectMutated(event) {
  //   const obj = event.detail.object;
  //   for (let i = this.crumbs.length; i--;) {
  //     if ((obj instanceof Uint16Array || obj instanceof Float32Array) && this.crumbs[i].isBufferAttribute) {
  //       this.crumbs[i].needsUpdate = true;
  //     }
  //   }
  //   if (event.detail.object.isCamera) {
  //     event.detail.object.updateProjectionMatrix();
  //   }
  // }
  valueChanged() {
    const config = this._config;
    const elements = [];
    for (let c in config) {
      if (this.value[c]) {
        const tag = config[c][0];
        const protoConfig = config[c][1];
        const label = config[c].label || c;
        const itemConfig = {className: 'io-property-editor', title: label, id: c, value: this.value[c], 'on-value-set': this._onValueSet};
        elements.push(
          ['div', {className: 'io-property'}, [
            this.labeled ? ['span', {className: 'io-property-label', title: label}, label + ':'] : null,
            [tag, Object.assign(itemConfig, protoConfig)]
          ]]);
      }
    }
    this.template(elements);
  }
}

ThreeAttributes.Register();

ThreeAttributes.RegisterConfig({});

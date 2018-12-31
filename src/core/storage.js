import * as THREE from "../../../three.js/build/three.module.js";
import {IoNode} from "../../../io/src/io-core.js";

const nodes = {};
const loader = new THREE.ObjectLoader();

class StoreNode extends IoNode {
  static get properties() {
    return {
      key: String,
      value: undefined,
    };
  }
  constructor(props, defValue) {
    super(props);
    const value = localStorage.getItem(this.key);
    if (value !== null) {
      this.value = loader.parse(JSON.parse(value));
    } else {
      this.value = defValue;
    }
  }
  valueChanged() {
    localStorage.setItem(this.key, JSON.stringify(this.value.toJSON()));
  }
}

StoreNode.Register();

export function storage(key, defValue) {
  if (!nodes[key]) {
    nodes[key] = new StoreNode({key: key}, defValue);
    nodes[key].connect();
    nodes[key].binding = nodes[key].bind('value');
  }
  return nodes[key].binding;
}

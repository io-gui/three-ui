import * as THREE from "../../../three.js/build/three.module.js";
import {IoCore} from "../../lib/io.js";

const nodes = {};
const loader = new THREE.ObjectLoader();

class ThreeStorageNode extends IoCore {
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

ThreeStorageNode.Register();

export function ThreeStorage(key, defValue) {
  if (!nodes[key]) {
    nodes[key] = new ThreeStorageNode({key: key}, defValue);
    nodes[key].connect();
    nodes[key].binding = nodes[key].bind('value');
  }
  return nodes[key].binding;
}

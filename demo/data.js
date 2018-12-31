import * as THREE from "../../three.js/build/three.module.js";
import {storage as $} from "../src/io-three.js";

const mesh = new THREE.Mesh(
  new THREE.SphereBufferGeometry(1,1,2,2),
  new THREE.MeshBasicMaterial()
);

window.mesh = mesh;

export const data = {
  mesh: $('mesh', mesh).value
}

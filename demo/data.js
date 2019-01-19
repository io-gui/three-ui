import * as THREE from "../../three.js/build/three.module.js";
import {storage as $} from "../src/core/storage.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const light = new THREE.DirectionalLight();
const mesh = new THREE.Mesh(new THREE.SphereBufferGeometry(1,1,2,2), new THREE.MeshBasicMaterial());

scene.add(camera);
scene.add(light);
scene.add(mesh);

export const data = {
  scene: $('scene', scene).value
}

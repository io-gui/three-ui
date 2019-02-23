import * as THREE from "../../three.js/build/three.module.js";
import {ThreePlayer} from "../build/three-ui.js";

export class ThreeExample extends ThreePlayer {
  static get properties() {
    return {
    };
  }
  constructor(props) {
    super(props);
    let camera = this.camera = new THREE.PerspectiveCamera( 45, 1, .1, 20000 );
    let scene = this.scene = new THREE.Scene();
  }
  preRender() {
  }
  update() {
    super.update();
  }
}

ThreeExample.Register();

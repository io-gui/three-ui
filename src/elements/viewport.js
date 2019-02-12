import {html, IoElement} from "../../lib/io.js";
import * as THREE from "../../../three.js/build/three.module.js";
import {ThreeRenderer} from "./renderer.js";

export class ThreeViewport extends ThreeRenderer {
  preRender() {}
  postRender() {}
}

ThreeViewport.Register();

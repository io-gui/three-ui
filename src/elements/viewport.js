/**
THREE.WebGLRenderer wrapper that manages GL rendering context across multiple instances of
ThreeRenderer. All instances of this element will share a single WebGL canvas.
An element instance becomes a host of the canvas any time WebGL API is used through one of
its methods. Before this happens, the previous host needs to store the framebuffer data in a
2D canvas before the WebGL canvas can be handed out.

IMPORTANT: Keep in mind that WebGL canvas migration is expensive and should not be performed
continuously. In other words, you cannot render with mutliple instances of
ThreeRenderer in realtime without severe performance penalties.
*/

import {html, IoElement} from "../../lib/io.js";
import * as THREE from "../../../three.js/build/three.module.js";
import {ThreeRenderer} from "./renderer.js";

export class ThreeViewport extends ThreeRenderer {
  static get properties() {
    return {
      scene: THREE.Scene,
      camera: THREE.PerspectiveCamera,
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this._connected = true;
    this._onAnimate();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._connected = false;
  }
  _updateCameraAspect(camera) {
    let rect = this.getBoundingClientRect();
    let aspect = rect.width / rect.height;
    if (camera instanceof THREE.PerspectiveCamera) {
      if (camera.aspect !== aspect) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      }
    }
    if (camera instanceof THREE.OrthographicCamera) {
      let hh = camera.top - camera.bottom / 2;
      let hw = hh * aspect;
      if (camera.top !== hh || camera.right !== hw) {
        camera.top = hh;
        camera.bottom = - hh;
        camera.right = hw;
        camera.left = - hw;
        camera.updateProjectionMatrix();
      }
    }
  }
  _onAnimate() {
    if (!this._connected) return;
    if (!this.rendered) {
      this.preRender();
      this._updateCameraAspect(this.camera);
      this.render(this.scene, this.camera);
      this.postRender();
      this.rendered = true;
    }
    requestAnimationFrame(this._onAnimate);
  }
  preRender() {}
  postRender() {}
}

ThreeViewport.Register();

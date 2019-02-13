import * as THREE from "../../../three.js/src/Three.js";
import {ThreeRenderer} from "./renderer.js";
import {OrbitCameraControls} from "../controls/camera/Orbit.js";

export class ThreePlayer extends ThreeRenderer {
  static get properties() {
    return {
      autoplay: false,
      playing: false,
      time: 0,
      controls: null,
      clock: THREE.Clock,
    };
  }
  connectedCallback() {
    if (this.autoplay) this.play();
    super.connectedCallback();
    this.controls = new OrbitCameraControls({domElement: this, camera: this.camera});
    // TODO: handle camera change
  }
  disconnectedCallback() {
    this.stop();
    super.disconnectedCallback();
  }
  controlsChanged(event) {
    if (event.detail.oldValue) event.detail.oldValue.dispose();
    if (this.controls) {
      this.controls.addEventListener('change', this.queueRender);
    }
  }
  autoplayChanged() {
    if (this.autoplay) this.play();
  }
  play() {
    if (this.playing) return;
    this._oldTime = Date.now() / 1000;
    this.playing = true;
    this.update();
  }
  pause() {
  }
  stop() {
    this.playing = false;
  }
  update() {
    if (this.playing) {
      requestAnimationFrame(this.update);
      this.time = (Date.now() / 1000) - this._oldTime;
      this.queueRender();
    }
  }
  preRender() {
  }
  postRender() {
  }
  dispose() {
    this.renderer.dispose();
    this.scene.traverse(child => {
      if (child.material) child.material.dispose();
      if (child.geometry) child.geometry.dispose();
    });
    if (this.controls) this.controls.dispose();
    super.dispose();
  }
}

ThreePlayer.Register();

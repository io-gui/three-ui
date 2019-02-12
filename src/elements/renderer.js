import {html, IoElement} from "../../lib/io.js";
import * as THREE from "../../../three.js/build/three.module.js";

const renderer = new THREE.WebGLRenderer({antialias: false});
const gl = renderer.getContext();
renderer.domElement.className = 'canvas3d';

let host;

let perfNow = 0;
let perfDelta = 1000;
let perfAverage = 1000;
let perfWarned;

const _performanceCheck = function() {
  if (perfWarned) return;
  perfDelta = performance.now() - perfNow;
  perfAverage = Math.min((perfAverage * 10 + perfDelta) / 11, 1000);
  perfNow = performance.now();
  if (perfAverage < 16) {
    console.warn('ThreeRenderer performance warning: rendering multiple canvases!');
    perfWarned = true;
  }
};

export class ThreeRenderer extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: block;
        overflow: hidden;
        position: relative;
        touch-action: none;
        user-select: none;
      }
      :host:focus {
        z-index: 2;
      }
      :host > canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      :host[ishost] > canvas:not(.canvas3d) {
        display: none;
      }
    </style>`;
  }
  static get properties() {
    return {
      scene: THREE.Scene,
      camera: THREE.PerspectiveCamera,
      ishost: {
        type: Boolean,
        reflect: true
      },
      size: [0, 0],
      tabindex: 1,
      renderer: function () { return renderer; }
    };
  }
  static get listeners() {
    return {
      'dragstart': 'preventDefault'
    };
  }
  constructor(props) {
    super(props);
    this.template([['canvas', {id: 'canvas'}]]);
    this._ctx = this.$.canvas.getContext('2d');
  }
  render() {
    if (this.rendered) {
      if (!this.scheduled) {
        requestAnimationFrame(this.renderNextFrame);
      }
      this.scheduled = true;
      return;
    }
    requestAnimationFrame(this.onNextFrame);
    this.setHost();
    this.updateCameraAspect();
    this.preRender();
    this.renderer.render(this.scene, this.camera);
    this.postRender();
    this.rendered = true;
  }
  preRender() {}
  postRender() {}
  renderNextFrame() {
    this.scheduled = false;
    this.render();
  }
  onNextFrame() {
    this.rendered = false;
  }
  updateCameraAspect() {
    let aspect = this.size[0] / this.size[1];
    const camera = this.camera;
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
  setHost() {
    if (!this.ishost) {
      _performanceCheck();
      if (host) {
        host.ishost = false;
        const canvas = this.renderer.domElement;
        host.$.canvas.width = canvas.width;
        host.$.canvas.height = canvas.height;
        host._ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
        gl.flush();
      }
      host = this;
      this.ishost = true;
      this.appendChild(this.renderer.domElement);
      this.resized();
    }
  }
  resized() {
    if (this.ishost) {
      const style = getComputedStyle(this, null);
      this.size[0] = style.width.substring(0, style.width.length - 2);
      this.size[1] = style.height.substring(0, style.height.length - 2);
      if (this.size[0] && this.size[1]) {
        this.renderer.setSize(this.size[0], this.size[1]);
        this.renderer.setPixelRatio(window.devicePixelRatio);
      }
    }
  }
}

ThreeRenderer.Register();

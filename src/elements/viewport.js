import {html, IoElement} from "../../lib/io.js";;
import * as THREE from "../../../../three.js/build/three.module.js";

export class ThreeViewport extends IoElement {
  static get style() {
    return html`<style>
      :host {
        position: relative;
        overflow: hidden;
      }
      :host > canvas {
        position: absolute;
        top: 0 !important;
        left: 0 !important;
      }
    </style>`;
  }
  static get properties() {
    return {
      renderer: null,
      camera: null,
      scene: null,
      tabindex: 1
    };
  }
  constructor(props) {
    super(props);
    if (!this.__properties.camera.value)
        this.__properties.camera.value = new THREE.PerspectiveCamera( 45, 1, .1, 20000 );
    if (!this.__properties.scene.value)
        this.__properties.scene.value = new THREE.Scene();
    if (!this.__properties.renderer.value)
        this.__properties.renderer.value = new THREE.WebGLRenderer( { antialias: false } );
    this.appendChild(this.renderer.domElement);
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
  _updateRendererSize() {
    let rect = this.getBoundingClientRect();
    if (rect.width !== this._width || rect.height !== this._height) {
      let _ctx = this.renderer.context;
      let _ratio = _ctx.webkitBackingStorePixelRatio ||
                  _ctx.mozBackingStorePixelRatio ||
                  _ctx.msBackingStorePixelRatio ||
                  _ctx.oBackingStorePixelRatio ||
                  _ctx.backingStorePixelRatio || 1;
      this._width = rect.width;
      this._height = rect.height;
      this.renderer.setPixelRatio((window.devicePixelRatio || 1) * _ratio);
      this.renderer.setSize(Math.floor(rect.width), Math.floor(rect.height));
      this.rendered = false;
    }
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
    this._updateRendererSize();
    if (!this.rendered) {
      this.preRender();
      this._updateCameraAspect(this.camera);
      this.renderer.render(this.scene, this.camera);
      this.postRender();
      this.rendered = true;
    }
    requestAnimationFrame(this._onAnimate);
  }
  preRender() {}
  postRender() {}
}

ThreeViewport.Register();

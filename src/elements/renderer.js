/**
* @author arodic / http://akirodic.com/
*/

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

const renderer = new THREE.WebGLRenderer();
const gl = renderer.getContext();
renderer.domElement.className = 'canvas3d';

renderer.gammaInput = true;
renderer.gammaOutput = true;
renderer.gammaFactor = 2.2;

let host;

let perfNow = 0;
let perfDelta = 1000;
let perfAverage = 1000;
let perfWarned;

/**
 * This function runs every time renderer migrates to another three-renderer host
 * It is designed to detect if migration feature is overrused by the user.
 */
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
        position: relative;
      }
      :host > canvas {
        position: absolute;
        top: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        left: 0 !important;
      }
      :host > canvas.canvas3d {
        display: none;
      }
      :host[ishost] canvas.canvas2d {
        display: none;
      }
      :host[ishost] > canvas.canvas3d {
        display: block;
      }
    </style>`;
  }
  static get properties() {
    return {
      ishost: {
        type: Boolean,
        reflect: true
      }
    };
  }
  static get listeners() {
    return {
      'mousemove': 'setHost'
    };
  }
  constructor() {
    super();

    // TODO: implement smarter resize

    this._canvas2d = document.createElement('canvas');
    this._canvas2d.className = 'canvas2d';
    this._context2d = this._canvas2d.getContext('2d');
    this.appendChild(this._canvas2d);

    this._renderer = renderer;
    Object.defineProperty(this, '_props', { value: {} });
    for (let key in renderer) {
      if (typeof renderer[key] === 'object') {
        this[key] = renderer[key];
      } else if (typeof renderer[key] === 'function') {
        this[key] = function() {
          this.setHost();
          renderer[key].apply(renderer, arguments);
        }.bind(this);
      } else {
        Object.defineProperty(this, key, {
          get: function() {
            return this._props[key];
          },
          set: function(value) {
            this._props[key] = value;
          },
          enumerable: true,
          configurable: true
        });
        this._props[key] = renderer[key];
      }
    }
  }
  setHost() {
    if (!this.ishost) {
      _performanceCheck();
      if (host) {
        host.ishost = false;
        host._context2d.drawImage(renderer.domElement, 0, 0, host._canvas2d.width, host._canvas2d.height);
        gl.flush();
      }
      host = this;
      this.ishost = true;
      this.appendChild(renderer.domElement);
      this.resized();
    }
    for (let key in this.props) {
      renderer[key] = this._props[key];
    }
  }
  resized() {
    const rect = this.getBoundingClientRect();
    const ratio = this._context2d.backingStorePixelRatio || 1;
    this._c2Dratio = (window.devicePixelRatio || 1) / ratio;
    if (rect.width && rect.height) {
      this._canvas2d.width = rect.width * this._c2Dratio || 1;
      this._canvas2d.height = rect.height * this._c2Dratio || 1;
      if (this.ishost) {
        renderer.setSize(rect.width, rect.height);
        renderer.setPixelRatio(window.devicePixelRatio);
      }
    }
  }
}

ThreeRenderer.Register();

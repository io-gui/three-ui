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

const renderer = new THREE.WebGLRenderer({antialias: false});
const gl = renderer.getContext();
renderer.domElement.className = 'canvas3d';

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
        touch-action: none;
        user-select: none;
      }
      :host > canvas.canvas3d {
        display: none;
      }
      :host[ishost] > canvas {
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
      },
      tabindex: 1,
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
    this._context2d = this.$.canvas.getContext('2d');

    Object.defineProperty(this, '_props', { value: {} })

    for (let key in renderer) {
      if (typeof renderer[key] === 'object') {
        this[key] = renderer[key];
      } else if (typeof renderer[key] === 'function') {
        this[key] = function() {
          renderer[key].apply(renderer, arguments);
          this.setHost();
        }.bind(this);
      } else {
        this._props[key] = renderer[key];
      }
    }
  }
  setHost() {
    if (!this.ishost) {
      _performanceCheck();
      if (host) {
        host.ishost = false;
        if (host.$.canvas) {
          const canvas = renderer.domElement;
          host.$.canvas.width = canvas.width;
          host.$.canvas.height = canvas.height;
          host._context2d.drawImage(canvas, 0, 0, canvas.width, canvas.height);
        }
        gl.flush();
      }
      host = this;
      this.ishost = true;
      this.appendChild(renderer.domElement);
      const rect = this.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      renderer.setPixelRatio(window.devicePixelRatio);
      for (let key in this._props) {
        if (this.__properties[key]) {
          renderer[key] = this.__properties[key].value;
        }
      }
    }
  }
  resized() {
    const rect = this.getBoundingClientRect();
    if (rect.width && rect.height) {
      if (this.ishost) {
        renderer.setSize(rect.width, rect.height);
        renderer.setPixelRatio(window.devicePixelRatio);
      }
    }
  }
}

ThreeRenderer.Register();

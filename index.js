import { IoElement, RegisterIoElement } from 'io-gui';
import { Object3D, Scene } from 'three';
import './build/index.js';

export class ThreeUiDemo extends IoElement {
  static get Style() {
    return /* css */`
      :host {
        display: flex;
        position: relative;
        height: 100%;
        flex-direction: column;
        overflow: hidden;
      }
      :host > three-viewport {
        flex: 1;
      }
    `;
  }
  static get Properties() {
    return {};
  }
  constructor(properties = {}) {
    super(properties);
    this.template([['three-viewport', {id: 'viewport'}]]);
  }
}

RegisterIoElement(ThreeUiDemo);
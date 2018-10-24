import {html, IoNumber} from "../io.js";
// import {IoInteractive} from "../classes/interactive.js";

export class IoFloat extends IoNumber {
  static get style() {
    return html`<style>
      :host[underslider] {
        background-image: paint(underslider);
        cursor: col-resize;
      }
    </style>`;
  }
  static get properties() {
    return {
      underslider: {
        value: false,
        reflect: true
      },
    };
  }
  static get listeners() {
    return {
      'io-pointer-start': '_onPointerStart',
      'io-pointer-move': '_onPointerMove',
      'io-pointer-end': '_onPointerEnd'
    };
  }
  _onPointerStart() {
    // TODO: implement floating slider
    event.detail.event.preventDefault();
  }
  _onPointerMove(event) {
    // TODO: implement floating slider
    if (this.underslider) {
      event.detail.event.preventDefault();
      if (event.detail.pointer[0].distance.length() > 2) {
        const rect = this.getBoundingClientRect();
        if (this.min !== -Infinity && this.max !== Infinity && this.max > this.min) {
          const val = Math.min(1, Math.max(0, event.detail.pointer[0].position.x / rect.width));
          this.set('value', this.min + (this.max - this.min) * val);
        }
      }
    }
  }
  _onPointerEnd(event) {
    if (event.detail.pointer[0].distance.length() <= 2 && this !== document.activeElement) {
      event.detail.event.preventDefault();
      this.focus();
    }
  }
}

IoFloat.Register();

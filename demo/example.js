import {html} from "../../../../io/build/io.js";
import {ThreeViewport} from "../three-viewport/three-viewport.js";
import {threeInspectorConfig} from "./inspector-config.js";
import {IoInspector} from "../../../../io-inspector/src/io-inspector.js";
import {EditorCameraControls} from "../../../../three.js-controls/src/controls/camera/Editor.js";
import {CombinedTransformControls} from "../../../../three.js-controls/src/controls/transform/Combined.js";

export class ThreeExample extends ThreeViewport {
  static get style() {
    return html`<style>
      :host > io-inspector {
        position: absolute;
        max-height: 100%;
        width: 100%;
        right: left;
      }
    </style>`;
  }
  static get properties() {
    return {
      options: [
        {label: 'geometries', value: 'geometries.js'},
        {label: 'colors', value: 'geometry-colors.js'},
        {label: 'hierarchy2', value: 'geometry-hierarchy2.js'},
        {label: 'teapot', value: 'geometry-teapot.js'},
      ],
      example: {
        type: String,
        observer: 'loadExample'
      },
      time: 0,
      control: 'Editor'
    };
  }
  static get listeners() {
    return {
      'scroll': 'stopPropagation',
      'value-set': '_onValueSet'
    };
  }
  _onValueSet(event) {
    if (this._example) {
      this._example.onPropertychanged(event.detail);
    }
  }
  constructor(props) {
    super(props);
    this._inspector = new IoInspector({});
    this.appendChild(this._inspector);

    // this._transformControl = new CombinedTransformControls({camera: this.camera, domElement: this});
    // this._transformControl.addEventListener('change', () => {
    //   this._example.rendered = false;
    // });
    super.template([
      ['io-option', {options: this.options}]
    ])
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._example) {
      this._example.stop();
      this._example.dispose();
      delete this._example;
    }
    if (this._control) {
      this._control.dispose();
      delete this._control;
    }
  }
  loadExample() {
    if (this._example) {
      this._example.stop();
      this._example.dispose();
      delete this._example;
    }
    if (this.example) {
      import('../../../lib/examples/' + this.example + '.js').then(module => {
        this._example = new module.Example();

        this.camera = this._example.camera;
        this.scene = this._example.scene;
        this._inspector.value = this._example;

        this._example.time = 0;
        this._lastTime = Date.now() / 1000;
        this.setControl();

        this._example.rendered = false;
        this._example.renderer = this.renderer;

        this._example.play();

      });
    }
  }
  setControl() {
    this._control = new EditorCameraControls({camera: this._example.camera, domElement: this});
    this._control.addEventListener('change', () => {
      this.dispatchEvent('io-object-mutated', {object: this._example.camera, key: '*'}, false, window);
      this.dispatchEvent('io-object-mutated', {object: this._example.camera.matrix, key: '*'}, false, window);
      this.dispatchEvent('io-object-mutated', {object: this._example.camera.matrixWorld, key: '*'}, false, window);
      this._example.rendered = false;
    });
    this._control.target.set(0, 0, 0);
    this.camera.lookAt(0, 0, 0);
  }
  changed() {
    if (this._example) {
      this._example.time += Date.now() / 1000 - this._lastTime;
      // this.dispatchEvent('io-object-mutated', {object: this._example, key: 'time'}, false, window);
      if (!this._example.rendered) {
        this._example.rendered = true;
        this.rendered = false;
      }
    }
    this._lastTime = Date.now() / 1000;
  }
  preRender() {
    if (this._example) this._example.preRender();
  }
  postRender() {
    if (this._example) this._example.postRender();
  }
  template() {
    if (this._example) {
      this._updateCameraAspect(this.camera);
      this.renderer.render(this.scene, this.camera);
    }
  }
}

ThreeExample.Register();

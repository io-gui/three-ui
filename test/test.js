import {html, IoElement, IoNode} from "../src/io.js";

import SliderTest from "./tests/slider.js"

import "./lib/mocha.js";

mocha.setup('bdd');

export class IoTest extends IoElement {
  constructor() {
    super();
    this.sliderTest = new SliderTest();
  }
  connectedCallback() {
    this.sliderTest.run();

    mocha.checkLeaks();
    mocha.run();
  }
}

IoTest.Register();

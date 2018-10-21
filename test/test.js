import {html, IoElement, IoNode} from "../lib/io.js";

import ObjectTest from "./tests/object.js"

import "https://cdn.jsdelivr.net/npm/mocha@5.2.0/mocha.js";

mocha.setup('bdd');

export class IoTest extends IoElement {
  constructor() {
    super();
    // this.objectTest = new ObjectTest();
  }
  connectedCallback() {
    // this.objectTest.run();

    mocha.checkLeaks();
    mocha.run();
  }
}

IoTest.Register();

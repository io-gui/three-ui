/**
 * @author arodic / http://github.com/arodic
 */

import {IoNode} from "../../../io/build/io-core.js";

const selectedOld = [];

function filterItems(list, hierarchy, filter) {
  list = list instanceof Array ? list : [list];
  let filtered = [];
  for (let i = 0; i < list.length; i++) {
    if (!filter || filter(list[i])) filtered.push(list[i]);
    if (hierarchy) {
      let children = filterItems(list[i].children, hierarchy, filter);
      filtered.push(...children);
    }
  }
  return filtered;
}

export class Selection extends IoNode {
  static get properties() {
    return {
      selected: [],
    };
  }
  toggle(list, hierarchy, filter) {
    list = filterItems(list, hierarchy, filter);
    selectedOld.push(...this.selected);
    for (let i = list.length; i--;) {
      let index = this.selected.indexOf(list[i]);
      if (index !== -1) this.selected.splice(index, 1);
      else this.selected.push(list[i]);
    }
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  add(list, hierarchy, filter) {
    list = filterItems(list, hierarchy, filter);
    selectedOld.push(...this.selected);
    this.selected.concat(...list);
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  addFirst(list, hierarchy, filter) {
    list = filterItems(list, hierarchy, filter);
    selectedOld.push(...this.selected);
    this.selected.length = 0;
    this.selected.push(...list);
    this.selected.push(...selectedOld);
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  remove(list, hierarchy, filter) {
    list = filterItems(list, hierarchy, filter);
    selectedOld.push(...this.selected);
    for (let i = list.length; i--;) {
      let index = this.selected.indexOf(list[i]);
      if (index !== -1) this.selected.splice(i, 1);
    }
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  replace(list, hierarchy, filter) {
    list = filterItems(list, hierarchy, filter);
    selectedOld.push(...this.selected);
    this.selected.length = 0;
    this.selected.push(...list);
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  clear() {
    selectedOld.push(...this.selected);
    this.selected.length = 0;
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  dispose() {
    // TODO:
    console.log('dispose');
  }
}

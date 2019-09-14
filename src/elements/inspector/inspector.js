import {IoProperties, IoInspector} from "../../../../io/build/io-core.js";
import {configs} from "./configs.js";
import {groups} from "./groups.js";

export class ThreeInspector extends IoInspector {
	static get Style() {
		return /* css */`
		:host {
			--io-spacing: 3px;
			--io-font-size: 12px;
			--io-line-height: 12px;
			--io-item-height: 20px;
		}
		`;
	}
	static get Properties() {
		return {
			autoExpand: ['properties', 'transform', 'values'],
		};
	}
	static get Listeners() {
		return {
			'mousedown': 'stopPropagation',
			'mouseup': 'stopPropagation',
			'mousemove': 'stopPropagation',
			'touchstart': 'stopPropagation',
			'touchmove': 'stopPropagation',
			'touchend': 'stopPropagation',
			'keydown': 'stopPropagation',
			'keyup': 'stopPropagation',
			'io-value-set': '_onIoValueSet',
		};
	}
	static get Config() {
		return configs;
	}
	static get Groups() {
		return groups;
	}
	stopPropagation(event) {
		event.stopPropagation();
	}
	_onIoValueSet() {
		this.dispatchEvent('change');
	}
}

// TODO: this should not be neccesary.
//Redundant with ThreeInspector `static get Config()a
IoProperties.RegisterConfig(configs);

ThreeInspector.Register();

ThreeInspector.RegisterGroups({
	// 'Object|other': [/^/],
});


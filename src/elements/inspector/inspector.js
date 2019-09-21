import {IoProperties, IoInspector} from "../../../../io/build/io-core.js";
import {config} from "./config.js";
import {groups} from "./groups.js";
import {widgets} from "./widgets.js";

export class ThreeInspector extends IoInspector {
	static get Style() {
		return /* css */`
		:host {
			--io-spacing: 2px;
			--io-font-size: 11px;
			--io-line-height: 12px;
			--io-item-height: 18px;
		}
		:host io-number {
			padding-left: 0;
			padding-right: 0;
		}
		:host io-number-slider > io-number {
			flex-basis: 4.5em;
		}
		`;
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
		return config;
	}
	static get Groups() {
		return groups;
	}
	static get Widgets() {
		return widgets;
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
IoProperties.RegisterConfig(config);

ThreeInspector.Register();

ThreeInspector.RegisterGroups({
	// 'Object|other': [/^/],
});


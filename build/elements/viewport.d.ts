import { IoElement, Change } from "io-gui";
import { WebGLRenderer, Scene, PerspectiveCamera, Texture } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ControlsInteractive, ControlsCamera } from 'io-gui-three-controls';
export declare class ThreeViewport extends IoElement {
    static get Style(): string;
    renderer: WebGLRenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    renderPass: RenderPass;
    composer: EffectComposer;
    backgroundTexture: null | Texture;
    static get Properties(): {
        tabindex: number;
        exposure: number;
        cameraControls: {
            type: typeof ControlsCamera;
            value: null;
        };
        interactiveControls: {
            type: typeof ControlsInteractive;
            value: null;
        };
    };
    constructor(properties?: Record<string, any>);
    cameraControlsChanged(change: Change): void;
    interactiveControlsChanged(change: Change): void;
    onInteractiveControlsActiveChanged(event: Change): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    onResized(): void;
    loadIbl(url: string, onLoad?: any, onProgress?: any, onError?: any): void;
    loadModel(url: string, onLoad?: any, onProgress?: any, onError?: any): void;
    render(): void;
}
//# sourceMappingURL=viewport.d.ts.map
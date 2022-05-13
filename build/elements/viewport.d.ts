import { IoElement } from "io-gui";
import { WebGLRenderer, Scene, PerspectiveCamera, Texture } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OrbitControls, TransformControls } from 'io-gui-three-controls';
export declare class ThreeViewport extends IoElement {
    static get Style(): string;
    renderer: WebGLRenderer;
    camera: PerspectiveCamera;
    controls: OrbitControls;
    transformControls: TransformControls;
    scene: Scene;
    renderPass: RenderPass;
    bokehPass: BokehPass;
    composer: EffectComposer;
    backgroundTexture: null | Texture;
    static get Properties(): {
        tabindex: number;
        exposure: number;
    };
    constructor(properties?: Record<string, any>);
    connectedCallback(): void;
    disconnectedCallback(): void;
    onResized(): void;
    loadIbl(url: string, onLoad?: any, onProgress?: any, onError?: any): void;
    loadModel(url: string, onLoad?: any, onProgress?: any, onError?: any): void;
    render(): void;
}
//# sourceMappingURL=viewport.d.ts.map
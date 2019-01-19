import { IoInspector, IoProperties, html, IoNumber, IoElement } from '../../io/src/io.js';

IoInspector.RegisterConfig({

  "Object|main": ["name", "visible"],
  "Object|transform": [],
  "Object|rendering": [/[S,s]hadow/, /[R,r]ender/, /[D,d]raw/, /bounding/, "fog"],
  "Object|hidden": ["type", /(is[A-Z])\w+/],

  "Object3D|transform": ["position", "rotation", "scale", "up", "quaternion", /[M,m]atrix/],
  "Object3D|rendering": ["layers", "frustumCulled"],
  "Object3D|scenegraph": ["parent", "children", "target"],

  "Mesh|main": ["geometry", "material"],

  "BufferGeometry|main": ["parameters", "index", "attributes"],

  "Texture|main": ["offset", "repeat", "center", "rotation"],

  "Material|main": [
    "color", "specular", "shininess", "opacity", "wireframe", "map", "specularMap",
    "alphaMap", "envMap", "lightMap", "lightMapIntensity", "aoMap", "aoMapIntensity",
    "emissive", "emissiveMap", "emissiveIntensity", "bumpMap", "bumpScale",
    "normalMap", "normalScale", "displacementMap", "displacementScale",
    "displacementBias", "reflectivity", "refractionRatio",
  ],
  // TODO: optimize for non-regex
  "Material|rendering": [
    /(depth[A-Z])\w+/, /(blend.)\w+/, "transparent", "dithering", "flatShading", "lights", "vertexColors",
    "side", "blending", "colorWrite", "alphaTest", "combine",
    "premultipliedAlpha",
  ],

  "Camera|main": ["near", "far", "zoom", "focus", "top", "bottom", "left", "right", "fov", "aspect", "filmGauge", "filmOffset"],

  "Light|main": ["intensity", "color"],
});

IoProperties.RegisterConfig({
  // "Object|type:object": ["io-inspector-link"], // TODO: why not inherited?

  "constructor:Vector2": ["three-vector"],
  "constructor:Vector3": ["three-vector"],
  "constructor:Vector4": ["three-vector"],
  "constructor:Quaternion": ["three-vector"],
  "constructor:Euler": ["three-euler"], // TODO: setter attributes
  "constructor:Color": ["three-color"],
  "intensity": ["io-slider", {"min": 0,"max": 1}],
  "constructor:Matrix2": ["three-matrix"],
  "constructor:Matrix3": ["three-matrix"],
  "constructor:Matrix4": ["three-matrix"],
  // Object3D
  "Object3D|key:scale": ["three-vector", {canlink: true}],
  "Object3D|key:children": ["io-properties", {labeled: false, config: {'type:object': ['io-inspector-link']}}],
  // BufferGeometry
  "BufferGeometry|parameters": ["io-inspector"],
  // "BufferGeometry|attributes": ["io-object-props"],// TODO: figure out how to pass config
  // WebGLRenderer
  "WebGLRenderer|toneMapping": ["io-option", {"options": [
    {"value": 0, "label": "NoToneMapping"},
    {"value": 1, "label": "LinearToneMapping"},
    {"value": 2, "label": "ReinhardToneMapping"},
    {"value": 3, "label": "Uncharted2ToneMapping"},
    {"value": 4, "label": "CineonToneMapping"}]}],
  // WebGLShadowMap
  "WebGLShadowMap|type": ["io-option", {"options": [
    {"value": 0, "label": "BasicShadowMap"},
    {"value": 1, "label": "PCFShadowMap"},
    {"value": 2, "label": "PCFSoftShadowMap"}]}],
  // MeshDepthMaterial
  "MeshDepthMaterial|depthPacking": ["io-option", {"options": [
    {"value": 3200, "label": "BasicDepthPacking"},
    {"value": 3201, "label": "RGBADepthPacking"}]}],
  // Texture
  "Texture|mapping": ["io-option", {"options": [
    {"value": 300, "label": "UVMapping"},
    {"value": 301, "label": "CubeReflectionMapping"},
    {"value": 302, "label": "CubeRefractionMapping"},
    {"value": 303, "label": "EquirectangularReflectionMapping"},
    {"value": 304, "label": "EquirectangularRefractionMapping"},
    {"value": 305, "label": "SphericalReflectionMapping"},
    {"value": 306, "label": "CubeUVReflectionMapping"},
    {"value": 307, "label": "CubeUVRefractionMapping"}]}],
  "Texture|minFilter": ["io-option", {"options": [
    {"value": 1003, "label": "NearestFilter"},
    {"value": 1004, "label": "NearestMipMapNearestFilter"},
    {"value": 1005, "label": "NearestMipMapLinearFilter"},
    {"value": 1006, "label": "LinearFilter"},
    {"value": 1007, "label": "LinearMipMapNearestFilter"},
    {"value": 1008, "label": "LinearMipMapLinearFilter"}]}],
  "Texture|magFilter": ["io-option", {"options": [
    {"value": 1003, "label": "NearestFilter"},
    {"value": 1004, "label": "NearestMipMapNearestFilter"},
    {"value": 1005, "label": "NearestMipMapLinearFilter"},
    {"value": 1006, "label": "LinearFilter"},
    {"value": 1007, "label": "LinearMipMapNearestFilter"},
    {"value": 1008, "label": "LinearMipMapLinearFilter"}]}],
  "Texture|wrapS": ["io-option", {"options": [
    {"value": 1000, "label": "RepeatWrapping"},
    {"value": 1001, "label": "ClampToEdgeWrapping"},
    {"value": 1002, "label": "MirroredRepeatWrapping"}]}],
  "Texture|wrapT": ["io-option", {"options": [
    {"value": 1000, "label": "RepeatWrapping"},
    {"value": 1001, "label": "ClampToEdgeWrapping"},
    {"value": 1002, "label": "MirroredRepeatWrapping"}]}],
  "Texture|encoding": ["io-option", {"options": [
    {"value": 3000, "label": "LinearEncoding"},
    {"value": 3001, "label": "sRGBEncoding"},
    {"value": 3007, "label": "GammaEncoding"},
    {"value": 3002, "label": "RGBEEncoding"},
    {"value": 3003, "label": "LogLuvEncoding"},
    {"value": 3004, "label": "RGBM7Encoding"},
    {"value": 3005, "label": "RGBM16Encoding"},
    {"value": 3006, "label": "RGBDEncoding"}]}],
  "Texture|type": ["io-option", {"options": [
    {"value": 1009, "label": "UnsignedByteType"},
    {"value": 1010, "label": "ByteType"},
    {"value": 1011, "label": "ShortType"},
    {"value": 1012, "label": "UnsignedShortType"},
    {"value": 1013, "label": "IntType"},
    {"value": 1014, "label": "UnsignedIntType"},
    {"value": 1015, "label": "FloatType"},
    {"value": 1016, "label": "HalfFloatType"},
    {"value": 1017, "label": "UnsignedShort4444Type"},
    {"value": 1018, "label": "UnsignedShort5551Type"},
    {"value": 1019, "label": "UnsignedShort565Type"},
    {"value": 1020, "label": "UnsignedInt248Type"}]}],
  "Texture|format": ["io-option", {"options": [
    {"value": 1021, "label": "AlphaFormat"},
    {"value": 1022, "label": "RGBFormat"},
    {"value": 1023, "label": "RGBAFormat"},
    {"value": 1024, "label": "LuminanceFormat"},
    {"value": 1025, "label": "LuminanceAlphaFormat"},
    {"value": 1023, "label": "RGBEFormat"},
    {"value": 1026, "label": "DepthFormat"},
    {"value": 1027, "label": "DepthStencilFormat"},
    {"value": 33776, "label": "RGB_S3TC_DXT1_Format"},
    {"value": 33777, "label": "RGBA_S3TC_DXT1_Format"},
    {"value": 33778, "label": "RGBA_S3TC_DXT3_Format"},
    {"value": 33779, "label": "RGBA_S3TC_DXT5_Format"},
    {"value": 35840, "label": "RGB_PVRTC_4BPPV1_Format"},
    {"value": 35841, "label": "RGB_PVRTC_2BPPV1_Format"},
    {"value": 35842, "label": "RGBA_PVRTC_4BPPV1_Format"},
    {"value": 35843, "label": "RGBA_PVRTC_2BPPV1_Format"},
    {"value": 36196, "label": "RGB_ETC1_Format"},
    {"value": 37808, "label": "RGBA_ASTC_4x4_Format"},
    {"value": 37809, "label": "RGBA_ASTC_5x4_Format"},
    {"value": 37810, "label": "RGBA_ASTC_5x5_Format"},
    {"value": 37811, "label": "RGBA_ASTC_6x5_Format"},
    {"value": 37812, "label": "RGBA_ASTC_6x6_Format"},
    {"value": 37813, "label": "RGBA_ASTC_8x5_Format"},
    {"value": 37814, "label": "RGBA_ASTC_8x6_Format"},
    {"value": 37815, "label": "RGBA_ASTC_8x8_Format"},
    {"value": 37816, "label": "RGBA_ASTC_10x5_Format"},
    {"value": 37817, "label": "RGBA_ASTC_10x6_Format"},
    {"value": 37818, "label": "RGBA_ASTC_10x8_Format"},
    {"value": 37819, "label": "RGBA_ASTC_10x10_Format"},
    {"value": 37820, "label": "RGBA_ASTC_12x10_Format"},
    {"value": 37821, "label": "RGBA_ASTC_12x12_Format"}]}],
  "Texture|unpackAlignment": ["io-option", {"options": [
    {"value": 1, "label": "1"},
    {"value": 2, "label": "2"},
    {"value": 4, "label": "4"},
    {"value": 8, "label": "8"}]}],
  // Object3D
  "Object3D|drawMode": ["io-option", {"options": [
    {"value": 0, "label": "TrianglesDrawMode"},
    {"value": 1, "label": "TriangleStripDrawMode"},
    {"value": 2, "label": "TriangleFanDrawMode"}]}],
  // Material
  "Material|reflectivity": ["io-slider", {"min": 0,"max": 1}],
  "Material|refractionRatio": ["io-slider", {"min": 0,"max": 1}],
  "Material|aoMapIntensity": ["io-slider", {"min": 0,"max": 1}],
  "Material|ightMapIntensity": ["io-slider", {"min": 0,"max": 1}],
  "Material|opacity": ["io-slider", {"min": 0,"max": 1}],
  "Material|blending": ["io-option", {"options": [
    {"value": 0, "label": "NoBlending"},
    {"value": 1, "label": "NormalBlending"},
    {"value": 2, "label": "AdditiveBlending"},
    {"value": 3, "label": "SubtractiveBlending"},
    {"value": 4, "label": "MultiplyBlending"},
    {"value": 5, "label": "CustomBlending"}]}],
  "Material|side": ["io-option", {"options": [
    {"value": 0, "label": "FrontSide"},
    {"value": 1, "label": "BackSide"},
    {"value": 2, "label": "DoubleSide"}]}],
  "Material|vertexColors": ["io-option", {"options": [
    {"value": 0, "label": "NoColors"},
    {"value": 1, "label": "FaceColors"},
    {"value": 2, "label": "VertexColors"}]}],
  "Material|depthFunc": ["io-option", {"options": [
    {"value": 0, "label": "NeverDepth"},
    {"value": 1, "label": "AlwaysDepth"},
    {"value": 2, "label": "LessDepth"},
    {"value": 3, "label": "LessEqualDepth"},
    {"value": 4, "label": "EqualDepth"},
    {"value": 5, "label": "GreaterEqualDepth"},
    {"value": 6, "label": "GreaterDepth"},
    {"value": 7, "label": "NotEqualDepth"}]}],
  "Material|combine": ["io-option", {"options": [
    {"value": 0, "label": "MultiplyOperation"},
    {"value": 1, "label": "MixOperation"},
    {"value": 2, "label": "AddOperation"}]}],
  "Material|blendEquation": ["io-option", {"options": [
    {"value": 100, "label": "AddEquation"},
    {"value": 101, "label": "SubtractEquation"},
    {"value": 102, "label": "ReverseSubtractEquation"},
    {"value": 103, "label": "MinEquation"},
    {"value": 104, "label": "MaxEquation"}]}],
  "Material|blendEquationAlpha": ["io-option", {"options": [
    {"value": 100, "label": "AddEquation"},
    {"value": 101, "label": "SubtractEquation"},
    {"value": 102, "label": "ReverseSubtractEquation"},
    {"value": 103, "label": "MinEquation"},
    {"value": 104, "label": "MaxEquation"}]}],
  "Material|blendSrc": ["io-option", {"options": [
    {"value": 200, "label": "ZeroFactor"},
    {"value": 201, "label": "OneFactor"},
    {"value": 202, "label": "SrcColorFactor"},
    {"value": 203, "label": "OneMinusSrcColorFactor"},
    {"value": 204, "label": "SrcAlphaFactor"},
    {"value": 205, "label": "OneMinusSrcAlphaFactor"},
    {"value": 206, "label": "DstAlphaFactor"},
    {"value": 207, "label": "OneMinusDstAlphaFactor"},
    {"value": 208, "label": "DstColorFactor"},
    {"value": 209, "label": "OneMinusDstColorFactor"},
    {"value": 210, "label": "SrcAlphaSaturateFactor"}]}],
  "Material|blendDst": ["io-option", {"options": [
    {"value": 200, "label": "ZeroFactor"},
    {"value": 201, "label": "OneFactor"},
    {"value": 202, "label": "SrcColorFactor"},
    {"value": 203, "label": "OneMinusSrcColorFactor"},
    {"value": 204, "label": "SrcAlphaFactor"},
    {"value": 205, "label": "OneMinusSrcAlphaFactor"},
    {"value": 206, "label": "DstAlphaFactor"},
    {"value": 207, "label": "OneMinusDstAlphaFactor"},
    {"value": 208, "label": "DstColorFactor"},
    {"value": 209, "label": "OneMinusDstColorFactor"},
    {"value": 210, "label": "SrcAlphaSaturateFactor"}]}],
  "Material|blendSrcAlpha": ["io-option", {"options": [
    {"value": 200, "label": "ZeroFactor"},
    {"value": 201, "label": "OneFactor"},
    {"value": 202, "label": "SrcColorFactor"},
    {"value": 203, "label": "OneMinusSrcColorFactor"},
    {"value": 204, "label": "SrcAlphaFactor"},
    {"value": 205, "label": "OneMinusSrcAlphaFactor"},
    {"value": 206, "label": "DstAlphaFactor"},
    {"value": 207, "label": "OneMinusDstAlphaFactor"},
    {"value": 208, "label": "DstColorFactor"},
    {"value": 209, "label": "OneMinusDstColorFactor"},
    {"value": 210, "label": "SrcAlphaSaturateFactor"}]}],
  "Material|blendDstAlpha": ["io-option", {"options": [
    {"value": 200, "label": "ZeroFactor"},
    {"value": 201, "label": "OneFactor"},
    {"value": 202, "label": "SrcColorFactor"},
    {"value": 203, "label": "OneMinusSrcColorFactor"},
    {"value": 204, "label": "SrcAlphaFactor"},
    {"value": 205, "label": "OneMinusSrcAlphaFactor"},
    {"value": 206, "label": "DstAlphaFactor"},
    {"value": 207, "label": "OneMinusDstAlphaFactor"},
    {"value": 208, "label": "DstColorFactor"},
    {"value": 209, "label": "OneMinusDstColorFactor"},
    {"value": 210, "label": "SrcAlphaSaturateFactor"}]}],
  "Material|shadowSide": ["io-option", {"options": [
    {"value": 0, "label": "BackSide"},
    {"value": 1, "label": "FrontSide"},
    {"value": 2, "label": "DoubleSide"}]}],
  "Material|shading": ["io-option", {"options": [
    {"value": 1, "label": "FlatShading"},
    {"value": 2, "label": "SmoothShading"}]}],
});

class ThreeColor extends IoProperties {
  static get style() {
    return html`<style>:host {display: flex;flex-direction: row;}:host > *:not(:last-child) {margin-right: 2px;}:host > three-color-hex {font-family: monospace;flex: 0 1 5.5em;}:host > io-number {flex: 1 1 auto;}</style>`;}static get properties() {return {hex: Number};}_onIoObjectMutated(event) {if (event.detail.object === this.value) {this.valueChanged();}}valueChanged() {this.hex = rgbToHex(this.value);}hexChanged() {const rgb = hexToRgb(this.hex);this.value.r = rgb.r;this.value.g = rgb.g;this.value.b = rgb.b;}changed() {this.template([['io-number', {value: this.value.r, 'on-value-set': this._onValueSet, id: 'r', step: 0.01, min: 0, max: 1, strict: false}],['io-number', {value: this.value.g, 'on-value-set': this._onValueSet, id: 'g', step: 0.01, min: 0, max: 1, strict: false}],['io-number', {value: this.value.b, 'on-value-set': this._onValueSet, id: 'b', step: 0.01, min: 0, max: 1, strict: false}],['three-color-hex', {value: this.bind('hex'), 'on-value-set': this._onValueSet, id: 'hex'}],]);}}ThreeColor.Register();class ThreeColorHex extends IoNumber {static get style() {return html`<style>:host::before {opacity: 0.5;content: '0x';}</style>`;
  }
  setFromText(text) {
    this.set('value', Math.floor(parseInt(text, 16)));
  }
  changed() {
    this.innerText = ( '000000' + this.value.toString( 16 ) ).slice( -6 );
    this.style.backgroundColor = '#' + this.innerText;
  }
}

ThreeColorHex.Register();

function rgbToHex(rgb) {
  return ((rgb.r * 255) << 16 ^ (rgb.g * 255) << 8 ^ (rgb.b * 255) << 0);
}

function hexToRgb(hex) {
  return {
    r: (hex >> 16 & 255) / 255,
    g: (hex >> 8 & 255) / 255,
    b: (hex & 255) / 255
  };
}

//TODO: test

class ThreeEuler extends IoProperties {
  static get style() {
    return html`<style>:host {display: flex;flex-direction: row;}:host > *:not(:last-child) {margin-right: 2px;}:host > io-number {flex: 1 0;}</style>`;
  }
  changed() {
    this.template([
      ['io-number', {id: 'x', value: this.value.x, 'on-value-set': this._onValueSet}],
      ['io-number', {id: 'y', value: this.value.y, 'on-value-set': this._onValueSet}],
      ['io-number', {id: 'z', value: this.value.z, 'on-value-set': this._onValueSet}],
      ['io-option', {id: 'order', value: this.value.order, options: ['XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX'], 'on-value-set': this._onValueSet}]
    ]);
  }
}

ThreeEuler.Register();

//TODO: test

const components = {
  x: {},
  y: {},
  z: {},
  w: {}
};

class ThreeVector extends IoProperties {
  static get style() {
    return html`<style>:host {display: flex;flex-direction: row;}:host > *:not(:last-child) {margin-right: 2px;}:host > io-number {flex: 1 0;}</style>`;
  }
  static get properties() {
    return {
      value: function() { return { x: 0, y: 0 }; },
      conversion: 1,
      step: 0.01,
      min: -Infinity,
      max: Infinity,
      strict: false,
      underslider: false,
      canlink: false,
      linked: false,
    };
  }
  _onValueSet(event) {
    const path = event.composedPath();
    if (path[0] === this) return;
    if (event.detail.object) return; // TODO: unhack
    event.stopPropagation();
    let key = path[0].id;
    if (key && typeof key === 'string') {
      if (this.value[key] !== event.detail.value) {
        this.value[key] = event.detail.value;
      }
      if (this.linked) {
        const change = event.detail.value / event.detail.oldValue;
        for (let key2 in components) {
          if (event.detail.oldValue === 0) {
            if (this.value[key2] !== undefined) {
              this.value[key2] = event.detail.value;
            }
          } else {
            if (this.value[key2] !== undefined && key2 !== key) {
              this.value[key2] *= change;
            }
          }
        }
      }

      let detail = Object.assign({object: this.value, key: this.linked ? '*' : key}, event.detail);
      this.dispatchEvent('object-mutated', detail, false, window);
      this.dispatchEvent('value-set', detail, true); // TODO
    }
  }
  changed() {
    const elements = [];
    for (let key in components) {
      if (this.value[key] !== undefined) {
        elements.push(['io-number', {
          id: key,
          value: this.value[key],
          conversion: this.conversion,
          step: this.step,
          min: this.min,
          max: this.max,
          strict: this.strict,
          underslider: this.underslider,
          'on-value-set': this._onValueSet
        }]);
      }
    }
    if (this.canlink) {
      elements.push(['io-boolean', {value: this.bind('linked'), true: '☑', false: '☐'}]);
    }
    this.template(elements);
  }
}

ThreeVector.Register();

class ThreeMatrix extends IoElement {
  static get style() {
    return html`<style>:host {display: block;}</style>`;
  }
  static get properties() {
    return {
      value: Object,
    };
  }
  changed() {
    this.template([
      ['io-collapsable', {
        label: 'elements',
        elements: [['io-array', {value: this.value.elements}]]
      }]
    ]);
  }
}

ThreeMatrix.Register();

export { ThreeColor, ThreeEuler, ThreeVector, ThreeMatrix };

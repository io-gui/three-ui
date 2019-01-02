import {IoInspector} from "../../../io/src/io.js";

import "./color.js";
import "./vector.js";
import "./euler.js";

export class ThreejsInspector extends IoInspector {
  static get config() {
    return {
      "Object": {
        "constructor:Vector2": ["io-vector"],
        "constructor:Vector3": ["io-vector"],
        "constructor:Vector4": ["io-vector"],
        "constructor:Quaternion": ["io-vector"],
        "constructor:Euler": ["io-euler"], // TODO: setter attributes
        "constructor:Color": ["io-color"],
        "intensity": ["io-slider", {"min": 0,"max": 1}],
        "constructor:Matrix2": ["io-matrix"],
        "constructor:Matrix3": ["io-matrix"],
        "constructor:Matrix4": ["io-matrix"],
      },
      "BufferGeometry": {
        "parameters": ["io-inspector"],
        // "attributes": ["io-object-props"],// TODO: figure out how to pass config
      },
      "WebGLRenderer": {
        "toneMapping": ["io-option", {"options": [{"value": 0, "label": "NoToneMapping"}, {"value": 1, "label": "LinearToneMapping"}, {"value": 2, "label": "ReinhardToneMapping"}, {"value": 3, "label": "Uncharted2ToneMapping"}, {"value": 4, "label": "CineonToneMapping"}]}]
      },
      "WebGLShadowMap": {
        "type": ["io-option", {"options": [{"value": 0, "label": "BasicShadowMap"}, {"value": 1, "label": "PCFShadowMap"}, {"value": 2, "label": "PCFSoftShadowMap"}]}]
      },
      "MeshDepthMaterial": {
        "depthPacking": ["io-option", {"options": [{"value": 3200, "label": "BasicDepthPacking"}, {"value": 3201, "label": "RGBADepthPacking"}]}]
      },
      "Texture": {
        "mapping": ["io-option", {"options": [{"value": 300, "label": "UVMapping"}, {"value": 301, "label": "CubeReflectionMapping"}, {"value": 302, "label": "CubeRefractionMapping"}, {"value": 303, "label": "EquirectangularReflectionMapping"}, {"value": 304, "label": "EquirectangularRefractionMapping"}, {"value": 305, "label": "SphericalReflectionMapping"}, {"value": 306, "label": "CubeUVReflectionMapping"}, {"value": 307, "label": "CubeUVRefractionMapping"}]}],
        "minFilter": ["io-option", {"options": [{"value": 1003, "label": "NearestFilter"}, {"value": 1004, "label": "NearestMipMapNearestFilter"}, {"value": 1005, "label": "NearestMipMapLinearFilter"}, {"value": 1006, "label": "LinearFilter"}, {"value": 1007, "label": "LinearMipMapNearestFilter"}, {"value": 1008, "label": "LinearMipMapLinearFilter"}]}],
        "magFilter": ["io-option", {"options": [{"value": 1003, "label": "NearestFilter"}, {"value": 1004, "label": "NearestMipMapNearestFilter"}, {"value": 1005, "label": "NearestMipMapLinearFilter"}, {"value": 1006, "label": "LinearFilter"}, {"value": 1007, "label": "LinearMipMapNearestFilter"}, {"value": 1008, "label": "LinearMipMapLinearFilter"}]}],
        "wrapS": ["io-option", {"options": [{"value": 1000, "label": "RepeatWrapping"}, {"value": 1001, "label": "ClampToEdgeWrapping"}, {"value": 1002, "label": "MirroredRepeatWrapping"}]}],
        "wrapT": ["io-option", {"options": [{"value": 1000, "label": "RepeatWrapping"}, {"value": 1001, "label": "ClampToEdgeWrapping"}, {"value": 1002, "label": "MirroredRepeatWrapping"}]}],
        "encoding": ["io-option", {"options": [{"value": 3000, "label": "LinearEncoding"}, {"value": 3001, "label": "sRGBEncoding"}, {"value": 3007, "label": "GammaEncoding"}, {"value": 3002, "label": "RGBEEncoding"}, {"value": 3003, "label": "LogLuvEncoding"}, {"value": 3004, "label": "RGBM7Encoding"}, {"value": 3005, "label": "RGBM16Encoding"}, {"value": 3006, "label": "RGBDEncoding"}]}],
        "type": ["io-option", {"options": [{"value": 1009, "label": "UnsignedByteType"}, {"value": 1010, "label": "ByteType"}, {"value": 1011, "label": "ShortType"}, {"value": 1012, "label": "UnsignedShortType"}, {"value": 1013, "label": "IntType"}, {"value": 1014, "label": "UnsignedIntType"}, {"value": 1015, "label": "FloatType"}, {"value": 1016, "label": "HalfFloatType"}, {"value": 1017, "label": "UnsignedShort4444Type"}, {"value": 1018, "label": "UnsignedShort5551Type"}, {"value": 1019, "label": "UnsignedShort565Type"}, {"value": 1020, "label": "UnsignedInt248Type"}]}],
        "format": ["io-option", {"options": [{"value": 1021, "label": "AlphaFormat"}, {"value": 1022, "label": "RGBFormat"}, {"value": 1023, "label": "RGBAFormat"}, {"value": 1024, "label": "LuminanceFormat"}, {"value": 1025, "label": "LuminanceAlphaFormat"}, {"value": 1023, "label": "RGBEFormat"}, {"value": 1026, "label": "DepthFormat"}, {"value": 1027, "label": "DepthStencilFormat"}, {"value": 33776, "label": "RGB_S3TC_DXT1_Format"}, {"value": 33777, "label": "RGBA_S3TC_DXT1_Format"}, {"value": 33778, "label": "RGBA_S3TC_DXT3_Format"}, {"value": 33779, "label": "RGBA_S3TC_DXT5_Format"}, {"value": 35840, "label": "RGB_PVRTC_4BPPV1_Format"}, {"value": 35841, "label": "RGB_PVRTC_2BPPV1_Format"}, {"value": 35842, "label": "RGBA_PVRTC_4BPPV1_Format"}, {"value": 35843, "label": "RGBA_PVRTC_2BPPV1_Format"}, {"value": 36196, "label": "RGB_ETC1_Format"}, {"value": 37808, "label": "RGBA_ASTC_4x4_Format"}, {"value": 37809, "label": "RGBA_ASTC_5x4_Format"}, {"value": 37810, "label": "RGBA_ASTC_5x5_Format"}, {"value": 37811, "label": "RGBA_ASTC_6x5_Format"}, {"value": 37812, "label": "RGBA_ASTC_6x6_Format"}, {"value": 37813, "label": "RGBA_ASTC_8x5_Format"}, {"value": 37814, "label": "RGBA_ASTC_8x6_Format"}, {"value": 37815, "label": "RGBA_ASTC_8x8_Format"}, {"value": 37816, "label": "RGBA_ASTC_10x5_Format"}, {"value": 37817, "label": "RGBA_ASTC_10x6_Format"}, {"value": 37818, "label": "RGBA_ASTC_10x8_Format"}, {"value": 37819, "label": "RGBA_ASTC_10x10_Format"}, {"value": 37820, "label": "RGBA_ASTC_12x10_Format"}, {"value": 37821, "label": "RGBA_ASTC_12x12_Format"}]}],
        "unpackAlignment": ["io-option", {"options": [{"value": 1, "label": "1"}, {"value": 2, "label": "2"}, {"value": 4, "label": "4"}, {"value": 8, "label": "8"}]}],
      },
      "Object3D": {
        "drawMode": ["io-option", {"options": [{"value": 0, "label": "TrianglesDrawMode"}, {"value": 1, "label": "TriangleStripDrawMode"}, {"value": 2, "label": "TriangleFanDrawMode"}]}],
      },
      "Material": {
        "reflectivity": ["io-slider", {"min": 0,"max": 1}],
        "refractionRatio": ["io-slider", {"min": 0,"max": 1}],
        "aoMapIntensity": ["io-slider", {"min": 0,"max": 1}],
        "lightMapIntensity": ["io-slider", {"min": 0,"max": 1}],
        "opacity": ["io-slider", {"min": 0,"max": 1}],

        // "map": ["io-inspector"],
        "blending": ["io-option", {"options": [{"value": 0, "label": "NoBlending"}, {"value": 1, "label": "NormalBlending"}, {"value": 2, "label": "AdditiveBlending"}, {"value": 3, "label": "SubtractiveBlending"}, {"value": 4, "label": "MultiplyBlending"}, {"value": 5, "label": "CustomBlending"}]}],
        "side": ["io-option", {"options": [{"value": 0, "label": "FrontSide"}, {"value": 1, "label": "BackSide"}, {"value": 2, "label": "DoubleSide"}]}],
        "vertexColors": ["io-option", {"options": [{"value": 0, "label": "NoColors"}, {"value": 1, "label": "FaceColors"}, {"value": 2, "label": "VertexColors"}]}],
        "depthFunc": ["io-option", {"options": [{"value": 0, "label": "NeverDepth"}, {"value": 1, "label": "AlwaysDepth"}, {"value": 2, "label": "LessDepth"}, {"value": 3, "label": "LessEqualDepth"}, {"value": 4, "label": "EqualDepth"}, {"value": 5, "label": "GreaterEqualDepth"}, {"value": 6, "label": "GreaterDepth"}, {"value": 7, "label": "NotEqualDepth"}]}],
        "combine": ["io-option", {"options": [{"value": 0, "label": "MultiplyOperation"}, {"value": 1, "label": "MixOperation"}, {"value": 2, "label": "AddOperation"}]}],
        "blendEquation": ["io-option", {"options": [{"value": 100, "label": "AddEquation"}, {"value": 101, "label": "SubtractEquation"}, {"value": 102, "label": "ReverseSubtractEquation"}, {"value": 103, "label": "MinEquation"}, {"value": 104, "label": "MaxEquation"}]}],
        "blendEquationAlpha": ["io-option", {"options": [{"value": 100, "label": "AddEquation"}, {"value": 101, "label": "SubtractEquation"}, {"value": 102, "label": "ReverseSubtractEquation"}, {"value": 103, "label": "MinEquation"}, {"value": 104, "label": "MaxEquation"}]}],
        "blendSrc": ["io-option", {"options": [{"value": 200, "label": "ZeroFactor"}, {"value": 201, "label": "OneFactor"}, {"value": 202, "label": "SrcColorFactor"}, {"value": 203, "label": "OneMinusSrcColorFactor"}, {"value": 204, "label": "SrcAlphaFactor"}, {"value": 205, "label": "OneMinusSrcAlphaFactor"}, {"value": 206, "label": "DstAlphaFactor"}, {"value": 207, "label": "OneMinusDstAlphaFactor"}, {"value": 208, "label": "DstColorFactor"}, {"value": 209, "label": "OneMinusDstColorFactor"}, {"value": 210, "label": "SrcAlphaSaturateFactor"}]}],
        "blendDst": ["io-option", {"options": [{"value": 200, "label": "ZeroFactor"}, {"value": 201, "label": "OneFactor"}, {"value": 202, "label": "SrcColorFactor"}, {"value": 203, "label": "OneMinusSrcColorFactor"}, {"value": 204, "label": "SrcAlphaFactor"}, {"value": 205, "label": "OneMinusSrcAlphaFactor"}, {"value": 206, "label": "DstAlphaFactor"}, {"value": 207, "label": "OneMinusDstAlphaFactor"}, {"value": 208, "label": "DstColorFactor"}, {"value": 209, "label": "OneMinusDstColorFactor"}, {"value": 210, "label": "SrcAlphaSaturateFactor"}]}],
        "blendSrcAlpha": ["io-option", {"options": [{"value": 200, "label": "ZeroFactor"}, {"value": 201, "label": "OneFactor"}, {"value": 202, "label": "SrcColorFactor"}, {"value": 203, "label": "OneMinusSrcColorFactor"}, {"value": 204, "label": "SrcAlphaFactor"}, {"value": 205, "label": "OneMinusSrcAlphaFactor"}, {"value": 206, "label": "DstAlphaFactor"}, {"value": 207, "label": "OneMinusDstAlphaFactor"}, {"value": 208, "label": "DstColorFactor"}, {"value": 209, "label": "OneMinusDstColorFactor"}, {"value": 210, "label": "SrcAlphaSaturateFactor"}]}],
        "blendDstAlpha": ["io-option", {"options": [{"value": 200, "label": "ZeroFactor"}, {"value": 201, "label": "OneFactor"}, {"value": 202, "label": "SrcColorFactor"}, {"value": 203, "label": "OneMinusSrcColorFactor"}, {"value": 204, "label": "SrcAlphaFactor"}, {"value": 205, "label": "OneMinusSrcAlphaFactor"}, {"value": 206, "label": "DstAlphaFactor"}, {"value": 207, "label": "OneMinusDstAlphaFactor"}, {"value": 208, "label": "DstColorFactor"}, {"value": 209, "label": "OneMinusDstColorFactor"}, {"value": 210, "label": "SrcAlphaSaturateFactor"}]}],
        "shadowSide": ["io-option", {"options": [{"value": 0, "label": "BackSide"}, {"value": 1, "label": "FrontSide"}, {"value": 2, "label": "DoubleSide"}]}],
        "shading": ["io-option", {"options": [{"value": 1, "label": "FlatShading"}, {"value": 2, "label": "SmoothShading"}]}],
      },
    };
  }
  static get groups() {
    return {
      "Object": {
        "main": ["name", "visible"],
        "transform": [/[M,m]atrix/],
        "rendering": [/[S,s]hadow/, /[R,r]ender/, /[D,d]raw/, /bounding/, "fog"],
        "hidden": ["type", /(is[A-Z])\w+/],
      },
      "Object3D": {
        "main": ["position", "rotation", "scale", "parent", "children", "target"],
        "transform": ["up", "quaternion"],
        "rendering": ["layers", "frustumCulled"],
      },
      "Mesh": {
        "main": ["geometry", "material"],
      },
      "BufferGeometry": {
        "main": ["parameters", "index", "attributes"]
      },
      "Texture": {
        "main": ["offset", "repeat", "center", "rotation"]
      },
      "Material": {
        "main": [
          "color", "specular", "shininess", "opacity", "wireframe", "map", "specularMap",
          "alphaMap", "envMap", "lightMap", "lightMapIntensity", "aoMap", "aoMapIntensity",
          "emissive", "emissiveMap", "emissiveIntensity", "bumpMap", "bumpScale",
          "normalMap", "normalScale", "displacementMap", "displacementScale",
          "displacementBias", "reflectivity", "refractionRatio",
        ],
        "rendering": [
          /(depth[A-Z])\w+/, /(blend.)\w+/, "transparent", "dithering", "flatShading", "lights", "vertexColors",
          "side", "blending", "colorWrite", "alphaTest", "combine",
          "premultipliedAlpha",
        ]
      },
      "Camera": {
        "main": ["near", "far", "zoom", "focus", "top", "bottom", "left", "right", "fov", "aspect", "filmGauge", "filmOffset"]
      },
      "Light": {
        "main": ["intensity", "color"]
      }
    };
  }
}

ThreejsInspector.Register();

import {IoInspector} from "../../lib/io.js";

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

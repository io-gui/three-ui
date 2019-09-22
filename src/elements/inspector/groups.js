export const groups = {
	'Object|main': [],
	'Object|hidden': [/^is/],
	'Array|elements': [/^[0-9]+$/],
	'Array|hidden': ['length'],

	'Object3D|main': [],
	'Object3D|transform': ['position', 'rotation', 'scale'],
	'Object3D|transform:advanced': ['up', 'quaternion'],
	'Object3D|rendering': ['castShadow', 'receiveShadow', 'background', 'fog', 'overrideMaterial', 'drawMode'],
	'Object3D|rendering:advanced': ['layers', 'renderOrder', 'frustumCulled'],
	'Object3D|matrices:advanced': [/matrix/i],

	'Object3D|hidden': ['name', 'parent', 'children', 'visible', 'material', 'geometry'],

	'Light|main': ['color', 'groundColor', 'intensity'],
	'Light|transform': ['target'],

	'Camera|main': ['fov'],
	'Camera|main:advanced': ['zoom', 'focus', 'aspect'],

	'BufferGeometry|main': ['boundingBox', 'boundingSphere', 'groups'],
	'BufferGeometry|attributes': ['index', 'attributes', 'morphAttributes', 'drawRange'],

	'Material|main': ['transparent', 'opacity', 'color', 'map', /Map/, /emissive/i, 'reflectivity', 'refractionRatio'],
	'Material|rendering': [
		'side', 'fog', 'lights', 'flatShading', 'vertexTangents',
		'vertexColors', 'toneMapped',
	],
	'Material|blending': [/blend/i, 'colorWrite', 'depthTest', 'depthWrite', 'dithering', 'premultipliedAlpha', 'alphaTest', 'depthFunc', 'combine'],
	'Material|stencil': [/stencil/i],
	'Material|shadows': [/shadow/i],
	'Material|wireframe': [/line/i, 'wireframe'],
};

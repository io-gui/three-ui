export const groups = {

	'Object3D|main': [],
	'Object3D|transform': ['position', 'rotation', 'scale'],
	'Object3D|rendering': ['frustumCulled', 'castShadow', 'receiveShadow'],

	'Scene|rendering': ['background', 'fog', 'overrideMaterial'],

	'Light|main': ['color', 'groundColor', 'intensity'],
	'Light|transform': ['target'],

	'Scene|main': ['autoUpdate'],

	'Camera|main': ['fov'],

	'BufferGeometry|main': ['boundingBox', 'boundingSphere'],
	'BufferGeometry|main:advanced': ['groups'],
	'BufferGeometry|attributes': ['index', 'attributes'],
	'BufferGeometry|attributes:advanced': ['morphAttributes', 'drawRange'],

	'BufferAttribute|main': ['array', 'itemSize', 'count', 'dynamic', 'normalized', 'updateRange'],

	'Material|main': ['transparent', 'opacity', 'color', 'map', /Map/, /emissive/i, 'reflectivity', 'refractionRatio'],
	'Material|rendering': ['side', 'fog', 'lights', 'flatShading', 'toneMapped', 'wireframe'],
	'Material|rendering:advanced': [/wireframeLine/, 'vertexTangents', 'vertexColors'],
	'Material|blending': [/blend/i, 'colorWrite', 'depthTest', 'depthWrite', 'dithering', 'premultipliedAlpha', 'alphaTest', 'depthFunc', 'combine'],
	'Material|shadows': [/shadow/i],
	'Material|stencil:advanced': [/stencil/i],

	'Camera|main:advanced': ['zoom', 'focus', 'aspect', 'filmGauge', 'filmOffset', 'view', 'near', 'far'],
	'Object3D|main:advanced': ['geometry', 'material', 'visible', 'parent', 'children'],
	'Object3D|transform:advanced': ['up', 'quaternion'],
	'Object3D|matrices:advanced': [/matrix/i],
	'Object3D|rendering:advanced': ['layers', 'renderOrder', 'drawMode'],

	'Object|main': [],
	'Object|main:advanced': ['name', 'id', 'uuid', 'userData', 'type'],
	'Object|hidden': [/^is/],

	'Array|elements': [/^[0-9]+$/],
	'Array|hidden': ['length'],
};

export const groups = {
	'Object|properties': ['name', 'visible', 'userData', 'map'],

	'Object3D|properties': ['name', 'parent', 'children', 'material', 'geometry'],
	'Object3D|transform': ['position', 'rotation', 'scale', 'quaternion', 'up', /update/i],
	'Object3D|rendering': ['layers', /shadow/i, 'renderOrder', 'frustumCulled', 'background', 'fog', 'overrideMaterial', 'drawMode'],
	'Object3D|matrices': [/matrix/i],

	'Light|properties': ['color', 'groundColor', 'intensity'],
	'Light|transform': ['target'],

	'Camera|properties': ['fov', 'near', 'far', 'zoom', 'focus', 'aspect', 'view', 'filmGauge', 'filmOffset'],

	'BufferGeometry|properties': ['boundingBox', 'boundingSphere', 'groups'],
	'BufferGeometry|attributes': ['index', 'attributes', 'morphAttributes', 'drawRange'],

	'Material|properties': ['transparent', 'opacity', 'color', /Map/, /emissive/i, 'reflectivity', 'refractionRatio'],
	'Material|rendering': [
		'side', 'fog', 'lights', 'flatShading', 'vertexTangents',
		'vertexColors', 'toneMapped',
	],
	'Material|blending': [/blend/i, 'colorWrite', 'depthTest', 'depthWrite', 'dithering', 'premultipliedAlpha', 'alphaTest', 'depthFunc', 'combine'],
	'Material|stencil': [/stencil/i],
	'Material|shadows': [/shadow/i],
	'Material|wireframe': [/line/i, 'wireframe'],
	'Material|advanced': [/polygon/i, 'precision', 'program', 'skinning', 'morphTargets', 'morphNormals', 'clipIntersection', 'clippingPlanes'],

	'Object|advanced': ['needsUpdate'],
	'Object|hidden': [/^is/, 'type', 'id', 'uuid'],

	'Array|values': [/^[0-9]+$/],
	// TODO
};

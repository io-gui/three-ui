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

	'Light|main': ['color', 'groundColor', 'intensity'],
	'Light|transform': ['target'],

'Camera|main': ['fov'],
'Camera|main:advanced': ['zoom', 'focus', 'aspect', 'filmGauge', 'filmOffset', 'view'],
'Camera|hidden': ['castShadow', 'receiveShadow'],

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

};

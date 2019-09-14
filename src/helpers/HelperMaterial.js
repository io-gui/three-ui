import {IoNodeMixin} from "../../../io/build/io.js";
import {UniformsUtils, Vector3, Color, FrontSide, ShaderMaterial,
	DataTexture, RGBAFormat, FloatType, NearestFilter} from "../../../three.js/build/three.module.js";

export class HelperMaterial extends IoNodeMixin(ShaderMaterial) {
	static get Properties() {
		return {
			depthTest: true,
			depthWrite: true,
			transparent: false,
			side: FrontSide,
			color: Color,
			opacity: 1,
			depthBias: 0,
			highlight: 0,
			resolution: Vector3,
		};
	}
	constructor(props = {}) {
		super(props);

		const data = new Float32Array([
			1.0 / 17.0, 0,0,0, 9.0 / 17.0, 0,0,0, 3.0 / 17.0, 0,0,0, 11.0 / 17.0, 0,0,0,
			13.0 / 17.0, 0,0,0, 5.0 / 17.0, 0,0,0, 15.0 / 17.0, 0,0,0, 7.0 / 17.0, 0,0,0,
			4.0 / 17.0, 0,0,0, 12.0 / 17.0, 0,0,0, 2.0 / 17.0, 0,0,0, 10.0 / 17.0, 0,0,0,
			16.0 / 17.0, 0,0,0, 8.0 / 17.0, 0,0,0, 14.0 / 17.0, 0,0,0, 6.0 / 17.0, 0,0,0,
		]);
		const texture = new DataTexture( data, 4, 4, RGBAFormat, FloatType );
		texture.magFilter = NearestFilter;
		texture.minFilter = NearestFilter;

		let color = props.color || new Color(0xffffff);
		let opacity = props.opacity !== undefined ? props.opacity : 1;

		this.color.copy(color);
		this.opacity = opacity;
		this.depthBias = props.depthBias || 0;
		this.highlight = props.highlight || 0;
		this.resolution.set(window.innerWidth, window.innerHeight, window.devicePixelRatio);

		this.uniforms = UniformsUtils.merge([this.uniforms, {
			"uColor":	{value: this.color},
			"uOpacity":	{value: this.opacity},
			"uDepthBias":	{value: this.depthBias},
			"uHighlight":	{value: this.highlight},
			"uResolution":	{value: this.resolution},
			"tDitherMatrix":	{value: texture},
		}]);

		this.uniforms.tDitherMatrix.value = texture;
		texture.needsUpdate = true;

		this.vertexShader = `

			attribute vec4 color;
			attribute float outline;

			varying vec4 vColor;
			varying float isOutline;

			uniform vec3 uResolution;
			uniform float uDepthBias;
			uniform float uHighlight;

			void main() {
				float aspect = projectionMatrix[0][0] / projectionMatrix[1][1];

				vColor = color;
				isOutline = outline;

				vec3 nor = normalMatrix * normal;
				vec4 pos = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				nor = normalize(nor.xyz * vec3(1., 1., 0.));

				pos.z -= uDepthBias * 0.1;
				pos.z -= uHighlight;

				pos.xyz /= pos.w;

				float extrude = 0.0;
				if (outline > 0.0) {
					extrude = outline;
					pos.z += 0.000001;
					pos.z = max(-0.99, pos.z);
				} else {
					extrude -= outline;
					pos.z = max(-1.0, pos.z);
				}

				float dx = nor.x * extrude * 2.0;
				float dy = nor.y * extrude * 2.0;

				pos.x += dx * (uResolution.z / uResolution.x);
				pos.y += dy * (uResolution.z / uResolution.y);

				pos.xyz *= pos.w;

				gl_Position = pos;
			}
		`;
		this.fragmentShader = `
			uniform vec3 uColor;
			uniform float uOpacity;
			uniform float uHighlight;
			uniform sampler2D tDitherMatrix;

			varying vec4 vColor;
			varying float isOutline;

			void main() {

				float opacity = 1.0;
				vec3 color = vColor.rgb;

				if (isOutline > 0.0) {
					color = mix(color * vec3(0.25), vec3(0.0), max(0.0, uHighlight) );
					color = mix(color, vColor.rgb, max(0.0, -uHighlight) );
				}

				float dimming = mix(1.0, 0.0, max(0.0, -uHighlight));
				dimming = mix(dimming, 2.0, max(0.0, uHighlight));
				opacity = vColor.a * dimming;

				color = mix(vec3(0.5), saturate(color), dimming);

				gl_FragColor = vec4(color, uOpacity);

				opacity = opacity - mod(opacity, 0.25) + 0.25;

				vec2 matCoord = ( mod(gl_FragCoord.xy, 4.0) - vec2(0.5) ) / 4.0;
				vec4 ditherPattern = texture2D( tDitherMatrix, matCoord.xy );
				if (opacity < ditherPattern.r) discard;
			}
		`;
	}
	changed() {
		if (this.uniforms) {
			this.uniforms.uColor.value = this.color;
			this.uniforms.uOpacity.value = this.opacity;
			this.uniforms.uDepthBias.value = this.depthBias;
			this.uniforms.uHighlight.value = this.highlight;
			this.uniforms.uResolution.value = this.resolution;
			this.uniformsNeedUpdate = true;
		}
	}
}

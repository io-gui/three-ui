import { IoProperties, html, IoNumber, IoCore, IoElement, IoInspector, IoCollapsable } from '../../io/build/io.js';
import { Scene, PerspectiveCamera, Vector3, OrthographicCamera, HemisphereLight, Clock, WebGLRenderer, DefaultLoadingManager, LoaderUtils, FileLoader, Color, DirectionalLight, PointLight, SpotLight, MeshBasicMaterial, ShaderMaterial, ShaderLib, UniformsUtils, Interpolant, Matrix3, Matrix4, Vector2, Texture, NearestFilter, LinearFilter, NearestMipMapNearestFilter, LinearMipMapNearestFilter, NearestMipMapLinearFilter, LinearMipMapLinearFilter, ClampToEdgeWrapping, MirroredRepeatWrapping, RepeatWrapping, FrontSide, InterpolateSmooth, InterpolateLinear, InterpolateDiscrete, RGBAFormat, RGBFormat, MeshStandardMaterial, Object3D, Material, BufferGeometry, Mesh, BufferAttribute, TextureLoader, AnimationClip, InterleavedBufferAttribute, InterleavedBuffer, Loader, DoubleSide, sRGBEncoding, Group, SkinnedMesh, TriangleStripDrawMode, TriangleFanDrawMode, LineSegments, Line, LineLoop, Points, PointsMaterial, LineBasicMaterial, VertexColors, Math as Math$1, NumberKeyframeTrack, QuaternionKeyframeTrack, VectorKeyframeTrack, AnimationUtils, Bone, PropertyBinding, Skeleton, Box3, Spherical, Sphere, Raycaster, Quaternion, MOUSE, CylinderBufferGeometry, Euler, Float32BufferAttribute, Uint16BufferAttribute, TrianglesDrawMode, Int8BufferAttribute, Int16BufferAttribute, Int32BufferAttribute, Uint8BufferAttribute, Uint32BufferAttribute, DataTexture, FloatType, Sprite } from '../../three.js/build/three.module.js';

class ThreeAttributes extends IoProperties {
  // static get listeners() {
  //   return {
  //     'object-mutated': 'onObjectMutated'
  //   }
  // }
  // onObjectMutated(event) {
  //   const obj = event.detail.object;
  //   for (let i = this.crumbs.length; i--;) {
  //     if ((obj instanceof Uint16Array || obj instanceof Float32Array) && this.crumbs[i].isBufferAttribute) {
  //       this.crumbs[i].needsUpdate = true;
  //     }
  //   }
  //   if (event.detail.object.isCamera) {
  //     event.detail.object.updateProjectionMatrix();
  //   }
  // }
  valueChanged() {
    const config = this._config;
    const elements = [];
    for (let c in config) {
      if (this.value[c]) {
        const tag = config[c][0];
        const protoConfig = config[c][1];
        const label = config[c].label || c;
        const itemConfig = {className: 'io-property-editor', title: label, id: c, value: this.value[c], 'on-value-set': this._onValueSet};
        elements.push(
          ['div', {className: 'io-property'}, [
            this.labeled ? ['span', {className: 'io-property-label', title: label}, label + ':'] : null,
            [tag, Object.assign(itemConfig, protoConfig)]
          ]]);
      }
    }
    this.template(elements);
  }
}

ThreeAttributes.Register();

ThreeAttributes.RegisterConfig({});

class ThreeColor extends IoProperties {
  static get style() {
    return html`<style>
    :host {
      display: flex;
      flex-direction: row;
    }
    :host > *:not(:last-child) {
      margin-right: 2px;
    }
    :host > three-color-hex {
      font-family: monospace;
      flex: 0 1 4.9em;
    }
    :host > io-number {
      flex: 1 1 calc(100% / 3 - 4.9em);
    }
    </style>`;
  }
  static get properties() {
    return {
      hex: Number
    };
  }
  hexChanged() {
    const rgb = hexToRgb(this.hex);
    this.value.r = rgb.r;
    this.value.g = rgb.g;
    this.value.b = rgb.b;
  }
  valueChanged() {
    this.hex = rgbToHex(this.value);
    this.template([
      ['io-number', {value: this.value.r, 'on-value-set': this._onValueSet, id: 'r', step: 0.01, min: 0, max: 1, strict: false}],
      ['io-number', {value: this.value.g, 'on-value-set': this._onValueSet, id: 'g', step: 0.01, min: 0, max: 1, strict: false}],
      ['io-number', {value: this.value.b, 'on-value-set': this._onValueSet, id: 'b', step: 0.01, min: 0, max: 1, strict: false}],
      ['three-color-hex', {value: this.bind('hex'), 'on-value-set': this._onValueSet, id: 'hex'}],
    ]);
  }
}

ThreeColor.Register();

class ThreeColorHex extends IoNumber {
  static get style() {
    return html`<style>
      :host::before {
        opacity: 0.5;
        content: '0x';
      }
    </style>`;
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

// Copyright 2016 The Draco Authors.

function DRACOLoader (manager) {
    this.timeLoaded = 0;
    this.manager = manager || DefaultLoadingManager;
    this.materials = null;
    this.verbosity = 0;
    this.attributeOptions = {};
    this.drawMode = TrianglesDrawMode;
    // Native Draco attribute type to Three.JS attribute type.
    this.nativeAttributeMap = {
      'position' : 'POSITION',
      'normal' : 'NORMAL',
      'color' : 'COLOR',
      'uv' : 'TEX_COORD'
    };
}
DRACOLoader.prototype = {

    constructor: DRACOLoader,

    load: function(url, onLoad, onProgress, onError) {
        var scope = this;
        var loader = new FileLoader(scope.manager);
        loader.setPath(this.path);
        loader.setResponseType('arraybuffer');
        loader.load(url, function(blob) {
            scope.decodeDracoFile(blob, onLoad);
        }, onProgress, onError);
    },

    setPath: function(value) {
        this.path = value;
        return this;
    },

    setVerbosity: function(level) {
        this.verbosity = level;
        return this;
    },

    /**
     *  Sets desired mode for generated geometry indices.
     *  Can be either:
     *      THREE.TrianglesDrawMode
     *      THREE.TriangleStripDrawMode
     */
    setDrawMode: function(drawMode) {
        this.drawMode = drawMode;
        return this;
    },

    /**
     * Skips dequantization for a specific attribute.
     * |attributeName| is the THREE.js name of the given attribute type.
     * The only currently supported |attributeName| is 'position', more may be
     * added in future.
     */
    setSkipDequantization: function(attributeName, skip) {
        var skipDequantization = true;
        if (typeof skip !== 'undefined')
          skipDequantization = skip;
        this.getAttributeOptions(attributeName).skipDequantization =
            skipDequantization;
        return this;
    },

    /**
     * Decompresses a Draco buffer. Names of attributes (for ID and type maps)
     * must be one of the supported three.js types, including: position, color,
     * normal, uv, uv2, skinIndex, skinWeight.
     *
     * @param {ArrayBuffer} rawBuffer
     * @param {Function} callback
     * @param {Object|undefined} attributeUniqueIdMap Provides a pre-defined ID
     *     for each attribute in the geometry to be decoded. If given,
     *     `attributeTypeMap` is required and `nativeAttributeMap` will be
     *     ignored.
     * @param {Object|undefined} attributeTypeMap Provides a predefined data
     *     type (as a typed array constructor) for each attribute in the
     *     geometry to be decoded.
     */
    decodeDracoFile: function(rawBuffer, callback, attributeUniqueIdMap,
                              attributeTypeMap) {
      var scope = this;
      DRACOLoader.getDecoderModule()
          .then( function ( module ) {
            scope.decodeDracoFileInternal( rawBuffer, module.decoder, callback,
              attributeUniqueIdMap, attributeTypeMap);
          });
    },

    decodeDracoFileInternal: function(rawBuffer, dracoDecoder, callback,
                                      attributeUniqueIdMap, attributeTypeMap) {
      /*
       * Here is how to use Draco Javascript decoder and get the geometry.
       */
      var buffer = new dracoDecoder.DecoderBuffer();
      buffer.Init(new Int8Array(rawBuffer), rawBuffer.byteLength);
      var decoder = new dracoDecoder.Decoder();

      /*
       * Determine what type is this file: mesh or point cloud.
       */
      var geometryType = decoder.GetEncodedGeometryType(buffer);
      if (geometryType == dracoDecoder.TRIANGULAR_MESH) {
        if (this.verbosity > 0) {
          console.log('Loaded a mesh.');
        }
      } else if (geometryType == dracoDecoder.POINT_CLOUD) {
        if (this.verbosity > 0) {
          console.log('Loaded a point cloud.');
        }
      } else {
        var errorMsg = 'THREE.DRACOLoader: Unknown geometry type.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      callback(this.convertDracoGeometryTo3JS(dracoDecoder, decoder,
          geometryType, buffer, attributeUniqueIdMap, attributeTypeMap));
    },

    addAttributeToGeometry: function(dracoDecoder, decoder, dracoGeometry,
                                     attributeName, attributeType, attribute,
                                     geometry, geometryBuffer) {
      if (attribute.ptr === 0) {
        var errorMsg = 'THREE.DRACOLoader: No attribute ' + attributeName;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      var numComponents = attribute.num_components();
      var numPoints = dracoGeometry.num_points();
      var numValues = numPoints * numComponents;
      var attributeData;
      var TypedBufferAttribute;

      switch ( attributeType ) {

        case Float32Array:
          attributeData = new dracoDecoder.DracoFloat32Array();
          decoder.GetAttributeFloatForAllPoints(
            dracoGeometry, attribute, attributeData);
          geometryBuffer[ attributeName ] = new Float32Array( numValues );
          TypedBufferAttribute = Float32BufferAttribute;
          break;

        case Int8Array:
          attributeData = new dracoDecoder.DracoInt8Array();
          decoder.GetAttributeInt8ForAllPoints(
            dracoGeometry, attribute, attributeData );
          geometryBuffer[ attributeName ] = new Int8Array( numValues );
          TypedBufferAttribute = Int8BufferAttribute;
          break;

        case Int16Array:
          attributeData = new dracoDecoder.DracoInt16Array();
          decoder.GetAttributeInt16ForAllPoints(
            dracoGeometry, attribute, attributeData);
          geometryBuffer[ attributeName ] = new Int16Array( numValues );
          TypedBufferAttribute = Int16BufferAttribute;
          break;

        case Int32Array:
          attributeData = new dracoDecoder.DracoInt32Array();
          decoder.GetAttributeInt32ForAllPoints(
            dracoGeometry, attribute, attributeData);
          geometryBuffer[ attributeName ] = new Int32Array( numValues );
          TypedBufferAttribute = Int32BufferAttribute;
          break;

        case Uint8Array:
          attributeData = new dracoDecoder.DracoUInt8Array();
          decoder.GetAttributeUInt8ForAllPoints(
            dracoGeometry, attribute, attributeData);
          geometryBuffer[ attributeName ] = new Uint8Array( numValues );
          TypedBufferAttribute = Uint8BufferAttribute;
          break;

        case Uint16Array:
          attributeData = new dracoDecoder.DracoUInt16Array();
          decoder.GetAttributeUInt16ForAllPoints(
            dracoGeometry, attribute, attributeData);
          geometryBuffer[ attributeName ] = new Uint16Array( numValues );
          TypedBufferAttribute = Uint16BufferAttribute;
          break;

        case Uint32Array:
          attributeData = new dracoDecoder.DracoUInt32Array();
          decoder.GetAttributeUInt32ForAllPoints(
            dracoGeometry, attribute, attributeData);
          geometryBuffer[ attributeName ] = new Uint32Array( numValues );
          TypedBufferAttribute = Uint32BufferAttribute;
          break;

        default:
          var errorMsg = 'THREE.DRACOLoader: Unexpected attribute type.';
          console.error( errorMsg );
          throw new Error( errorMsg );

      }

      // Copy data from decoder.
      for (var i = 0; i < numValues; i++) {
        geometryBuffer[attributeName][i] = attributeData.GetValue(i);
      }
      // Add attribute to THREEJS geometry for rendering.
      geometry.addAttribute(attributeName,
          new TypedBufferAttribute(geometryBuffer[attributeName],
            numComponents));
      dracoDecoder.destroy(attributeData);
    },

    convertDracoGeometryTo3JS: function(dracoDecoder, decoder, geometryType,
                                        buffer, attributeUniqueIdMap,
                                        attributeTypeMap) {
        // TODO: Should not assume native Draco attribute IDs apply.
        if (this.getAttributeOptions('position').skipDequantization === true) {
          decoder.SkipAttributeTransform(dracoDecoder.POSITION);
        }
        var dracoGeometry;
        var decodingStatus;
        var start_time = performance.now();
        if (geometryType === dracoDecoder.TRIANGULAR_MESH) {
          dracoGeometry = new dracoDecoder.Mesh();
          decodingStatus = decoder.DecodeBufferToMesh(buffer, dracoGeometry);
        } else {
          dracoGeometry = new dracoDecoder.PointCloud();
          decodingStatus =
              decoder.DecodeBufferToPointCloud(buffer, dracoGeometry);
        }
        if (!decodingStatus.ok() || dracoGeometry.ptr == 0) {
          var errorMsg = 'THREE.DRACOLoader: Decoding failed: ';
          errorMsg += decodingStatus.error_msg();
          console.error(errorMsg);
          dracoDecoder.destroy(decoder);
          dracoDecoder.destroy(dracoGeometry);
          throw new Error(errorMsg);
        }

        var decode_end = performance.now();
        dracoDecoder.destroy(buffer);
        /*
         * Example on how to retrieve mesh and attributes.
         */
        var numFaces;
        if (geometryType == dracoDecoder.TRIANGULAR_MESH) {
          numFaces = dracoGeometry.num_faces();
          if (this.verbosity > 0) {
            console.log('Number of faces loaded: ' + numFaces.toString());
          }
        } else {
          numFaces = 0;
        }

        var numPoints = dracoGeometry.num_points();
        var numAttributes = dracoGeometry.num_attributes();
        if (this.verbosity > 0) {
          console.log('Number of points loaded: ' + numPoints.toString());
          console.log('Number of attributes loaded: ' +
              numAttributes.toString());
        }

        // Verify if there is position attribute.
        // TODO: Should not assume native Draco attribute IDs apply.
        var posAttId = decoder.GetAttributeId(dracoGeometry,
                                              dracoDecoder.POSITION);
        if (posAttId == -1) {
          var errorMsg = 'THREE.DRACOLoader: No position attribute found.';
          console.error(errorMsg);
          dracoDecoder.destroy(decoder);
          dracoDecoder.destroy(dracoGeometry);
          throw new Error(errorMsg);
        }
        var posAttribute = decoder.GetAttribute(dracoGeometry, posAttId);

        // Structure for converting to THREEJS geometry later.
        var geometryBuffer = {};
        // Import data to Three JS geometry.
        var geometry = new BufferGeometry();

        // Do not use both the native attribute map and a provided (e.g. glTF) map.
        if ( attributeUniqueIdMap ) {

          // Add attributes of user specified unique id. E.g. GLTF models.
          for (var attributeName in attributeUniqueIdMap) {
            var attributeType = attributeTypeMap[attributeName];
            var attributeId = attributeUniqueIdMap[attributeName];
            var attribute = decoder.GetAttributeByUniqueId(dracoGeometry,
                                                           attributeId);
            this.addAttributeToGeometry(dracoDecoder, decoder, dracoGeometry,
                attributeName, attributeType, attribute, geometry, geometryBuffer);
          }

        } else {

          // Add native Draco attribute type to geometry.
          for (var attributeName in this.nativeAttributeMap) {
            var attId = decoder.GetAttributeId(dracoGeometry,
                dracoDecoder[this.nativeAttributeMap[attributeName]]);
            if (attId !== -1) {
              if (this.verbosity > 0) {
                console.log('Loaded ' + attributeName + ' attribute.');
              }
              var attribute = decoder.GetAttribute(dracoGeometry, attId);
              this.addAttributeToGeometry(dracoDecoder, decoder, dracoGeometry,
                  attributeName, Float32Array, attribute, geometry, geometryBuffer);
            }
          }

        }

        // For mesh, we need to generate the faces.
        if (geometryType == dracoDecoder.TRIANGULAR_MESH) {
          if (this.drawMode === TriangleStripDrawMode) {
            var stripsArray = new dracoDecoder.DracoInt32Array();
            var numStrips = decoder.GetTriangleStripsFromMesh(
                dracoGeometry, stripsArray);
            geometryBuffer.indices = new Uint32Array(stripsArray.size());
            for (var i = 0; i < stripsArray.size(); ++i) {
              geometryBuffer.indices[i] = stripsArray.GetValue(i);
            }
            dracoDecoder.destroy(stripsArray);
          } else {
            var numIndices = numFaces * 3;
            geometryBuffer.indices = new Uint32Array(numIndices);
            var ia = new dracoDecoder.DracoInt32Array();
            for (var i = 0; i < numFaces; ++i) {
              decoder.GetFaceFromMesh(dracoGeometry, i, ia);
              var index = i * 3;
              geometryBuffer.indices[index] = ia.GetValue(0);
              geometryBuffer.indices[index + 1] = ia.GetValue(1);
              geometryBuffer.indices[index + 2] = ia.GetValue(2);
            }
            dracoDecoder.destroy(ia);
         }
        }

        geometry.drawMode = this.drawMode;
        if (geometryType == dracoDecoder.TRIANGULAR_MESH) {
          geometry.setIndex(new(geometryBuffer.indices.length > 65535 ?
                Uint32BufferAttribute : Uint16BufferAttribute)
              (geometryBuffer.indices, 1));
        }

        // TODO: Should not assume native Draco attribute IDs apply.
        // TODO: Can other attribute types be quantized?
        var posTransform = new dracoDecoder.AttributeQuantizationTransform();
        if (posTransform.InitFromAttribute(posAttribute)) {
          // Quantized attribute. Store the quantization parameters into the
          // THREE.js attribute.
          geometry.attributes['position'].isQuantized = true;
          geometry.attributes['position'].maxRange = posTransform.range();
          geometry.attributes['position'].numQuantizationBits =
              posTransform.quantization_bits();
          geometry.attributes['position'].minValues = new Float32Array(3);
          for (var i = 0; i < 3; ++i) {
            geometry.attributes['position'].minValues[i] =
                posTransform.min_value(i);
          }
        }
        dracoDecoder.destroy(posTransform);
        dracoDecoder.destroy(decoder);
        dracoDecoder.destroy(dracoGeometry);

        this.decode_time = decode_end - start_time;
        this.import_time = performance.now() - decode_end;

        if (this.verbosity > 0) {
          console.log('Decode time: ' + this.decode_time);
          console.log('Import time: ' + this.import_time);
        }
        return geometry;
    },

    isVersionSupported: function(version, callback) {
        DRACOLoader.getDecoderModule()
            .then( function ( module ) {
              callback( module.decoder.isVersionSupported( version ) );
            });
    },

    getAttributeOptions: function(attributeName) {
        if (typeof this.attributeOptions[attributeName] === 'undefined')
          this.attributeOptions[attributeName] = {};
        return this.attributeOptions[attributeName];
    }
};

DRACOLoader.decoderPath = './';
DRACOLoader.decoderConfig = {};
DRACOLoader.decoderModulePromise = null;

/**
 * Sets the base path for decoder source files.
 * @param {string} path
 */
DRACOLoader.setDecoderPath = function ( path ) {
  DRACOLoader.decoderPath = path;
};

/**
 * Sets decoder configuration and releases singleton decoder module. Module
 * will be recreated with the next decoding call.
 * @param {Object} config
 */
DRACOLoader.setDecoderConfig = function ( config ) {
  var wasmBinary = DRACOLoader.decoderConfig.wasmBinary;
  DRACOLoader.decoderConfig = config || {};
  DRACOLoader.releaseDecoderModule();

  // Reuse WASM binary.
  if ( wasmBinary ) DRACOLoader.decoderConfig.wasmBinary = wasmBinary;
};

/**
 * Releases the singleton DracoDecoderModule instance. Module will be recreated
 * with the next decoding call.
 */
DRACOLoader.releaseDecoderModule = function () {
  DRACOLoader.decoderModulePromise = null;
};

/**
 * Gets WebAssembly or asm.js singleton instance of DracoDecoderModule
 * after testing for browser support. Returns Promise that resolves when
 * module is available.
 * @return {Promise<{decoder: DracoDecoderModule}>}
 */
DRACOLoader.getDecoderModule = function () {
  var scope = this;
  var path = DRACOLoader.decoderPath;
  var config = DRACOLoader.decoderConfig;
  var promise = DRACOLoader.decoderModulePromise;

  if ( promise ) return promise;

  // Load source files.
  if ( typeof DracoDecoderModule !== 'undefined' ) {
    // Loaded externally.
    promise = Promise.resolve();
  } else if ( typeof WebAssembly !== 'object' || config.type === 'js' ) {
    // Load with asm.js.
    promise = DRACOLoader._loadScript( path + 'draco_decoder.js' );
  } else {
    // Load with WebAssembly.
    config.wasmBinaryFile = path + 'draco_decoder.wasm';
    promise = DRACOLoader._loadScript( path + 'draco_wasm_wrapper.js' )
        .then( function () {
          return DRACOLoader._loadArrayBuffer( config.wasmBinaryFile );
        } )
        .then( function ( wasmBinary ) {
          config.wasmBinary = wasmBinary;
        } );
  }

  // Wait for source files, then create and return a decoder.
  promise = promise.then( function () {
    return new Promise( function ( resolve ) {
      config.onModuleLoaded = function ( decoder ) {
        scope.timeLoaded = performance.now();
        // Module is Promise-like. Wrap before resolving to avoid loop.
        resolve( { decoder: decoder } );
      };
      DracoDecoderModule( config );
    } );
  } );

  DRACOLoader.decoderModulePromise = promise;
  return promise;
};

/**
 * @param {string} src
 * @return {Promise}
 */
DRACOLoader._loadScript = function ( src ) {
  var prevScript = document.getElementById( 'decoder_script' );
  if ( prevScript !== null ) {
    prevScript.parentNode.removeChild( prevScript );
  }
  var head = document.getElementsByTagName( 'head' )[ 0 ];
  var script = document.createElement( 'script' );
  script.id = 'decoder_script';
  script.type = 'text/javascript';
  script.src = src;
  return new Promise( function ( resolve ) {
    script.onload = resolve;
    head.appendChild( script );
  });
};

/**
 * @param {string} src
 * @return {Promise}
 */
DRACOLoader._loadArrayBuffer = function ( src ) {
  var loader = new FileLoader();
  loader.setResponseType( 'arraybuffer' );
  return new Promise( function( resolve, reject ) {
    loader.load( src, resolve, undefined, reject );
  });
};

/**
 * @author Rich Tibbett / https://github.com/richtr
 * @author mrdoob / http://mrdoob.com/
 * @author Tony Parisi / http://www.tonyparisi.com/
 * @author Takahiro / https://github.com/takahirox
 * @author Don McCurdy / https://www.donmccurdy.com
 */

const GLTFLoader = ( function () {

	function GLTFLoader( manager ) {

		this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;
		this.dracoLoader = null;

	}

	GLTFLoader.prototype = {

		constructor: GLTFLoader,

		crossOrigin: 'anonymous',

		load: function ( url, onLoad, onProgress, onError ) {

			var scope = this;

			var resourcePath;

			if ( this.resourcePath !== undefined ) {

				resourcePath = this.resourcePath;

			} else if ( this.path !== undefined ) {

				resourcePath = this.path;

			} else {

				resourcePath = LoaderUtils.extractUrlBase( url );

			}

			// Tells the LoadingManager to track an extra item, which resolves after
			// the model is fully loaded. This means the count of items loaded will
			// be incorrect, but ensures manager.onLoad() does not fire early.
			scope.manager.itemStart( url );

			var _onError = function ( e ) {

				if ( onError ) {

					onError( e );

				} else {

					console.error( e );

				}

				scope.manager.itemError( url );
				scope.manager.itemEnd( url );

			};

			var loader = new FileLoader( scope.manager );

			loader.setPath( this.path );
			loader.setResponseType( 'arraybuffer' );

			loader.load( url, function ( data ) {

				try {

					scope.parse( data, resourcePath, function ( gltf ) {

						onLoad( gltf );

						scope.manager.itemEnd( url );

					}, _onError );

				} catch ( e ) {

					_onError( e );

				}

			}, onProgress, _onError );

		},

		setCrossOrigin: function ( value ) {

			this.crossOrigin = value;
			return this;

		},

		setPath: function ( value ) {

			this.path = value;
			return this;

		},

		setResourcePath: function ( value ) {

			this.resourcePath = value;
			return this;

		},

		setDRACOLoader: function ( dracoLoader ) {

			this.dracoLoader = dracoLoader;
			return this;

		},

		parse: function ( data, path, onLoad, onError ) {

			var content;
			var extensions = {};

			if ( typeof data === 'string' ) {

				content = data;

			} else {

				var magic = LoaderUtils.decodeText( new Uint8Array( data, 0, 4 ) );

				if ( magic === BINARY_EXTENSION_HEADER_MAGIC ) {

					try {

						extensions[ EXTENSIONS.KHR_BINARY_GLTF ] = new GLTFBinaryExtension( data );

					} catch ( error ) {

						if ( onError ) onError( error );
						return;

					}

					content = extensions[ EXTENSIONS.KHR_BINARY_GLTF ].content;

				} else {

					content = LoaderUtils.decodeText( new Uint8Array( data ) );

				}

			}

			var json = JSON.parse( content );

			if ( json.asset === undefined || json.asset.version[ 0 ] < 2 ) {

				if ( onError ) onError( new Error( 'GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported. Use LegacyGLTFLoader instead.' ) );
				return;

			}

			if ( json.extensionsUsed ) {

				for ( var i = 0; i < json.extensionsUsed.length; ++ i ) {

					var extensionName = json.extensionsUsed[ i ];
					var extensionsRequired = json.extensionsRequired || [];

					switch ( extensionName ) {

						case EXTENSIONS.KHR_LIGHTS_PUNCTUAL:
							extensions[ extensionName ] = new GLTFLightsExtension( json );
							break;

						case EXTENSIONS.KHR_MATERIALS_UNLIT:
							extensions[ extensionName ] = new GLTFMaterialsUnlitExtension( json );
							break;

						case EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS:
							extensions[ extensionName ] = new GLTFMaterialsPbrSpecularGlossinessExtension( json );
							break;

						case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
							extensions[ extensionName ] = new GLTFDracoMeshCompressionExtension( json, this.dracoLoader );
							break;

						case EXTENSIONS.MSFT_TEXTURE_DDS:
							extensions[ EXTENSIONS.MSFT_TEXTURE_DDS ] = new GLTFTextureDDSExtension( json );
							break;

						case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
							extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] = new GLTFTextureTransformExtension( json );
							break;

						default:

							if ( extensionsRequired.indexOf( extensionName ) >= 0 ) {

								console.warn( 'GLTFLoader: Unknown extension "' + extensionName + '".' );

							}

					}

				}

			}

			var parser = new GLTFParser( json, extensions, {

				path: path || this.resourcePath || '',
				crossOrigin: this.crossOrigin,
				manager: this.manager

			} );

			parser.parse( function ( scene, scenes, cameras, animations, json ) {

				var glTF = {
					scene: scene,
					scenes: scenes,
					cameras: cameras,
					animations: animations,
					asset: json.asset,
					parser: parser,
					userData: {}
				};

				addUnknownExtensionsToUserData( extensions, glTF, json );

				onLoad( glTF );

			}, onError );

		}

	};

	/* GLTFREGISTRY */

	function GLTFRegistry() {

		var objects = {};

		return	{

			get: function ( key ) {

				return objects[ key ];

			},

			add: function ( key, object ) {

				objects[ key ] = object;

			},

			remove: function ( key ) {

				delete objects[ key ];

			},

			removeAll: function () {

				objects = {};

			}

		};

	}

	/*********************************/
	/********** EXTENSIONS ***********/
	/*********************************/

	var EXTENSIONS = {
		KHR_BINARY_GLTF: 'KHR_binary_glTF',
		KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
		KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
		KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS: 'KHR_materials_pbrSpecularGlossiness',
		KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
		KHR_TEXTURE_TRANSFORM: 'KHR_texture_transform',
		MSFT_TEXTURE_DDS: 'MSFT_texture_dds'
	};

	/**
	 * DDS Texture Extension
	 *
	 * Specification:
	 * https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_texture_dds
	 *
	 */
	function GLTFTextureDDSExtension() {

		if ( ! DDSLoader ) {

			throw new Error( 'GLTFLoader: Attempting to load .dds texture without importing DDSLoader' );

		}

		this.name = EXTENSIONS.MSFT_TEXTURE_DDS;
		this.ddsLoader = new DDSLoader();

	}

	/**
	 * Lights Extension
	 *
	 * Specification: PENDING
	 */
	function GLTFLightsExtension( json ) {

		this.name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL;

		var extension = ( json.extensions && json.extensions[ EXTENSIONS.KHR_LIGHTS_PUNCTUAL ] ) || {};
		this.lightDefs = extension.lights || [];

	}

	GLTFLightsExtension.prototype.loadLight = function ( lightIndex ) {

		var lightDef = this.lightDefs[ lightIndex ];
		var lightNode;

		var color = new Color( 0xffffff );
		if ( lightDef.color !== undefined ) color.fromArray( lightDef.color );

		var range = lightDef.range !== undefined ? lightDef.range : 0;

		switch ( lightDef.type ) {

			case 'directional':
				lightNode = new DirectionalLight( color );
				lightNode.target.position.set( 0, 0, - 1 );
				lightNode.add( lightNode.target );
				break;

			case 'point':
				lightNode = new PointLight( color );
				lightNode.distance = range;
				break;

			case 'spot':
				lightNode = new SpotLight( color );
				lightNode.distance = range;
				// Handle spotlight properties.
				lightDef.spot = lightDef.spot || {};
				lightDef.spot.innerConeAngle = lightDef.spot.innerConeAngle !== undefined ? lightDef.spot.innerConeAngle : 0;
				lightDef.spot.outerConeAngle = lightDef.spot.outerConeAngle !== undefined ? lightDef.spot.outerConeAngle : Math$1.PI / 4.0;
				lightNode.angle = lightDef.spot.outerConeAngle;
				lightNode.penumbra = 1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
				lightNode.target.position.set( 0, 0, - 1 );
				lightNode.add( lightNode.target );
				break;

			default:
				throw new Error( 'GLTFLoader: Unexpected light type, "' + lightDef.type + '".' );

		}

		// Some lights (e.g. spot) default to a position other than the origin. Reset the position
		// here, because node-level parsing will only override position if explicitly specified.
		lightNode.position.set( 0, 0, 0 );

		lightNode.decay = 2;

		if ( lightDef.intensity !== undefined ) lightNode.intensity = lightDef.intensity;

		lightNode.name = lightDef.name || ( 'light_' + lightIndex );

		return Promise.resolve( lightNode );

	};

	/**
	 * Unlit Materials Extension (pending)
	 *
	 * PR: https://github.com/KhronosGroup/glTF/pull/1163
	 */
	function GLTFMaterialsUnlitExtension( json ) {

		this.name = EXTENSIONS.KHR_MATERIALS_UNLIT;

	}

	GLTFMaterialsUnlitExtension.prototype.getMaterialType = function ( material ) {

		return MeshBasicMaterial;

	};

	GLTFMaterialsUnlitExtension.prototype.extendParams = function ( materialParams, material, parser ) {

		var pending = [];

		materialParams.color = new Color( 1.0, 1.0, 1.0 );
		materialParams.opacity = 1.0;

		var metallicRoughness = material.pbrMetallicRoughness;

		if ( metallicRoughness ) {

			if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

				var array = metallicRoughness.baseColorFactor;

				materialParams.color.fromArray( array );
				materialParams.opacity = array[ 3 ];

			}

			if ( metallicRoughness.baseColorTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture ) );

			}

		}

		return Promise.all( pending );

	};
	var BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
	var BINARY_EXTENSION_HEADER_LENGTH = 12;
	var BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };

	function GLTFBinaryExtension( data ) {

		this.name = EXTENSIONS.KHR_BINARY_GLTF;
		this.content = null;
		this.body = null;

		var headerView = new DataView( data, 0, BINARY_EXTENSION_HEADER_LENGTH );

		this.header = {
			magic: LoaderUtils.decodeText( new Uint8Array( data.slice( 0, 4 ) ) ),
			version: headerView.getUint32( 4, true ),
			length: headerView.getUint32( 8, true )
		};

		if ( this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC ) {

			throw new Error( 'GLTFLoader: Unsupported glTF-Binary header.' );

		} else if ( this.header.version < 2.0 ) {

			throw new Error( 'GLTFLoader: Legacy binary file detected. Use LegacyGLTFLoader instead.' );

		}

		var chunkView = new DataView( data, BINARY_EXTENSION_HEADER_LENGTH );
		var chunkIndex = 0;

		while ( chunkIndex < chunkView.byteLength ) {

			var chunkLength = chunkView.getUint32( chunkIndex, true );
			chunkIndex += 4;

			var chunkType = chunkView.getUint32( chunkIndex, true );
			chunkIndex += 4;

			if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON ) {

				var contentArray = new Uint8Array( data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength );
				this.content = LoaderUtils.decodeText( contentArray );

			} else if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN ) {

				var byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
				this.body = data.slice( byteOffset, byteOffset + chunkLength );

			}

			// Clients must ignore chunks with unknown types.

			chunkIndex += chunkLength;

		}

		if ( this.content === null ) {

			throw new Error( 'GLTFLoader: JSON content not found.' );

		}

	}

	/**
	 * DRACO Mesh Compression Extension
	 *
	 * Specification: https://github.com/KhronosGroup/glTF/pull/874
	 */
	function GLTFDracoMeshCompressionExtension( json, dracoLoader ) {

		if ( ! dracoLoader ) {

			throw new Error( 'GLTFLoader: No DRACOLoader instance provided.' );

		}

		this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;
		this.json = json;
		this.dracoLoader = dracoLoader;
		DRACOLoader.getDecoderModule();

	}

	GLTFDracoMeshCompressionExtension.prototype.decodePrimitive = function ( primitive, parser ) {

		var json = this.json;
		var dracoLoader = this.dracoLoader;
		var bufferViewIndex = primitive.extensions[ this.name ].bufferView;
		var gltfAttributeMap = primitive.extensions[ this.name ].attributes;
		var threeAttributeMap = {};
		var attributeNormalizedMap = {};
		var attributeTypeMap = {};

		for ( var attributeName in gltfAttributeMap ) {

			if ( ! ( attributeName in ATTRIBUTES ) ) continue;

			threeAttributeMap[ ATTRIBUTES[ attributeName ] ] = gltfAttributeMap[ attributeName ];

		}

		for ( attributeName in primitive.attributes ) {

			if ( ATTRIBUTES[ attributeName ] !== undefined && gltfAttributeMap[ attributeName ] !== undefined ) {

				var accessorDef = json.accessors[ primitive.attributes[ attributeName ] ];
				var componentType = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];

				attributeTypeMap[ ATTRIBUTES[ attributeName ] ] = componentType;
				attributeNormalizedMap[ ATTRIBUTES[ attributeName ] ] = accessorDef.normalized === true;

			}

		}

		return parser.getDependency( 'bufferView', bufferViewIndex ).then( function ( bufferView ) {

			return new Promise( function ( resolve ) {

				dracoLoader.decodeDracoFile( bufferView, function ( geometry ) {

					for ( var attributeName in geometry.attributes ) {

						var attribute = geometry.attributes[ attributeName ];
						var normalized = attributeNormalizedMap[ attributeName ];

						if ( normalized !== undefined ) attribute.normalized = normalized;

					}

					resolve( geometry );

				}, threeAttributeMap, attributeTypeMap );

			} );

		} );

	};

	/**
	 * Texture Transform Extension
	 *
	 * Specification:
	 */
	function GLTFTextureTransformExtension( json ) {

		this.name = EXTENSIONS.KHR_TEXTURE_TRANSFORM;

	}

	GLTFTextureTransformExtension.prototype.extendTexture = function ( texture, transform ) {

		texture = texture.clone();

		if ( transform.offset !== undefined ) {

			texture.offset.fromArray( transform.offset );

		}

		if ( transform.rotation !== undefined ) {

			texture.rotation = transform.rotation;

		}

		if ( transform.scale !== undefined ) {

			texture.repeat.fromArray( transform.scale );

		}

		if ( transform.texCoord !== undefined ) {

			console.warn( 'GLTFLoader: Custom UV sets in "' + this.name + '" extension not yet supported.' );

		}

		texture.needsUpdate = true;

		return texture;

	};

	/**
	 * Specular-Glossiness Extension
	 *
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness
	 */
	function GLTFMaterialsPbrSpecularGlossinessExtension() {

		return {

			name: EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS,

			specularGlossinessParams: [
				'color',
				'map',
				'lightMap',
				'lightMapIntensity',
				'aoMap',
				'aoMapIntensity',
				'emissive',
				'emissiveIntensity',
				'emissiveMap',
				'bumpMap',
				'bumpScale',
				'normalMap',
				'displacementMap',
				'displacementScale',
				'displacementBias',
				'specularMap',
				'specular',
				'glossinessMap',
				'glossiness',
				'alphaMap',
				'envMap',
				'envMapIntensity',
				'refractionRatio',
			],

			getMaterialType: function () {

				return ShaderMaterial;

			},

			extendParams: function ( params, material, parser ) {

				var pbrSpecularGlossiness = material.extensions[ this.name ];

				var shader = ShaderLib[ 'standard' ];

				var uniforms = UniformsUtils.clone( shader.uniforms );

				var specularMapParsFragmentChunk = [
					'#ifdef USE_SPECULARMAP',
					'	uniform sampler2D specularMap;',
					'#endif'
				].join( '\n' );

				var glossinessMapParsFragmentChunk = [
					'#ifdef USE_GLOSSINESSMAP',
					'	uniform sampler2D glossinessMap;',
					'#endif'
				].join( '\n' );

				var specularMapFragmentChunk = [
					'vec3 specularFactor = specular;',
					'#ifdef USE_SPECULARMAP',
					'	vec4 texelSpecular = texture2D( specularMap, vUv );',
					'	texelSpecular = sRGBToLinear( texelSpecular );',
					'	// reads channel RGB, compatible with a glTF Specular-Glossiness (RGBA) texture',
					'	specularFactor *= texelSpecular.rgb;',
					'#endif'
				].join( '\n' );

				var glossinessMapFragmentChunk = [
					'float glossinessFactor = glossiness;',
					'#ifdef USE_GLOSSINESSMAP',
					'	vec4 texelGlossiness = texture2D( glossinessMap, vUv );',
					'	// reads channel A, compatible with a glTF Specular-Glossiness (RGBA) texture',
					'	glossinessFactor *= texelGlossiness.a;',
					'#endif'
				].join( '\n' );

				var lightPhysicalFragmentChunk = [
					'PhysicalMaterial material;',
					'material.diffuseColor = diffuseColor.rgb;',
					'material.specularRoughness = clamp( 1.0 - glossinessFactor, 0.04, 1.0 );',
					'material.specularColor = specularFactor.rgb;',
				].join( '\n' );

				var fragmentShader = shader.fragmentShader
					.replace( 'uniform float roughness;', 'uniform vec3 specular;' )
					.replace( 'uniform float metalness;', 'uniform float glossiness;' )
					.replace( '#include <roughnessmap_pars_fragment>', specularMapParsFragmentChunk )
					.replace( '#include <metalnessmap_pars_fragment>', glossinessMapParsFragmentChunk )
					.replace( '#include <roughnessmap_fragment>', specularMapFragmentChunk )
					.replace( '#include <metalnessmap_fragment>', glossinessMapFragmentChunk )
					.replace( '#include <lights_physical_fragment>', lightPhysicalFragmentChunk );

				delete uniforms.roughness;
				delete uniforms.metalness;
				delete uniforms.roughnessMap;
				delete uniforms.metalnessMap;

				uniforms.specular = { value: new Color().setHex( 0x111111 ) };
				uniforms.glossiness = { value: 0.5 };
				uniforms.specularMap = { value: null };
				uniforms.glossinessMap = { value: null };

				params.vertexShader = shader.vertexShader;
				params.fragmentShader = fragmentShader;
				params.uniforms = uniforms;
				params.defines = { 'STANDARD': '' };

				params.color = new Color( 1.0, 1.0, 1.0 );
				params.opacity = 1.0;

				var pending = [];

				if ( Array.isArray( pbrSpecularGlossiness.diffuseFactor ) ) {

					var array = pbrSpecularGlossiness.diffuseFactor;

					params.color.fromArray( array );
					params.opacity = array[ 3 ];

				}

				if ( pbrSpecularGlossiness.diffuseTexture !== undefined ) {

					pending.push( parser.assignTexture( params, 'map', pbrSpecularGlossiness.diffuseTexture ) );

				}

				params.emissive = new Color( 0.0, 0.0, 0.0 );
				params.glossiness = pbrSpecularGlossiness.glossinessFactor !== undefined ? pbrSpecularGlossiness.glossinessFactor : 1.0;
				params.specular = new Color( 1.0, 1.0, 1.0 );

				if ( Array.isArray( pbrSpecularGlossiness.specularFactor ) ) {

					params.specular.fromArray( pbrSpecularGlossiness.specularFactor );

				}

				if ( pbrSpecularGlossiness.specularGlossinessTexture !== undefined ) {

					var specGlossMapDef = pbrSpecularGlossiness.specularGlossinessTexture;
					pending.push( parser.assignTexture( params, 'glossinessMap', specGlossMapDef ) );
					pending.push( parser.assignTexture( params, 'specularMap', specGlossMapDef ) );

				}

				return Promise.all( pending );

			},

			createMaterial: function ( params ) {

				// setup material properties based on MeshStandardMaterial for Specular-Glossiness

				var material = new ShaderMaterial( {
					defines: params.defines,
					vertexShader: params.vertexShader,
					fragmentShader: params.fragmentShader,
					uniforms: params.uniforms,
					fog: true,
					lights: true,
					opacity: params.opacity,
					transparent: params.transparent
				} );

				material.isGLTFSpecularGlossinessMaterial = true;

				material.color = params.color;

				material.map = params.map === undefined ? null : params.map;

				material.lightMap = null;
				material.lightMapIntensity = 1.0;

				material.aoMap = params.aoMap === undefined ? null : params.aoMap;
				material.aoMapIntensity = 1.0;

				material.emissive = params.emissive;
				material.emissiveIntensity = 1.0;
				material.emissiveMap = params.emissiveMap === undefined ? null : params.emissiveMap;

				material.bumpMap = params.bumpMap === undefined ? null : params.bumpMap;
				material.bumpScale = 1;

				material.normalMap = params.normalMap === undefined ? null : params.normalMap;
				if ( params.normalScale ) material.normalScale = params.normalScale;

				material.displacementMap = null;
				material.displacementScale = 1;
				material.displacementBias = 0;

				material.specularMap = params.specularMap === undefined ? null : params.specularMap;
				material.specular = params.specular;

				material.glossinessMap = params.glossinessMap === undefined ? null : params.glossinessMap;
				material.glossiness = params.glossiness;

				material.alphaMap = null;

				material.envMap = params.envMap === undefined ? null : params.envMap;
				material.envMapIntensity = 1.0;

				material.refractionRatio = 0.98;

				material.extensions.derivatives = true;

				return material;

			},

			/**
			 * Clones a GLTFSpecularGlossinessMaterial instance. The ShaderMaterial.copy() method can
			 * copy only properties it knows about or inherits, and misses many properties that would
			 * normally be defined by MeshStandardMaterial.
			 *
			 * This method allows GLTFSpecularGlossinessMaterials to be cloned in the process of
			 * loading a glTF model, but cloning later (e.g. by the user) would require these changes
			 * AND also updating `.onBeforeRender` on the parent mesh.
			 *
			 * @param  {ShaderMaterial} source
			 * @return {ShaderMaterial}
			 */
			cloneMaterial: function ( source ) {

				var target = source.clone();

				target.isGLTFSpecularGlossinessMaterial = true;

				var params = this.specularGlossinessParams;

				for ( var i = 0, il = params.length; i < il; i ++ ) {

					target[ params[ i ] ] = source[ params[ i ] ];

				}

				return target;

			},

			// Here's based on refreshUniformsCommon() and refreshUniformsStandard() in WebGLRenderer.
			refreshUniforms: function ( renderer, scene, camera, geometry, material, group ) {

				if ( material.isGLTFSpecularGlossinessMaterial !== true ) {

					return;

				}

				var uniforms = material.uniforms;
				var defines = material.defines;

				uniforms.opacity.value = material.opacity;

				uniforms.diffuse.value.copy( material.color );
				uniforms.emissive.value.copy( material.emissive ).multiplyScalar( material.emissiveIntensity );

				uniforms.map.value = material.map;
				uniforms.specularMap.value = material.specularMap;
				uniforms.alphaMap.value = material.alphaMap;

				uniforms.lightMap.value = material.lightMap;
				uniforms.lightMapIntensity.value = material.lightMapIntensity;

				uniforms.aoMap.value = material.aoMap;
				uniforms.aoMapIntensity.value = material.aoMapIntensity;

				// uv repeat and offset setting priorities
				// 1. color map
				// 2. specular map
				// 3. normal map
				// 4. bump map
				// 5. alpha map
				// 6. emissive map

				var uvScaleMap;

				if ( material.map ) {

					uvScaleMap = material.map;

				} else if ( material.specularMap ) {

					uvScaleMap = material.specularMap;

				} else if ( material.displacementMap ) {

					uvScaleMap = material.displacementMap;

				} else if ( material.normalMap ) {

					uvScaleMap = material.normalMap;

				} else if ( material.bumpMap ) {

					uvScaleMap = material.bumpMap;

				} else if ( material.glossinessMap ) {

					uvScaleMap = material.glossinessMap;

				} else if ( material.alphaMap ) {

					uvScaleMap = material.alphaMap;

				} else if ( material.emissiveMap ) {

					uvScaleMap = material.emissiveMap;

				}

				if ( uvScaleMap !== undefined ) {

					// backwards compatibility
					if ( uvScaleMap.isWebGLRenderTarget ) {

						uvScaleMap = uvScaleMap.texture;

					}

					if ( uvScaleMap.matrixAutoUpdate === true ) {

						uvScaleMap.updateMatrix();

					}

					uniforms.uvTransform.value.copy( uvScaleMap.matrix );

				}

				if ( material.envMap ) {

					uniforms.envMap.value = material.envMap;
					uniforms.envMapIntensity.value = material.envMapIntensity;

					// don't flip CubeTexture envMaps, flip everything else:
					//  WebGLRenderTargetCube will be flipped for backwards compatibility
					//  WebGLRenderTargetCube.texture will be flipped because it's a Texture and NOT a CubeTexture
					// this check must be handled differently, or removed entirely, if WebGLRenderTargetCube uses a CubeTexture in the future
					uniforms.flipEnvMap.value = material.envMap.isCubeTexture ? - 1 : 1;

					uniforms.reflectivity.value = material.reflectivity;
					uniforms.refractionRatio.value = material.refractionRatio;

					uniforms.maxMipLevel.value = renderer.properties.get( material.envMap ).__maxMipLevel;

				}

				uniforms.specular.value.copy( material.specular );
				uniforms.glossiness.value = material.glossiness;

				uniforms.glossinessMap.value = material.glossinessMap;

				uniforms.emissiveMap.value = material.emissiveMap;
				uniforms.bumpMap.value = material.bumpMap;
				uniforms.normalMap.value = material.normalMap;

				uniforms.displacementMap.value = material.displacementMap;
				uniforms.displacementScale.value = material.displacementScale;
				uniforms.displacementBias.value = material.displacementBias;

				if ( uniforms.glossinessMap.value !== null && defines.USE_GLOSSINESSMAP === undefined ) {

					defines.USE_GLOSSINESSMAP = '';
					// set USE_ROUGHNESSMAP to enable vUv
					defines.USE_ROUGHNESSMAP = '';

				}

				if ( uniforms.glossinessMap.value === null && defines.USE_GLOSSINESSMAP !== undefined ) {

					delete defines.USE_GLOSSINESSMAP;
					delete defines.USE_ROUGHNESSMAP;

				}

			}

		};

	}

	/*********************************/
	/********** INTERPOLATION ********/
	/*********************************/

	// Spline Interpolation
	// Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation
	function GLTFCubicSplineInterpolant( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

		Interpolant.call( this, parameterPositions, sampleValues, sampleSize, resultBuffer );

	}

	GLTFCubicSplineInterpolant.prototype = Object.create( Interpolant.prototype );
	GLTFCubicSplineInterpolant.prototype.constructor = GLTFCubicSplineInterpolant;

	GLTFCubicSplineInterpolant.prototype.copySampleValue_ = function ( index ) {

		// Copies a sample value to the result buffer. See description of glTF
		// CUBICSPLINE values layout in interpolate_() function below.

		var result = this.resultBuffer,
			values = this.sampleValues,
			valueSize = this.valueSize,
			offset = index * valueSize * 3 + valueSize;

		for ( var i = 0; i !== valueSize; i ++ ) {

			result[ i ] = values[ offset + i ];

		}

		return result;

	};

	GLTFCubicSplineInterpolant.prototype.beforeStart_ = GLTFCubicSplineInterpolant.prototype.copySampleValue_;

	GLTFCubicSplineInterpolant.prototype.afterEnd_ = GLTFCubicSplineInterpolant.prototype.copySampleValue_;

	GLTFCubicSplineInterpolant.prototype.interpolate_ = function ( i1, t0, t, t1 ) {

		var result = this.resultBuffer;
		var values = this.sampleValues;
		var stride = this.valueSize;

		var stride2 = stride * 2;
		var stride3 = stride * 3;

		var td = t1 - t0;

		var p = ( t - t0 ) / td;
		var pp = p * p;
		var ppp = pp * p;

		var offset1 = i1 * stride3;
		var offset0 = offset1 - stride3;

		var s2 = - 2 * ppp + 3 * pp;
		var s3 = ppp - pp;
		var s0 = 1 - s2;
		var s1 = s3 - pp + p;

		// Layout of keyframe output values for CUBICSPLINE animations:
		//   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]
		for ( var i = 0; i !== stride; i ++ ) {

			var p0 = values[ offset0 + i + stride ]; // splineVertex_k
			var m0 = values[ offset0 + i + stride2 ] * td; // outTangent_k * (t_k+1 - t_k)
			var p1 = values[ offset1 + i + stride ]; // splineVertex_k+1
			var m1 = values[ offset1 + i ] * td; // inTangent_k+1 * (t_k+1 - t_k)

			result[ i ] = s0 * p0 + s1 * m0 + s2 * p1 + s3 * m1;

		}

		return result;

	};

	/*********************************/
	/********** INTERNALS ************/
	/*********************************/

	/* CONSTANTS */

	var WEBGL_CONSTANTS = {
		FLOAT: 5126,
		//FLOAT_MAT2: 35674,
		FLOAT_MAT3: 35675,
		FLOAT_MAT4: 35676,
		FLOAT_VEC2: 35664,
		FLOAT_VEC3: 35665,
		FLOAT_VEC4: 35666,
		LINEAR: 9729,
		REPEAT: 10497,
		SAMPLER_2D: 35678,
		POINTS: 0,
		LINES: 1,
		LINE_LOOP: 2,
		LINE_STRIP: 3,
		TRIANGLES: 4,
		TRIANGLE_STRIP: 5,
		TRIANGLE_FAN: 6,
		UNSIGNED_BYTE: 5121,
		UNSIGNED_SHORT: 5123
	};

	var WEBGL_COMPONENT_TYPES = {
		5120: Int8Array,
		5121: Uint8Array,
		5122: Int16Array,
		5123: Uint16Array,
		5125: Uint32Array,
		5126: Float32Array
	};

	var WEBGL_FILTERS = {
		9728: NearestFilter,
		9729: LinearFilter,
		9984: NearestMipMapNearestFilter,
		9985: LinearMipMapNearestFilter,
		9986: NearestMipMapLinearFilter,
		9987: LinearMipMapLinearFilter
	};

	var WEBGL_WRAPPINGS = {
		33071: ClampToEdgeWrapping,
		33648: MirroredRepeatWrapping,
		10497: RepeatWrapping
	};

	var WEBGL_TYPE_SIZES = {
		'SCALAR': 1,
		'VEC2': 2,
		'VEC3': 3,
		'VEC4': 4,
		'MAT2': 4,
		'MAT3': 9,
		'MAT4': 16
	};

	var ATTRIBUTES = {
		POSITION: 'position',
		NORMAL: 'normal',
		TEXCOORD_0: 'uv',
		TEXCOORD_1: 'uv2',
		COLOR_0: 'color',
		WEIGHTS_0: 'skinWeight',
		JOINTS_0: 'skinIndex',
	};

	var PATH_PROPERTIES = {
		scale: 'scale',
		translation: 'position',
		rotation: 'quaternion',
		weights: 'morphTargetInfluences'
	};

	var INTERPOLATION = {
		CUBICSPLINE: InterpolateSmooth, // We use custom interpolation GLTFCubicSplineInterpolation for CUBICSPLINE.
		                                      // KeyframeTrack.optimize() can't handle glTF Cubic Spline output values layout,
		                                      // using InterpolateSmooth for KeyframeTrack instantiation to prevent optimization.
		                                      // See KeyframeTrack.optimize() for the detail.
		LINEAR: InterpolateLinear,
		STEP: InterpolateDiscrete
	};

	var ALPHA_MODES = {
		OPAQUE: 'OPAQUE',
		MASK: 'MASK',
		BLEND: 'BLEND'
	};

	var MIME_TYPE_FORMATS = {
		'image/png': RGBAFormat,
		'image/jpeg': RGBFormat
	};

	/* UTILITY FUNCTIONS */

	function resolveURL( url, path ) {

		// Invalid URL
		if ( typeof url !== 'string' || url === '' ) return '';

		// Absolute URL http://,https://,//
		if ( /^(https?:)?\/\//i.test( url ) ) return url;

		// Data URI
		if ( /^data:.*,.*$/i.test( url ) ) return url;

		// Blob URL
		if ( /^blob:.*$/i.test( url ) ) return url;

		// Relative URL
		return path + url;

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
	 */
	function createDefaultMaterial() {

		return new MeshStandardMaterial( {
			color: 0xFFFFFF,
			emissive: 0x000000,
			metalness: 1,
			roughness: 1,
			transparent: false,
			depthTest: true,
			side: FrontSide
		} );

	}

	function addUnknownExtensionsToUserData( knownExtensions, object, objectDef ) {

		// Add unknown glTF extensions to an object's userData.

		for ( var name in objectDef.extensions ) {

			if ( knownExtensions[ name ] === undefined ) {

				object.userData.gltfExtensions = object.userData.gltfExtensions || {};
				object.userData.gltfExtensions[ name ] = objectDef.extensions[ name ];

			}

		}

	}

	/**
	 * @param {Object3D|Material|BufferGeometry} object
	 * @param {GLTF.definition} gltfDef
	 */
	function assignExtrasToUserData( object, gltfDef ) {

		if ( gltfDef.extras !== undefined ) {

			if ( typeof gltfDef.extras === 'object' ) {

				object.userData = gltfDef.extras;

			} else {

				console.warn( 'GLTFLoader: Ignoring primitive type .extras, ' + gltfDef.extras );

			}

		}

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
	 *
	 * @param {BufferGeometry} geometry
	 * @param {Array<GLTF.Target>} targets
	 * @param {GLTFParser} parser
	 * @return {Promise<BufferGeometry>}
	 */
	function addMorphTargets( geometry, targets, parser ) {

		var hasMorphPosition = false;
		var hasMorphNormal = false;

		for ( var i = 0, il = targets.length; i < il; i ++ ) {

			var target = targets[ i ];

			if ( target.POSITION !== undefined ) hasMorphPosition = true;
			if ( target.NORMAL !== undefined ) hasMorphNormal = true;

			if ( hasMorphPosition && hasMorphNormal ) break;

		}

		if ( ! hasMorphPosition && ! hasMorphNormal ) return Promise.resolve( geometry );

		var pendingPositionAccessors = [];
		var pendingNormalAccessors = [];

		for ( var i = 0, il = targets.length; i < il; i ++ ) {

			var target = targets[ i ];

			if ( hasMorphPosition ) {

				// TODO: Error-prone use of a callback inside a loop.
				var accessor = target.POSITION !== undefined
					? parser.getDependency( 'accessor', target.POSITION )
						.then( function ( accessor ) {
							// Cloning not to pollute original accessor below
							return cloneBufferAttribute( accessor );
						} )
					: geometry.attributes.position;

				pendingPositionAccessors.push( accessor );

			}

			if ( hasMorphNormal ) {

				// TODO: Error-prone use of a callback inside a loop.
				var accessor = target.NORMAL !== undefined
					? parser.getDependency( 'accessor', target.NORMAL )
						.then( function ( accessor ) {
							return cloneBufferAttribute( accessor );
						} )
					: geometry.attributes.normal;

				pendingNormalAccessors.push( accessor );

			}

		}

		return Promise.all( [
			Promise.all( pendingPositionAccessors ),
			Promise.all( pendingNormalAccessors )
		] ).then( function ( accessors ) {

			var morphPositions = accessors[ 0 ];
			var morphNormals = accessors[ 1 ];

			for ( var i = 0, il = targets.length; i < il; i ++ ) {

				var target = targets[ i ];
				var attributeName = 'morphTarget' + i;

				if ( hasMorphPosition ) {

					// Three.js morph position is absolute value. The formula is
					//   basePosition
					//     + weight0 * ( morphPosition0 - basePosition )
					//     + weight1 * ( morphPosition1 - basePosition )
					//     ...
					// while the glTF one is relative
					//   basePosition
					//     + weight0 * glTFmorphPosition0
					//     + weight1 * glTFmorphPosition1
					//     ...
					// then we need to convert from relative to absolute here.

					if ( target.POSITION !== undefined ) {

						var positionAttribute = morphPositions[ i ];
						positionAttribute.name = attributeName;

						var position = geometry.attributes.position;

						for ( var j = 0, jl = positionAttribute.count; j < jl; j ++ ) {

							positionAttribute.setXYZ(
								j,
								positionAttribute.getX( j ) + position.getX( j ),
								positionAttribute.getY( j ) + position.getY( j ),
								positionAttribute.getZ( j ) + position.getZ( j )
							);

						}

					}

				}

				if ( hasMorphNormal ) {

					// see target.POSITION's comment

					if ( target.NORMAL !== undefined ) {

						var normalAttribute = morphNormals[ i ];
						normalAttribute.name = attributeName;

						var normal = geometry.attributes.normal;

						for ( var j = 0, jl = normalAttribute.count; j < jl; j ++ ) {

							normalAttribute.setXYZ(
								j,
								normalAttribute.getX( j ) + normal.getX( j ),
								normalAttribute.getY( j ) + normal.getY( j ),
								normalAttribute.getZ( j ) + normal.getZ( j )
							);

						}

					}

				}

			}

			if ( hasMorphPosition ) geometry.morphAttributes.position = morphPositions;
			if ( hasMorphNormal ) geometry.morphAttributes.normal = morphNormals;

			return geometry;

		} );

	}

	/**
	 * @param {Mesh} mesh
	 * @param {GLTF.Mesh} meshDef
	 */
	function updateMorphTargets( mesh, meshDef ) {

		mesh.updateMorphTargets();

		if ( meshDef.weights !== undefined ) {

			for ( var i = 0, il = meshDef.weights.length; i < il; i ++ ) {

				mesh.morphTargetInfluences[ i ] = meshDef.weights[ i ];

			}

		}

		// .extras has user-defined data, so check that .extras.targetNames is an array.
		if ( meshDef.extras && Array.isArray( meshDef.extras.targetNames ) ) {

			var targetNames = meshDef.extras.targetNames;

			if ( mesh.morphTargetInfluences.length === targetNames.length ) {

				mesh.morphTargetDictionary = {};

				for ( var i = 0, il = targetNames.length; i < il; i ++ ) {

					mesh.morphTargetDictionary[ targetNames[ i ] ] = i;

				}

			} else {

				console.warn( 'GLTFLoader: Invalid extras.targetNames length. Ignoring names.' );

			}

		}

	}

	function isPrimitiveEqual( a, b ) {

		var dracoExtA = a.extensions ? a.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ] : undefined;
		var dracoExtB = b.extensions ? b.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ] : undefined;

		if ( dracoExtA && dracoExtB ) {

			if ( dracoExtA.bufferView !== dracoExtB.bufferView ) return false;

			return isObjectEqual( dracoExtA.attributes, dracoExtB.attributes );

		}

		if ( a.indices !== b.indices ) {

			return false;

		}

		return isObjectEqual( a.attributes, b.attributes );

	}

	function isObjectEqual( a, b ) {

		if ( Object.keys( a ).length !== Object.keys( b ).length ) return false;

		for ( var key in a ) {

			if ( a[ key ] !== b[ key ] ) return false;

		}

		return true;

	}

	function isArrayEqual( a, b ) {

		if ( a.length !== b.length ) return false;

		for ( var i = 0, il = a.length; i < il; i ++ ) {

			if ( a[ i ] !== b[ i ] ) return false;

		}

		return true;

	}

	function getCachedGeometry( cache, newPrimitive ) {

		for ( var i = 0, il = cache.length; i < il; i ++ ) {

			var cached = cache[ i ];

			if ( isPrimitiveEqual( cached.primitive, newPrimitive ) ) return cached.promise;

		}

		return null;

	}

	function getCachedCombinedGeometry( cache, geometries ) {

		for ( var i = 0, il = cache.length; i < il; i ++ ) {

			var cached = cache[ i ];

			if ( isArrayEqual( geometries, cached.baseGeometries ) ) return cached.geometry;

		}

		return null;

	}

	function getCachedMultiPassGeometry( cache, geometry, primitives ) {

		for ( var i = 0, il = cache.length; i < il; i ++ ) {

			var cached = cache[ i ];

			if ( geometry === cached.baseGeometry && isArrayEqual( primitives, cached.primitives ) ) return cached.geometry;

		}

		return null;

	}

	function cloneBufferAttribute( attribute ) {

		if ( attribute.isInterleavedBufferAttribute ) {

			var count = attribute.count;
			var itemSize = attribute.itemSize;
			var array = attribute.array.slice( 0, count * itemSize );

			for ( var i = 0, j = 0; i < count; ++ i ) {

				array[ j ++ ] = attribute.getX( i );
				if ( itemSize >= 2 ) array[ j ++ ] = attribute.getY( i );
				if ( itemSize >= 3 ) array[ j ++ ] = attribute.getZ( i );
				if ( itemSize >= 4 ) array[ j ++ ] = attribute.getW( i );

			}

			return new BufferAttribute( array, itemSize, attribute.normalized );

		}

		return attribute.clone();

	}

	/**
	 * Checks if we can build a single Mesh with MultiMaterial from multiple primitives.
	 * Returns true if all primitives use the same attributes/morphAttributes/mode
	 * and also have index. Otherwise returns false.
	 *
	 * @param {Array<GLTF.Primitive>} primitives
	 * @return {Boolean}
	 */
	function isMultiPassGeometry( primitives ) {

		if ( primitives.length < 2 ) return false;

		var primitive0 = primitives[ 0 ];
		var targets0 = primitive0.targets || [];

		if ( primitive0.indices === undefined ) return false;

		for ( var i = 1, il = primitives.length; i < il; i ++ ) {

			var primitive = primitives[ i ];

			if ( primitive0.mode !== primitive.mode ) return false;
			if ( primitive.indices === undefined ) return false;
			if ( primitive.extensions && primitive.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ] ) return false;
			if ( ! isObjectEqual( primitive0.attributes, primitive.attributes ) ) return false;

			var targets = primitive.targets || [];

			if ( targets0.length !== targets.length ) return false;

			for ( var j = 0, jl = targets0.length; j < jl; j ++ ) {

				if ( ! isObjectEqual( targets0[ j ], targets[ j ] ) ) return false;

			}

		}

		return true;

	}

	/* GLTF PARSER */

	function GLTFParser( json, extensions, options ) {

		this.json = json || {};
		this.extensions = extensions || {};
		this.options = options || {};

		// loader object cache
		this.cache = new GLTFRegistry();

		// BufferGeometry caching
		this.primitiveCache = [];
		this.multiplePrimitivesCache = [];
		this.multiPassGeometryCache = [];

		this.textureLoader = new TextureLoader( this.options.manager );
		this.textureLoader.setCrossOrigin( this.options.crossOrigin );

		this.fileLoader = new FileLoader( this.options.manager );
		this.fileLoader.setResponseType( 'arraybuffer' );

	}

	GLTFParser.prototype.parse = function ( onLoad, onError ) {

		var json = this.json;

		// Clear the loader cache
		this.cache.removeAll();

		// Mark the special nodes/meshes in json for efficient parse
		this.markDefs();

		// Fire the callback on complete
		this.getMultiDependencies( [

			'scene',
			'animation',
			'camera'

		] ).then( function ( dependencies ) {

			var scenes = dependencies.scenes || [];
			var scene = scenes[ json.scene || 0 ];
			var animations = dependencies.animations || [];
			var cameras = dependencies.cameras || [];

			onLoad( scene, scenes, cameras, animations, json );

		} ).catch( onError );

	};

	/**
	 * Marks the special nodes/meshes in json for efficient parse.
	 */
	GLTFParser.prototype.markDefs = function () {

		var nodeDefs = this.json.nodes || [];
		var skinDefs = this.json.skins || [];
		var meshDefs = this.json.meshes || [];

		var meshReferences = {};
		var meshUses = {};

		// Nothing in the node definition indicates whether it is a Bone or an
		// Object3D. Use the skins' joint references to mark bones.
		for ( var skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex ++ ) {

			var joints = skinDefs[ skinIndex ].joints;

			for ( var i = 0, il = joints.length; i < il; i ++ ) {

				nodeDefs[ joints[ i ] ].isBone = true;

			}

		}

		// Meshes can (and should) be reused by multiple nodes in a glTF asset. To
		// avoid having more than one Mesh with the same name, count
		// references and rename instances below.
		//
		// Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
		for ( var nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex ++ ) {

			var nodeDef = nodeDefs[ nodeIndex ];

			if ( nodeDef.mesh !== undefined ) {

				if ( meshReferences[ nodeDef.mesh ] === undefined ) {

					meshReferences[ nodeDef.mesh ] = meshUses[ nodeDef.mesh ] = 0;

				}

				meshReferences[ nodeDef.mesh ] ++;

				// Nothing in the mesh definition indicates whether it is
				// a SkinnedMesh or Mesh. Use the node's mesh reference
				// to mark SkinnedMesh if node has skin.
				if ( nodeDef.skin !== undefined ) {

					meshDefs[ nodeDef.mesh ].isSkinnedMesh = true;

				}

			}

		}

		this.json.meshReferences = meshReferences;
		this.json.meshUses = meshUses;

	};

	/**
	 * Requests the specified dependency asynchronously, with caching.
	 * @param {string} type
	 * @param {number} index
	 * @return {Promise<Object3D|Material|Texture|AnimationClip|ArrayBuffer|Object>}
	 */
	GLTFParser.prototype.getDependency = function ( type, index ) {

		var cacheKey = type + ':' + index;
		var dependency = this.cache.get( cacheKey );

		if ( ! dependency ) {

			switch ( type ) {

				case 'scene':
					dependency = this.loadScene( index );
					break;

				case 'node':
					dependency = this.loadNode( index );
					break;

				case 'mesh':
					dependency = this.loadMesh( index );
					break;

				case 'accessor':
					dependency = this.loadAccessor( index );
					break;

				case 'bufferView':
					dependency = this.loadBufferView( index );
					break;

				case 'buffer':
					dependency = this.loadBuffer( index );
					break;

				case 'material':
					dependency = this.loadMaterial( index );
					break;

				case 'texture':
					dependency = this.loadTexture( index );
					break;

				case 'skin':
					dependency = this.loadSkin( index );
					break;

				case 'animation':
					dependency = this.loadAnimation( index );
					break;

				case 'camera':
					dependency = this.loadCamera( index );
					break;

				case 'light':
					dependency = this.extensions[ EXTENSIONS.KHR_LIGHTS_PUNCTUAL ].loadLight( index );
					break;

				default:
					throw new Error( 'Unknown type: ' + type );

			}

			this.cache.add( cacheKey, dependency );

		}

		return dependency;

	};

	/**
	 * Requests all dependencies of the specified type asynchronously, with caching.
	 * @param {string} type
	 * @return {Promise<Array<Object>>}
	 */
	GLTFParser.prototype.getDependencies = function ( type ) {

		var dependencies = this.cache.get( type );

		if ( ! dependencies ) {

			var parser = this;
			var defs = this.json[ type + ( type === 'mesh' ? 'es' : 's' ) ] || [];

			dependencies = Promise.all( defs.map( function ( def, index ) {

				return parser.getDependency( type, index );

			} ) );

			this.cache.add( type, dependencies );

		}

		return dependencies;

	};

	/**
	 * Requests all multiple dependencies of the specified types asynchronously, with caching.
	 * @param {Array<string>} types
	 * @return {Promise<Object<Array<Object>>>}
	 */
	GLTFParser.prototype.getMultiDependencies = function ( types ) {

		var results = {};
		var pending = [];

		for ( var i = 0, il = types.length; i < il; i ++ ) {

			var type = types[ i ];
			var value = this.getDependencies( type );

			// TODO: Error-prone use of a callback inside a loop.
			value = value.then( function ( key, value ) {

				results[ key ] = value;

			}.bind( this, type + ( type === 'mesh' ? 'es' : 's' ) ) );

			pending.push( value );

		}

		return Promise.all( pending ).then( function () {

			return results;

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 * @param {number} bufferIndex
	 * @return {Promise<ArrayBuffer>}
	 */
	GLTFParser.prototype.loadBuffer = function ( bufferIndex ) {

		var bufferDef = this.json.buffers[ bufferIndex ];
		var loader = this.fileLoader;

		if ( bufferDef.type && bufferDef.type !== 'arraybuffer' ) {

			throw new Error( 'GLTFLoader: ' + bufferDef.type + ' buffer type is not supported.' );

		}

		// If present, GLB container is required to be the first buffer.
		if ( bufferDef.uri === undefined && bufferIndex === 0 ) {

			return Promise.resolve( this.extensions[ EXTENSIONS.KHR_BINARY_GLTF ].body );

		}

		var options = this.options;

		return new Promise( function ( resolve, reject ) {

			loader.load( resolveURL( bufferDef.uri, options.path ), resolve, undefined, function () {

				reject( new Error( 'GLTFLoader: Failed to load buffer "' + bufferDef.uri + '".' ) );

			} );

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 * @param {number} bufferViewIndex
	 * @return {Promise<ArrayBuffer>}
	 */
	GLTFParser.prototype.loadBufferView = function ( bufferViewIndex ) {

		var bufferViewDef = this.json.bufferViews[ bufferViewIndex ];

		return this.getDependency( 'buffer', bufferViewDef.buffer ).then( function ( buffer ) {

			var byteLength = bufferViewDef.byteLength || 0;
			var byteOffset = bufferViewDef.byteOffset || 0;
			return buffer.slice( byteOffset, byteOffset + byteLength );

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
	 * @param {number} accessorIndex
	 * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
	 */
	GLTFParser.prototype.loadAccessor = function ( accessorIndex ) {

		var parser = this;
		var json = this.json;

		var accessorDef = this.json.accessors[ accessorIndex ];

		if ( accessorDef.bufferView === undefined && accessorDef.sparse === undefined ) {

			// Ignore empty accessors, which may be used to declare runtime
			// information about attributes coming from another source (e.g. Draco
			// compression extension).
			return Promise.resolve( null );

		}

		var pendingBufferViews = [];

		if ( accessorDef.bufferView !== undefined ) {

			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.bufferView ) );

		} else {

			pendingBufferViews.push( null );

		}

		if ( accessorDef.sparse !== undefined ) {

			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.indices.bufferView ) );
			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.values.bufferView ) );

		}

		return Promise.all( pendingBufferViews ).then( function ( bufferViews ) {

			var bufferView = bufferViews[ 0 ];

			var itemSize = WEBGL_TYPE_SIZES[ accessorDef.type ];
			var TypedArray = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];

			// For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
			var elementBytes = TypedArray.BYTES_PER_ELEMENT;
			var itemBytes = elementBytes * itemSize;
			var byteOffset = accessorDef.byteOffset || 0;
			var byteStride = accessorDef.bufferView !== undefined ? json.bufferViews[ accessorDef.bufferView ].byteStride : undefined;
			var normalized = accessorDef.normalized === true;
			var array, bufferAttribute;

			// The buffer is not interleaved if the stride is the item size in bytes.
			if ( byteStride && byteStride !== itemBytes ) {

				var ibCacheKey = 'InterleavedBuffer:' + accessorDef.bufferView + ':' + accessorDef.componentType;
				var ib = parser.cache.get( ibCacheKey );

				if ( ! ib ) {

					// Use the full buffer if it's interleaved.
					array = new TypedArray( bufferView );

					// Integer parameters to IB/IBA are in array elements, not bytes.
					ib = new InterleavedBuffer( array, byteStride / elementBytes );

					parser.cache.add( ibCacheKey, ib );

				}

				bufferAttribute = new InterleavedBufferAttribute( ib, itemSize, byteOffset / elementBytes, normalized );

			} else {

				if ( bufferView === null ) {

					array = new TypedArray( accessorDef.count * itemSize );

				} else {

					array = new TypedArray( bufferView, byteOffset, accessorDef.count * itemSize );

				}

				bufferAttribute = new BufferAttribute( array, itemSize, normalized );

			}

			// https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
			if ( accessorDef.sparse !== undefined ) {

				var itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
				var TypedArrayIndices = WEBGL_COMPONENT_TYPES[ accessorDef.sparse.indices.componentType ];

				var byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
				var byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;

				var sparseIndices = new TypedArrayIndices( bufferViews[ 1 ], byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices );
				var sparseValues = new TypedArray( bufferViews[ 2 ], byteOffsetValues, accessorDef.sparse.count * itemSize );

				if ( bufferView !== null ) {

					// Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
					bufferAttribute.setArray( bufferAttribute.array.slice() );

				}

				for ( var i = 0, il = sparseIndices.length; i < il; i ++ ) {

					var index = sparseIndices[ i ];

					bufferAttribute.setX( index, sparseValues[ i * itemSize ] );
					if ( itemSize >= 2 ) bufferAttribute.setY( index, sparseValues[ i * itemSize + 1 ] );
					if ( itemSize >= 3 ) bufferAttribute.setZ( index, sparseValues[ i * itemSize + 2 ] );
					if ( itemSize >= 4 ) bufferAttribute.setW( index, sparseValues[ i * itemSize + 3 ] );
					if ( itemSize >= 5 ) throw new Error( 'GLTFLoader: Unsupported itemSize in sparse BufferAttribute.' );

				}

			}

			return bufferAttribute;

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
	 * @param {number} textureIndex
	 * @return {Promise<Texture>}
	 */
	GLTFParser.prototype.loadTexture = function ( textureIndex ) {

		var parser = this;
		var json = this.json;
		var options = this.options;
		var textureLoader = this.textureLoader;

		var URL = window.URL || window.webkitURL;

		var textureDef = json.textures[ textureIndex ];

		var textureExtensions = textureDef.extensions || {};

		var source;

		if ( textureExtensions[ EXTENSIONS.MSFT_TEXTURE_DDS ] ) {

			source = json.images[ textureExtensions[ EXTENSIONS.MSFT_TEXTURE_DDS ].source ];

		} else {

			source = json.images[ textureDef.source ];

		}

		var sourceURI = source.uri;
		var isObjectURL = false;

		if ( source.bufferView !== undefined ) {

			// Load binary image data from bufferView, if provided.

			sourceURI = parser.getDependency( 'bufferView', source.bufferView ).then( function ( bufferView ) {

				isObjectURL = true;
				var blob = new Blob( [ bufferView ], { type: source.mimeType } );
				sourceURI = URL.createObjectURL( blob );
				return sourceURI;

			} );

		}

		return Promise.resolve( sourceURI ).then( function ( sourceURI ) {

			// Load Texture resource.

			var loader = Loader.Handlers.get( sourceURI );

			if ( ! loader ) {

				loader = textureExtensions[ EXTENSIONS.MSFT_TEXTURE_DDS ]
					? parser.extensions[ EXTENSIONS.MSFT_TEXTURE_DDS ].ddsLoader
					: textureLoader;

			}

			return new Promise( function ( resolve, reject ) {

				loader.load( resolveURL( sourceURI, options.path ), resolve, undefined, reject );

			} );

		} ).then( function ( texture ) {

			// Clean up resources and configure Texture.

			if ( isObjectURL === true ) {

				URL.revokeObjectURL( sourceURI );

			}

			texture.flipY = false;

			if ( textureDef.name !== undefined ) texture.name = textureDef.name;

			// Ignore unknown mime types, like DDS files.
			if ( source.mimeType in MIME_TYPE_FORMATS ) {

				texture.format = MIME_TYPE_FORMATS[ source.mimeType ];

			}

			var samplers = json.samplers || {};
			var sampler = samplers[ textureDef.sampler ] || {};

			texture.magFilter = WEBGL_FILTERS[ sampler.magFilter ] || LinearFilter;
			texture.minFilter = WEBGL_FILTERS[ sampler.minFilter ] || LinearMipMapLinearFilter;
			texture.wrapS = WEBGL_WRAPPINGS[ sampler.wrapS ] || RepeatWrapping;
			texture.wrapT = WEBGL_WRAPPINGS[ sampler.wrapT ] || RepeatWrapping;

			return texture;

		} );

	};

	/**
	 * Asynchronously assigns a texture to the given material parameters.
	 * @param {Object} materialParams
	 * @param {string} mapName
	 * @param {Object} mapDef
	 * @return {Promise}
	 */
	GLTFParser.prototype.assignTexture = function ( materialParams, mapName, mapDef ) {

		var parser = this;

		return this.getDependency( 'texture', mapDef.index ).then( function ( texture ) {

			if ( parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] ) {

				var transform = mapDef.extensions !== undefined ? mapDef.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] : undefined;

				if ( transform ) {

					texture = parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ].extendTexture( texture, transform );

				}

			}

			materialParams[ mapName ] = texture;

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
	 * @param {number} materialIndex
	 * @return {Promise<Material>}
	 */
	GLTFParser.prototype.loadMaterial = function ( materialIndex ) {

		var parser = this;
		var json = this.json;
		var extensions = this.extensions;
		var materialDef = json.materials[ materialIndex ];

		var materialType;
		var materialParams = {};
		var materialExtensions = materialDef.extensions || {};

		var pending = [];

		if ( materialExtensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ] ) {

			var sgExtension = extensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ];
			materialType = sgExtension.getMaterialType( materialDef );
			pending.push( sgExtension.extendParams( materialParams, materialDef, parser ) );

		} else if ( materialExtensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ] ) {

			var kmuExtension = extensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ];
			materialType = kmuExtension.getMaterialType( materialDef );
			pending.push( kmuExtension.extendParams( materialParams, materialDef, parser ) );

		} else {

			// Specification:
			// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material

			materialType = MeshStandardMaterial;

			var metallicRoughness = materialDef.pbrMetallicRoughness || {};

			materialParams.color = new Color( 1.0, 1.0, 1.0 );
			materialParams.opacity = 1.0;

			if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

				var array = metallicRoughness.baseColorFactor;

				materialParams.color.fromArray( array );
				materialParams.opacity = array[ 3 ];

			}

			if ( metallicRoughness.baseColorTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture ) );

			}

			materialParams.metalness = metallicRoughness.metallicFactor !== undefined ? metallicRoughness.metallicFactor : 1.0;
			materialParams.roughness = metallicRoughness.roughnessFactor !== undefined ? metallicRoughness.roughnessFactor : 1.0;

			if ( metallicRoughness.metallicRoughnessTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'metalnessMap', metallicRoughness.metallicRoughnessTexture ) );
				pending.push( parser.assignTexture( materialParams, 'roughnessMap', metallicRoughness.metallicRoughnessTexture ) );

			}

		}

		if ( materialDef.doubleSided === true ) {

			materialParams.side = DoubleSide;

		}

		var alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;

		if ( alphaMode === ALPHA_MODES.BLEND ) {

			materialParams.transparent = true;

		} else {

			materialParams.transparent = false;

			if ( alphaMode === ALPHA_MODES.MASK ) {

				materialParams.alphaTest = materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;

			}

		}

		if ( materialDef.normalTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'normalMap', materialDef.normalTexture ) );

			materialParams.normalScale = new Vector2( 1, 1 );

			if ( materialDef.normalTexture.scale !== undefined ) {

				materialParams.normalScale.set( materialDef.normalTexture.scale, materialDef.normalTexture.scale );

			}

		}

		if ( materialDef.occlusionTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'aoMap', materialDef.occlusionTexture ) );

			if ( materialDef.occlusionTexture.strength !== undefined ) {

				materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;

			}

		}

		if ( materialDef.emissiveFactor !== undefined && materialType !== MeshBasicMaterial ) {

			materialParams.emissive = new Color().fromArray( materialDef.emissiveFactor );

		}

		if ( materialDef.emissiveTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'emissiveMap', materialDef.emissiveTexture ) );

		}

		return Promise.all( pending ).then( function () {

			var material;

			if ( materialType === ShaderMaterial ) {

				material = extensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ].createMaterial( materialParams );

			} else {

				material = new materialType( materialParams );

			}

			if ( materialDef.name !== undefined ) material.name = materialDef.name;

			// Normal map textures use OpenGL conventions:
			// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#materialnormaltexture
			if ( material.normalScale ) {

				material.normalScale.y = - material.normalScale.y;

			}

			// baseColorTexture, emissiveTexture, and specularGlossinessTexture use sRGB encoding.
			if ( material.map ) material.map.encoding = sRGBEncoding;
			if ( material.emissiveMap ) material.emissiveMap.encoding = sRGBEncoding;
			if ( material.specularMap ) material.specularMap.encoding = sRGBEncoding;

			assignExtrasToUserData( material, materialDef );

			if ( materialDef.extensions ) addUnknownExtensionsToUserData( extensions, material, materialDef );

			return material;

		} );

	};

	/**
	 * @param {BufferGeometry} geometry
	 * @param {GLTF.Primitive} primitiveDef
	 * @param {GLTFParser} parser
	 * @return {Promise<BufferGeometry>}
	 */
	function addPrimitiveAttributes( geometry, primitiveDef, parser ) {

		var attributes = primitiveDef.attributes;

		var pending = [];

		function assignAttributeAccessor( accessorIndex, attributeName ) {

			return parser.getDependency( 'accessor', accessorIndex )
				.then( function ( accessor ) {

					geometry.addAttribute( attributeName, accessor );

				} );

		}

		for ( var gltfAttributeName in attributes ) {

			var threeAttributeName = ATTRIBUTES[ gltfAttributeName ];

			if ( ! threeAttributeName ) continue;

			// Skip attributes already provided by e.g. Draco extension.
			if ( threeAttributeName in geometry.attributes ) continue;

			pending.push( assignAttributeAccessor( attributes[ gltfAttributeName ], threeAttributeName ) );

		}

		if ( primitiveDef.indices !== undefined && ! geometry.index ) {

			var accessor = parser.getDependency( 'accessor', primitiveDef.indices ).then( function ( accessor ) {

				geometry.setIndex( accessor );

			} );

			pending.push( accessor );

		}

		assignExtrasToUserData( geometry, primitiveDef );

		return Promise.all( pending ).then( function () {

			return primitiveDef.targets !== undefined
				? addMorphTargets( geometry, primitiveDef.targets, parser )
				: geometry;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
	 *
	 * Creates BufferGeometries from primitives.
	 * If we can build a single BufferGeometry with .groups from multiple primitives, returns one BufferGeometry.
	 * Otherwise, returns BufferGeometries without .groups as many as primitives.
	 *
	 * @param {Array<GLTF.Primitive>} primitives
	 * @return {Promise<Array<BufferGeometry>>}
	 */
	GLTFParser.prototype.loadGeometries = function ( primitives ) {

		var parser = this;
		var extensions = this.extensions;
		var cache = this.primitiveCache;

		var isMultiPass = isMultiPassGeometry( primitives );
		var originalPrimitives;

		if ( isMultiPass ) {

			originalPrimitives = primitives; // save original primitives and use later

			// We build a single BufferGeometry with .groups from multiple primitives
			// because all primitives share the same attributes/morph/mode and have indices.

			primitives = [ primitives[ 0 ] ];

			// Sets .groups and combined indices to a geometry later in this method.

		}

		function createDracoPrimitive( primitive ) {

			return extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ]
				.decodePrimitive( primitive, parser )
				.then( function ( geometry ) {

					return addPrimitiveAttributes( geometry, primitive, parser );

				} );

		}

		var pending = [];

		for ( var i = 0, il = primitives.length; i < il; i ++ ) {

			var primitive = primitives[ i ];

			// See if we've already created this geometry
			var cached = getCachedGeometry( cache, primitive );

			if ( cached ) {

				// Use the cached geometry if it exists
				pending.push( cached );

			} else {

				var geometryPromise;

				if ( primitive.extensions && primitive.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ] ) {

					// Use DRACO geometry if available
					geometryPromise = createDracoPrimitive( primitive );

				} else {

					// Otherwise create a new geometry
					geometryPromise = addPrimitiveAttributes( new BufferGeometry(), primitive, parser );

				}

				// Cache this geometry
				cache.push( { primitive: primitive, promise: geometryPromise } );

				pending.push( geometryPromise );

			}

		}

		return Promise.all( pending ).then( function ( geometries ) {

			if ( isMultiPass ) {

				var baseGeometry = geometries[ 0 ];

				// See if we've already created this combined geometry
				var cache = parser.multiPassGeometryCache;
				var cached = getCachedMultiPassGeometry( cache, baseGeometry, originalPrimitives );

				if ( cached !== null ) return [ cached.geometry ];

				// Cloning geometry because of index override.
				// Attributes can be reused so cloning by myself here.
				var geometry = new BufferGeometry();

				geometry.name = baseGeometry.name;
				geometry.userData = baseGeometry.userData;

				for ( var key in baseGeometry.attributes ) geometry.addAttribute( key, baseGeometry.attributes[ key ] );
				for ( var key in baseGeometry.morphAttributes ) geometry.morphAttributes[ key ] = baseGeometry.morphAttributes[ key ];

				var pendingIndices = [];

				for ( var i = 0, il = originalPrimitives.length; i < il; i ++ ) {

					pendingIndices.push( parser.getDependency( 'accessor', originalPrimitives[ i ].indices ) );

				}

				return Promise.all( pendingIndices ).then( function ( accessors ) {

					var indices = [];
					var offset = 0;

					for ( var i = 0, il = originalPrimitives.length; i < il; i ++ ) {

						var accessor = accessors[ i ];

						for ( var j = 0, jl = accessor.count; j < jl; j ++ ) indices.push( accessor.array[ j ] );

						geometry.addGroup( offset, accessor.count, i );

						offset += accessor.count;

					}

					geometry.setIndex( indices );

					cache.push( { geometry: geometry, baseGeometry: baseGeometry, primitives: originalPrimitives } );

					return [ geometry ];

				} );

			} else if ( geometries.length > 1 && BufferGeometryUtils !== undefined ) {

				// Tries to merge geometries with BufferGeometryUtils if possible

				for ( var i = 1, il = primitives.length; i < il; i ++ ) {

					// can't merge if draw mode is different
					if ( primitives[ 0 ].mode !== primitives[ i ].mode ) return geometries;

				}

				// See if we've already created this combined geometry
				var cache = parser.multiplePrimitivesCache;
				var cached = getCachedCombinedGeometry( cache, geometries );

				if ( cached ) {

					if ( cached.geometry !== null ) return [ cached.geometry ];

				} else {

					var geometry = BufferGeometryUtils.mergeBufferGeometries( geometries, true );

					cache.push( { geometry: geometry, baseGeometries: geometries } );

					if ( geometry !== null ) return [ geometry ];

				}

			}

			return geometries;

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
	 * @param {number} meshIndex
	 * @return {Promise<Group|Mesh|SkinnedMesh>}
	 */
	GLTFParser.prototype.loadMesh = function ( meshIndex ) {

		var parser = this;
		var json = this.json;
		var extensions = this.extensions;

		var meshDef = json.meshes[ meshIndex ];
		var primitives = meshDef.primitives;

		var pending = [];

		for ( var i = 0, il = primitives.length; i < il; i ++ ) {

			var material = primitives[ i ].material === undefined
				? createDefaultMaterial()
				: this.getDependency( 'material', primitives[ i ].material );

			pending.push( material );

		}

		return Promise.all( pending ).then( function ( originalMaterials ) {

			return parser.loadGeometries( primitives ).then( function ( geometries ) {

				var isMultiMaterial = geometries.length === 1 && geometries[ 0 ].groups.length > 0;

				var meshes = [];

				for ( var i = 0, il = geometries.length; i < il; i ++ ) {

					var geometry = geometries[ i ];
					var primitive = primitives[ i ];

					// 1. create Mesh

					var mesh;

					var material = isMultiMaterial ? originalMaterials : originalMaterials[ i ];

					if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLES ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
						primitive.mode === undefined ) {

						// .isSkinnedMesh isn't in glTF spec. See .markDefs()
						mesh = meshDef.isSkinnedMesh === true
							? new SkinnedMesh( geometry, material )
							: new Mesh( geometry, material );

						if ( mesh.isSkinnedMesh === true ) mesh.normalizeSkinWeights(); // #15319

						if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ) {

							mesh.drawMode = TriangleStripDrawMode;

						} else if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ) {

							mesh.drawMode = TriangleFanDrawMode;

						}

					} else if ( primitive.mode === WEBGL_CONSTANTS.LINES ) {

						mesh = new LineSegments( geometry, material );

					} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_STRIP ) {

						mesh = new Line( geometry, material );

					} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_LOOP ) {

						mesh = new LineLoop( geometry, material );

					} else if ( primitive.mode === WEBGL_CONSTANTS.POINTS ) {

						mesh = new Points( geometry, material );

					} else {

						throw new Error( 'GLTFLoader: Primitive mode unsupported: ' + primitive.mode );

					}

					if ( Object.keys( mesh.geometry.morphAttributes ).length > 0 ) {

						updateMorphTargets( mesh, meshDef );

					}

					mesh.name = meshDef.name || ( 'mesh_' + meshIndex );

					if ( geometries.length > 1 ) mesh.name += '_' + i;

					assignExtrasToUserData( mesh, meshDef );

					meshes.push( mesh );

					// 2. update Material depending on Mesh and BufferGeometry

					var materials = isMultiMaterial ? mesh.material : [ mesh.material ];

					var useVertexColors = geometry.attributes.color !== undefined;
					var useFlatShading = geometry.attributes.normal === undefined;
					var useSkinning = mesh.isSkinnedMesh === true;
					var useMorphTargets = Object.keys( geometry.morphAttributes ).length > 0;
					var useMorphNormals = useMorphTargets && geometry.morphAttributes.normal !== undefined;

					for ( var j = 0, jl = materials.length; j < jl; j ++ ) {

						var material = materials[ j ];

						if ( mesh.isPoints ) {

							var cacheKey = 'PointsMaterial:' + material.uuid;

							var pointsMaterial = parser.cache.get( cacheKey );

							if ( ! pointsMaterial ) {

								pointsMaterial = new PointsMaterial();
								Material.prototype.copy.call( pointsMaterial, material );
								pointsMaterial.color.copy( material.color );
								pointsMaterial.map = material.map;
								pointsMaterial.lights = false; // PointsMaterial doesn't support lights yet

								parser.cache.add( cacheKey, pointsMaterial );

							}

							material = pointsMaterial;

						} else if ( mesh.isLine ) {

							var cacheKey = 'LineBasicMaterial:' + material.uuid;

							var lineMaterial = parser.cache.get( cacheKey );

							if ( ! lineMaterial ) {

								lineMaterial = new LineBasicMaterial();
								Material.prototype.copy.call( lineMaterial, material );
								lineMaterial.color.copy( material.color );
								lineMaterial.lights = false; // LineBasicMaterial doesn't support lights yet

								parser.cache.add( cacheKey, lineMaterial );

							}

							material = lineMaterial;

						}

						// Clone the material if it will be modified
						if ( useVertexColors || useFlatShading || useSkinning || useMorphTargets ) {

							var cacheKey = 'ClonedMaterial:' + material.uuid + ':';

							if ( material.isGLTFSpecularGlossinessMaterial ) cacheKey += 'specular-glossiness:';
							if ( useSkinning ) cacheKey += 'skinning:';
							if ( useVertexColors ) cacheKey += 'vertex-colors:';
							if ( useFlatShading ) cacheKey += 'flat-shading:';
							if ( useMorphTargets ) cacheKey += 'morph-targets:';
							if ( useMorphNormals ) cacheKey += 'morph-normals:';

							var cachedMaterial = parser.cache.get( cacheKey );

							if ( ! cachedMaterial ) {

								cachedMaterial = material.isGLTFSpecularGlossinessMaterial
									? extensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ].cloneMaterial( material )
									: material.clone();

								if ( useSkinning ) cachedMaterial.skinning = true;
								if ( useVertexColors ) cachedMaterial.vertexColors = VertexColors;
								if ( useFlatShading ) cachedMaterial.flatShading = true;
								if ( useMorphTargets ) cachedMaterial.morphTargets = true;
								if ( useMorphNormals ) cachedMaterial.morphNormals = true;

								parser.cache.add( cacheKey, cachedMaterial );

							}

							material = cachedMaterial;

						}

						materials[ j ] = material;

						// workarounds for mesh and geometry

						if ( material.aoMap && geometry.attributes.uv2 === undefined && geometry.attributes.uv !== undefined ) {

							console.log( 'GLTFLoader: Duplicating UVs to support aoMap.' );
							geometry.addAttribute( 'uv2', new BufferAttribute( geometry.attributes.uv.array, 2 ) );

						}

						if ( material.isGLTFSpecularGlossinessMaterial ) {

							// for GLTFSpecularGlossinessMaterial(ShaderMaterial) uniforms runtime update
							mesh.onBeforeRender = extensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ].refreshUniforms;

						}

					}

					mesh.material = isMultiMaterial ? materials : materials[ 0 ];

				}

				if ( meshes.length === 1 ) {

					return meshes[ 0 ];

				}

				var group = new Group();

				for ( var i = 0, il = meshes.length; i < il; i ++ ) {

					group.add( meshes[ i ] );

				}

				return group;

			} );

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
	 * @param {number} cameraIndex
	 * @return {Promise<Camera>}
	 */
	GLTFParser.prototype.loadCamera = function ( cameraIndex ) {

		var camera;
		var cameraDef = this.json.cameras[ cameraIndex ];
		var params = cameraDef[ cameraDef.type ];

		if ( ! params ) {

			console.warn( 'GLTFLoader: Missing camera parameters.' );
			return;

		}

		if ( cameraDef.type === 'perspective' ) {

			camera = new PerspectiveCamera( Math$1.radToDeg( params.yfov ), params.aspectRatio || 1, params.znear || 1, params.zfar || 2e6 );

		} else if ( cameraDef.type === 'orthographic' ) {

			camera = new OrthographicCamera( params.xmag / - 2, params.xmag / 2, params.ymag / 2, params.ymag / - 2, params.znear, params.zfar );

		}

		if ( cameraDef.name !== undefined ) camera.name = cameraDef.name;

		assignExtrasToUserData( camera, cameraDef );

		return Promise.resolve( camera );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
	 * @param {number} skinIndex
	 * @return {Promise<Object>}
	 */
	GLTFParser.prototype.loadSkin = function ( skinIndex ) {

		var skinDef = this.json.skins[ skinIndex ];

		var skinEntry = { joints: skinDef.joints };

		if ( skinDef.inverseBindMatrices === undefined ) {

			return Promise.resolve( skinEntry );

		}

		return this.getDependency( 'accessor', skinDef.inverseBindMatrices ).then( function ( accessor ) {

			skinEntry.inverseBindMatrices = accessor;

			return skinEntry;

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
	 * @param {number} animationIndex
	 * @return {Promise<AnimationClip>}
	 */
	GLTFParser.prototype.loadAnimation = function ( animationIndex ) {

		var json = this.json;

		var animationDef = json.animations[ animationIndex ];

		var pendingNodes = [];
		var pendingInputAccessors = [];
		var pendingOutputAccessors = [];
		var pendingSamplers = [];
		var pendingTargets = [];

		for ( var i = 0, il = animationDef.channels.length; i < il; i ++ ) {

			var channel = animationDef.channels[ i ];
			var sampler = animationDef.samplers[ channel.sampler ];
			var target = channel.target;
			var name = target.node !== undefined ? target.node : target.id; // NOTE: target.id is deprecated.
			var input = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.input ] : sampler.input;
			var output = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.output ] : sampler.output;

			pendingNodes.push( this.getDependency( 'node', name ) );
			pendingInputAccessors.push( this.getDependency( 'accessor', input ) );
			pendingOutputAccessors.push( this.getDependency( 'accessor', output ) );
			pendingSamplers.push( sampler );
			pendingTargets.push( target );

		}

		return Promise.all( [

			Promise.all( pendingNodes ),
			Promise.all( pendingInputAccessors ),
			Promise.all( pendingOutputAccessors ),
			Promise.all( pendingSamplers ),
			Promise.all( pendingTargets )

		] ).then( function ( dependencies ) {

			var nodes = dependencies[ 0 ];
			var inputAccessors = dependencies[ 1 ];
			var outputAccessors = dependencies[ 2 ];
			var samplers = dependencies[ 3 ];
			var targets = dependencies[ 4 ];

			var tracks = [];

			for ( var i = 0, il = nodes.length; i < il; i ++ ) {

				var node = nodes[ i ];
				var inputAccessor = inputAccessors[ i ];
				var outputAccessor = outputAccessors[ i ];
				var sampler = samplers[ i ];
				var target = targets[ i ];

				if ( node === undefined ) continue;

				node.updateMatrix();
				node.matrixAutoUpdate = true;

				var TypedKeyframeTrack;

				switch ( PATH_PROPERTIES[ target.path ] ) {

					case PATH_PROPERTIES.weights:

						TypedKeyframeTrack = NumberKeyframeTrack;
						break;

					case PATH_PROPERTIES.rotation:

						TypedKeyframeTrack = QuaternionKeyframeTrack;
						break;

					case PATH_PROPERTIES.position:
					case PATH_PROPERTIES.scale:
					default:

						TypedKeyframeTrack = VectorKeyframeTrack;
						break;

				}

				var targetName = node.name ? node.name : node.uuid;

				var interpolation = sampler.interpolation !== undefined ? INTERPOLATION[ sampler.interpolation ] : InterpolateLinear;

				var targetNames = [];

				if ( PATH_PROPERTIES[ target.path ] === PATH_PROPERTIES.weights ) {

					// node can be Group here but
					// PATH_PROPERTIES.weights(morphTargetInfluences) should be
					// the property of a mesh object under group.

					node.traverse( function ( object ) {

						if ( object.isMesh === true && object.morphTargetInfluences ) {

							targetNames.push( object.name ? object.name : object.uuid );

						}

					} );

				} else {

					targetNames.push( targetName );

				}

				// KeyframeTrack.optimize() will modify given 'times' and 'values'
				// buffers before creating a truncated copy to keep. Because buffers may
				// be reused by other tracks, make copies here.
				for ( var j = 0, jl = targetNames.length; j < jl; j ++ ) {

					var track = new TypedKeyframeTrack(
						targetNames[ j ] + '.' + PATH_PROPERTIES[ target.path ],
						AnimationUtils.arraySlice( inputAccessor.array, 0 ),
						AnimationUtils.arraySlice( outputAccessor.array, 0 ),
						interpolation
					);

					// Here is the trick to enable custom interpolation.
					// Overrides .createInterpolant in a factory method which creates custom interpolation.
					if ( sampler.interpolation === 'CUBICSPLINE' ) {

						track.createInterpolant = function InterpolantFactoryMethodGLTFCubicSpline( result ) {

							// A CUBICSPLINE keyframe in glTF has three output values for each input value,
							// representing inTangent, splineVertex, and outTangent. As a result, track.getValueSize()
							// must be divided by three to get the interpolant's sampleSize argument.

							return new GLTFCubicSplineInterpolant( this.times, this.values, this.getValueSize() / 3, result );

						};

						// Workaround, provide an alternate way to know if the interpolant type is cubis spline to track.
						// track.getInterpolation() doesn't return valid value for custom interpolant.
						track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;

					}

					tracks.push( track );

				}

			}

			var name = animationDef.name !== undefined ? animationDef.name : 'animation_' + animationIndex;

			return new AnimationClip( name, undefined, tracks );

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
	 * @param {number} nodeIndex
	 * @return {Promise<Object3D>}
	 */
	GLTFParser.prototype.loadNode = function ( nodeIndex ) {

		var json = this.json;
		var extensions = this.extensions;
		var parser = this;

		var meshReferences = json.meshReferences;
		var meshUses = json.meshUses;

		var nodeDef = json.nodes[ nodeIndex ];

		return ( function () {

			// .isBone isn't in glTF spec. See .markDefs
			if ( nodeDef.isBone === true ) {

				return Promise.resolve( new Bone() );

			} else if ( nodeDef.mesh !== undefined ) {

				return parser.getDependency( 'mesh', nodeDef.mesh ).then( function ( mesh ) {

					var node;

					if ( meshReferences[ nodeDef.mesh ] > 1 ) {

						var instanceNum = meshUses[ nodeDef.mesh ] ++;

						node = mesh.clone();
						node.name += '_instance_' + instanceNum;

						// onBeforeRender copy for Specular-Glossiness
						node.onBeforeRender = mesh.onBeforeRender;

						for ( var i = 0, il = node.children.length; i < il; i ++ ) {

							node.children[ i ].name += '_instance_' + instanceNum;
							node.children[ i ].onBeforeRender = mesh.children[ i ].onBeforeRender;

						}

					} else {

						node = mesh;

					}

					// if weights are provided on the node, override weights on the mesh.
					if ( nodeDef.weights !== undefined ) {

						node.traverse( function ( o ) {

							if ( ! o.isMesh ) return;

							for ( var i = 0, il = nodeDef.weights.length; i < il; i ++ ) {

								o.morphTargetInfluences[ i ] = nodeDef.weights[ i ];

							}

						} );

					}

					return node;

				} );

			} else if ( nodeDef.camera !== undefined ) {

				return parser.getDependency( 'camera', nodeDef.camera );

			} else if ( nodeDef.extensions
				&& nodeDef.extensions[ EXTENSIONS.KHR_LIGHTS_PUNCTUAL ]
				&& nodeDef.extensions[ EXTENSIONS.KHR_LIGHTS_PUNCTUAL ].light !== undefined ) {

				return parser.getDependency( 'light', nodeDef.extensions[ EXTENSIONS.KHR_LIGHTS_PUNCTUAL ].light );

			} else {

				return Promise.resolve( new Object3D() );

			}

		}() ).then( function ( node ) {

			if ( nodeDef.name !== undefined ) {

				node.name = PropertyBinding.sanitizeNodeName( nodeDef.name );

			}

			assignExtrasToUserData( node, nodeDef );

			if ( nodeDef.extensions ) addUnknownExtensionsToUserData( extensions, node, nodeDef );

			if ( nodeDef.matrix !== undefined ) {

				var matrix = new Matrix4();
				matrix.fromArray( nodeDef.matrix );
				node.applyMatrix( matrix );

			} else {

				if ( nodeDef.translation !== undefined ) {

					node.position.fromArray( nodeDef.translation );

				}

				if ( nodeDef.rotation !== undefined ) {

					node.quaternion.fromArray( nodeDef.rotation );

				}

				if ( nodeDef.scale !== undefined ) {

					node.scale.fromArray( nodeDef.scale );

				}

			}

			return node;

		} );

	};

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
	 * @param {number} sceneIndex
	 * @return {Promise<Scene>}
	 */
	GLTFParser.prototype.loadScene = function () {

		// scene node hierachy builder

		function buildNodeHierachy( nodeId, parentObject, json, parser ) {

			var nodeDef = json.nodes[ nodeId ];

			return parser.getDependency( 'node', nodeId ).then( function ( node ) {

				if ( nodeDef.skin === undefined ) return node;

				// build skeleton here as well

				var skinEntry;

				return parser.getDependency( 'skin', nodeDef.skin ).then( function ( skin ) {

					skinEntry = skin;

					var pendingJoints = [];

					for ( var i = 0, il = skinEntry.joints.length; i < il; i ++ ) {

						pendingJoints.push( parser.getDependency( 'node', skinEntry.joints[ i ] ) );

					}

					return Promise.all( pendingJoints );

				} ).then( function ( jointNodes ) {

					var meshes = node.isGroup === true ? node.children : [ node ];

					for ( var i = 0, il = meshes.length; i < il; i ++ ) {

						var mesh = meshes[ i ];

						var bones = [];
						var boneInverses = [];

						for ( var j = 0, jl = jointNodes.length; j < jl; j ++ ) {

							var jointNode = jointNodes[ j ];

							if ( jointNode ) {

								bones.push( jointNode );

								var mat = new Matrix4();

								if ( skinEntry.inverseBindMatrices !== undefined ) {

									mat.fromArray( skinEntry.inverseBindMatrices.array, j * 16 );

								}

								boneInverses.push( mat );

							} else {

								console.warn( 'GLTFLoader: Joint "%s" could not be found.', skinEntry.joints[ j ] );

							}

						}

						mesh.bind( new Skeleton( bones, boneInverses ), mesh.matrixWorld );

					}
					return node;

				} );

			} ).then( function ( node ) {

				// build node hierachy

				parentObject.add( node );

				var pending = [];

				if ( nodeDef.children ) {

					var children = nodeDef.children;

					for ( var i = 0, il = children.length; i < il; i ++ ) {

						var child = children[ i ];
						pending.push( buildNodeHierachy( child, node, json, parser ) );

					}

				}

				return Promise.all( pending );

			} );

		}

		return function loadScene( sceneIndex ) {

			var json = this.json;
			var extensions = this.extensions;
			var sceneDef = this.json.scenes[ sceneIndex ];
			var parser = this;

			var scene = new Scene();
			if ( sceneDef.name !== undefined ) scene.name = sceneDef.name;

			assignExtrasToUserData( scene, sceneDef );

			if ( sceneDef.extensions ) addUnknownExtensionsToUserData( extensions, scene, sceneDef );

			var nodeIds = sceneDef.nodes || [];

			var pending = [];

			for ( var i = 0, il = nodeIds.length; i < il; i ++ ) {

				pending.push( buildNodeHierachy( nodeIds[ i ], scene, json, parser ) );

			}

			return Promise.all( pending ).then( function () {

				return scene;

			} );

		};

	}();

	return GLTFLoader;

} )();

class Binding {
  constructor(source, sourceProp) {
    this.source = source;
    this.sourceProp = sourceProp;
    this.targets = [];
    this.targetsMap = new WeakMap();
    this.updateSource = this.updateSource.bind(this);
    this.updateTargets = this.updateTargets.bind(this);
    this.setSource(this.source);
  }
  get value() {
    return this.source[this.sourceProp];
  }
  setSource() {
    this.source.addEventListener(this.sourceProp + '-changed', this.updateTargets);
    for (let i = this.targets.length; i--;) {
      const targetProps = this.targetsMap.get(this.targets[i]);
      for (let j = targetProps.length; j--;) {
        this.targets[i].__properties[targetProps[j]].value = this.source[this.sourceProp];
        // TODO: test observers on binding hot-swap!
      }
    }
  }
  setTarget(target, targetProp) {
    if (this.targets.indexOf(target) === -1) this.targets.push(target);
    if (this.targetsMap.has(target)) {
      const targetProps = this.targetsMap.get(target);
      if (targetProps.indexOf(targetProp) === -1) { // safe check needed?
        targetProps.push(targetProp);
        target.addEventListener(targetProp + '-changed', this.updateSource);
      }
    } else {
      this.targetsMap.set(target, [targetProp]);
      target.addEventListener(targetProp + '-changed', this.updateSource);
    }
  }
  removeTarget(target, targetProp) {
    if (this.targetsMap.has(target)) {
      const targetProps = this.targetsMap.get(target);
      const index = targetProps.indexOf(targetProp);
      if (index !== -1) {
        targetProps.splice(index, 1);
      }
      if (targetProps.length === 0) this.targets.splice(this.targets.indexOf(target), 1);
      target.removeEventListener(targetProp + '-changed', this.updateSource);
    }
  }
  updateSource(event) {
    if (this.targets.indexOf(event.target) === -1) return;
    const value = event.detail.value;
    if (this.source[this.sourceProp] !== value) {
      this.source[this.sourceProp] = value;
    }
  }
  updateTargets(event) {
    if (event.target != this.source) return;
    const value = event.detail.value;
    for (let i = this.targets.length; i--;) {
      const targetProps = this.targetsMap.get(this.targets[i]);
      for (let j = targetProps.length; j--;) {
        let oldValue = this.targets[i][targetProps[j]];
        if (oldValue !== value) {
          // JavaScript is weird NaN != NaN
          if (typeof value == 'number' && typeof oldValue == 'number' && isNaN(value) && isNaN(oldValue)) continue;
          this.targets[i][targetProps[j]] = value;
        }
      }
    }
  }
  // TODO: dispose bindings correctly
}

// Creates a list of functions defined in prototype chain (for the purpose of binding to instance).
// TODO: consider improving
class Functions extends Array {
  constructor(protochain) {
    super();
    for (let i = protochain.length; i--;) {
      const names = Object.getOwnPropertyNames(protochain[i]);
      for (let j = 0; j < names.length; j++) {
        if (names[j] === 'constructor') continue;
        const p = Object.getOwnPropertyDescriptor(protochain[i], names[j]);
        if (p.get || p.set) continue;
        if (typeof protochain[i][names[j]] !== 'function') continue;
        if (protochain[i][names[j]].name === 'anonymous') continue;
        if (this.indexOf(names[j]) === -1) this.push(names[j]);
        if (names[j] === 'value') console.log(protochain[i][names[j]]);
      }
    }
  }
  bind(element) {
    for (let i = 0; i < this.length; i++) {
      element[this[i]] = element[this[i]].bind(element);
    }
  }
}

// Creates a list of listeners passed to element instance as arguments.
// Creates a list of listeners defined in prototype chain.
class Listeners {
  constructor(protochain) {
    if (protochain) {
      for (let i = protochain.length; i--;) {
        const prop = protochain[i].constructor.listeners;
        for (let j in prop) this[j] = prop[j];
      }
    }
  }
  setListeners(props) {
    // TODO remove old listeners
    for (let l in props) {
      if (l.startsWith('on-')) {
        this[l.slice(3, l.length)] = props[l];
      }
    }
  }
  connect(element) {
    for (let i in this) {
      const listener = typeof this[i] === 'function' ? this[i] : element[this[i]];
      element.addEventListener(i, listener);
    }
  }
  disconnect(element) {
    for (let i in this) {
      const listener = typeof this[i] === 'function' ? this[i] : element[this[i]];
      element.removeEventListener(i, listener);
    }
  }
}

// Creates a properties object with configurations inherited from protochain.
// TODO: make test

class Properties {
  constructor(protochain) {
    const propertyDefs = {};
    for (let i = protochain.length; i--;) {
      const prop = protochain[i].constructor.properties;
      for (let key in prop) {
        const propDef = new Property(prop[key], true);
        if (propertyDefs[key]) propertyDefs[key].assign(propDef);
        else propertyDefs[key] = propDef;
      }
    }
    for (let key in propertyDefs) {
      this[key] = new Property(propertyDefs[key]);
    }
  }
  clone() {
    const properties = new Properties([]);
    for (let prop in this) {
      properties[prop] = this[prop].clone();
    }
    return properties;
  }
}

/*
 Creates a property configuration object with following properties:
 {
   value: property value
   type: constructor of the value
   reflect: reflect to HTML element attribute
   binding: binding object if bound (internal)
 }
 */
class Property {
  constructor(propDef) {
    if (propDef === null || propDef === undefined) {
      propDef = {value: propDef};
    } else if (typeof propDef === 'function') {
      propDef = {type: propDef};
    } else if (propDef instanceof Array) {
      propDef = {type: Array, value: [...propDef]};
    } else if (typeof propDef !== 'object') {
      propDef = {value: propDef, type: propDef.constructor};
    }
    this.value = propDef.value;
    this.type = propDef.type;
    this.reflect = propDef.reflect;
    this.binding = propDef.binding;
    this.config = propDef.config;
    this.enumerable = propDef.enumerable !== undefined ? propDef.enumerable : true;
  }
  // Helper function to assign new values as we walk up the inheritance chain.
  assign(propDef) {
    if (propDef.value !== undefined) this.value = propDef.value;
    if (propDef.type !== undefined) this.type = propDef.type;
    if (propDef.reflect !== undefined) this.reflect = propDef.reflect;
    if (propDef.binding !== undefined) this.binding = propDef.binding;
    if (propDef.config !== undefined) this.config = propDef.config;
    if (propDef.enumerable !== undefined) this.enumerable = propDef.enumerable;
  }
  // Clones the property. If property value is objects it does one level deep object clone.
  clone() {
    const prop = new Property(this);

    if (prop.type === Array && prop.value) {
      prop.value = [...prop.value];
    }

    // TODO: test
    if (prop.type === undefined && prop.value !== undefined && prop.value !== null) {
      prop.type = prop.value.constructor;
    }

    // Set default values.
    if (prop.value === undefined && prop.type) {
      if (prop.type === Boolean) prop.value = false;
      else if (prop.type === String) prop.value = '';
      else if (prop.type === Number) prop.value = 0;
      else if (prop.type === Array) prop.value = [];
      else if (prop.type === Object) prop.value = {};
      else if (prop.type !== HTMLElement && prop.type !== Function) {
        prop.value = new prop.type();
      }
    }

    return prop;
  }
}

const IoCoreMixin = (superclass) => class extends superclass {
  static get properties() {
    return {};
  }
  get bindings() {
    return;
  }
  constructor(initProps = {}) {
    super();

    if (!this.constructor.prototype.__registered) this.constructor.Register();

    Object.defineProperty(this, '__bindings', {value: {}});
    Object.defineProperty(this, '__activeListeners', {value: {}});
    Object.defineProperty(this, '__queue', {value: []});

    this.__functions.bind(this);

    Object.defineProperty(this, '__propListeners', {value: new Listeners()});
    this.__propListeners.setListeners(initProps);

    Object.defineProperty(this, '__properties', {value: this.__properties.clone()});

    // This triggers change events for object values initialized from type constructor.
    for (let i = 0; i < this.__objectProps.length; i++) {
      const p = this.__objectProps[i];
      if (this.__properties[p].value) this.queue(p, this.__properties[p].value, undefined);
    }

    if (this.bindings) {
      this._bindNodes(this.bindings);
    }

    this.setProperties(initProps);

    if (superclass !== HTMLElement) this.connect(); // TODO: test
  }
  connect() {
    this.connectedCallback();
  }
  disconnect() {
    this.disconnectedCallback();
  }
  preventDefault(event) {
    event.preventDefault();
  }
  changed() {}
  bind(prop) {
    this.__bindings[prop] = this.__bindings[prop] || new Binding(this, prop);
    return this.__bindings[prop];
  }
  set(prop, value) {
    if (this[prop] !== value) {
      const oldValue = this[prop];
      this[prop] = value;
      this.dispatchEvent(prop + '-set', {property: prop, value: value, oldValue: oldValue}, false);
    }
  }
  setProperties(props) {

    for (let p in props) {

      if (this.__properties[p] === undefined) continue;

      let oldBinding = this.__properties[p].binding;
      let oldValue = this.__properties[p].value;

      let binding;
      let value;

      if (props[p] instanceof Binding) {
        binding = props[p];
        value = props[p].source[props[p].sourceProp];
      } else {
        value = props[p];
      }

      this.__properties[p].binding = binding;
      this.__properties[p].value = value;

      if (value !== oldValue) {
        if (this.__properties[p].reflect) this.setAttribute(p, value);
        this.queue(p, value, oldValue);
      }

      if (binding !== oldBinding) {
        if (binding) binding.setTarget(this, p);
        if (oldBinding) {
          oldBinding.removeTarget(this, p); // TODO: test extensively
        }
      }
    }

    this.className = props['className'] || '';

    if (props['style']) {
      for (let s in props['style']) {
        this.style[s] = props['style'][s];
        this.style.setProperty(s, props['style'][s]);
      }
    }

    this.queueDispatch();
  }
  // TODO: test extensively
  _bindNodes(nodes) {
    for (let n in nodes) {
      const properties = nodes[n];
      this[n].setProperties(properties);
      this.addEventListener(n + '-changed', (event) => {
        if (event.detail.oldValue) {
          event.detail.oldValue.dispose(); // TODO: test
        }
        event.detail.value.setProperties(properties);
      });
    }
  }
  connectedCallback() {
    this.__protoListeners.connect(this);
    this.__propListeners.connect(this);
    this.__connected = true;
    this.queueDispatch();
    for (let p in this.__properties) {
      if (this.__properties[p].binding) {
        this.__properties[p].binding.setTarget(this, p); //TODO: test
      }
    }
    if (this.__objectProps.length) {
      window.addEventListener('object-mutated', this._onObjectMutation);
    }
  }
  disconnectedCallback() {
    this.__protoListeners.disconnect(this);
    this.__propListeners.disconnect(this);
    this.__connected = false;
    for (let p in this.__properties) {
      if (this.__properties[p].binding) {
        this.__properties[p].binding.removeTarget(this, p);
        // TODO: this breaks binding for transplanted elements.
        // delete this.__properties[p].binding;
        // TODO: possible memory leak!
      }
    }
    if (this.__objectProps.length) {
      window.removeEventListener('object-mutated', this._onObjectMutation);
    }
  }
  dispose() {
    // TODO: test dispose!
    // TODO: dispose bindings correctly
    this.__protoListeners.disconnect(this);
    this.__propListeners.disconnect(this);
    // TODO: test
    for (let i in this.__activeListeners) {
      for (let j = this.__activeListeners[i].length; j--;) {
        if (superclass === HTMLElement) HTMLElement.prototype.removeEventListener.call(this, i, this.__activeListeners[i][j]);
        this.__activeListeners[i].splice(j, 1);
      }
    }
    for (let p in this.__properties) {
      if (this.__properties[p].binding) {
        this.__properties[p].binding.removeTarget(this, p);
        // TODO: this breaks binding for transplanted elements.
        // TODO: possible memory leak!
        delete this.__properties[p].binding;
      }
    }
    for (let l in this.__listeners) this.__listeners[l].lenght = 0; // TODO: test
    for (let p in this.__properties) delete this.__properties[p]; // TODO: test
  }
  addEventListener(type, listener) {
    this.__activeListeners[type] = this.__activeListeners[type] || [];
    const i = this.__activeListeners[type].indexOf(listener);
    if (i === - 1) {
      if (superclass === HTMLElement) HTMLElement.prototype.addEventListener.call(this, type, listener);
      this.__activeListeners[type].push(listener);
    }
  }
  removeEventListener(type, listener) {
    if (this.__activeListeners[type] !== undefined) {
      const i = this.__activeListeners[type].indexOf(listener);
      if (i !== - 1) {
        if (superclass === HTMLElement) HTMLElement.prototype.removeEventListener.call(this, type, listener);
        this.__activeListeners[type].splice(i, 1);
      }
    }
  }
  dispatchEvent(type, detail = {}, bubbles = true, src = this) {
    if (src instanceof HTMLElement || src === window) {
      HTMLElement.prototype.dispatchEvent.call(src, new CustomEvent(type, {type: type, detail: detail, bubbles: bubbles, composed: true}));
    } else {
      if (this.__activeListeners[type] !== undefined) {
        const array = this.__activeListeners[type].slice(0);
        for (let i = 0; i < array.length; i ++) {
          array[i].call(this, {detail: detail, target: this, path: [this]});
          // TODO: consider bubbling
        }
      }
    }
  }
  queue(prop, value, oldValue) {
    const i = this.__queue.indexOf(prop);
    if (i === -1) {
      this.__queue.push(prop, {property: prop, value: value, oldValue: oldValue});
    } else {
      this.__queue[i + 1].value = value;
    }
  }
  queueDispatch() {
    if (this.__queue.length) {
      for (let j = 0; j < this.__queue.length; j += 2) {
        const prop = this.__queue[j];
        const payload = {detail: this.__queue[j + 1]};
        if (this[prop + 'Changed']) this[prop + 'Changed'](payload);
        this.dispatchEvent(prop + '-changed', payload.detail);
      }
      if (this.changed) this.changed();
      this.__queue.length = 0;
    }
  }
  _onObjectMutation(event) {
    for (let i = this.__objectProps.length; i--;) {
      const prop = this.__objectProps[i];
      const value = this.__properties[prop].value;
      if (value === event.detail.object) {
        if (this[prop + 'Mutated']) this[prop + 'Mutated'](event);
        return;
      }
    }
  }
};

IoCoreMixin.Register = function () {
  Object.defineProperty(this.prototype, '__registered', {value: true});
  Object.defineProperty(this.prototype, '__protochain', {value: []});

  let proto = this.prototype;
  while (proto && proto.constructor !== HTMLElement && proto.constructor !== Object) {
    this.prototype.__protochain.push(proto); proto = proto.__proto__;
  }

  Object.defineProperty(this.prototype, '__properties', {value: new Properties(this.prototype.__protochain)});
  Object.defineProperty(this.prototype, '__functions', {value: new Functions(this.prototype.__protochain)});
  Object.defineProperty(this.prototype, '__protoListeners', {value: new Listeners(this.prototype.__protochain)});

  // TODO: rewise
  Object.defineProperty(this.prototype, '__objectProps', {value: []});
  const ignore = [Boolean, String, Number, HTMLElement, Function, undefined];
  for (let prop in this.prototype.__properties) {
    let type = this.prototype.__properties[prop].type;
    if (ignore.indexOf(type) == -1) this.prototype.__objectProps.push(prop);
  }

  for (let prop in this.prototype.__properties) {
    const isPublic = prop.charAt(0) !== '_';
    const isEnumerable = !(this.prototype.__properties[prop].enumerable === false);
    Object.defineProperty(this.prototype, prop, {
      get: function() {
        return this.__properties[prop].value;
      },
      set: function(value) {
        if (this.__properties[prop].value === value) return;
        const oldValue = this.__properties[prop].value;
        if (value instanceof Binding) {
          const binding = value;
          value = value.source[value.sourceProp];
          binding.setTarget(this, prop);
          this.__properties[prop].binding = binding;
        }
        this.__properties[prop].value = value;
        if (this.__properties[prop].reflect) this.setAttribute(prop, this.__properties[prop].value);
        if (isPublic && this.__connected) {
          this.queue(prop, value, oldValue);
          this.queueDispatch();
        }
      },
      enumerable: isEnumerable && isPublic,
      configurable: true,
    });
  }
};

class IoCore$1 extends IoCoreMixin(Object) {}

IoCore$1.Register = IoCoreMixin.Register;

const warning = document.createElement('div');
warning.innerHTML = `
No support for custom elements detected! <br />
Sorry, modern browser is required to view this page.<br />
Please try <a href="https://www.mozilla.org/en-US/firefox/new/">Firefox</a>,
<a href="https://www.google.com/chrome/">Chrome</a> or
<a href="https://www.apple.com/lae/safari/">Safari</a>`;

let ro;
if (window.ResizeObserver !== undefined) {
  ro = new ResizeObserver(entries => {
    for (let entry of entries) entry.target.resized();
  });
}

const _stagingElement = document.createElement('div');

/**
 * @author arodic / https://github.com/arodic
 */

class Pointers extends IoCore$1 {
  static get properties() {
    return {
      enabled: true,
    };
  }
  constructor(props = {}) {
    super(props);

    this.domElements = [];
    this.pointers = new WeakMap();

    this.onPointerdown = this.onPointerdown.bind(this);
    this.onPointerhover = this.onPointerhover.bind(this);
    this.onPointermove = this.onPointermove.bind(this);
    this.onPointerup = this.onPointerup.bind(this);
    this.onContextmenu = this.onContextmenu.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
    this.onKeyup = this.onKeyup.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }
  attachElement(domElement) {
    if (this.domElements.indexOf(domElement) === -1) {
      domElement.addEventListener('pointerdown', this.onPointerdown);
      domElement.addEventListener('pointermove', this.onPointerhover);
      domElement.addEventListener('pointerup', this.onPointerup);
      domElement.addEventListener('pointerleave', this.onPointerleave);
      domElement.addEventListener('contextmenu', this.onContextmenu);
      domElement.addEventListener('wheel', this.onWheel);
      domElement.addEventListener('keydown', this.onKeydown);
      domElement.addEventListener('keyup', this.onKeyup);
      domElement.addEventListener('focus', this.onFocus);
      domElement.addEventListener('blur', this.onBlur);
      this.domElements.push(domElement);
    }
    this.pointers.set(domElement, {});
  }
  detachElement(domElement) {
    if (this.domElements.indexOf(domElement) !== -1) {
      this.domElements.splice(this.domElements.indexOf(domElement), 1);
      domElement.removeEventListener('pointerdown', this.onPointerdown);
      domElement.removeEventListener('pointermove', this.onPointerhover);
      domElement.removeEventListener('pointerup', this.onPointerup);
      domElement.removeEventListener('pointerleave', this.onPointerleave);
      domElement.removeEventListener('contextmenu', this.onContextmenu);
      domElement.removeEventListener('wheel', this.onWheel);
      domElement.removeEventListener('keydown', this.onKeydown);
      domElement.removeEventListener('keyup', this.onKeyup);
      domElement.removeEventListener('focus', this.onFocus);
      domElement.removeEventListener('blur', this.onBlur);
    }
    this.pointers.delete(domElement);
  }
  dispose() {
    super.dispose();
    for (let i = this.domElements.length; i--;) {
      this.detachElement(this.domElements[i]);
    }
    delete this.domElements;
    delete this.pointers;
    delete this.onPointerdown;
    delete this.onPointerhover;
    delete this.onPointermove;
    delete this.onPointerup;
    delete this.onContextmenu;
    delete this.onWheel;
    delete this.onKeydown;
    delete this.onKeyup;
    delete this.onFocus;
    delete this.onBlur;
  }
  // Viewport event handlers
  onPointerdown(event) {
    if (!this.enabled) return false;
    event.target.setPointerCapture(event.pointerId);
    const pointers = this.pointers.get(event.target);
    pointers[event.pointerId] = new Pointer(event);
    this.dispatchEvent('pointerdown', {event: event, pointers: [pointers[event.pointerId]]});
  }
  onPointerhover(event) {
    if (!this.enabled) return false;
    if (event.buttons !== 0) {
      this.onPointermove(event);
      return;
    }
    const pointer = new Pointer(event);
    this.dispatchEvent('pointerhover', {event: event, pointers: [pointer]});
  }
  onPointermove(event) {
    if (!this.enabled) return false;
    const pointers = this.pointers.get(event.target);
    pointers[event.pointerId] = new Pointer(event, pointers[event.pointerId].start);
    const pointerArray = [];
    for (let i in pointers) pointerArray.push(pointers[i]);
    this.dispatchEvent('pointermove', {event: event, pointers: pointerArray});
  }
  onPointerup(event) {
    if (!this.enabled) return false;
    event.target.releasePointerCapture(event.pointerId);
    const pointers = this.pointers.get(event.target);
    const pointer = new Pointer(event, pointers[event.pointerId].start);
    delete pointers[event.pointerId];
    this.dispatchEvent('pointerup', {event: event, pointers: [pointer]});
  }
  onPointerleave(event) {
    if (!this.enabled) return false;
    const pointers = this.pointers.get(event.target);
    const pointer = new Pointer(event);
    delete pointers[event.pointerId];
    this.dispatchEvent('pointerleave', {event: event, pointers: [pointer]});
  }
  onContextmenu(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('contextmenu', {event: event});
  }
  onKeydown(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('keydown', {event: event});
  }
  onKeyup(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('keyup', {event: event});
  }
  onWheel(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('wheel', {event: event});
  }
  onFocus(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('focus', {event: event});
  }
  onBlur(event) {
    if (!this.enabled) return false;
    this.dispatchEvent('blur', {event: event});
  }
}

class Pointer {
  constructor(event, start) {
    const rect = event.target.getBoundingClientRect();
    const button0 = (event.buttons === 1 || event.buttons === 3 || event.buttons === 5 || event.buttons === 7) ? true : false;
    const button1 = (event.buttons === 2 || event.buttons === 6) ? true : false;
    const button2 = (event.buttons === 4) ? true : false;
    const x = (event.offsetX / rect.width) * 2.0 - 1.0;
    const y = (event.offsetY / rect.height) * - 2.0 + 1.0;
    const dx = (event.movementX / rect.width) * 2.0;
    const dy = (event.movementY / rect.height) * - 2.0;
    start = start || {x: x, y: y};
    return {
      pointerId: event.pointerId,
      target: event.target,
      rect: rect,
      type: event.type,
      pointerType: event.pointerType,
      position: {x: x, y: y},
      movement: {x: dx, y: dy},
      previous: {x: x - dx, y: y - dy},
      start: {x: start.x, y: start.y},
      distance: {x: x - start.x, y: y - start.y},
      buttons: event.buttons,
      button: button0 ? 0 : button1 ? 1 : button2 ? 2 : -1,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
    };
  }
}

/**
 * @author arodic / https://github.com/arodic
 */

class Tool extends IoCore$1 {
  static get properties() {
    return {
      enabled: true,
      active: false,
      state: -1,
      scene: Scene,
      helperScene: Scene,
      viewports: [],
      cameras: WeakMap,
      pointers: Pointers,
    };
  }
  get bindings() {
    return {
      pointers: {enabled: this.bind('enabled')}
    };
  }
  constructor(props = {}) {
    super(props);

    this.pointers.addEventListener('pointerdown', this.onViewportPointerdown.bind(this));
    this.pointers.addEventListener('pointerhover', this.onViewportPointerhover.bind(this));
    this.pointers.addEventListener('pointermove', this.onViewportPointermove.bind(this));
    this.pointers.addEventListener('pointerup', this.onViewportPointerup.bind(this));
    this.pointers.addEventListener('pointerleave', this.onViewportPointerleave.bind(this));
    this.pointers.addEventListener('contextmenu', this.onViewportContextmenu.bind(this));
    this.pointers.addEventListener('wheel', this.onViewportWheel.bind(this));
    this.pointers.addEventListener('keydown', this.onViewportKeydown.bind(this));
    this.pointers.addEventListener('keyup', this.onViewportKeyup.bind(this));
    this.pointers.addEventListener('focus', this.onViewportFocus.bind(this));
    this.pointers.addEventListener('blur', this.onViewportBlur.bind(this));

    if (props.domElement && props.camera) {
      this.attachViewport(props.domElement, props.camera);
    }
  }
  enabledChanged() {
    this.pointers.enabled = this.enabled;
  }
  attachViewport(domElement, camera) {
    if (this.viewports.indexOf(domElement) === -1) {
      this.viewports.push(domElement);
    }
    this.pointers.attachElement(domElement);
    this.cameras.set(domElement, camera);
  }
  detachViewport(domElement) {
    if (this.viewports.indexOf(domElement) !== -1) {
      this.viewports.splice(this.viewports.indexOf(domElement), 1);
    }
    this.pointers.detachElement(domElement);
    this.cameras.delete(domElement);
  }
  // Viewport event handlers
  onViewportPointerdown(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('pointerdown', {event: event.detail.event, target: target, rect: rect, pointers: pointers, camera: camera});
  }
  onViewportPointerhover(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('pointerhover', {event: event.detail.event, target: target, rect: rect, pointers: pointers, camera: camera});
  }
  onViewportPointermove(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('pointermove', {event: event.detail.event, target: target, rect: rect, pointers: pointers, camera: camera});
  }
  onViewportPointerup(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('pointerup', {event: event.detail.event, target: target, rect: rect, pointers: pointers, camera: camera});
  }
  onViewportPointerleave(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const pointers = event.detail.pointers;
    const camera = this.cameras.get(target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('pointerleave', {event: event.detail.event, target: target, rect: rect, pointers: pointers, camera: camera});
  }
  onViewportContextmenu(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('contextmenu', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  onViewportKeydown(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('keykown', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  onViewportKeyup(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('keyup', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  onViewportWheel(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('wheel', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  onViewportFocus(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('focus', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  onViewportBlur(event) {
    if (!this.enabled) return false;
    const target = event.detail.event.target;
    const camera = this.cameras.get(event.target);
    const rect = target.getBoundingClientRect();
    this.dispatchEvent('blur', {event: event.detail.event, target: target, rect: rect, camera: camera});
  }
  dispose() {
    super.dispose();
    for (let i = this.viewports.length; i--;) {
      this.detachViewport(this.viewports[i]);
    }
    this.pointers.dispose();
    delete this.viewports;
    delete this.cameras;
    delete this.pointers;
    delete this.onViewportPointerdown;
    delete this.onViewportPointerhover;
    delete this.onViewportPointermove;
    delete this.onViewportPointerup;
    delete this.onViewportContextmenu;
    delete this.onViewportWheel;
    delete this.onViewportKeydown;
    delete this.onViewportKeyup;
    delete this.onViewportFocus;
    delete this.onViewportBlur;
  }
}

/**
 * @author arodic / https://github.com/arodic
 */

/*
 * Creates a single requestAnimationFrame loop.
 * provides methods to control animation and update event to hook into animation updates.
 */

let time = performance.now();
const animationQueue = [];
const animate = function() {
  const newTime = performance.now();
  const timestep = newTime - time;
  time = newTime;
  for (let i = animationQueue.length; i--;) {
    animationQueue[i].animate(timestep, time);
  }
  requestAnimationFrame(animate);
};
requestAnimationFrame(animate);

class Animation extends IoCore$1 {
  constructor() {
    super();
    this._time = 0;
    this._timeRemainging = 0;
  }
  startAnimation(duration) {
    this._time = 0;
    this._timeRemainging = Math.max(this._timeRemainging, duration * 1000 || 0);
    if (animationQueue.indexOf(this) === -1) animationQueue.push(this);
  }
  animate(timestep, time) {
    if (this._timeRemainging >= 0) {
      this._time = this._time + timestep;
      this._timeRemainging = this._timeRemainging - timestep;
      this.dispatchEvent('animation', {timestep: timestep, time: time});
    } else {
      this.stop();
    }
  }
  stop() {
    this._time = 0;
    this._timeRemainging = 0;
    animationQueue.splice(animationQueue.indexOf(this), 1);
  }
  stopAnimation() {
    this._active = false;
    cancelAnimationFrame(this._rafID);
  }
}

/**
 * @author arodic / http://github.com/arodic
 */

/*
 * CameraControls is a base class for controls performing orbiting, dollying, and panning.
 *
 *    Orbit - left mouse / touch: one-finger move
 *    Dolly - middle mouse, or mousewheel / touch: two-finger spread or squish
 *    Pan - right mouse, or left mouse + ctrlKey/altKey, wasd, or arrow keys / touch: two-finger move
 */

const STATE = {NONE: - 1, ORBIT: 0, DOLLY: 1, PAN: 2, DOLLY_PAN: 3};
const EPS = 0.000001;

// Temp variables
const direction = new Vector2();
const aspectMultiplier = new Vector2();
const orbit = new Vector2();
const pan = new Vector2();

// Framerate-independent damping
function dampTo(source, target, smoothing, dt) {
  const t = 1 - Math.pow(smoothing, dt);
  return source * (1 - t) + target * t;
}

class CameraControls extends Tool {
  static get properties() {
    return {
      enableOrbit: true,
      enableDolly: true,
      enablePan: true,
      enableFocus: true,
      orbitSpeed: 1.0,
      dollySpeed: 1.0,
      panSpeed: 1.0,
      keyOrbitSpeed: 0.1,
      keyDollySpeed: 0.1,
      keyPanSpeed: 0.1,
      wheelDollySpeed: 0.02,
      autoOrbit: Vector2,
      autoDollyPan: Vector3,
      enableDamping: true,
      dampingFactor: 0.05,
    };
  }
  constructor(props) {
    super(props);

    this.KEYS = {
      PAN_LEFT: 37, /* left */
      PAN_UP: 38, /* up */
      PAN_RIGHT: 39, /* right */
      PAN_DOWN: 40, /* down */
      ORBIT_LEFT: 65, /* A */
      ORBIT_RIGHT: 68, /* D */
      ORBIT_UP: 83, /* S */
      ORBIT_DOWN: 87, /* W */
      DOLLY_OUT: 189, /* + */
      DOLLY_IN: 187, /* - */
      FOCUS: 70 /* F */
    },
    this.BUTTON = {LEFT: MOUSE.LEFT, MIDDLE: MOUSE.MIDDLE, RIGHT: MOUSE.RIGHT}, // Mouse buttons

    this.animation = new Animation();
    this.animation.addEventListener('animation', event => {
      this.update(event.detail.timestep);
    });
    this.addEventListener('pointermove', this.onPointermove.bind(this));
    this.addEventListener('pointerup', this.onPointerup.bind(this));
  }
  dispose() {
    super.dispose();
  }
  attachViewport(domElement, camera) {
    super.attachViewport(domElement, camera);
    camera._target = camera._target || new Vector3();
    camera._state = camera._state || {
      _orbit: new Vector2(),
      _orbitV: new Vector2(),
      _pan: new Vector2(),
      _panV: new Vector2(),
      _dolly: 0,
      _dollyV: 0
    };
    camera.lookAt(camera._target);
    this.animation.startAnimation(0);
  }
  stateChanged() {
    this.active = this.state !== STATE.NONE;
    this.animation.startAnimation(0);
  }
  update(timestep) {
    let dt = timestep / 1000;

    for (let i = this.viewports.length; i--;) {

      const camera = this.cameras.get(this.viewports[i]);

      // Apply orbit intertia
      if (this.state !== STATE.ORBIT) {
        if (this.enableDamping) {
          camera._state._orbitV.x = dampTo(camera._state._orbitV.x, this.autoOrbit.x, this.dampingFactor, dt);
          camera._state._orbitV.y = dampTo(camera._state._orbitV.y, 0.0, this.dampingFactor, dt);
        }
      } else {
        camera._state._orbitV.set(this.autoOrbit.x, 0);
      }

      camera._state._orbit.x += camera._state._orbitV.x;
      camera._state._orbit.y += camera._state._orbitV.y;

      // Apply pan intertia
      if (this.state !== STATE.PAN) {
        camera._state._panV.x = dampTo(camera._state._panV.x, 0.0, this.dampingFactor, dt);
        camera._state._panV.y = dampTo(camera._state._panV.y, 0.0, this.dampingFactor, dt);
      } else {
        camera._state._panV.set(0, 0);
      }
      camera._state._pan.x += camera._state._panV.x;
      camera._state._pan.y += camera._state._panV.y;

      // Apply dolly intertia
      if (this.state !== STATE.DOLLY) {
        camera._state._dollyV = dampTo(camera._state._dollyV, 0.0, this.dampingFactor, dt);
      } else {
        camera._state._dollyV = 0;
      }
      camera._state._dolly += camera._state._dollyV;

      // set inertiae from current offsets
      if (this.enableDamping) {
        if (this.state === STATE.ORBIT) {
          camera._state._orbitV.copy(camera._state._orbit);
        }
        if (this.state === STATE.PAN) {
          camera._state._panV.copy(camera._state._pan);
        }
        if (this.state === STATE.DOLLY) {
          camera._state._dollyV = camera._state._dolly;
        }
      }

      this.orbit(orbit.copy(camera._state._orbit), camera);
      this.dolly(camera._state._dolly, camera);
      this.pan(pan.copy(camera._state._pan), camera);
      camera.lookAt(camera._target);

      camera._state._orbit.set(0, 0);
      camera._state._pan.set(0, 0);
      camera._state._dolly = 0;

      let viewportMaxV = 0;

      viewportMaxV = Math.max(viewportMaxV, Math.abs(camera._state._orbitV.x));
      viewportMaxV = Math.max(viewportMaxV, Math.abs(camera._state._orbitV.y));
      viewportMaxV = Math.max(viewportMaxV, Math.abs(camera._state._panV.x));
      viewportMaxV = Math.max(viewportMaxV, Math.abs(camera._state._panV.y));
      viewportMaxV = Math.max(viewportMaxV, Math.abs(camera._state._dollyV));

      if (viewportMaxV > EPS) {
        this.dispatchEvent('object-mutated', {object: camera}, false, window);
        this.animation.startAnimation(0);
      }
    }
  }
  onPointermove(event) {
    const pointers = event.detail.pointers;
    const camera = event.detail.camera;
    const rect = event.detail.rect;
    // let prevDistance, distance;
    aspectMultiplier.set(rect.width / rect.height, 1);
    switch (pointers.length) {
      case 1:
        direction.copy(pointers[0].movement).multiply(aspectMultiplier);
        switch (pointers[0].button) {
          case this.BUTTON.LEFT:
            if (pointers.ctrlKey) {
              this._setPan(camera, direction.multiplyScalar(this.panSpeed));
            } else if (pointers.altKey) {
              this._setDolly(camera, pointers[0].movement.y * this.dollySpeed);
            } else {
              this._setOrbit(camera, direction.multiplyScalar(this.orbitSpeed));
            }
            break;
          case this.BUTTON.MIDDLE:
            this._setDolly(camera, pointers[0].movement.y * this.dollySpeed);
            break;
          case this.BUTTON.RIGHT:
            this._setPan(camera, direction.multiplyScalar(this.panSpeed));
            break;
        }
        break;
      // default: // 2 or more
      //   // two-fingered touch: dolly-pan
      //   // TODO: apply aspectMultiplier?
      //   distance = pointers[0].position.distanceTo(pointers[1].position);
      //   prevDistance = pointers[0].previous.distanceTo(pointers[1].previous);
      //   direction.copy(pointers[0].movement).add(pointers[1].movement).multiply(aspectMultiplier);
      //   this._setDollyPan(camera, (prevDistance - distance) * this.dollySpeed, direction.multiplyScalar(this.panSpeed));
      //   break;
    }
  }
  onPointerup(/*pointers, camera*/) {
    this.state = STATE.NONE;
  }
  // onKeyDown(event) {
  //   TODO: key inertia
  //   TODO: better state setting
  //   switch (event.keyCode) {
  //     case this.KEYS.PAN_UP:
  //       this._setPan(camera, direction.set(0, -this.keyPanSpeed));
  //       break;
  //     case this.KEYS.PAN_DOWN:
  //       this._setPan(camera, direction.set(0, this.keyPanSpeed));
  //       break;
  //     case this.KEYS.PAN_LEFT:
  //       this._setPan(camera, direction.set(this.keyPanSpeed, 0));
  //       break;
  //     case this.KEYS.PAN_RIGHT:
  //       this._setPan(camera, direction.set(-this.keyPanSpeed, 0));
  //       break;
  //     case this.KEYS.ORBIT_LEFT:
  //       this._setOrbit(camera, direction.set(this.keyOrbitSpeed, 0));
  //       break;
  //     case this.KEYS.ORBIT_RIGHT:
  //       this._setOrbit(camera, direction.set(-this.keyOrbitSpeed, 0));
  //       break;
  //     case this.KEYS.ORBIT_UP:
  //       this._setOrbit(camera, direction.set(0, this.keyOrbitSpeed));
  //       break;
  //     case this.KEYS.ORBIT_DOWN:
  //       this._setOrbit(camera, direction.set(0, -this.keyOrbitSpeed));
  //       break;
  //     case this.KEYS.DOLLY_IN:
  //       this._setDolly(camera, -this.keyDollySpeed);
  //       break;
  //     case this.KEYS.DOLLY_OUT:
  //       this._setDolly(camera, this.keyDollySpeed);
  //       break;
  //     case this.KEYS.FOCUS:
  //       this._setFocus(camera, );
  //       break;
  //     default:
  //       break;
  //   }
  //   this.active = false;
  // }
  onKeyUp() {
    // TODO: Consider improving for prevent pointer and multi-key interruptions.
    // this.active = false;
  }
  onWheel(event) {
    this.state = STATE.DOLLY;
    const camera = event.detail.camera;
    this._setDolly(camera, event.detail.delta * this.wheelDollySpeed);
    this.state = STATE.NONE;
    this.animation.startAnimation(0);
  }
  _setPan(camera, dir) {
    this.state = STATE.PAN;
    if (this.enablePan) camera._state._pan.copy(dir);
    this.animation.startAnimation(0);
  }
  _setDolly(camera, dir) {
    this.state = STATE.DOLLY;
    if (this.enableDolly) camera._state._dolly = dir;
    this.animation.startAnimation(0);
  }
  _setDollyPan(camera, dollyDir, panDir) {
    this.state = STATE.DOLLY_PAN;
    if (this.enableDolly) camera._state._dolly = dollyDir;
    if (this.enablePan) camera._state._pan.copy(panDir);
    this.animation.startAnimation(0);
  }
  _setOrbit(camera, dir) {
    this.state = STATE.ORBIT;
    if (this.enableOrbit) camera._state._orbit.copy(dir);
    this.animation.startAnimation(0);
  }
  _setFocus(camera) {
    this.state = STATE.NONE;
    if (this.object && this.enableFocus) this.focus(this.object, camera);
    this.animation.startAnimation(0);
  }

  // CameraControl methods. Implement in subclass!
  pan(/*pan, camera*/) {
    console.warn('CameraControls: pan() not implemented!');
  }
  dolly(/*dolly, camera*/) {
    console.warn('CameraControls: dolly() not implemented!');
  }
  orbit(/*orbit, camera*/) {
    console.warn('CameraControls: orbit() not implemented!');
  }
  focus(/*focus, camera*/) {
    console.warn('CameraControls: focus() not implemented!');
  }
}

/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author arodic / http://github.com/arodic
 */

// Reusable utility variables
const center = new Vector3();
const delta = new Vector3();
const box = new Box3();
const normalMatrix = new Matrix3();
const spherical = new Spherical();
const sphere = new Sphere();

class EditorCameraControls extends CameraControls {
  orbit(orbit, camera) {
    delta.copy(camera.position).sub(camera._target);
    spherical.setFromVector3(delta);
    spherical.theta -= orbit.x;
    spherical.phi += orbit.y;
    spherical.makeSafe();
    delta.setFromSpherical(spherical);
    camera.position.copy(camera._target).add(delta);
    camera.lookAt(camera._target);
  }
  dolly(dolly, camera) {
    delta.set(0, 0, dolly);
    let distance = camera.position.distanceTo(camera._target);
    delta.multiplyScalar(distance * this.dollySpeed);
    if (delta.length() > distance) return;
    delta.applyMatrix3(normalMatrix.getNormalMatrix(camera.matrix));
    camera.position.add(delta);
  }
  pan(pan, camera) {
    let distance = camera.position.distanceTo(camera._target);
    delta.set(-pan.x, -pan.y, 0);
    delta.multiplyScalar(distance);
    delta.applyMatrix3(normalMatrix.getNormalMatrix(camera.matrix));
    camera.position.add(delta);
    camera._target.add(delta);
  }
  focus(object, camera) {
    let distance;
    box.setFromObject(object);
    if (box.isEmpty() === false) {
      camera._target.copy(box.getCenter(center));
      distance = box.getBoundingSphere(sphere).radius;
    } else {
      // Focusing on an Group, AmbientLight, etc
      camera._target.setFromMatrixPosition(object.matrixWorld);
      distance = 0.1;
    }
    delta.set(0, 0, 1);
    delta.applyQuaternion(camera.quaternion);
    delta.multiplyScalar(distance * 4);
    camera.position.copy(camera._target).add(delta);
  }
}

/**
 * @author arodic / http://github.com/arodic
 */

const selectedOld = [];

function filterItems(list, hierarchy, filter) {
  list = list instanceof Array ? list : [list];
  let filtered = [];
  for (let i = 0; i < list.length; i++) {
    if (!filter || filter(list[i])) filtered.push(list[i]);
    if (hierarchy) {
      let children = filterItems(list[i].children, hierarchy, filter);
      filtered.push(...children);
    }
  }
  return filtered;
}

class Selection extends IoCore {
  static get properties() {
    return {
      selected: [],
    };
  }
  toggle(list, hierarchy, filter) {
    list = filterItems(list, hierarchy, filter);
    selectedOld.push(...this.selected);
    for (let i = list.length; i--;) {
      let index = this.selected.indexOf(list[i]);
      if (index !== -1) this.selected.splice(index, 1);
      else this.selected.push(list[i]);
    }
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  add(list, hierarchy, filter) {
    list = filterItems(list, hierarchy, filter);
    selectedOld.push(...this.selected);
    this.selected.concat(...list);
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  addFirst(list, hierarchy, filter) {
    list = filterItems(list, hierarchy, filter);
    selectedOld.push(...this.selected);
    this.selected.length = 0;
    this.selected.push(...list);
    this.selected.push(...selectedOld);
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  remove(list, hierarchy, filter) {
    list = filterItems(list, hierarchy, filter);
    selectedOld.push(...this.selected);
    for (let i = list.length; i--;) {
      let index = this.selected.indexOf(list[i]);
      if (index !== -1) this.selected.splice(i, 1);
    }
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  replace(list, hierarchy, filter) {
    list = filterItems(list, hierarchy, filter);
    selectedOld.push(...this.selected);
    this.selected.length = 0;
    this.selected.push(...list);
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  clear() {
    selectedOld.push(...this.selected);
    this.selected.length = 0;
    this.dispatchEvent('object-mutated', {object: this}, false, window);
  }
  dispose() {
    // TODO:
    console.log('dispose');
  }
}

// Material for outlines
class HelperMaterial extends IoCoreMixin(ShaderMaterial) {
  static get properties() {
    return {
      depthTest: true,
      depthWrite: true,
      transparent: false,
      side: FrontSide,

      color: { type: Color, change: 'uniformChanged'},
      opacity: { value: 1, change: 'uniformChanged'},
      depthBias: { value: 0, change: 'uniformChanged'},
      highlight: { value: 0, change: 'uniformChanged'},
      resolution: { type: Vector3, change: 'uniformChanged'},
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
      "uColor":  {value: this.color},
      "uOpacity":  {value: this.opacity},
      "uDepthBias":  {value: this.depthBias},
      "uHighlight":  {value: this.highlight},
      "uResolution":  {value: this.resolution},
      "tDitherMatrix":  {value: texture},
    }]);

    this.uniforms.tDitherMatrix.value = texture;
    texture.needsUpdate = true;

    this.vertexShader = `

      attribute vec4 color;
      attribute float outline;

      varying vec4 vColor;
      varying float isOutline;
      varying vec2 vUv;

      uniform vec3 uResolution;
      uniform float uDepthBias;
      uniform float uHighlight;

      void main() {
        float aspect = projectionMatrix[0][0] / projectionMatrix[1][1];

        vColor = color;
        isOutline = outline;

        vec3 nor = normalMatrix * normal;
        vec4 pos = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

        // nor = (projectionMatrix * vec4(nor, 1.0)).xyz;
        nor = normalize((nor.xyz) * vec3(1., 1., 0.));

        pos.z -= uDepthBias * 0.1;
        pos.z -= uHighlight;

        float extrude = 0.0;
        if (outline > 0.0) {
          extrude = outline;
          pos.z += 0.00001;
          pos.z = max(-0.99, pos.z);
        } else {
          extrude -= outline;
          pos.z = max(-1.0, pos.z);
        }

        pos.xy /= pos.w;

        float dx = nor.x * extrude * (1.0 + uResolution.z);
        float dy = nor.y * extrude * (1.0 + uResolution.z);

        pos.x += (dx) * (1.0 / uResolution.x);
        pos.y += (dy) * (1.0 / uResolution.y);

        vUv = uv;

        pos.xy *= pos.w;

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
      varying vec2 vUv;

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
  uniformChanged() {
    if (this.uniforms) ;
  }
}

HelperMaterial.Register = IoCoreMixin.Register;

/**
 * @author arodic / https://github.com/arodic
 */

class TextHelper extends IoCoreMixin(Sprite) {
  static get properties() {
    return {
      text: '',
      color: 'black',
      size: 0.5,
    };
  }
  constructor(props = {}) {
    super(props);

    this.scaleTarget = new Vector3(1, 1, 1);

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.texture = new Texture(this.canvas);

    this.material.map = this.texture;

    this.canvas.width = 256;
    this.canvas.height = 64;

    this.scale.set(1, 0.25, 1);
    this.scale.multiplyScalar(this.size);

    this.position.set(props.position[0], props.position[1], props.position[2]);
  }
  textChanged() {
    const ctx = this.ctx;
    const canvas = this.canvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold ' + canvas.height * 0.9 + 'px monospace';

    ctx.fillStyle = this.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.strokeStyle = 'black';
    ctx.lineWidth = canvas.height / 8;

    ctx.strokeText(this.text, canvas.width / 2, canvas.height / 2);
    ctx.fillText(this.text, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";

    ctx.fillText(this.text, canvas.width / 2, canvas.height / 2);

    this.texture.needsUpdate = true;
  }
}

/**
 * @author arodic / https://github.com/arodic
 */

// Reusable utility variables
const _cameraPosition = new Vector3();

/*
 * Helper extends Object3D to automatically follow its target `object` by copying transform matrices from it.
 * If `space` property is set to "world", helper will not inherit objects rotation.
 * Helpers will auto-scale in view space if `size` property is non-zero.
 */

class Helper extends IoCoreMixin(Object3D) {
  static get properties() {
    return {
      object: null,
      camera: null,
      depthBias: 0,
      space: 'local',
      size: 0
    };
  }
  constructor(props = {}) {
    super(props);
    this.eye = new Vector3();
  }
  onBeforeRender(renderer, scene, camera) {
    this.camera = camera;
  }
  depthBiasChanged() {
    this.traverse(object => {object.material.depthBias = this.depthBias;});
  }
  objectChanged() {
    this.updateHelperMatrix();
  }
  cameraChanged() {
    this.updateHelperMatrix();
  }
  spaceChanged() {
    this.updateHelperMatrix();
  }
  updateHelperMatrix() {
    if (this.object) {
      this.matrix.copy(this.object.matrix);
      this.matrixWorld.copy(this.object.matrixWorld);
      this.matrixWorld.decompose(this.position, this.quaternion, this.scale);
    } else {
      super.updateMatrixWorld();
    }

    if (this.camera) {
      let eyeDistance = 1;
      _cameraPosition.set(this.camera.matrixWorld.elements[12], this.camera.matrixWorld.elements[13], this.camera.matrixWorld.elements[14]);
      if (this.camera.isPerspectiveCamera) {
        this.eye.copy(_cameraPosition).sub(this.position);
        eyeDistance = 0.15 * this.eye.length() * (this.camera.fov / Math.PI);
        this.eye.normalize();
      } else if (this.camera.isOrthographicCamera) {
        eyeDistance = 3 * (this.camera.top - this.camera.bottom) / this.camera.zoom;
        this.eye.copy(_cameraPosition).normalize();
      }
      if (this.size) this.scale.set(1, 1, 1).multiplyScalar(eyeDistance * this.size);
    }
    if (this.space === 'world') this.quaternion.set(0, 0, 0, 1);

    this.matrixWorld.compose(this.position, this.quaternion, this.scale);
  }
  updateMatrixWorld( force ) {
    this.updateHelperMatrix();
    this.matrixWorldNeedsUpdate = false;
    for (let i = this.children.length; i--;) this.children[i].updateMatrixWorld(force);
  }
  // TODO: refactor. Consider moving to utils.
  addGeometries(geometries, props = {}) {
    const objects = [];
    for (let name in geometries) {
      objects.push(objects[name] = this.addObject(geometries[name], Object.assign(props, {name: name})));
    }
    return objects;
  }
  addObject(geometry, meshProps = {}) {

    const geometryProps = geometry.props || {};

    const materialProps = {highlight: 0};

    if (geometryProps.opacity !== undefined) materialProps.opacity = geometryProps.opacity;
    if (geometryProps.depthBias !== undefined) materialProps.depthBias = geometryProps.depthBias;
    if (meshProps.highlight !== undefined) materialProps.highlight = meshProps.highlight;

    const material = new HelperMaterial(materialProps);

    const mesh = new Mesh(geometry, material);

    meshProps = Object.assign({hidden: false, highlight: 0}, meshProps);

    mesh.positionTarget = mesh.position.clone();
    mesh.quaternionTarget = mesh.quaternion.clone();
    mesh.scaleTarget = mesh.scale.clone();

    //TODO: refactor
    for (let i in meshProps) mesh[i] = meshProps[i];
    this.add(mesh);
    return mesh;
  }
  addTextSprites(textSprites) {
    const texts = [];
    for (let name in textSprites) {
      const mesh = new TextHelper(textSprites[name]);
      mesh.name = name;
      mesh.positionTarget = mesh.position.clone();
      mesh.material.opacity = 0;
      mesh.material.visible = false;
      mesh.isInfo = true;
      texts.push(mesh);
      texts[name] = mesh;
      this.add(mesh);
    }
    return texts;
  }
}
Helper.Register = IoCoreMixin.Register;
// Helper.Register();

/**
 * @author mrdoob / http://mrdoob.com/
 */

const BufferGeometryUtils$1 = {

	computeTangents: function ( geometry ) {

		let index = geometry.index;
		let attributes = geometry.attributes;

		// based on http://www.terathon.com/code/tangent.html
		// (per vertex tangents)

		if ( index === null ||
			attributes.position === undefined ||
			attributes.normal === undefined ||
			attributes.uv === undefined ) {

			console.warn( 'BufferGeometry: Missing required attributes (index, position, normal or uv) in BufferGeometry.computeTangents()' );
			return;

		}

		let indices = index.array;
		let positions = attributes.position.array;
		let normals = attributes.normal.array;
		let uvs = attributes.uv.array;

		let nVertices = positions.length / 3;

		if ( attributes.tangent === undefined ) {

			geometry.addAttribute( 'tangent', new BufferAttribute( new Float32Array( 4 * nVertices ), 4 ) );

		}

		let tangents = attributes.tangent.array;

		let tan1 = [], tan2 = [];

		for ( let i = 0; i < nVertices; i ++ ) {

			tan1[ i ] = new Vector3();
			tan2[ i ] = new Vector3();

		}

		let vA = new Vector3(),
			vB = new Vector3(),
			vC = new Vector3(),

			uvA = new Vector2(),
			uvB = new Vector2(),
			uvC = new Vector2(),

			sdir = new Vector3(),
			tdir = new Vector3();

		function handleTriangle( a, b, c ) {

			vA.fromArray( positions, a * 3 );
			vB.fromArray( positions, b * 3 );
			vC.fromArray( positions, c * 3 );

			uvA.fromArray( uvs, a * 2 );
			uvB.fromArray( uvs, b * 2 );
			uvC.fromArray( uvs, c * 2 );

			let x1 = vB.x - vA.x;
			let x2 = vC.x - vA.x;

			let y1 = vB.y - vA.y;
			let y2 = vC.y - vA.y;

			let z1 = vB.z - vA.z;
			let z2 = vC.z - vA.z;

			let s1 = uvB.x - uvA.x;
			let s2 = uvC.x - uvA.x;

			let t1 = uvB.y - uvA.y;
			let t2 = uvC.y - uvA.y;

			let r = 1.0 / ( s1 * t2 - s2 * t1 );

			sdir.set(
				( t2 * x1 - t1 * x2 ) * r,
				( t2 * y1 - t1 * y2 ) * r,
				( t2 * z1 - t1 * z2 ) * r
			);

			tdir.set(
				( s1 * x2 - s2 * x1 ) * r,
				( s1 * y2 - s2 * y1 ) * r,
				( s1 * z2 - s2 * z1 ) * r
			);

			tan1[ a ].add( sdir );
			tan1[ b ].add( sdir );
			tan1[ c ].add( sdir );

			tan2[ a ].add( tdir );
			tan2[ b ].add( tdir );
			tan2[ c ].add( tdir );

		}

		let groups = geometry.groups;

		if ( groups.length === 0 ) {

			groups = [ {
				start: 0,
				count: indices.length
			} ];

		}

		for ( let i = 0, il = groups.length; i < il; ++ i ) {

			let group = groups[ i ];

			let start = group.start;
			let count = group.count;

			for ( let j = start, jl = start + count; j < jl; j += 3 ) {

				handleTriangle(
					indices[ j + 0 ],
					indices[ j + 1 ],
					indices[ j + 2 ]
				);

			}

		}

		let tmp = new Vector3(), tmp2 = new Vector3();
		let n = new Vector3(), n2 = new Vector3();
		let w, t, test;

		function handleVertex( v ) {

			n.fromArray( normals, v * 3 );
			n2.copy( n );

			t = tan1[ v ];

			// Gram-Schmidt orthogonalize

			tmp.copy( t );
			tmp.sub( n.multiplyScalar( n.dot( t ) ) ).normalize();

			// Calculate handedness

			tmp2.crossVectors( n2, t );
			test = tmp2.dot( tan2[ v ] );
			w = ( test < 0.0 ) ? - 1.0 : 1.0;

			tangents[ v * 4 ] = tmp.x;
			tangents[ v * 4 + 1 ] = tmp.y;
			tangents[ v * 4 + 2 ] = tmp.z;
			tangents[ v * 4 + 3 ] = w;

		}

		for ( let i = 0, il = groups.length; i < il; ++ i ) {

			let group = groups[ i ];

			let start = group.start;
			let count = group.count;

			for ( let j = start, jl = start + count; j < jl; j += 3 ) {

				handleVertex( indices[ j + 0 ] );
				handleVertex( indices[ j + 1 ] );
				handleVertex( indices[ j + 2 ] );

			}

		}

	},

	/**
	* @param  {Array<BufferGeometry>} geometries
	* @return {BufferGeometry}
	*/
	mergeBufferGeometries: function ( geometries, useGroups, mergedGeometry ) {

		let isIndexed = geometries[ 0 ].index !== null;

		let attributesUsed = new Set( Object.keys( geometries[ 0 ].attributes ) );
		let morphAttributesUsed = new Set( Object.keys( geometries[ 0 ].morphAttributes ) );

		let attributes = {};
		let morphAttributes = {};

		// mergedGeometry = mergedGeometry || new BufferGeometry();

		let offset = 0;

		for ( let i = 0; i < geometries.length; ++ i ) {

			let geometry = geometries[ i ];

			// ensure that all geometries are indexed, or none

			if ( isIndexed !== ( geometry.index !== null ) ) return null;

			// gather attributes, exit early if they're different

			for ( let name in geometry.attributes ) {

				if ( ! attributesUsed.has( name ) ) return null;

				if ( attributes[ name ] === undefined ) attributes[ name ] = [];

				attributes[ name ].push( geometry.attributes[ name ] );

			}

			// gather morph attributes, exit early if they're different

			for ( let name in geometry.morphAttributes ) {

				if ( ! morphAttributesUsed.has( name ) ) return null;

				if ( morphAttributes[ name ] === undefined ) morphAttributes[ name ] = [];

				morphAttributes[ name ].push( geometry.morphAttributes[ name ] );

			}

			// gather .userData

			mergedGeometry.userData.mergedUserData = mergedGeometry.userData.mergedUserData || [];
			mergedGeometry.userData.mergedUserData.push( geometry.userData );

			if ( useGroups ) {

				let count;

				if ( isIndexed ) {

					count = geometry.index.count;

				} else if ( geometry.attributes.position !== undefined ) {

					count = geometry.attributes.position.count;

				} else {

					return null;

				}

				mergedGeometry.addGroup( offset, count, i );

				offset += count;

			}

		}

		// merge indices

		if ( isIndexed ) {

			let indexOffset = 0;
			let mergedIndex = [];

			for ( let i = 0; i < geometries.length; ++ i ) {

				let index = geometries[ i ].index;

				for ( let j = 0; j < index.count; ++ j ) {

					mergedIndex.push( index.getX( j ) + indexOffset );

				}

				indexOffset += geometries[ i ].attributes.position.count;

			}

			mergedGeometry.setIndex( mergedIndex );

		}

		// merge attributes

		for ( let name in attributes ) {

			let mergedAttribute = this.mergeBufferAttributes( attributes[ name ] );

			if ( ! mergedAttribute ) return null;

			mergedGeometry.addAttribute( name, mergedAttribute );

		}

		// merge morph attributes

		for ( let name in morphAttributes ) {

			let numMorphTargets = morphAttributes[ name ][ 0 ].length;

			if ( numMorphTargets === 0 ) break;

			mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
			mergedGeometry.morphAttributes[ name ] = [];

			for ( let i = 0; i < numMorphTargets; ++ i ) {

				let morphAttributesToMerge = [];

				for ( let j = 0; j < morphAttributes[ name ].length; ++ j ) {

					morphAttributesToMerge.push( morphAttributes[ name ][ j ][ i ] );

				}

				let mergedMorphAttribute = this.mergeBufferAttributes( morphAttributesToMerge );

				if ( ! mergedMorphAttribute ) return null;

				mergedGeometry.morphAttributes[ name ].push( mergedMorphAttribute );

			}

		}

		return mergedGeometry;

	},

	/**
	* @param {Array<BufferAttribute>} attributes
	* @return {BufferAttribute}
	*/
	mergeBufferAttributes: function ( attributes ) {

		let TypedArray;
		let itemSize;
		let normalized;
		let arrayLength = 0;

		for ( let i = 0; i < attributes.length; ++ i ) {

			let attribute = attributes[ i ];

			if ( attribute.isInterleavedBufferAttribute ) return null;

			if ( TypedArray === undefined ) TypedArray = attribute.array.constructor;
			if ( TypedArray !== attribute.array.constructor ) return null;

			if ( itemSize === undefined ) itemSize = attribute.itemSize;
			if ( itemSize !== attribute.itemSize ) return null;

			if ( normalized === undefined ) normalized = attribute.normalized;
			if ( normalized !== attribute.normalized ) return null;

			arrayLength += attribute.array.length;

		}

		let array = new TypedArray( arrayLength );
		let offset = 0;

		for ( let i = 0; i < attributes.length; ++ i ) {

			array.set( attributes[ i ].array, offset );

			offset += attributes[ i ].array.length;

		}

		return new BufferAttribute( array, itemSize, normalized );

	}

};

// Reusable utility variables
const _position = new Vector3();
const _euler = new Euler();
const _quaternion = new Quaternion();
const _scale = new Vector3();
const _matrix = new Matrix4();

class HelperGeometry extends BufferGeometry {
  constructor(geometry, props) {
    super();

    this.props = props;

    this.index = new Uint16BufferAttribute([], 1);
    this.addAttribute('position', new Float32BufferAttribute([], 3));
    this.addAttribute('uv', new Float32BufferAttribute([], 2));
    this.addAttribute('color', new Float32BufferAttribute([], 4));
    this.addAttribute('normal', new Float32BufferAttribute([], 3));
    this.addAttribute('outline', new Float32BufferAttribute([], 1));

    let chunks;
    if (geometry instanceof Array) {
      chunks = geometry;
    } else {
      chunks = [[geometry, props]];
    }

    const chunkGeometries = [];

    for (let i = chunks.length; i--;) {

      const chunk = chunks[i];

      let chunkGeo = chunk[0].clone();
      chunkGeometries.push(chunkGeo);

      let chunkProp = chunk[1] || {};

      const color = chunkProp.color || [];
      const position = chunkProp.position;
      const rotation = chunkProp.rotation;
      let scale = chunkProp.scale;

      let thickness = (chunkProp.thickness || -0) / 2;
      let outlineThickness = chunkProp.outlineThickness !== undefined ? chunkProp.outlineThickness : 1;

      if (scale && typeof scale === 'number') scale = [scale, scale, scale];

      _position.set(0, 0, 0);
      _quaternion.set(0, 0, 0, 1);
      _scale.set(1, 1, 1);

      if (position) _position.set(position[0], position[1], position[2]);
      if (rotation) _quaternion.setFromEuler(_euler.set(rotation[0], rotation[1], rotation[2]));
      if (scale) _scale.set(scale[0], scale[1], scale[2]);

      _matrix.compose(_position, _quaternion, _scale);

      chunkGeo.applyMatrix(_matrix);

      // TODO: investigate proper indexing!
      if (chunkGeo.index === null) {
        const indices = [];
        for (let j = 0; j < chunkGeo.attributes.position.count - 2; j+=3) {
          indices.push(j + 0);
          indices.push(j + 1);
          indices.push(j + 2);
        }
        chunkGeo.index = new Uint16BufferAttribute(indices, 1);
      }

      let vertCount = chunkGeo.attributes.position.count;

      if (!chunkGeo.attributes.color) {
        chunkGeo.addAttribute('color', new Float32BufferAttribute(new Array(vertCount * 4), 4));
      }

      const colorArray = chunkGeo.attributes.color.array;
      for (let j = 0; j < vertCount; j++) {
        const r = j * 4 + 0; colorArray[r] = color[0] !== undefined ? color[0] : colorArray[r];
        const g = j * 4 + 1; colorArray[g] = color[1] !== undefined ? color[1] : colorArray[g];
        const b = j * 4 + 2; colorArray[b] = color[2] !== undefined ? color[2] : colorArray[b];
        const a = j * 4 + 3; colorArray[a] = color[3] !== undefined ? color[3] : colorArray[a] || 1;
      }

      // Duplicate geometry and add outline attribute
      //TODO: enable outline overwrite (needs to know if is outline or not in combined geometry)
      if (!chunkGeo.attributes.outline) {
        const outlineArray = [];
        for (let j = 0; j < vertCount; j++) {
          outlineArray[j] = -thickness;
        }

        chunkGeo.addAttribute( 'outline', new Float32BufferAttribute(outlineArray, 1));
        BufferGeometryUtils$1.mergeBufferGeometries([chunkGeo, chunkGeo], false, chunkGeo);

        if (outlineThickness) {
          for (let j = 0; j < vertCount; j++) {
            chunkGeo.attributes.outline.array[(vertCount + j)] = outlineThickness + thickness;
          }
        }

        let array = chunkGeo.index.array;
        for (let j = array.length / 2; j < array.length; j+=3) {
          let a = array[j + 1];
          let b = array[j + 2];
          array[j + 1] = b;
          array[j + 2] = a;
        }
      }

      for (let j = 0; j < chunkGeo.attributes.outline.array.length; j++) {
        if (chunkGeo.attributes.outline.array[j] < 0) {
          if (chunkProp.thickness !== undefined) chunkGeo.attributes.outline.array[j] = -thickness;
        } else {
          if (chunkProp.outlineThickness !== undefined) chunkGeo.attributes.outline.array[j] = outlineThickness + thickness;
        }
      }

    }

    BufferGeometryUtils$1.mergeBufferGeometries(chunkGeometries, false, this);
  }
}

/**
 * @author arodic / https://github.com/arodic
 */

// Reusable utility variables
const PI = Math.PI;
const HPI = PI / 2;
const EPS$1 = 0.000001;

// TODO: consider supporting objects with skewed transforms.
const _position$1 = new Vector3();
const _quaternion$1 = new Quaternion();
const _scale$1 = new Vector3();
const _m1 = new Matrix4();
const _m2 = new Matrix4();
const _one = new Vector3(1, 1, 1);

const corner3Geometry = new HelperGeometry([
  [new CylinderBufferGeometry(EPS$1, EPS$1, 1, 4, 2, true), {color: [1, 0, 0], position: [0.5, 0, 0], rotation: [0, 0, HPI], thickness: 1}],
  [new CylinderBufferGeometry(EPS$1, EPS$1, 1, 4, 2, true), {color: [0, 1, 0], position: [0, 0.5, 0], rotation: [0, HPI, 0], thickness: 1}],
  [new CylinderBufferGeometry(EPS$1, EPS$1, 1, 4, 2, true), {color: [0, 0, 1], position: [0, 0, 0.5], rotation: [HPI, 0, 0], thickness: 1}],
]);

const handleGeometry = {
  XYZ: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [HPI, 0, PI]}),
  XYz: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [HPI, 0, HPI]}),
  xyz: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [-HPI, 0, -HPI]}),
  xyZ: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [-HPI, 0, 0]}),
  xYZ: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [PI/2, 0, -PI/2]}),
  xYz: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [PI/2, 0, 0]}),
  Xyz: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [0, 0, HPI]}),
  XyZ: new HelperGeometry(corner3Geometry, {color: [1, 1, 0], rotation: [0, PI, 0]}),
};

class SelectionHelper extends Helper {
  static get properties() {
    return {
      selection: null,
    };
  }
  get handleGeometry() {
    return handleGeometry;
  }
  constructor(props) {
    super(props);
    this.corners = this.addGeometries(this.handleGeometry);

    // const axis = new TransformHelper({object: this});
    // axis.size = 0.01;
    // axis.doFlip = false;
    // axis.doHide = false;
    // super.add(axis);
  }
  selectionChanged() {
    const selected = this.selection.selected;

    if (selected.length && selected[0].geometry) {
      const object = selected[0];

      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
      const bbMax = object.geometry.boundingBox.max;
      const bbMin = object.geometry.boundingBox.min;
      // bbMax.applyMatrix4(object.matrixWorld);
      // bbMin.applyMatrix4(object.matrixWorld);

      this.corners['XYZ'].position.set(bbMax.x, bbMax.y, bbMax.z);
      this.corners['XYz'].position.set(bbMax.x, bbMax.y, bbMin.z);
      this.corners['xyz'].position.set(bbMin.x, bbMin.y, bbMin.z);
      this.corners['xyZ'].position.set(bbMin.x, bbMin.y, bbMax.z);
      this.corners['xYZ'].position.set(bbMin.x, bbMax.y, bbMax.z);
      this.corners['xYz'].position.set(bbMin.x, bbMax.y, bbMin.z);
      this.corners['Xyz'].position.set(bbMax.x, bbMin.y, bbMin.z);
      this.corners['XyZ'].position.set(bbMax.x, bbMin.y, bbMax.z);

      //

      object.updateMatrixWorld();
      object.matrixWorld.decompose(_position$1, _quaternion$1, _scale$1);

      _m1.compose(this.position, this.quaternion, _one);

      _scale$1.x = Math.abs(_scale$1.x);
      _scale$1.y = Math.abs(_scale$1.y);
      _scale$1.z = Math.abs(_scale$1.z);

      for (let i = 0; i < 8; i ++) {

        _position$1.copy(this.children[i].position).multiply(_scale$1);

        let __scale = this.scale.clone();

        let dir = this.children[i].position.clone().applyQuaternion(this.quaternion).normalize();

        this.children[i].material.highlight = Math.min(Math.max(3 - Math.abs(dir.dot(this.eye)) * 4, -1), 0.5);

        __scale.x = Math.min(this.scale.x, Math.abs(_position$1.x) / 2);
        __scale.y = Math.min(this.scale.y, Math.abs(_position$1.y) / 2);
        __scale.z = Math.min(this.scale.z, Math.abs(_position$1.z) / 2);

        __scale.x = Math.max(__scale.x, EPS$1);
        __scale.y = Math.max(__scale.y, EPS$1);
        __scale.z = Math.max(__scale.z, EPS$1);

        _m2.compose(_position$1, new Quaternion, __scale);

        this.children[i].matrixWorld.copy(_m1).multiply(_m2);
      }


    }
  }

  updateMatrixWorld() {
    this.updateHelperMatrix();
    // this.matrixWorldNeedsUpdate = false;
    //
    // this.object.matrixWorld.decompose(_position, _quaternion, _scale);
    //
    // _m1.compose(this.position, this.quaternion, _one);
    //
    // _scale.x = Math.abs(_scale.x);
    // _scale.y = Math.abs(_scale.y);
    // _scale.z = Math.abs(_scale.z);
    //
    // for (let i = 0; i < 8; i ++) {
    //
    //   _position.copy(this.children[i].position).multiply(_scale);
    //
    //   let __scale = this.scale.clone();
    //
    //   let dir = this.children[i].position.clone().applyQuaternion(this.quaternion).normalize();
    //
    //   this.children[i].material.highlight = Math.min(Math.max(3 - Math.abs(dir.dot(this.eye)) * 4, -1), 0.5);
    //
    //   __scale.x = Math.min(this.scale.x, Math.abs(_position.x) / 2);
    //   __scale.y = Math.min(this.scale.y, Math.abs(_position.y) / 2);
    //   __scale.z = Math.min(this.scale.z, Math.abs(_position.z) / 2);
    //
    //   __scale.x = Math.max(__scale.x, EPS);
    //   __scale.y = Math.max(__scale.y, EPS);
    //   __scale.z = Math.max(__scale.z, EPS);
    //
    //   _m2.compose(_position, new Quaternion, __scale);
    //
    //   this.children[i].matrixWorld.copy(_m1).multiply(_m2);
    // }
    // this.children[8].updateMatrixWorld();
  }
}

/**
 * @author arodic / http://github.com/arodic
 */

// Temp variables
const raycaster = new Raycaster();

let time$1 = 0, dtime = 0;
const CLICK_DIST = 2;
const CLICK_TIME = 250;

class SelectionControls extends Tool {
  static get properties() {
    return {
      selection: Selection,
      helper: SelectionHelper,
    };
  }
  constructor(props) {
    super(props);
    this.addEventListener('pointerdown', this.onPointerdown.bind(this));
    this.addEventListener('pointerup', this.onPointerup.bind(this));
  }
  helperChanged(event) {
    const oldHelper = event.detail.oldValue;
    const helper = event.detail.value;
    if (oldHelper) this.helperScene.remove(oldHelper);
    if (helper) this.helperScene.remove(helper);
  }
  selectionChanged() {
    this.helper.selection = this.selection;
  }
  select(viewport, pointer, camera) {
    raycaster.setFromCamera(pointer.position, camera);
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    if (intersects.length > 0) {
      const object = intersects[0].object;
      // TODO: handle helper selection
      if (pointer.ctrlKey) {
        this.selection.toggle(object);
      } else {
        this.selection.replace(object);
      }
    } else {
      this.selection.clear();
    }
  }
  onPointerdown() {
    time$1 = Date.now();
  }
  onPointerup(event) {
    const pointers = event.detail.pointers;
    const target = event.detail.event.target;
    const camera = event.detail.camera;
    const rect = event.detail.rect;
    const x = Math.floor(pointers[0].distance.x * rect.width / 2);
    const y = Math.floor(pointers[0].distance.y * rect.height / 2);
    const length = Math.sqrt(x * x + y * y);
    dtime = Date.now() - time$1;
    if (pointers[0] && dtime < CLICK_TIME) {
      if (length < CLICK_DIST) {
        this.select(target, pointers[0], camera);
      }
    }
  }
}

const renderer = new WebGLRenderer({antialias: true, preserveDrawingBuffer: true, alpha: true});
const gl = renderer.getContext();

renderer.domElement.className = 'canvas3d';
renderer.gammaFactor = 2.2;
renderer.gammaInput = true;
renderer.gammaOutput = true;
renderer.shadowMap.enabled = true;
renderer.setClearColor(0x000000, 1.0);
renderer.autoClear = false;

let host;

let perfNow = 0;
let perfDelta = 1000;
let perfAverage = 1000;
let perfWarned;

const _performanceCheck = function() {
  if (perfWarned) return;
  perfDelta = performance.now() - perfNow;
  perfAverage = Math.min((perfAverage * 10 + perfDelta) / 11, 1000);
  perfNow = performance.now();
  if (perfAverage < 16) {
    console.warn('ThreeRenderer performance warning: rendering multiple canvases!');
    perfWarned = true;
  }
};

const renderedQueue = [];
const renderNextQueue = [];

const animate$1 = function() {
  for (let i = 0; i < renderedQueue.length; i++) renderedQueue[i].rendered = false;
  renderedQueue.length = 0;
  for (let i = 0; i < renderNextQueue.length; i++) {
    renderNextQueue[i].scheduled = false;
    renderNextQueue[i].render();
  }
  renderNextQueue.length = 0;
  requestAnimationFrame(animate$1);
};
requestAnimationFrame(animate$1);

class ThreeRenderer extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: block;
        overflow: hidden;
        position: relative;
        touch-action: none;
        user-select: none;
        box-sizing: border-box;
      }
      :host:focus {
        z-index: 2;
      }
      :host > canvas {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
      }
      :host[ishost] > canvas:not(.canvas3d) {
        display: none;
      }
    </style>`;
  }
  static get properties() {
    return {
      scene: {
        type: Scene,
        change: 'renderableChanged',
      },
      camera: {
        type: PerspectiveCamera,
        change: 'renderableChanged',
      },
      ishost: {
        type: Boolean,
        reflect: true
      },
      size: [0, 0],
      tabindex: 1,
      clearColor: 0x000000,
      clearAlpha: 1,
      renderer: function () { return renderer; }
    };
  }
  static get listeners() {
    return {
      'dragstart': 'preventDefault'
    };
  }
  constructor(props) {
    super(props);
    this.template([['canvas', {id: 'canvas'}]]);
    this._ctx = this.$.canvas.getContext('2d');
  }
  renderableChanged() {
    this.queueRender();
  }
  sceneMutated() {
    this.queueRender();
  }
  cameraMutated() {
    this.queueRender();
  }
  queueRender() {
    if (!this.scheduled) {
      renderNextQueue.push(this);
      this.scheduled = true;
    }
  }
  render() {
    if (this.rendered || !this._ctx) {
      this.queueRender();
      return;
    }
    this.setHost();
    this.updateCameraAspect();
    this.preRender();
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.postRender();
    renderedQueue.push(this);
    this.rendered = true;
  }
  preRender() {}
  postRender() {}
  updateCameraAspect() {
    if (this.size[0] && this.size[1]) {
      const aspect = this.size[0] / this.size[1];
      if (this.camera instanceof PerspectiveCamera) {
        this.camera.aspect = aspect;
      }
      if (this.camera instanceof OrthographicCamera) {
        const hh = (this.camera.top - this.camera.bottom) / 2;
        let hw = hh * aspect;
        this.camera.top = hh;
        this.camera.bottom = - hh;
        this.camera.right = hw;
        this.camera.left = - hw;
        this.camera.updateMatrix();
        this.camera.updateMatrixWorld();
      }
      this.camera.updateProjectionMatrix();
    }
  }
  setHost() {
    if (!this.ishost) {
      if (host) {
        const ratio =  (window.devicePixelRatio || 1) / host._ctx.backingStorePixelRatio || 1;
        host._ctx.clearRect(0, 0, host.size[0] * ratio, host.size[1] * ratio);
        host._ctx.drawImage(host.renderer.domElement, 0, 0, host.size[0] * ratio, host.size[1] * ratio);
        gl.flush();
        host.ishost = false;
      }
      host = this;
      this.appendChild(this.renderer.domElement);
      this.ishost = true;
      _performanceCheck();
    }
    if (this.size[0] && this.size[1]) {
      this.renderer.setSize(this.size[0], this.size[1]);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setClearColor(this.clearColor, this.clearAlpha);
    }
  }
  resized() {
    const rect = this.getBoundingClientRect();
    this.size[0] = Math.ceil(rect.width);
    this.size[1] = Math.ceil(rect.height);
    const ratio =  (window.devicePixelRatio || 1) / this._ctx.backingStorePixelRatio || 1;
    this.$.canvas.width = this.size[0] * ratio;
    this.$.canvas.height = this.size[1] * ratio;

    if (this.size[0] && this.size[1]) {
      this.renderer.setSize(this.size[0], this.size[1]);
      this.renderer.setPixelRatio(window.devicePixelRatio);
    }
    this.render();
  }
}

ThreeRenderer.Register();

/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 * @author arodic / http://github.com/arodic
 */

/*
 * This set of controls performs orbiting, dollying, and panning.
 * Unlike TrackballCameraControls, it maintains the "up" direction camera.up (+Y by default).
 *
 *  Orbit - left mouse / touch: one-finger move
 *  Dolly - middle mouse, or mousewheel / touch: two-finger spread or squish
 *  Pan - right mouse, or left mouse + ctrlKey/altKey, wasd, or arrow keys / touch: two-finger move
 */

// Temp variables
const eye = new Vector3();
const offset = new Vector3();
const offset2 = new Vector3();
const unitY = new Vector3(0, 1, 0);
const tempQuat = new Quaternion();
const tempQuatInverse = tempQuat.clone().inverse();

class OrbitCameraControls extends CameraControls {
  static get properties() {
    return {
      minDistance: 0, // PerspectiveCamera dolly limit
      maxDistance: Infinity, // PerspectiveCamera dolly limit
      minZoom: 0, // OrthographicCamera zoom limit
      maxZoom: Infinity, // OrthographicCamera zoom limit
      minPolarAngle: 0, // radians (0 to Math.PI)
      maxPolarAngle: Math.PI, // radians (0 to Math.PI)
      minAzimuthAngle: - Infinity, // radians (-Math.PI to Math.PI)
      maxAzimuthAngle: Infinity, // radians (-Math.PI to Math.PI)
      screenSpacePanning: false,
      _spherical: Spherical
    };
  }
  orbit(orbit, camera) {
    // camera.up is the orbit axis
    tempQuat.setFromUnitVectors(camera.up, unitY);
    tempQuatInverse.copy(tempQuat).inverse();
    eye.copy(camera.position).sub(camera._target);
    // rotate eye to "y-axis-is-up" space
    eye.applyQuaternion(tempQuat);
    // angle from z-axis around y-axis
    this._spherical.setFromVector3(eye);
    this._spherical.theta -= orbit.x;
    this._spherical.phi += orbit.y;
    // restrict theta to be between desired limits
    this._spherical.theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, this._spherical.theta));
    // restrict phi to be between desired limits
    this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi));
  }
  dolly(dolly, camera) {
    let dollyScale = (dolly > 0) ? 1 - dolly : 1 / (1 + dolly);
    if (camera.isPerspectiveCamera) {
      this._spherical.radius /= dollyScale;
    } else if (camera.isOrthographicCamera) {
      camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, camera.zoom * dollyScale));
    }
    camera.updateProjectionMatrix();

    this._spherical.makeSafe();
    // restrict radius to be between desired limits
    this._spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this._spherical.radius));
  }
  pan(pan, camera) {
    // move target to panned location

    let panLeftDist;
    let panUpDist;
    if (camera.isPerspectiveCamera) {
      // half of the fov is center to top of screen
      let fovFactor = Math.tan((camera.fov / 2) * Math.PI / 180.0);
      panLeftDist = pan.x * eye.length() * fovFactor;
      panUpDist = -pan.y * eye.length() * fovFactor;
    } else if (camera.isOrthographicCamera) {
      panLeftDist = pan.x * (camera.right - camera.left) / camera.zoom;
      panUpDist = -pan.y * (camera.top - camera.bottom) / camera.zoom;
    }

    // panLeft
    offset.setFromMatrixColumn(camera.matrix, 0);
    offset.multiplyScalar(-panLeftDist);
    offset2.copy(offset);

    // panUp
    if (this.screenSpacePanning) {
      offset.setFromMatrixColumn(camera.matrix, 1);
    } else {
      offset.setFromMatrixColumn(camera.matrix, 0);
      offset.crossVectors(camera.up, offset);
    }
    offset.multiplyScalar(panUpDist);
    offset2.add(offset);

    camera._target.add(offset2);
    offset.setFromSpherical(this._spherical);
    // rotate offset back to "camera-up-vector-is-up" space
    offset.applyQuaternion(tempQuatInverse);
    camera.position.copy(camera._target).add(offset);
    camera.lookAt(camera._target);
  }
  focus(/*camera*/) {
    // console.log(this.selection);
  }
  // utility getters
  get polarAngle() {
    return this._spherical.phi;
  }
  get azimuthalAngle() {
    return this._spherical.theta;
  }
}

// import {CombinedTransformControls} from "../controls/transform/Combined.js";

class ThreeViewport extends ThreeRenderer {
  static get properties() {
    return {
      cameraTool: OrbitCameraControls,
      selectionTool: SelectionControls,
      selection: Selection,
    };
  }
  get bindings() {
    return {
      cameraTool: {scene: this.bind('scene')},
      selectionTool: {scene: this.bind('scene'), selection: this.bind('selection')},
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this.cameraTool.attachViewport(this, this.camera);
    this.selectionTool.attachViewport(this, this.camera);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.cameraTool.detachViewport(this, this.camera);
    this.selectionTool.detachViewport(this, this.camera);
  }
  sceneChanged() {
    this.selectionTool.scene = this.scene;
  }
  cameraChanged() {
    this.cameraTool.attachViewport(this, this.camera);
    this.selectionTool.attachViewport(this, this.camera);
  }
  selectionToolChanged(event) {
    if (event.detail.oldValue) event.detail.oldValue.detachViewport(this);
    event.detail.value.attachViewport(this, this.camera);
  }
  cameraToolChanged(event) {
    if (event.detail.oldValue) event.detail.oldValue.detachViewport(this);
    event.detail.value.attachViewport(this, this.camera);
  }
  selectionMutated(event) {
    console.log('!!!! selection mutated', event.detail, this);
    this.render();
  }
  dispose() {
    // TODO
    this.cameraTool.detachViewport(this, this.camera);
    this.selectionTool.detachViewport(this, this.camera);
  }
  preRender() {
  }
  postRender() {
    this.renderer.clearDepth();
    if (this.cameraTool.helperScene) this.renderer.render(this.cameraTool.helperScene, this.camera);
    if (this.selectionTool.helperScene) this.renderer.render(this.selectionTool.helperScene, this.camera);
  }
}

ThreeViewport.Register();

const loader = new GLTFLoader();
const scene = new Scene();

const perspCamera = new PerspectiveCamera(90, 1, 0.0001, 100);
perspCamera.position.set(1, 1, 1);
perspCamera._target = new Vector3(0, 0.75, 0);

const topCamera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.001, 20);
topCamera.position.set(0, 10, 0);
topCamera._target = new Vector3(0, 0.75, 0);

const leftCamera = new OrthographicCamera(-0.75, 0.75, 0.75, -0.75, 0.001, 20);
leftCamera.position.set(10, 0.75, 0);
leftCamera._target = new Vector3(0, 0.75, 0);

const frontCamera = new OrthographicCamera(-0.75, 0.75, 0.75, -0.75, 0.001, 20);
frontCamera.position.set(0, 0.75, 10);
frontCamera._target = new Vector3(0, 0.75, 0);

class ThreeEditor extends IoElement {
  static get style() {
    return html`
    <style>
      :host {
        display: grid;
        grid-template-columns: 50% 50%;
      }
      :host > three-viewport {
        display: flex;
        flex: 1 1 auto;
      }
    </style>
    `;
  }
  static get properties() {
    return {
      cameraControls: EditorCameraControls,
      selectionControls: SelectionControls,
      selection: Selection,
      // transformControls: CombinedTransformControls,
    };
  }
  connectedCallback() {
    super.connectedCallback();
    if (!scene.loaded) {
      loader.load('/three-ui/demo/scene/cubes.gltf', gltf => {
        gltf.scene.children.forEach(child => { scene.add( child ); });
        scene.add(new HemisphereLight(0x333333, 0xffffff, 3));
        window.dispatchEvent(new CustomEvent('object-mutated', {detail: {object: scene}}));
      }, undefined, function ( e ) {
        console.error( e );
      } );
      scene.loaded = true;
    }
  }
  constructor(props) {
    super(props);
    const viewportProps = {
      clearAlpha: 0,
      scene: scene,
      selection: this.selection,
      // TODO: make sure previous controls do disconnect!
      cameraTool: this.cameraControls,
      selectTool: this.selectionControls,
      // editTool: this.transformControls,
    };
    this.template([
      ['three-viewport', Object.assign({id: 'viewport0', camera: perspCamera}, viewportProps)],
      ['three-viewport', Object.assign({id: 'viewport1', camera: topCamera}, viewportProps)],
      ['three-viewport', Object.assign({id: 'viewport2', camera: leftCamera}, viewportProps)],
      ['three-viewport', Object.assign({id: 'viewport3', camera: frontCamera}, viewportProps)],
    ]);
  }
  selectionMutated(event) {
    console.log('EDITOR !!!! selection mutated', event.detail, this);
  }
}

ThreeEditor.Register();

//TODO: test

class ThreeEuler extends IoProperties {
  static get style() {
    return html`<style>
      :host {
        display: flex;
        flex-direction: row;
      }
      :host > *:not(:last-child) {
        margin-right: 2px;
      }
      :host > io-number {
        flex: 1 0;
      }
    </style>`;
  }
  valueChanged() {
    this.template([
      ['io-number', {id: 'x', conversion: 180 / Math.PI, value: this.value.x, 'on-value-set': this._onValueSet}],
      ['io-number', {id: 'y', conversion: 180 / Math.PI, value: this.value.y, 'on-value-set': this._onValueSet}],
      ['io-number', {id: 'z', conversion: 180 / Math.PI, value: this.value.z, 'on-value-set': this._onValueSet}],
      ['io-option', {id: 'order', value: this.value.order, options: ['XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX'], 'on-value-set': this._onValueSet}]
    ]);
  }
}

ThreeEuler.Register();

class ThreeInspector extends IoInspector {
  static get listeners() {
    return {
      'object-mutated': 'onObjectMutated'
    };
  }
  onObjectMutated(event) {
    const obj = event.detail.object;
    for (let i = this.crumbs.length; i--;) {
      if ((obj instanceof Uint16Array || obj instanceof Float32Array) && this.crumbs[i].isBufferAttribute) {
        this.crumbs[i].needsUpdate = true;
      }
    }
    if (event.detail.object.isCamera) {
      event.detail.object.updateProjectionMatrix();
    }
  }
}

ThreeInspector.Register();

ThreeInspector.RegisterConfig({

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
  "Object3D|scale": ["three-vector", {canlink: true}],
  "Object3D|children": ["io-properties", {labeled: false, config: {'type:object': ['io-inspector-link']}}],
  // Camera
  "Camera|fov": ["io-slider", {min: 0.001, max: 180}],
  "Camera|zoom": ["io-slider", {min: 0.001, max: 100}],
  "Camera|near": ["io-slider", {min: 0.001, max: 100000}], // TODO: log
  "Camera|far": ["io-slider", {min: 0.001, max: 100000}], // TODO: log
  // BufferGeometry
  "BufferGeometry|parameters": ["io-properties"],
  "BufferGeometry|index": ["three-attributes"],
  "BufferGeometry|attributes": ["three-attributes"],
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
  "Material|shininess": ["io-slider", {"min": 0,"max": 100}],
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

class ThreeMatrix extends IoCollapsable {
  static get properties() {
    return {
      value: Object,
    };
  }
  changed() {
    this.template([
      ['io-boolean', {true: 'elements', false: 'elements', value: this.bind('expanded')}],
      this.expanded ? ['div', {className: 'io-collapsable-content'}, [['io-array', {value: this.value.elements}]]] : null
    ]);
  }
}

ThreeMatrix.Register();

// import {OrbitCameraControls} from "../controls/camera/Orbit.js";

class ThreePlayer extends ThreeViewport {
  static get style() {
    return html`
    <style>
      :host:hover:not([playing])::after {
        color: white !important;
      }
      :host:not([loading]):not([playing])::after {
        content: '▶';
        color: var(--io-theme-link-color);
        display: inline-block;
        position: relative;
        top: 50%;
        left: 50%;
        margin-top: -32px;
        margin-left: -24px;
        font-size: 64px;
      }
      :host[loading]::after {
        content: '';
        display: inline-block;
        position: relative;
        top: 50%;
        left: 50%;
        margin-top: -32px;
        margin-left: -32px;
        width: 64px;
        height: 64px;
        background: var(--io-theme-link-color);
        animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
      }
      @keyframes lds-ripple {
        0% {
          width: 0;
        }
        25% {
          margin-left: -32px;
          width: 64px;
        }
        75% {
          margin-left: -32px;
          width: 64px;
        }
        100% {
          margin-left: 32px;
          width: 0;
        }
      }
      :host > canvas {
        transition: opacity 0.8s;
      }
      :host:hover:not([playing]) > canvas {
        opacity: 1;
      }
      :host:not([playing]) > canvas,
      :host[loading] > canvas {
        opacity: 0.2;
      }
    </style>
    `;
  }
  static get properties() {
    return {
      loading: {
        type: Boolean,
        reflect: true
      },
      playing: {
        type: Boolean,
        reflect: true
      },
      autoplay: false,
      time: 0,
      // controls: null,
      clock: Clock,
    };
  }
  static get listeners() {
    return {
      'pointerdown': 'play',
    };
  }
  connectedCallback() {
    if (this.autoplay) this.play();
    super.connectedCallback();
    // this.attachControls(this.controls);
    // this.controls = new OrbitCameraControls();
    // TODO: handle camera change
  }
  disconnectedCallback() {
    this.stop();
    super.disconnectedCallback();
  }
  // controlsChanged(event) {
  //   if (event.detail.oldValue) event.detail.oldValue.dispose();
  //   if (this.controls) {
  //     this.controls.addEventListener('change', this.queueRender);
  //   }
  // }
  autoplayChanged() {
    if (this.autoplay) this.play();
  }
  play() {
    if (this.playing) return;
    this._oldTime = Date.now() / 1000;
    this.playing = true;
    this.update();
  }
  pause() {
  }
  stop() {
    this.playing = false;
  }
  update() {
    if (this.playing) {
      requestAnimationFrame(this.update);
      this.time = (Date.now() / 1000) - this._oldTime;
      this.queueRender();
    }
  }
  preRender() {
  }
  postRender() {
  }
  dispose() {
    this.renderer.dispose();
    this.scene.traverse(child => {
      if (child.material) child.material.dispose();
      if (child.geometry) child.geometry.dispose();
    });
    super.dispose();
  }
}

ThreePlayer.Register();

//TODO: test

const components = {
  x: {},
  y: {},
  z: {},
  w: {}
};

class ThreeVector extends IoProperties {
  static get style() {
    return html`<style>
      :host {
        display: flex;
        flex-direction: row;
      }
      :host > *:not(:last-child) {
        margin-right: 2px;
      }
      :host > io-number {
        flex: 1 0;
      }
    </style>`;
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
  valueChanged() {
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

export { ThreeAttributes, ThreeColor, ThreeEditor, ThreeEuler, ThreeInspector, ThreeMatrix, ThreePlayer, ThreeVector, ThreeRenderer, ThreeViewport };

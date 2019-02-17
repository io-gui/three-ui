import * as THREE from "../../three.js/build/three.module.js";
import {ThreePlayer} from "../src/elements/player.js";
import {GLTFLoader} from "../lib/GLTFLoader.js";
import {DRACOLoader} from "../lib/DRACOLoader.js";

export class ThreeExampleAnimationKeyframes extends ThreePlayer {
  constructor(props) {
    super(props);
    let camera = this.camera = new THREE.PerspectiveCamera( 40, 1, 1, 100 );
    let scene = this.scene = new THREE.Scene();

    var pointLight;
    var renderer, mixer, controls;
    var container = document.getElementById( 'container' );

    scene.background = new THREE.Color( 0xbfe3dd );
    camera.position.set( 5, 2, 8 );

    scene.add( new THREE.AmbientLight( 0x404040 ) );
    pointLight = new THREE.PointLight( 0xffffff, 1 );
    pointLight.position.copy( camera.position );
    scene.add( pointLight );
    // envmap

    this.loading = true;

    var path = './examples/textures/cube/Park2/';
    var format = '.jpg';
    var envMap = new THREE.CubeTextureLoader().load( [
      path + 'posx' + format, path + 'negx' + format,
      path + 'posy' + format, path + 'negy' + format,
      path + 'posz' + format, path + 'negz' + format
    ] );

    DRACOLoader.setDecoderPath( './examples/js/libs/draco/gltf/' );

    var loader = new GLTFLoader();
    loader.setDRACOLoader( new DRACOLoader() );

    const scope = this;

    loader.load( './examples/models/gltf/LittlestTokyo.glb', function ( gltf ) {
      var model = gltf.scene;
      model.position.set( 1, 1, 0 );
      model.scale.set( 0.01, 0.01, 0.01 );
      model.traverse( function ( child ) {
        if ( child.isMesh ) child.material.envMap = envMap;
      } );
      scene.add( model );
      scope.mixer = new THREE.AnimationMixer( model );
      scope.mixer.clipAction( gltf.animations[ 0 ] ).play();

      scope.loading = false;

    }, undefined, function ( e ) {
      console.error( e );
    } );
  }
  preRender() {
  }
  update() {
    super.update();
    if (this.mixer) {
      var delta = this.clock.getDelta();
      this.mixer.update( delta );
    }
  }
}

ThreeExampleAnimationKeyframes.Register();

import * as THREE from "../../three.js/build/three.module.js";
import {ThreePlayer} from "../src/elements/player.js";
import {cloth, clothFunction, ballSize, windForce, simulate, ballPosition} from "./js/Cloth.js";

export class ThreeExampleCloth extends ThreePlayer {
  static get properties() {
    return {
      sphere: {},
      object: {},
      clothGeometry: {},
      group: THREE.Group,
    };
  }
  constructor(props) {
    super(props);

    let camera = this.camera = new THREE.PerspectiveCamera( 45, 1, .1, 20000 );
    let scene = this.scene = new THREE.Scene();
    let group = this.group = new THREE.Group();

    scene.background = new THREE.Color( 0xcce0ff );
    scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );

    // camera
    camera.position.set( 300, 30, 600 );
    camera.lookAt( new THREE.Vector3() );

    // lights

    var light, materials;

    scene.add( new THREE.AmbientLight( 0x666666 ) );

    light = new THREE.DirectionalLight( 0xdfebff, 1 );
    light.position.set( 50, 200, 100 );
    light.position.multiplyScalar( 1.3 );

    light.castShadow = true;

    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    var d = 300;

    light.shadow.camera.left = - d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = - d;

    light.shadow.camera.far = 1000;

    scene.add( light );

    // cloth material

    var loader = new THREE.TextureLoader();
    var clothTexture = loader.load( './examples/textures/patterns/circuit_pattern.png' );
    clothTexture.anisotropy = 16;

    var clothMaterial = new THREE.MeshLambertMaterial( {
      map: clothTexture,
      side: THREE.DoubleSide,
      alphaTest: 0.5
    } );

    // cloth geometry

    this.clothGeometry = new THREE.ParametricGeometry( clothFunction, cloth.w, cloth.h );

    // cloth mesh

    this.object = new THREE.Mesh( this.clothGeometry, clothMaterial );
    this.object.position.set( 0, 0, 0 );
    this.object.castShadow = true;
    scene.add( this.object );

    this.object.customDepthMaterial = new THREE.MeshDepthMaterial( {

      depthPacking: THREE.RGBADepthPacking,
      map: clothTexture,
      alphaTest: 0.5

    } );

    // sphere

    var ballGeo = new THREE.SphereBufferGeometry( ballSize, 32, 16 );
    var ballMaterial = new THREE.MeshLambertMaterial();

    this.sphere = new THREE.Mesh( ballGeo, ballMaterial );
    this.sphere.castShadow = true;
    this.sphere.receiveShadow = true;
    scene.add( this.sphere );

    // ground

    var groundTexture = loader.load( './examples/textures/terrain/grasslight-big.jpg' );
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set( 25, 25 );
    groundTexture.anisotropy = 16;

    var groundMaterial = new THREE.MeshLambertMaterial( { map: groundTexture } );

    var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 20000, 20000 ), groundMaterial );
    mesh.position.y = - 250;
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );

    // poles

    var poleGeo = new THREE.BoxBufferGeometry( 5, 375, 5 );
    var poleMat = new THREE.MeshLambertMaterial();

    var mesh = new THREE.Mesh( poleGeo, poleMat );
    mesh.position.x = - 125;
    mesh.position.y = - 62;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add( mesh );

    var mesh = new THREE.Mesh( poleGeo, poleMat );
    mesh.position.x = 125;
    mesh.position.y = - 62;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add( mesh );

    var mesh = new THREE.Mesh( new THREE.BoxBufferGeometry( 255, 5, 5 ), poleMat );
    mesh.position.y = - 250 + ( 750 / 2 );
    mesh.position.x = 0;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add( mesh );

    var gg = new THREE.BoxBufferGeometry( 10, 10, 10 );
    var mesh = new THREE.Mesh( gg, poleMat );
    mesh.position.y = - 250;
    mesh.position.x = 125;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add( mesh );

    var mesh = new THREE.Mesh( gg, poleMat );
    mesh.position.y = - 250;
    mesh.position.x = - 125;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add( mesh );
  }
  preRender() {
    var p = cloth.particles;
    for ( var i = 0, il = p.length; i < il; i ++ ) {
      this.clothGeometry.vertices[ i ].copy( p[ i ].position );
    }
    this.clothGeometry.verticesNeedUpdate = true;
    this.clothGeometry.computeFaceNormals();
    this.clothGeometry.computeVertexNormals();
    this.sphere.position.copy( ballPosition );
  }
  update() {
    let camera = this.camera;
    let scene = this.scene;

    var time = Date.now();
    var windStrength = Math.cos( time / 7000 ) * 5 + 40;

    if (this.clothGeometry && this.sphere) {
      windForce.set( Math.sin( time / 2000 ), Math.cos( time / 3000 ), Math.sin( time / 1000 ) )
      windForce.normalize()
      windForce.multiplyScalar( windStrength );
      simulate( this.clothGeometry, this.sphere, time );
    }
    super.update();
  }
}

ThreeExampleCloth.Register();

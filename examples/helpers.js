import * as THREE from "../../three.js/build/three.module.js";
import {ThreePlayer} from "../src/elements/player.js";
import {GLTFLoader} from "../lib/GLTFLoader.js";

export class ThreeExampleHelpers extends ThreePlayer {
  static get properties() {
    return {
    };
  }
  constructor(props) {
    super(props);
    let camera = this.camera = new THREE.PerspectiveCamera( 45, 1, .1, 20000 );
    let scene = this.scene = new THREE.Scene();
    let light = this.light = new THREE.PointLight();

    camera.position.z = 400;

    light.position.set( 200, 100, 150 );
    scene.add( light );
    scene.add( new THREE.PointLightHelper( light, 15 ) );
    var gridHelper = new THREE.GridHelper( 400, 40, 0x0000ff, 0x808080 );
    gridHelper.position.y = - 150;
    gridHelper.position.x = - 150;
    scene.add( gridHelper );
    var polarGridHelper = new THREE.PolarGridHelper( 200, 16, 8, 64, 0x0000ff, 0x808080 );
    polarGridHelper.position.y = - 150;
    polarGridHelper.position.x = 200;
    scene.add( polarGridHelper );
    var loader = new GLTFLoader();

    const scope = this;

    loader.load( './examples/models/gltf/LeePerrySmith/LeePerrySmith.glb', function ( gltf ) {
      var mesh = gltf.scene.children[ 0 ];
      var group = new THREE.Group();
      group.scale.multiplyScalar( 50 );
      scene.add( group );
      // To make sure that the matrixWorld is up to date for the boxhelpers
      group.updateMatrixWorld( true );
      group.add( mesh );
      scope.vnh = new THREE.VertexNormalsHelper( mesh, 5 );
      scene.add( scope.vnh );
      scene.add( new THREE.BoxHelper( mesh ) );
      var wireframe = new THREE.WireframeGeometry( mesh.geometry );
      var line = new THREE.LineSegments( wireframe );
      line.material.depthTest = false;
      line.material.opacity = 0.25;
      line.material.transparent = true;
      line.position.x = 4;
      group.add( line );
      scene.add( new THREE.BoxHelper( line ) );
      var edges = new THREE.EdgesGeometry( mesh.geometry );
      var line = new THREE.LineSegments( edges );
      line.material.depthTest = false;
      line.material.opacity = 0.25;
      line.material.transparent = true;
      line.position.x = - 4;
      group.add( line );
      scene.add( new THREE.BoxHelper( line ) );
      scene.add( new THREE.BoxHelper( group ) );
      scene.add( new THREE.BoxHelper( scene ) );
    } );
  }
  preRender() {
  }
  update() {

    var time = - performance.now() * 0.0003;
    if (this.light) {
      this.light.position.x = Math.sin( time * 1.7 ) * 300;
      this.light.position.y = Math.cos( time * 1.5 ) * 400;
      this.light.position.z = Math.cos( time * 1.3 ) * 300;
    }
    if ( this.vnh ) this.vnh.update();

    super.update();
  }
}

ThreeExampleHelpers.Register();

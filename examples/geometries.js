import * as THREE from "../../three.js/src/Three.js";
import {ThreePlayer} from "../src/elements/player.js";

export class ThreeExampleGeometries extends ThreePlayer {
  static get properties() {
    return {
      group: THREE.Group
    };
  }
  constructor(props) {
    super(props);

    let camera = this.camera = new THREE.PerspectiveCamera( 45, 1, .1, 20000 );
    let scene = this.scene = new THREE.Scene();
    let group = this.group = new THREE.Group();

    camera.position.set( -400, 250, 1000 );

    scene.add( group );

    let object;

    let ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
    scene.add( ambientLight );

    let pointLight = new THREE.PointLight( 0xffffff, 0.8 );
    camera.add( pointLight );
    scene.add( camera );

    let map = new THREE.TextureLoader().load( './examples/textures/UV_Grid_Sm.jpg' );
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 16;

    let material = new THREE.MeshPhongMaterial( { map: map, side: THREE.DoubleSide } );

    object = new THREE.Mesh( new THREE.SphereGeometry( 75, 20, 10 ), material );
    object.position.set( - 300, 0, 200 );
    group.add( object );

    object = new THREE.Mesh( new THREE.IcosahedronGeometry( 75, 1 ), material );
    object.position.set( - 100, 0, 200 );
    group.add( object );

    object = new THREE.Mesh( new THREE.OctahedronGeometry( 75, 2 ), material );
    object.position.set( 100, 0, 200 );
    group.add( object );

    object = new THREE.Mesh( new THREE.TetrahedronGeometry( 75, 0 ), material );
    object.position.set( 300, 0, 200 );
    group.add( object );

    //

    object = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100, 4, 4 ), material );
    object.position.set( - 300, 0, 0 );
    group.add( object );

    object = new THREE.Mesh( new THREE.BoxGeometry( 100, 100, 100, 4, 4, 4 ), material );
    object.position.set( - 100, 0, 0 );
    group.add( object );

    object = new THREE.Mesh( new THREE.CircleGeometry( 50, 20, 0, Math.PI * 2 ), material );
    object.position.set( 100, 0, 0 );
    group.add( object );

    object = new THREE.Mesh( new THREE.RingGeometry( 10, 50, 20, 5, 0, Math.PI * 2 ), material );
    object.position.set( 300, 0, 0 );
    group.add( object );

    //

    object = new THREE.Mesh( new THREE.CylinderGeometry( 25, 75, 100, 40, 5 ), material );
    object.position.set( - 300, 0, - 200 );
    group.add( object );

    let points = [];

    for ( let i = 0; i < 50; i ++ ) {

      points.push( new THREE.Vector2( Math.sin( i * 0.2 ) * Math.sin( i * 0.1 ) * 15 + 50, ( i - 5 ) * 2 ) );

    }

    object = new THREE.Mesh( new THREE.LatheGeometry( points, 20 ), material );
    object.position.set( - 100, 0, - 200 );
    group.add( object );

    object = new THREE.Mesh( new THREE.TorusGeometry( 50, 20, 20, 20 ), material );
    object.position.set( 100, 0, - 200 );
    group.add( object );

    object = new THREE.Mesh( new THREE.TorusKnotGeometry( 50, 10, 50, 20 ), material );
    object.position.set( 300, 0, - 200 );
    group.add( object );

  }
  update() {
    let camera = this.camera;
    let scene = this.scene;

    this.group.rotation.y = this.time * 0.2;

    camera.lookAt( scene.position );

    scene.traverse( ( object ) => {

      if ( object.isMesh === true ) {

        object.rotation.x = this.time * 0.5;
        object.rotation.y = this.time * 0.25;

      }

    } );
    super.update();
  }
}

ThreeExampleGeometries.Register();
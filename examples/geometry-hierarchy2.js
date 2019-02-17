import * as THREE from "../../three.js/build/three.module.js";
import {ThreePlayer} from "../src/elements/player.js";

export class ThreeExampleGeometryHierarchy2 extends ThreePlayer {
  constructor(props) {
    super(props);

    let camera = this.camera = new THREE.PerspectiveCamera( 45, 1, .1, 20000 );
    let scene = this.scene = new THREE.Scene();

    camera.position.set( 3000, 300, 600 );
    camera.lookAt( new THREE.Vector3() );

    scene.background = new THREE.Color( 0xffffff );

    let geometry = new THREE.BoxGeometry( 100, 100, 100 );
    let material = new THREE.MeshNormalMaterial();

    let root = new THREE.Mesh( geometry, material );
    scene.add( root );

    let amount = 200, object, parent = root;

    for ( let i = 0; i < amount; i ++ ) {

      object = new THREE.Mesh( geometry, material );
      object.position.x = 100;

      parent.add( object );
      parent = object;

    }

    parent = root;

    for ( let i = 0; i < amount; i ++ ) {

      object = new THREE.Mesh( geometry, material );
      object.position.x = - 100;

      parent.add( object );
      parent = object;

    }

    parent = root;

    for ( let i = 0; i < amount; i ++ ) {

      object = new THREE.Mesh( geometry, material );
      object.position.y = - 100;

      parent.add( object );
      parent = object;

    }

    parent = root;

    for ( let i = 0; i < amount; i ++ ) {

      object = new THREE.Mesh( geometry, material );
      object.position.y = 100;

      parent.add( object );
      parent = object;

    }

    parent = root;

    for ( let i = 0; i < amount; i ++ ) {

      object = new THREE.Mesh( geometry, material );
      object.position.z = - 100;

      parent.add( object );
      parent = object;

    }

    parent = root;

    for ( let i = 0; i < amount; i ++ ) {

      object = new THREE.Mesh( geometry, material );
      object.position.z = 100;

      parent.add( object );
      parent = object;

    }

  }
  update() {
    let rx = Math.sin( this.time * 0.07 ) * 0.2;
    let ry = Math.sin( this.time * 0.03 ) * 0.1;
    let rz = Math.sin( this.time * 0.02 ) * 0.1;

    this.scene.traverse( function ( object ) {

      object.rotation.x = rx;
      object.rotation.y = ry;
      object.rotation.z = rz;

    } );

    super.update();
  }
}

ThreeExampleGeometryHierarchy2.Register();

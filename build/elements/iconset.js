import { IoIconsetSingleton } from 'io-gui';

IoIconsetSingleton.registerIcons( 'three', /* html */ `
<svg>
<g id="mesh_triangles">
	<path d="M18.3,12.5l-4.8-8.2c0.1-0.2,0.1-0.4,0.1-0.6c0-0.9-0.7-1.6-1.6-1.6c-0.9,0-1.6,0.7-1.6,1.6c0,0.2,0,0.4,0.1,0.6l-4.1,4
		C6.3,8.1,6.1,8,5.9,8C5,8,4.3,8.7,4.3,9.6c0,0.8,0.6,1.5,1.4,1.5l3.8,8.1c-0.3,0.3-0.4,0.6-0.4,1c0,0.9,0.7,1.6,1.6,1.6
		c0.9,0,1.6-0.7,1.6-1.6c0-0.3-0.1-0.5-0.2-0.7l5-4.4c0.3,0.3,0.7,0.5,1.1,0.5c0.9,0,1.6-0.7,1.6-1.6C19.7,13.3,19.1,12.6,18.3,12.5
		z M7.2,10.5l3.4,1c0,0.1,0,0.2,0,0.3c0,0.8,0.6,1.4,1.3,1.5l-1.3,5.5c-0.2,0-0.5,0.1-0.6,0.2l-3.7-7.9C6.6,11,6.9,10.8,7.2,10.5z
		 M17,13l-3.4-1c0-0.1,0-0.1,0-0.2c0-0.8-0.6-1.4-1.3-1.5v-5c0.4-0.1,0.7-0.2,1-0.5l4.6,7.9C17.5,12.6,17.2,12.8,17,13z M11.8,5.2v5
		c-0.5,0.1-0.9,0.4-1.2,0.8l-3.4-1c0-0.2,0.1-0.3,0.1-0.5c0-0.5-0.2-0.9-0.5-1.2l3.9-3.8C11.1,4.9,11.4,5.2,11.8,5.2z M11,18.8
		l1.3-5.5c0.6-0.1,1-0.4,1.3-0.9l3.3,1c-0.1,0.2-0.2,0.4-0.2,0.7s0.1,0.5,0.2,0.8l-5,4.4C11.6,19,11.3,18.9,11,18.8z"/>
</g>
<g id="sphere_shadow">
	<path d="M12,2.1c-5.3,0-9.7,4.3-9.7,9.7c0,3.1,1.5,5.9,3.8,7.7c-2.2,0.2-3.7,0.7-3.7,1.2c0,0.7,3,1.3,6.7,1.3
		c3.5,0,6.8-0.6,6.7-1.2c3.5-1.5,5.9-4.9,5.9-8.9C21.7,6.4,17.3,2.1,12,2.1z M14.9,19.8l0.5-0.5c-0.3,0-0.7,0.1-1,0.1l-0.8,0.8
		c-0.3,0.1-0.5,0.1-0.8,0.1l0.7-0.7l0.2-0.2c-0.3,0-0.6-0.1-0.9-0.1l-0.2,0.2l-0.8,0.8c-0.2,0-0.4,0-0.6,0l1.1-1.1
		C12,19.1,11.7,19,11.5,19l-1.2,1.2c-0.2,0-0.4-0.1-0.6-0.1l1.1-1.1l0.2-0.2c-0.2-0.1-0.4-0.2-0.7-0.3l-0.2,0.2L9,19.8
		c-0.2-0.1-0.3-0.1-0.5-0.2l1.2-1.2l0.2-0.2c-0.2-0.1-0.4-0.2-0.6-0.4L9.1,18l-1.2,1.2c-0.2-0.1-0.3-0.2-0.4-0.3l1.4-1.4
		c-0.2-0.1-0.4-0.3-0.5-0.4l-0.2,0.2l-1.3,1.3c-0.1-0.1-0.3-0.2-0.4-0.3L7.8,17L8,16.8c-0.2-0.2-0.3-0.3-0.5-0.5l-0.2,0.2l-1.4,1.4
		c-0.1-0.1-0.2-0.3-0.4-0.4L7,16l0.2-0.2c-0.1-0.2-0.3-0.4-0.4-0.6l-1.6,1.6c-0.1-0.1-0.2-0.3-0.3-0.4L6.3,15l0.2-0.2
		c-0.1-0.2-0.2-0.4-0.3-0.6L6,14.4l-1.5,1.5c-0.1-0.2-0.2-0.3-0.2-0.5l1.5-1.5L6,13.7c-0.1-0.2-0.2-0.5-0.2-0.7L4,14.7
		c-0.1-0.2-0.1-0.4-0.2-0.6l1.7-1.7c-0.1-0.3-0.1-0.5-0.1-0.8l-0.2,0.2l-1.6,1.6c0-0.2-0.1-0.4-0.1-0.6L5.3,11c0-0.2,0-0.3,0-0.5
		s0-0.3,0-0.5l-1.8,1.8c0-0.3,0-0.5,0-0.8l1.9-1.9c0.1-0.4,0.2-0.8,0.3-1.2L5.3,8.2L3.7,9.8C3.8,9.4,3.9,9.1,4,8.7L5.7,7l0.4-0.4
		c0.4-0.8,0.8-1.5,1.4-2.1c1.3-0.8,2.9-1.3,4.5-1.3c4.7,0,8.5,3.8,8.5,8.5C20.5,15.5,18.2,18.6,14.9,19.8z"/>
</g>
<g id="sphere_shade">
	<path d="M21.8,10.8c-0.4-3.1-2.2-5.8-4.9-7.4c-0.5-0.3-1-0.5-1.5-0.7c-2.6-0.9-5.8-0.8-8.2,0.7C6,4.1,4.8,5,4,6.2S2.7,8.7,2.4,10
		c-0.6,2.8,0.2,5.9,2,8.1c1.7,2.1,4.4,3.5,7.1,3.6c2.9,0.2,5.9-1.1,7.9-3.3C21.2,16.4,22.2,13.6,21.8,10.8z M18.4,16.3
		c-0.2,0.1-0.4,0.3-0.6,0.4l2.8-2.8c-0.1,0.2-0.2,0.4-0.4,0.6L18.4,16.3z M16.7,17.1c-0.1,0-0.2,0.1-0.4,0.1l4.7-4.7
		c0,0.1-0.1,0.2-0.1,0.4L16.7,17.1z M15.6,17.4c-0.1,0-0.2,0-0.3,0l6-6c0,0.1,0,0.2,0,0.3L15.6,17.4z M8.9,3.6
		c0.2-0.1,0.4-0.2,0.6-0.3L6.7,6.1C6.8,5.9,6.9,5.7,7,5.5L8.9,3.6z M10.5,2.9c0.1,0,0.2-0.1,0.4-0.1L6.2,7.4c0-0.1,0.1-0.2,0.1-0.4
		L10.5,2.9z M11.6,2.6c0.1,0,0.2,0,0.3,0L6,8.5c0-0.1,0-0.2,0-0.3L11.6,2.6z M14.4,17.4l2.7-2.7c-0.3,0.2-0.7,0.3-1,0.4l-2.3,2.3
		c-0.1,0-0.2,0-0.2,0l2.1-2.1c-0.2,0-0.5,0.1-0.7,0.1l-2,2c-0.1,0-0.2,0-0.2,0l1.9-1.9c-0.2,0-0.4,0-0.6,0l-1.8,1.8
		c-0.1,0-0.1,0-0.2-0.1l1.8-1.8c-0.2,0-0.4,0-0.5-0.1L11.7,17c-0.1,0-0.1,0-0.2-0.1l1.7-1.7l0,0c-0.2,0-0.3-0.1-0.5-0.1L11,16.7
		c-0.1,0-0.1,0-0.2-0.1l1.6-1.6c-0.2,0-0.3-0.1-0.5-0.2l-1.6,1.6c-0.1,0-0.1-0.1-0.2-0.1l1.6-1.6c-0.1-0.1-0.3-0.1-0.4-0.2L9.8,16
		c0,0-0.1-0.1-0.2-0.1l1.5-1.5c-0.1-0.1-0.3-0.2-0.4-0.2l-1.5,1.5c0,0-0.1-0.1-0.2-0.1l1.5-1.5c-0.1-0.1-0.2-0.2-0.4-0.3l-1.5,1.5
		l-0.1-0.1l1.5-1.5c-0.1-0.1-0.2-0.2-0.3-0.3l-1.5,1.5l-0.1-0.1l1.5-1.5c-0.1-0.1-0.2-0.2-0.3-0.3L8,14.4l-0.1-0.1l1.5-1.5
		c-0.1-0.1-0.2-0.2-0.3-0.4l-1.5,1.5c0,0-0.1-0.1-0.1-0.2L9,12.3c-0.1-0.1-0.2-0.3-0.2-0.4l-1.5,1.5c0,0-0.1-0.1-0.1-0.2l1.5-1.5
		c-0.1-0.1-0.1-0.3-0.2-0.4l-1.6,1.6c0-0.1-0.1-0.1-0.1-0.2l1.6-1.6c-0.1-0.2-0.1-0.3-0.2-0.5l-1.6,1.6c0-0.1,0-0.1-0.1-0.2l1.7-1.7
		c0-0.2-0.1-0.4-0.1-0.5l-1.7,1.7c0-0.1,0-0.1-0.1-0.2l1.8-1.8c0-0.2,0-0.4,0-0.6L6.2,11c0-0.1,0-0.1,0-0.2l1.9-1.9
		c0-0.2,0-0.5,0.1-0.7l-2.1,2.1c0-0.1,0-0.2,0-0.2l2.2-2.2C8.4,7.6,8.5,7.3,8.6,7L6,9.4c0-0.1,0-0.2,0-0.3l2.8-2.8
		C9.3,5.6,9.9,5,10.7,4.5l1.9-1.9c0.1,0,0.2,0,0.3,0l-1.6,1.6c0.3-0.1,0.6-0.2,0.9-0.3l1.3-1.3h0.1l0,0l0,0c0,0,0.1,0,0.2,0
		l-1.2,1.2c0.2,0,0.5-0.1,0.7-0.1l1-1c0.1,0,0.1,0,0.2,0l-0.9,0.9c0.2,0,0.4,0,0.6,0L15,2.8c0.1,0,0.1,0,0.2,0.1l-0.8,0.8
		c0.2,0,0.4,0,0.5,0.1L15.6,3c0.1,0,0.1,0,0.2,0.1l-0.7,0.8c0.2,0,0.3,0.1,0.5,0.1l0.7-0.7c0.1,0,0.1,0,0.2,0.1l-0.7,0.7
		c0.2,0,0.3,0.1,0.4,0.2l0.6-0.6c0,0,0.1,0.1,0.2,0.1l-0.6,0.6c0.1,0.1,0.3,0.1,0.4,0.2L17.3,4c0,0,0.1,0.1,0.2,0.1l-0.6,0.6
		c0.1,0.1,0.2,0.2,0.4,0.2l0.6-0.6c0,0,0.1,0.1,0.2,0.1L17.4,5c0.1,0.1,0.2,0.2,0.4,0.3l0.5-0.5l0.1,0.1l-0.5,0.6
		c0.1,0.1,0.2,0.2,0.3,0.3l0.6-0.6l0.1,0.1l-0.6,0.6c0.1,0.1,0.2,0.2,0.3,0.3l0.6-0.6l0.1,0.1l-0.6,0.6l0,0l0,0
		c0.1,0.1,0.2,0.2,0.2,0.3L19.5,6c0,0,0.1,0.1,0.1,0.2L19,6.8c0.1,0.1,0.2,0.3,0.2,0.4L20,6.6c0,0,0.1,0.1,0.1,0.2l-0.7,0.7
		c0.1,0.2,0.1,0.3,0.2,0.4l0.7-0.7c0,0.1,0.1,0.1,0.1,0.2L19.7,8c0,0.2,0.1,0.3,0.1,0.5l0.8-0.8c0,0.1,0,0.1,0.1,0.2l-0.8,0.8
		c0,0.2,0.1,0.4,0.1,0.5l0.9-0.9c0,0.1,0,0.1,0.1,0.2l-1,1c0,0.2,0,0.4,0,0.6L21,9c0,0.1,0,0.1,0,0.2l-1.2,1.2
		c0,0.2-0.1,0.5-0.1,0.7l1.4-1.4c0,0.1,0,0.2,0,0.2l-1.5,1.5c-0.1,0.4-0.3,0.7-0.4,1.1l2-2c0,0.1,0,0.2,0,0.3l-2.4,2.4
		c-0.3,0.4-0.7,0.7-1.1,1.1l-3.2,3.2C14.5,17.4,14.4,17.5,14.4,17.4z"/>
</g>
<path id="sphere_mesh" d="M22.1,12.6c0-0.4,0-0.8,0-1.2l0,0l0,0c-0.2-3.2-2-6.2-5.1-7.9c-2.4-1.3-5.1-1.7-7.7-1
	c-1.1,0.3-2.1,0.7-3,1.3l0,0c-0.1,0-0.1,0.1-0.2,0.1C4.9,4.7,3.9,5.7,3.1,7c-0.8,1.4-1.2,2.8-1.3,4.3c0,0,0,0,0,0.1v0.1
	c0,0.4,0,0.7,0,1.1c0,0,0,0,0,0.1l0,0c0.2,3.2,2,6.2,5.1,7.9c1.6,0.9,3.4,1.3,5.1,1.3c1.5,0,3-0.4,4.4-1h0.1c0.1,0,0.1-0.1,0.2-0.1
	c0.2-0.1,0.5-0.2,0.7-0.4c0.1-0.1,0.2-0.1,0.3-0.1c0,0,0.1,0,0.1-0.1c1.2-0.8,2.3-1.9,3.1-3.2c0.7-1.3,1.2-2.6,1.3-4
	C22.1,12.9,22.1,12.7,22.1,12.6L22.1,12.6z M17,18.1c-0.8,0.4-1.8,0.6-2.8,0.7c-1.7,0.1-3.5-0.3-5.1-1.1l1.2-2.1
	c1.3,0.6,2.6,0.9,4,0.9c0.9,0,1.8-0.2,2.7-0.5C17.1,16.9,17.1,17.5,17,18.1z M16.2,19.8c-2.4,1.2-5.4,1.1-8.1-0.3l0.5-0.9
	c1.5,0.8,3.3,1.2,5,1.2c0.2,0,0.4,0,0.7,0c0.8-0.1,1.6-0.2,2.3-0.4C16.4,19.6,16.3,19.7,16.2,19.8z M5.7,9.8c0.4,2.1,1.7,4,3.7,5.3
	l-1.2,2.1c-1.5-0.9-2.7-2.2-3.5-3.7c-0.5-0.9-0.7-1.8-0.8-2.7C4.4,10.4,5,10.1,5.7,9.8z M18.6,8.2c0-0.2-0.1-0.5-0.2-0.7
	c-0.3-0.9-1-1.7-1.8-2.3l0.2-0.4c1.4,0.9,2.5,2.2,3,3.6c0,0.1,0.1,0.3,0.1,0.4C19.6,8.6,19.1,8.4,18.6,8.2z M17.3,10.1
	c-0.2,0.3-0.4,0.5-0.7,0.7c-0.1-0.3-0.3-0.6-0.4-0.9c-0.2-0.5-0.5-1-0.8-1.4c0.4,0,0.7,0.1,1,0.1c0.4,0.1,0.8,0.2,1.2,0.3
	C17.6,9.4,17.5,9.8,17.3,10.1z M11.8,5.7c0.5,0.5,1,1,1.5,1.7c-0.9,0-1.8,0-2.6,0.1c0-0.3,0.1-0.7,0.3-0.9
	C11.2,6.2,11.5,5.9,11.8,5.7z M12.9,5.3c0.2,0,0.5-0.1,0.7-0.1c0.5,0,1,0.1,1.6,0.3L14.3,7C13.8,6.3,13.4,5.8,12.9,5.3z M13.4,8.4
	l-1.3,2.2c-0.6-0.5-1.1-1.1-1.3-1.7c0-0.1-0.1-0.2-0.1-0.3C11.6,8.5,12.5,8.4,13.4,8.4z M14.4,9c0.3,0.5,0.6,1,0.8,1.5
	c0.2,0.3,0.3,0.6,0.4,0.9c-0.1,0-0.2,0.1-0.3,0.1c-0.7,0.1-1.5,0-2.2-0.3L14.4,9z M16.6,7.7c-0.4-0.1-0.9-0.1-1.4-0.2l0.9-1.4
	c0.6,0.5,1.1,1.1,1.3,1.7c0,0,0,0,0,0.1C17.2,7.8,16.9,7.7,16.6,7.7z M15.7,4.6C14.4,4.1,13.1,4,12,4.4c-0.4-0.3-0.8-0.6-1.2-0.8
	c0.6-0.1,1.1-0.2,1.7-0.2c1.1,0,2.3,0.3,3.4,0.8L15.7,4.6z M9.4,4.1c0.5,0.2,1,0.5,1.5,0.9c-0.4,0.3-0.7,0.6-0.9,1
	C9.7,6.5,9.5,7,9.5,7.6C8.5,7.8,7.6,8,6.7,8.3l0,0c0-0.8,0.3-1.5,0.7-2.2C7.9,5.2,8.6,4.6,9.4,4.1z M7,9.3C7.8,9,8.7,8.9,9.6,8.7
	c0,0.2,0.1,0.3,0.1,0.5c0.3,0.9,1,1.7,1.8,2.3L10,14.2c-1.8-1.2-3-3-3.3-4.8C6.8,9.4,6.9,9.3,7,9.3z M3,11.9
	c0.2,0.7,0.4,1.4,0.8,2.1c0.9,1.7,2.3,3.1,3.9,4.2L7.1,19c-2.5-1.6-4.1-4-4.3-6.6C2.9,12.2,2.9,12,3,11.9z M10.9,14.8l1.6-2.7
	c0.7,0.3,1.4,0.5,2.1,0.5c0.3,0,0.6,0,0.9-0.1c0.2,0,0.4-0.1,0.5-0.2c0.4,1,0.7,1.9,0.8,2.8C15.1,15.8,12.9,15.7,10.9,14.8z
	 M17,11.9c0.5-0.3,0.9-0.7,1.2-1.2c0.2-0.4,0.4-0.9,0.4-1.3c0.6,0.2,1.2,0.5,1.5,0.8c0,1-0.2,1.9-0.7,2.7c-0.4,0.7-1,1.3-1.7,1.7
	C17.7,13.7,17.4,12.8,17,11.9z M7.3,4.3C7,4.7,6.7,5.1,6.4,5.5c-0.6,1-0.8,2.1-0.8,3.1C5,8.9,4.4,9.2,3.9,9.5
	c0.2-1.9,1.2-3.7,2.9-4.8C7,4.5,7.2,4.4,7.3,4.3z M18.2,17.5c0-0.6,0-1.2-0.1-1.8c1-0.5,1.8-1.3,2.4-2.3c0.3-0.4,0.4-0.9,0.6-1.4
	c0,0.2,0,0.4,0,0.6C20.8,14.7,19.8,16.4,18.2,17.5z"/>
<g id="cube_transparent">
	<path d="M20.6,6.8L12.4,2l0,0h-0.1l0,0h-0.1l0,0l0,0h-0.1l0,0H12l0,0L3.6,6.6C3.4,6.7,3.3,6.9,3.3,7.1l-0.1,9.5l0,0v0.1
		c0,0,0,0,0,0.1v0.1l0,0c0,0,0,0.1,0.1,0.1l0,0l0,0l0.1,0.1l0,0l8.2,4.9c0.1,0.1,0.2,0.1,0.3,0.1s0.2,0,0.2-0.1l8.3-4.6
		c0.2-0.1,0.3-0.3,0.3-0.4l0.1-9.6C20.8,7.1,20.7,6.9,20.6,6.8z M12.1,3l7.1,4.2L12,11.3L4.9,7.1L12.1,3z M12.5,12.2l7.2-4.1
		l-0.1,8.4l-7.2,4L12.5,12.2L12.5,12.2z M4.4,8l7.1,4.2v8.4l-7.2-4.3L4.4,8z M7.5,14.4c0.1,0.2,0.1,0.6-0.2,0.7
		c-0.1,0.1-0.2,0.1-0.2,0.1c-0.2,0-0.4-0.1-0.4-0.3c-0.1-0.2-0.1-0.6,0.2-0.7C7,14.1,7.4,14.2,7.5,14.4z M10.6,13.3
		c-0.1,0.1-0.2,0.1-0.2,0.1c-0.2,0-0.4-0.1-0.5-0.3s-0.1-0.6,0.2-0.7c0.2-0.1,0.6-0.1,0.7,0.2C10.9,12.8,10.9,13.2,10.6,13.3z
		 M5.9,15.4C6,15.6,6,16,5.7,16.1c-0.1,0.1-0.2,0.1-0.2,0.1c-0.2,0-0.4-0.1-0.4-0.3C5,15.7,5,15.3,5.3,15.2
		C5.4,15,5.7,15.1,5.9,15.4z M9.2,13.5c0.1,0.2,0.1,0.6-0.2,0.7c-0.1,0.1-0.2,0.1-0.2,0.1c-0.2,0-0.4-0.1-0.4-0.3
		c-0.1-0.2-0.1-0.6,0.2-0.7C8.7,13.2,9,13.3,9.2,13.5z M15.7,14.1c-0.1,0.2-0.3,0.2-0.4,0.2c-0.1,0-0.2,0-0.3-0.1
		c-0.2-0.1-0.3-0.5-0.2-0.7s0.5-0.3,0.7-0.2C15.8,13.5,15.9,13.9,15.7,14.1z M14.1,13.1c-0.1,0.2-0.3,0.2-0.4,0.2
		c-0.1,0-0.2,0-0.3-0.1c-0.2-0.1-0.3-0.5-0.2-0.7s0.5-0.3,0.7-0.2C14.2,12.6,14.2,12.9,14.1,13.1z M17.3,15.1
		c-0.1,0.2-0.3,0.2-0.4,0.2s-0.2,0-0.3-0.1c-0.2-0.1-0.3-0.5-0.2-0.7c0.1-0.2,0.5-0.3,0.7-0.2C17.4,14.5,17.5,14.8,17.3,15.1z
		 M19,16c-0.1,0.2-0.3,0.2-0.4,0.2s-0.2,0-0.3-0.1c-0.2-0.1-0.3-0.5-0.2-0.7c0.1-0.2,0.5-0.3,0.7-0.2C19.1,15.5,19.1,15.8,19,16z
		 M11.6,4.3c0-0.3,0.2-0.5,0.5-0.5s0.5,0.2,0.5,0.5s-0.2,0.5-0.5,0.5l0,0C11.8,4.8,11.6,4.6,11.6,4.3z M12.6,10
		c0,0.3-0.2,0.5-0.5,0.5l0,0c-0.3,0-0.5-0.2-0.5-0.5s0.2-0.5,0.5-0.5S12.6,9.7,12.6,10z M11.5,8.1c0-0.3,0.2-0.5,0.5-0.5
		s0.5,0.2,0.5,0.5S12.3,8.6,12,8.6l0,0C11.8,8.6,11.5,8.4,11.5,8.1z M11.6,6.2c0-0.3,0.2-0.5,0.5-0.5s0.5,0.2,0.5,0.5
		s-0.2,0.5-0.5,0.5l0,0C11.8,6.7,11.5,6.5,11.6,6.2z"/>
</g>
<g id="group">
	<path d="M16.9,21.5c-0.1,0-0.2,0-0.3-0.1L12,19.3l-4.6,2.1c-0.1,0-0.2,0.1-0.3,0.1c-0.1,0-0.2,0-0.3-0.1l-4.9-2.3
		c-0.3-0.1-0.4-0.4-0.4-0.6v-5.4V13l0,0c0-0.1,0-0.1,0.1-0.2l0.1-0.1l0.1-0.1l0.1-0.1l4.5-2.1v-5V5.3V5.2V5.1L6.5,5h0.1l0.1-0.1
		l0.1-0.1l4.9-2.3c0.1,0,0.2-0.1,0.3-0.1s0.2,0,0.3,0.1l5,2.3l0.1,0.1L17.5,5l0,0l0,0l0.1,0.2v5.1l4.5,2.1h0.1l0.1,0.1l0,0l0.1,0.1
		v0.1L22.1,13l0.4-0.1V13v0.1v5.4c0,0.3-0.2,0.5-0.4,0.6l-4.9,2.3C17.1,21.5,17,21.5,16.9,21.5z M7.8,19.7l3.5-1.6v-3.8l-3.5,1.6
		V19.7z M17.6,19.7l3.5-1.6v-3.8l-3.5,1.6V19.7z M6.4,19.7v-3.9l-3.5-1.6V18L6.4,19.7z M16.2,19.7v-3.9l-3.5-1.6V18L16.2,19.7z
		 M7.1,14.6l3.2-1.5L7,11.7l-3.2,1.5L7.1,14.6z M16.9,14.6l3.2-1.5L17,11.7l-3.2,1.5L16.9,14.6z M12.7,12l3.5-1.6V6.6l-3.5,1.6
		C12.7,8.2,12.7,12,12.7,12z M11.3,12V8.2L7.8,6.6v3.8L11.3,12z M12,7l3.2-1.5L12,4L8.8,5.5L12,7z"/>
</g>
<g id="cube">
	<path d="M20,6.4L20,6.4l-7.1-4.1c-0.6-0.3-1.3-0.3-1.8,0L4,6.4C3.4,6.8,3.1,7.4,3.1,8v8.2c0,0.7,0.4,1.2,0.9,1.6l7.1,4.1
		c0.3,0.2,0.6,0.3,0.9,0.3s0.6-0.1,0.9-0.3l7.1-4.1c0.6-0.3,0.9-0.9,0.9-1.6V8C20.9,7.4,20.6,6.8,20,6.4z M11.8,3.6
		c0.1,0,0.1,0,0.2,0c0.1,0,0.1,0,0.2,0l6.6,3.8L12,11.3L5.2,7.4L11.8,3.6z M4.7,16.6c-0.1-0.1-0.2-0.2-0.2-0.3V8.6l6.8,3.9v7.8
		L4.7,16.6z M19.3,16.6l-6.6,3.8v-7.8l6.8-3.9v7.6C19.5,16.4,19.4,16.5,19.3,16.6z"/>
</g>
<g id="cube_axis_alt">
	<path d="M16.7,10l-4.4-2.6l0,0h-0.1l0,0h-0.1l0,0l0,0H12l0,0h-0.1l0,0L7.4,9.9c-0.2,0.1-0.3,0.3-0.3,0.4L7,15.4
		c0,0.2,0.1,0.3,0.2,0.4l4.4,2.6c0.1,0.1,0.2,0.1,0.3,0.1s0.2,0,0.2-0.1l4.4-2.5c0,0,0.1,0,0.1-0.1l0,0l0.1-0.1c0,0,0-0.1,0.1-0.1
		l0,0v-0.1l0,0l0.1-5.1C17,10.3,16.8,10.1,16.7,10z M8.1,11.2l3.4,2l-0.1,3.9l-3.4-2L8.1,11.2z M12.1,8.4l3.4,2L12,12.3l-3.4-2
		L12.1,8.4z M12.5,13.2l3.4-1.9l-0.1,3.9l-3.4,1.9L12.5,13.2z M21.9,18.8c0,0.2-0.2,0.2-0.4,0.2c-0.1,0-0.2,0-0.3-0.1
		c-0.2-0.1-0.3-0.4-0.2-0.7c0.1-0.2,0.4-0.3,0.7-0.2C22,18.3,22.1,18.6,21.9,18.8z M20.2,17.8C20.1,18,20,18,19.8,18
		c-0.1,0-0.2,0-0.3-0.1c-0.2-0.1-0.3-0.4-0.2-0.7c0.1-0.2,0.4-0.3,0.7-0.2C20.3,17.3,20.4,17.6,20.2,17.8z M18.5,16.8
		C18.4,17,18.2,17,18.1,17s-0.2,0-0.3-0.1c-0.2-0.1-0.3-0.4-0.2-0.7c0.1-0.2,0.4-0.3,0.7-0.2C18.6,16.2,18.7,16.5,18.5,16.8z
		 M2.9,18.1C3,18.3,3,18.7,2.7,18.8c-0.1,0.1-0.2,0.1-0.2,0.1c-0.2,0-0.3-0.1-0.4-0.3C1.9,18.3,2,18,2.2,17.9S2.8,17.8,2.9,18.1z
		 M4.6,17.1c0.1,0.2,0.1,0.6-0.2,0.7c-0.1,0.1-0.2,0.1-0.2,0.1c-0.2,0-0.3-0.1-0.4-0.3C3.7,17.3,3.7,17,4,16.9
		C4.2,16.8,4.5,16.9,4.6,17.1z M6.4,16.1c0.1,0.2,0.1,0.6-0.2,0.7C6.1,16.9,6,16.9,6,16.9c-0.2,0-0.3-0.1-0.4-0.3
		c-0.1-0.2-0.1-0.6,0.2-0.7C5.9,15.8,6.2,15.9,6.4,16.1z M11.6,3.9c0-0.3,0.2-0.5,0.5-0.5s0.5,0.2,0.5,0.5s-0.2,0.5-0.5,0.5
		S11.6,4.1,11.6,3.9z M11.6,1.9c0-0.3,0.2-0.5,0.5-0.5s0.5,0.2,0.5,0.5s-0.2,0.5-0.5,0.5S11.6,2.1,11.6,1.9z M11.6,5.8
		c0-0.3,0.2-0.5,0.5-0.5s0.5,0.2,0.5,0.5s-0.2,0.5-0.5,0.5S11.6,6.1,11.6,5.8z"/>
</g>
<g id="cube_axis">
	<path d="M21.4,17.1l-3.8-2.2v-4.8c0-0.2,0-0.3-0.1-0.4c0,0,0-0.1-0.1-0.1c-0.1-0.1-0.1-0.2-0.2-0.2l0,0L12.9,7V4
		c0-0.5-0.4-0.9-0.9-0.9S11.1,3.5,11.1,4v3L6.9,9.4l0,0C6.8,9.5,6.7,9.5,6.7,9.6c0,0,0,0.1-0.1,0.1C6.5,9.8,6.5,10,6.5,10.1v4.8
		l-3.8,2.2c-0.4,0.2-0.6,0.8-0.3,1.2c0.2,0.4,0.8,0.6,1.2,0.3l3.8-2.2l4.2,2.4l0,0c0.1,0.1,0.3,0.1,0.4,0.1c0.2,0,0.3,0,0.4-0.1l0,0
		l4.2-2.4l3.8,2.2c0.4,0.2,1,0.1,1.2-0.3C21.9,17.9,21.8,17.3,21.4,17.1z M11.1,16.5l-2.8-1.6v-3.2l2.8,1.6V16.5z M12,11.7l-2.8-1.6
		L12,8.5l2.8,1.6L12,11.7z M15.7,14.9l-2.8,1.6v-3.3l2.8-1.6V14.9z"/>
</g>
<g id="grid">
<path d="M1.6,11.2L12,5.9l10.4,5.3l-10.3,7.1L1.6,11.2z M12.1,17.6l2.3-1.6L12,14.6L9.7,16L12.1,17.6z M9.3,15.8l2.3-1.4
	L9.4,13l-2.3,1.3L9.3,15.8z M14.8,15.8l2.1-1.4L14.6,13l-2.1,1.3L14.8,15.8z M6.7,14L9,12.7L7,11.5l-2.3,1.2L6.7,14z M12,14l2.1-1.3
	L12,11.5l-2.1,1.2L12,14z M17.4,14l1.9-1.3L17,11.5l-1.9,1.2L17.4,14z M4.3,12.4l2.3-1.2l-1.8-1.1l-2.3,1.1L4.3,12.4z M9.5,12.4
	l2.1-1.2l-1.9-1.1l-2.1,1.1L9.5,12.4z M14.6,12.4l1.9-1.2l-2.1-1.1l-1.9,1.1L14.6,12.4z M19.7,12.4l1.7-1.2l-2.3-1.1l-1.8,1.1
	L19.7,12.4z M12,10.9l1.9-1.1l-1.9-1l-1.9,1L12,10.9z M7.1,10.9l2.1-1.1l-1.8-1l-2.1,1L7.1,10.9z M17,10.9l1.7-1.1l-2.1-1l-1.8,1
	L17,10.9z M14.4,9.6l1.7-1l-1.9-1l-1.7,0.9L14.4,9.6z M9.6,9.6l1.9-1L9.8,7.6l-1.9,1L9.6,9.6z M12,8.3l1.7-0.9L12,6.4l-1.7,0.9
	L12,8.3z"/>
</g>
</svg>
` );

//# sourceMappingURL=iconset.js.map

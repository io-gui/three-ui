import path from 'path';

export default [
  {
    input: 'src/three-ui.js',
    output: [
      {
        format: 'es',
        file: 'build/three-ui.js',
        indent: '  '
      }
    ],
    external: [
      path.resolve('../three.js/build/three.module.js'),
      path.resolve('./lib/BufferGeometryUtils.js'),
      path.resolve('./lib/GLTFLoader.js'),
      path.resolve('./lib/DRACOLoader.js'),
      path.resolve('../io/build/io-core.js'),
      path.resolve('../io/build/io.js'),
    ]
  }
];

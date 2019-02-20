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
      path.resolve('../io/build/io.js')
    ]
  },
  {
    input: 'src/core/controls/transform/Combined.js',
    output: [
      {
        format: 'es',
        file: 'build/CombinedTransformControls.js',
        indent: '  '
      }
    ],
    external: [ path.resolve('../three.js/build/three.module.js') ]
  }
];

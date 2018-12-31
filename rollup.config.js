import path from 'path';

function html() {
  return {
    transform( code, id ) {
      let transformedCode = code;
      let regex = /html`(([\s\S])*)`/;
      if ( regex.test( code ) === true ) {
        let match = code.match(regex);
        transformedCode = code.replace(match[0], match[0].replace((/  |\r\n|\n|\r/gm),""))
      };
      return {
        code: transformedCode,
        map: { mappings: '' }
      };
    }
  };
}

export default [
  {
    input: 'src/io-graphics.js',
    plugins: [html()],
    experimentalDynamicImport: true,
    output: [
      {
        format: 'es',
        file: 'build/io-graphics.js',
        indent: '  '
      }
    ],
    external: [ path.resolve('../io/build/io.js') ]
  }
];

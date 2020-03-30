import path from 'path';

function html() {
  return {
    transform( code, id ) {
      let transformedCode = code;
      let regex = /<style>([\s\S]*?)<\/style>/gm;
      if ( regex.test( code ) === true ) {
        let match = code.match(regex);
        for (let i = 0; i < match.length; i++) {
          transformedCode = transformedCode.replace(match[i], match[i].replace((/ {2}|\r\n|\n|\r/gm), ""));
        }
      }
      return {
        code: transformedCode,
        map: { mappings: '' }
      };
    }
  };
}

function svg() {
  return {
    transform( code, id ) {
      let transformedCode = code;
      let regex = /<svg>([\s\S]*?)<\/svg>/gm;
      if ( regex.test( code ) === true ) {
        let match = code.match(regex);
        for (let i = 0; i < match.length; i++) {
          transformedCode = transformedCode.replace(match[i], match[i].replace((/ {2}|\r\n|\n|\r/gm), ""));
        }
      }
      return {
        code: transformedCode,
        map: { mappings: '' }
      };
    }
  };
}

const externals = [
	path.resolve('../three.js/build/three.module.js'),
	path.resolve('../io/build/io.js'),
	path.resolve('../io/build/io-elements.js')
];

function makeTarget(src, target) {
  externals.push(path.resolve(src));
  return {
    input: src,
    plugins: [html(), svg()],
    inlineDynamicImports: true,
    output: [
      {
        format: 'es',
        file: target,
        indent: '  '
      }
    ],
    external: externals,
    onwarn: (warning, warn) => {
      if (warning.code === 'THIS_IS_UNDEFINED') return;
      warn(warning);
    }
  };
}

export default [
  makeTarget('src/three-ui.js', 'build/three-ui.js'),
];

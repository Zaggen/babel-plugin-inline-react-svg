import { extname, dirname, resolve } from 'path';
import { readFileSync } from 'fs';
import template from 'babel-template';
import traverse from 'babel-traverse';
import { parse } from 'babylon';
import resolveFrom from 'resolve-from';
import optimize from './optimize';
import escapeBraces from './escapeBraces';
import transformSvg from './transformSvg';

const buildSvg = template(`
  var SVG_NAME = function SVG_NAME(props) { return SVG_CODE; };
`);

let ignoreRegex;

export default ({ types: t }) => ({
  visitor: {
    ImportDeclaration(path, state) {
      const { ignorePattern, root, alias } = state.opts;
      if (ignorePattern) {
        // Only set the ignoreRegex once:
        ignoreRegex = ignoreRegex || new RegExp(ignorePattern);
        // Test if we should ignore this:
        if (ignoreRegex.test(path.node.source.value)) {
          return;
        }
      }
      // This plugin only applies for SVGs:
      if (extname(path.node.source.value) === '.svg') {
        // We only support the import default specifier, so let's use that identifier:
        const importIdentifier = path.node.specifiers[0].local;
        const iconPath = state.file.opts.filename;
        const aliasMatch = alias[path.node.source.value.split('/')[0]];
        let svgPath;
        if(aliasMatch){
          const resolveRoot = resolve(process.cwd(), root || './');
          const aliasedPath = resolve(resolveRoot, aliasMatch);
          svgPath = aliasedPath + path.node.source.value.replace(aliasMatch, '');
        } else {
          svgPath = resolveFrom(dirname(iconPath), path.node.source.value);
        }
        const rawSource = readFileSync(svgPath, 'utf8');
        const optimizedSource = state.opts.svgo === false
          ? rawSource
          : optimize(rawSource, state.opts.svgo);

        const escapeSvgSource = escapeBraces(optimizedSource);

        const parsedSvgAst = parse(escapeSvgSource, {
          sourceType: 'module',
          plugins: ['jsx'],
        });

        traverse(parsedSvgAst, transformSvg(t));

        const svgCode = traverse.removeProperties(parsedSvgAst.program.body[0].expression);

        const svgReplacement = buildSvg({
          SVG_NAME: importIdentifier,
          SVG_CODE: svgCode,
        });

        path.replaceWith(svgReplacement);
      }
    },
  },
});

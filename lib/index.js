Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _fs = require('fs');

var _babelTemplate = require('babel-template');

var _babelTemplate2 = _interopRequireDefault(_babelTemplate);

var _babelTraverse = require('babel-traverse');

var _babelTraverse2 = _interopRequireDefault(_babelTraverse);

var _babylon = require('babylon');

var _resolveFrom = require('resolve-from');

var _resolveFrom2 = _interopRequireDefault(_resolveFrom);

var _optimize = require('./optimize');

var _optimize2 = _interopRequireDefault(_optimize);

var _escapeBraces = require('./escapeBraces');

var _escapeBraces2 = _interopRequireDefault(_escapeBraces);

var _transformSvg = require('./transformSvg');

var _transformSvg2 = _interopRequireDefault(_transformSvg);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var buildSvg = (0, _babelTemplate2['default'])('\n  var SVG_NAME = function SVG_NAME(props) { return SVG_CODE; };\n');

var ignoreRegex = void 0;

exports['default'] = function (_ref) {
  var t = _ref.types;
  return {
    visitor: {
      ImportDeclaration: function () {
        function ImportDeclaration(path, state) {
          var _state$opts = state.opts,
              ignorePattern = _state$opts.ignorePattern,
              root = _state$opts.root,
              alias = _state$opts.alias;

          if (ignorePattern) {
            // Only set the ignoreRegex once:
            ignoreRegex = ignoreRegex || new RegExp(ignorePattern);
            // Test if we should ignore this:
            if (ignoreRegex.test(path.node.source.value)) {
              return;
            }
          }
          // This plugin only applies for SVGs:
          if ((0, _path.extname)(path.node.source.value) === '.svg') {
            // We only support the import default specifier, so let's use that identifier:
            var importIdentifier = path.node.specifiers[0].local;
            var iconPath = state.file.opts.filename;
            var aliasMatch = alias[path.node.source.value.split('/')[0]];
            var svgPath = void 0;
            if (aliasMatch) {
              var resolveRoot = (0, _path.resolve)(process.cwd(), root || './');
              var aliasedPath = (0, _path.resolve)(resolveRoot, aliasMatch);
              svgPath = aliasedPath + path.node.source.value.replace(aliasMatch, '');
            } else {
              svgPath = (0, _resolveFrom2['default'])((0, _path.dirname)(iconPath), path.node.source.value);
            }
            var rawSource = (0, _fs.readFileSync)(svgPath, 'utf8');
            var optimizedSource = state.opts.svgo === false ? rawSource : (0, _optimize2['default'])(rawSource, state.opts.svgo);

            var escapeSvgSource = (0, _escapeBraces2['default'])(optimizedSource);

            var parsedSvgAst = (0, _babylon.parse)(escapeSvgSource, {
              sourceType: 'module',
              plugins: ['jsx']
            });

            (0, _babelTraverse2['default'])(parsedSvgAst, (0, _transformSvg2['default'])(t));

            var svgCode = _babelTraverse2['default'].removeProperties(parsedSvgAst.program.body[0].expression);

            var svgReplacement = buildSvg({
              SVG_NAME: importIdentifier,
              SVG_CODE: svgCode
            });

            path.replaceWith(svgReplacement);
          }
        }

        return ImportDeclaration;
      }()
    }
  };
};
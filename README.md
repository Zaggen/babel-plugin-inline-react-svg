# babel-plugin-inline-react-svg

Transforms imports to SVG files into React Components, and optimizes the SVGs with [SVGO](https://github.com/svg/svgo/).

For example, the following code...

```jsx
import React from 'react';
import CloseSVG from './close.svg';

const MyComponent = () => <CloseSvg />;
```

will be transformed into...

```jsx
import React from 'react';
const CloseSVG = () => <svg>{/* ... */}</svg>;

const MyComponent = () => <CloseSvg />;
```

## Installation

```
npm install --save-dev babel-plugin-inline-react-svg
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": [
    "inline-react-svg"
  ]
}
```

#### Options

- *`ignorePattern`* - A pattern that imports will be tested against to selectively ignore imports.
- *`svgo`* - svgo options (`false` to disable). Example:
```json
{
  "plugins": [
    [
      "inline-react-svg",
      {
        "svgo": {
          "plugins": [
            {
              "removeAttrs": { "attrs": "(data-name)" }
            },
            {
              "cleanupIDs": true
            }
          ]

        }
      }
    ]
  ]
}
```
- *`alias`* - An object with alias for module resolution
- *`root`* - A relative path string (Starting from CWD), it only works in conjunction with alias.
Example:

```json
{
  "plugins": [
    [
      "inline-react-svg", {
        "root": "./",
        "alias": {
          "svgs": "svgs"
        }
      }
    ]
  ]
}
```
**Note:** If root is not specified it will always start resolving from the project root

### Via CLI

```sh
$ babel --plugins inline-react-svg script.js
```

### Via Node API


```javascript
require('babel-core').transform('code', {
  plugins: ['inline-react-svg']
}) // => { code, map, ast };
```

---

Inspired by and code foundation provided by [react-svg-loader](https://github.com/boopathi/react-svg-loader).

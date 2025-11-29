// This script ensures a missing `debug/src/debug.js` shim exists
// so packages requiring './debug' in the `src` folder don't fail on platforms
// (like Linux) where case-sensitivity / package layout issues may expose this.

const fs = require('fs');
const path = require('path');

const debugSrc = path.join(__dirname, '..', 'node_modules', 'debug', 'src');
const debugFile = path.join(debugSrc, 'debug.js');
const idxFile = path.join(debugSrc, 'index.js');

try {
  if (!fs.existsSync(debugSrc)) {
    // Nothing to do.
    process.exit(0);
  }
  if (!fs.existsSync(debugFile)) {
    // If index.js exists, create debug.js that proxies to index.js
    if (fs.existsSync(idxFile)) {
      const proxy = "module.exports = require('./index.js');\n";
      fs.writeFileSync(debugFile, proxy, { encoding: 'utf8' });
      console.log('Created shim for debug module: src/debug.js');
    } else {
      console.warn('debug/src/index.js is missing; cannot create shim.');
    }
  }
} catch (err) {
  console.error('Error in fix-debug postinstall script:', err);
}

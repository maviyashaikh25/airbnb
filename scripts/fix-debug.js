// This script ensures a missing `debug/src/debug.js` shim exists
// so packages requiring './debug' in the `src` folder don't fail on platforms
// (like Linux) where case-sensitivity / package layout issues may expose this.

const fs = require('fs');
const path = require('path');

const debugSrc = path.join(__dirname, '..', 'node_modules', 'debug', 'src');
const debugFile = path.join(debugSrc, 'debug.js');
const idxFile = path.join(debugSrc, 'index.js');
const mongodbTimeoutFile = path.join(__dirname, '..', 'node_modules', 'mongodb', 'lib', 'timeout.js');

try {
  const shim = `module.exports = function debug() {\n  // minimal debug function stub - no-op\n  return function(){};\n};\n\n// Export common API expected by consumers and node.js file\nmodule.exports.formatters = {};\nmodule.exports.log = function(){};\nmodule.exports.init = function(){};\nmodule.exports.save = function(){};\nmodule.exports.load = function(){};\nmodule.exports.enable = function(){};\nmodule.exports.disable = function(){};\nmodule.exports.useColors = function() { return false; };\nmodule.exports.humanize = function() { return ''; };\n`;

  if (!fs.existsSync(debugSrc)) {
    // Nothing to do.
    process.exit(0);
  }
  if (!fs.existsSync(debugFile)) {
    // Create a minimal shim implementation for debug/src/debug.js
    // Export a function and some properties expected by node.js implementation.
    const shim = `module.exports = function debug() {\n  // minimal debug function stub - no-op\n  return function(){};\n};\n\n// Export common API expected by consumers and node.js file\nmodule.exports.formatters = {};\nmodule.exports.log = function(){};\nmodule.exports.init = function(){};\nmodule.exports.save = function(){};\nmodule.exports.load = function(){};\nmodule.exports.enable = function(){};\nmodule.exports.disable = function(){};\nmodule.exports.useColors = function() { return false; };\nmodule.exports.humanize = function() { return ''; };\n`;
    fs.writeFileSync(debugFile, shim, { encoding: 'utf8' });
    console.log('Created fallback shim for debug module: src/debug.js');
  } else {
    // If the shim exists but lacks expected functions, update it
    try {
      const content = fs.readFileSync(debugFile, 'utf8');
      if (!/module\.exports\.enable/.test(content) || !/module\.exports\.formatters/.test(content)) {
        fs.unlinkSync(debugFile);
        fs.writeFileSync(debugFile, shim, { encoding: 'utf8' });
        console.log('Updated existing debug shim with required API surface.');
      }
    } catch (err) {
      console.warn('Could not read or update existing debug shim:', err.message);
    }
  }
} catch (err) {
  console.error('Error in fix-debug postinstall script:', err);
}

// Check for MongoDB timeout file (CI installations occasionally miss published files)
try {
  if (!fs.existsSync(mongodbTimeoutFile)) {
    console.warn('mongodb/lib/timeout.js missing; this indicates a corrupted or partial install of the mongodb package.');
    console.warn('Please try reinstalling dependencies with `npm ci` or verify your build environment.');
  }
} catch (err) {
  console.error('Error when checking for mongodb timeout file:', err);
}

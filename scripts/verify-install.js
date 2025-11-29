const fs = require('fs');
const path = require('path');

const node = process.version;
const cwd = process.cwd();
const { execSync } = require('child_process');
console.log(`Node.js: ${node}`);
console.log(`CWD: ${cwd}`);
try {
  console.log('npm version:', execSync('npm -v').toString().trim());
  console.log('npm registry:', execSync('npm config get registry').toString().trim());
} catch (e) {
  console.warn('Could not get npm info:', e.message);
}

function checkFile(p) {
  if (fs.existsSync(p)) {
    console.log(`OK: ${p}`);
    return true;
  } else {
    console.error(`MISSING: ${p}`);
    return false;
  }
}

const debugFile = path.join(cwd, 'node_modules', 'debug', 'src', 'debug.js');
const debugIndex = path.join(cwd, 'node_modules', 'debug', 'src', 'index.js');
const mongodbTimeout = path.join(cwd, 'node_modules', 'mongodb', 'lib', 'timeout.js');

const missing = [];
if (!checkFile(debugFile)) missing.push(debugFile);
if (!checkFile(debugIndex)) missing.push(debugIndex);
if (!checkFile(mongodbTimeout)) missing.push(mongodbTimeout);

// Print contents of the directories to help debugging if missing
function listDir(p) {
  try {
    const files = fs.readdirSync(p);
    console.log(`Contents of ${p}:`);
    files.forEach(f => console.log('  -', f));
  } catch (err) {
    console.warn(`Cannot list ${p}:`, err.message);
  }
}

if (missing.length) {
  console.warn('\nFiles missing; printing node_modules debug and mongodb directories (if present):');
  listDir(path.join(cwd, 'node_modules', 'debug', 'src'));
  listDir(path.join(cwd, 'node_modules', 'mongodb', 'lib'));
  try {
    console.log('\nDependency tree (npm ls mongodb):');
    console.log(execSync('npm ls mongodb --depth=0 --json').toString());
  } catch (e) {
    console.warn('npm ls mongodb failed:', e.message);
  }
  console.warn('\nIf these files are missing in CI, please use `npm ci` for deterministic install and clear the build cache on your host.');
  // Exit non-zero on purpose when running `node ./scripts/verify-install.js` directly in debugging mode
  if (process.argv.includes('--fail-on-missing')) process.exit(1);
} else {
  console.log('\nAll critical files present');
}

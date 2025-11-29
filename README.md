Troubleshooting
---------------
If you see a "Cannot find module './debug'" error during deployment or after npm install, a `postinstall` script is included to create a small shim for the `debug` package: `scripts/fix-debug.js`. This is a workaround to ensure older packages that require `debug` from `src/debug.js` don't fail when the package layout differs across environments.

If you still encounter issues, try cleaning and reinstalling dependencies:

```powershell
Remove-Item -Recurse -Force node_modules
npm cache clean --force
npm install
```

Consider updating or removing old dependencies that pull in legacy versions of `debug` (for example `connect` or old `connect-flash`).



// Startup file for cPanel's Node.js Selector (Phusion Passenger).
//
// Passenger launches a plain .js file directly — it doesn't run
// package.json scripts. This just execs the equivalent of `next start`
// on whatever port Passenger assigns via process.env.PORT.
//
// Not used by `npm run dev` / `npm run start` locally or on other hosts
// (Railway, etc.) — those already call `next start` directly. This file
// only matters for the HostPinnacle/cPanel deployment path.
// See docs/HOSTPINNACLE_DEPLOY.md.

const { spawn } = require('child_process');

const port = process.env.PORT || 3000;
const child = spawn('node_modules/.bin/next', ['start', '-p', port], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));
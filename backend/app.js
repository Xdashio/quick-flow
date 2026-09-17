// HostPinnacle / cPanel (Phusion Passenger) entry point for the NestJS API.
//
// In cPanel "Setup Node.js App", set:
//   Application startup file → app.js
//   Application root        → the folder containing this file (backend deploy root)
//
// Passenger assigns the listen port via process.env.PORT — dist/main.js already
// reads it, so this file only forwards there. Keep it CommonJS: Passenger loads
// the startup file with plain `require`.
//
// NOTE: cPanel does not always load backend/.env from the same working
// directory the app was built with, so every variable in backend/.env must ALSO
// be set in the cPanel "Setup Node.js App" environment-variables UI
// (DATABASE_URL, JWT_SECRET, CORS_ORIGIN, DARAJA_*, R2_*, TILL_NUMBER).
require('./dist/main.js');

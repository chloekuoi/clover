// app.config.js
// Dynamic Expo config. Uses app.json as the base (passed in as `config`) and
// injects secrets from the environment so they aren't committed to source.
//
// Expo CLI automatically loads variables from .env into process.env when it
// evaluates this file, so GOOGLE_PLACES_API_KEY=... in .env becomes available
// here and is surfaced to the app via Constants.expoConfig.extra.googlePlacesApiKey.

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY,
  },
});

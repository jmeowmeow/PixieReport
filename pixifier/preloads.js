// Preloads of pixie resources
const { icaoToLocationMap } = require('./icao.js');
const Jimp = require("jimp"); // used here and in composer. Redundant in composer?
const resources = {};
// many image load promises; also need import "fs"; see compose-async.js for models
exports.stations = icaoToLocationMap;
exports.resources = resources;
exports.Jimp = Jimp;

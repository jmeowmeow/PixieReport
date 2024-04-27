// Preloads of pixie resources
const { icaoToLocationMap } = require('./icao.js');
const Jimp = require("jimp"); // used here and in composer.
const resources = {};

class Layer {
  constructor(desc, path) {
    this.desc = desc;
    this.path = path;
    this.img = undefined;
  }

  myPromise() {
    const fulfilled = new Promise((resolve, reject) => { resolve(this.img); });
    return fulfilled;
  }

  async toJimp() {
    if (this.img) {
      return this.myPromise();
    } else {
      let jp = Jimp.read(this.path);
      jp.then( (result) => { this.img = result; } );
      return jp;
    } 
  }
}

const noLayer = new Layer("none", "pixifier/pixies/weather/blank.png");
const frameLayer = new Layer("frame", "pixifier/pixies/backgrounds/blackframe.png");

noLayer.toJimp();
frameLayer.toJimp();

resources.noLayer = noLayer;
resources.frameLayer = frameLayer;

// many image load promises; also need import "fs"; see compose-async.js for models
exports.stations = icaoToLocationMap;
exports.resources = resources;
exports.Jimp = Jimp;
exports.Layer = Layer;
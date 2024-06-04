// Preloads of pixie resources
// Troublesome issue in interaction of promises and current
// working directory. ES6 modules might allow us to do
// synchronous / settled file operations with await()
// but we can't do that with CommonJS modules and 
// image loading unless we embed the images as String
// resources and decode them.

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

const noLayer = new Layer("none", "pixies/weather/blank.png");
const frameLayer = new Layer("black frame", "pixies/backgrounds/blackframe.png");

noLayer.toJimp();
frameLayer.toJimp();

resources.noLayer = noLayer;
resources.frameLayer = frameLayer;

// at the end of this we want something suitable for a Map
// lookup of Layer by name, e.g.
// map.put("none", new Layer("none", "pixies/weather/blank.png");

const namedLayers = new Map();
resources.namedLayers = namedLayers;
namedLayers.set("none", noLayer);
namedLayers.set("frame", frameLayer);

namedLayers.set("night", new Layer("night", "pixies/backgrounds/starrynightbkg.png"));
namedLayers.set("gray", new Layer("gray twilight", "pixies/backgrounds/graybackground.png"));
namedLayers.set("pink", new Layer("dusk", "pixies/backgrounds/pinkbackground.png"));
namedLayers.set("day", new Layer("day", "pixies/backgrounds/sunnybackground.png"));
namedLayers.set("noPixie", new Layer("no pixel doll", "pixies/weather/blank.png"));
namedLayers.set("clear", new Layer("clear", "pixies/skycond/blank.png"));
namedLayers.set("cloudy", new Layer("cloudy", "pixies/skycond/clouds.png"));
namedLayers.set("overcast", new Layer("overcast", "pixies/skycond/overcast.png"));

namedLayers.set("warning", new Layer('a red high wind warning pennant', "pixies/highwind/daywarn.png"));;
namedLayers.set("gale", new Layer('two red gale warning pennants', "pixies/highwind/daygale.png"));
namedLayers.set("storm", new Layer('a red and black storm warning flag', "pixies/highwind/daystorm.png"));
namedLayers.set("hurricane", new Layer('two red and black hurricane warning flags', "pixies/highwind/dayhurricane.png"));

const promises = namedLayers.forEach(layer => { return layer.toJimp();});
Promise.allSettled(promises).then((results) => {console.log(JSON.stringify(results))}).catch(console.error);

const layerDescMap = {
  "noPixie": "no pixel doll",
//  "icyPixie": "a pixel doll dressed for icy weather",
//  "coldPixie": "a pixel doll dressed for cold weather",
//  "coolPixie": "a pixel doll dressed for cool weather",
//  "warmPixie": "a pixel doll dressed for warm weather",
//  "hotPixie": "a pixel doll dressed for hot weather",
  "clear": "clear",
  "cloudy": "cloudy",
  "overcast": "overcast",
  "warning": 'a red high wind warning pennant',
  "gale": 'two red gale warning pennants',
  "storm": 'a red and black storm warning flag',
  "hurricane": 'two red and black hurricane warning flags',
  "lightning": "lightning",
  "frame": "black frame",
  'drizzle': 'drizzle',
  'light rain': 'light rain',
  'rain': 'rain',
  'mist': 'mist',
  'fog': 'fog',
  'light snow': 'light snow',
  'snow': 'snow',
  'heavy snow': 'heavy snow',
};

const layerMap = {
    "none": "pixies/weather/blank.png",
    "night": "pixies/backgrounds/starrynightbkg.png",
    "gray": "pixies/backgrounds/graybackground.png",
    "pink": "pixies/backgrounds/pinkbackground.png",
    "day": "pixies/backgrounds/sunnybackground.png",
//    "icyPixie": "pixies/pixieselfie/pixie-icy.png",
//    "coldPixie": "pixies/pixieselfie/pixie-cold.png",
//    "coolPixie": "pixies/pixieselfie/pixie-cool.png",
//    "warmPixie": "pixies/pixieselfie/pixie-warm.png",
//    "hotPixie": "pixies/pixieselfie/pixie-hot.png",
    "clear": "pixies/skycond/blank.png",
    "cloudy": "pixies/skycond/clouds.png",
    "overcast": "pixies/skycond/overcast.png",
    "warning": "pixies/highwind/daywarn.png",
    "gale": "pixies/highwind/daygale.png",
    "storm": "pixies/highwind/daystorm.png",
    "hurricane": "pixies/highwind/dayhurricane.png",
    "lightning": "pixies/weather/lightning.png",
    "frame": "pixies/backgrounds/blackframe.png",
};

// coalesced from pixie-composer.js
// weather we show: keys of weatherhash (drizzle, rain, mist, fog, snow)
// weather we don't: haze, smoke, dust, volcanic ash
const weatherhash = {
      'none':           'pixies/weather/blank.png',
      'light drizzle':  'pixies/weather/ltrain.png',
      'drizzle':        'pixies/weather/drizzle.png',
      'heavy drizzle':  'pixies/weather/drizzle.png',
      'light rain':     'pixies/weather/ltrain.png',
      'light rain with thunder':     'pixies/weather/ltrain.png',
      'rain':           'pixies/weather/rain.png',
      'rain with thunder':           'pixies/weather/rain.png',
      'heavy rain':     'pixies/weather/rain.png',
      'heavy rain with thunder':           'pixies/weather/rain.png',
      'mist':           'pixies/weather/mist.png',
      'fog':            'pixies/weather/fog.png',
      'patches of fog': 'pixies/weather/fog.png',
      'light snow':     'pixies/weather/ltsnow.png',
      'snow':           'pixies/weather/snow.png',
      'heavy snow':     'pixies/weather/snow.png',
      };


for (const entry of namedLayers.entries()) {console.log(JSON.stringify(entry)); console.log('');}

const metarToLocationMap = new Map();
Object.entries(icaoToLocationMap).map(each => {metarToLocationMap.set(each[0], each[1]);});
// many image load promises; also need import "fs"; see compose-async.js for models
exports.stations = metarToLocationMap;
exports.resources = resources;
exports.Jimp = Jimp;
exports.Layer = Layer;

// Preloads of pixie resources
// Troublesome issue in interaction of promises and current
// working directory. ES6 modules might allow us to do
// synchronous / settled file operations with await()
// but we can't do that with CommonJS modules and 
// image loading unless we embed the images as String
// resources and decode them.

const { icaoToLocationMap } = require('./pixifier/icao.js');
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
const frameLayer = new Layer("black frame", "pixifier/pixies/backgrounds/blackframe.png");

noLayer.toJimp();
frameLayer.toJimp();

resources.noLayer = noLayer;
resources.frameLayer = frameLayer;

// at the end of this we want something suitable for a Map
// lookup of Layer by name, e.g.
// map.put("none", new Layer("none", "pixifier/pixies/weather/blank.png");

const namedLayers = new Map();
resources.namedLayers = namedLayers;
namedLayers.set("none", noLayer);
namedLayers.set("frame", frameLayer);

namedLayers.set("night", new Layer("night", "pixifier/pixies/backgrounds/starrynightbkg.png"));
namedLayers.set("gray", new Layer("gray twilight", "pixifier/pixies/backgrounds/graybackground.png"));
namedLayers.set("pink", new Layer("dusk", "pixifier/pixies/backgrounds/pinkbackground.png"));
namedLayers.set("day", new Layer("day", "pixifier/pixies/backgrounds/sunnybackground.png"));
namedLayers.set("noPixie", new Layer("no pixel doll", "pixifier/pixies/weather/blank.png"));
namedLayers.set("clear", new Layer("clear", "pixifier/pixies/skycond/blank.png"));
namedLayers.set("cloudy", new Layer("cloudy", "pixifier/pixies/skycond/clouds.png"));
namedLayers.set("overcast", new Layer("overcast", "pixifier/pixies/skycond/overcast.png"));

namedLayers.set("warning", new Layer('a red high wind warning pennant', "pixifier/pixies/highwind/daywarn.png"));;
namedLayers.set("gale", new Layer('two red gale warning pennants', "pixifier/pixies/highwind/daygale.png"));
namedLayers.set("storm", new Layer('a red and black storm warning flag', "pixifier/pixies/highwind/daystorm.png"));
namedLayers.set("hurricane", new Layer('two red and black hurricane warning flags', "pixifier/pixies/highwind/dayhurricane.png"));

let promises = [];
namedLayers.forEach(layer => { promises.push(layer.toJimp())});
// Resolution gets printed after the "Server listening" message.
Promise.allSettled(promises).then((results) => {console.log(results.length)}).catch(console.error);

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
    "none": "pixifier/pixies/weather/blank.png",
    "night": "pixifier/pixies/backgrounds/starrynightbkg.png",
    "gray": "pixifier/pixies/backgrounds/graybackground.png",
    "pink": "pixifier/pixies/backgrounds/pinkbackground.png",
    "day": "pixifier/pixies/backgrounds/sunnybackground.png",
//    "icyPixie": "pixifier/pixies/pixieselfie/pixie-icy.png",
//    "coldPixie": "pixifier/pixies/pixieselfie/pixie-cold.png",
//    "coolPixie": "pixifier/pixies/pixieselfie/pixie-cool.png",
//    "warmPixie": "pixifier/pixies/pixieselfie/pixie-warm.png",
//    "hotPixie": "pixifier/pixies/pixieselfie/pixie-hot.png",
    "clear": "pixifier/pixies/skycond/blank.png",
    "cloudy": "pixifier/pixies/skycond/clouds.png",
    "overcast": "pixifier/pixies/skycond/overcast.png",
    "warning": "pixifier/pixies/highwind/daywarn.png",
    "gale": "pixifier/pixies/highwind/daygale.png",
    "storm": "pixifier/pixies/highwind/daystorm.png",
    "hurricane": "pixifier/pixies/highwind/dayhurricane.png",
    "lightning": "pixifier/pixies/weather/lightning.png",
    "frame": "pixifier/pixies/backgrounds/blackframe.png",
};

// coalesced from pixie-composer.js
// weather we show: keys of weatherhash (drizzle, rain, mist, fog, snow)
// weather we don't: haze, smoke, dust, volcanic ash
const weatherhash = {
      'none':           'pixifier/pixies/weather/blank.png',
      'light drizzle':  'pixifier/pixies/weather/ltrain.png',
      'drizzle':        'pixifier/pixies/weather/drizzle.png',
      'heavy drizzle':  'pixifier/pixies/weather/drizzle.png',
      'light rain':     'pixifier/pixies/weather/ltrain.png',
      'light rain with thunder':     'pixifier/pixies/weather/ltrain.png',
      'rain':           'pixifier/pixies/weather/rain.png',
      'rain with thunder':           'pixifier/pixies/weather/rain.png',
      'heavy rain':     'pixifier/pixies/weather/rain.png',
      'heavy rain with thunder':           'pixifier/pixies/weather/rain.png',
      'mist':           'pixifier/pixies/weather/mist.png',
      'fog':            'pixifier/pixies/weather/fog.png',
      'patches of fog': 'pixifier/pixies/weather/fog.png',
      'light snow':     'pixifier/pixies/weather/ltsnow.png',
      'snow':           'pixifier/pixies/weather/snow.png',
      'heavy snow':     'pixifier/pixies/weather/snow.png',
      };


for (const entry of namedLayers.entries()) {console.log(JSON.stringify(entry)); console.log('');}

const metarToLocationMap = new Map();
Object.entries(icaoToLocationMap).map(each => {metarToLocationMap.set(each[0], each[1]);});

exports.stations = metarToLocationMap;
exports.resources = resources;
exports.Jimp = Jimp;
exports.Layer = Layer;

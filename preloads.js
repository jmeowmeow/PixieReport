// Preloads of pixie resources
// Troublesome issue in interaction of promises and current
// working directory. ES6 modules might allow us to do
// synchronous / settled file operations with await()
// but we can't do that with CommonJS modules and 
// image loading unless we embed the images as String
// resources and decode them.

var dollsByWeather;
const moomindescs = require('./pixifier/pixies/pixiemoomin/dolldesc.js');
const pixie0descs = require('./pixifier/pixies/pixie0/dolldesc.js');
const bunnydescs  = require('./pixifier/pixies/pixiebunny/dolldesc.js');
const selfiedescs = require('./pixifier/pixies/pixieselfie/dolldesc.js');
const xmasdescs   = require('./pixifier/pixies/pixiexmas/dolldesc.js');

const dd = new Map();
dd.set('moomin', moomindescs.dollsByWeather);
dd.set('pixie0', pixie0descs.dollsByWeather);
dd.set('selfie', selfiedescs.dollsByWeather);
dd.set('bunny', bunnydescs.dollsByWeather);
dd.set('xmas', xmasdescs.dollsByWeather);

const pixiepaths = new Map();
pixiepaths.set('moomin', './pixifier/pixies/pixiemoomin/');
pixiepaths.set('pixie0', './pixifier/pixies/pixie0/');
pixiepaths.set('selfie', './pixifier/pixies/pixieselfie/');
pixiepaths.set('bunny', './pixifier/pixies/pixiebunny/');
pixiepaths.set('xmas', './pixifier/pixies/pixiexmas/');
const pixieFiles = ['pixie-icy.png', 'pixie-cold.png', 'pixie-cool.png', 'pixie-warm.png', 'pixie-hot.png'];
const { icaoToLocationMap, activeMetarStations, stationsByLat, stationsByLong } = require('./pixifier/icao.js');
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

const namedLayers = new Map();
resources.namedLayers = namedLayers;
namedLayers.set("none", new Layer("none", "pixifier/pixies/weather/blank.png"));
namedLayers.set("frame", new Layer("black frame", "pixifier/pixies/backgrounds/blackframe.png"));

// let's make some pixie layers! and save them in the layer lookups!
const savePixieLayers = function(whichPixie, dollDescs, dollPaths, dollFiles, layers) {
  const tempLevel = ['icy', 'cold', 'cool', 'warm', 'hot'];
  let pixieLayers = [];
  for (const i in [0,1,2,3,4]) {
    const dollLayer = new Layer(dollDescs.get(whichPixie)[i], ''+dollPaths.get(whichPixie)+dollFiles[i]);
    pixieLayers.push(dollLayer);
    const pixieNameBySetAndTemp = ''+whichPixie+'/'+tempLevel[i]+'Pixie';
    layers.set(pixieNameBySetAndTemp, dollLayer); // shared layers
  }
  return pixieLayers; // this set's layers only
}

const setNames = ['bunny', 'selfie', 'pixie0', 'moomin' ];
const bunnyLayers  = savePixieLayers(setNames[0], dd, pixiepaths, pixieFiles, namedLayers);
const selfieLayers = savePixieLayers(setNames[1], dd, pixiepaths, pixieFiles, namedLayers);
const pixie0Layers = savePixieLayers(setNames[2], dd, pixiepaths, pixieFiles, namedLayers);
const moominLayers = savePixieLayers(setNames[3], dd, pixiepaths, pixieFiles, namedLayers);

// We should probably pick the doll set in the server or composer, but for now, here.

const dollLayerSets = [bunnyLayers, selfieLayers, pixie0Layers, moominLayers];
const chosenDollSet = dollLayerSets[Math.trunc(Math.random()*4)];
const icyDoll  = chosenDollSet[0];
const coldDoll = chosenDollSet[1];
const coolDoll = chosenDollSet[2];
const warmDoll = chosenDollSet[3];
const hotDoll  = chosenDollSet[4];
namedLayers.set('icyPixie', icyDoll);
namedLayers.set('coldPixie', coldDoll);
namedLayers.set('coolPixie', coolDoll);
namedLayers.set('warmPixie', warmDoll);
namedLayers.set('hotPixie', hotDoll);

namedLayers.set("noreport", new Layer("video static", "pixifier/pixies/backgrounds/nosignal-bkg.png"));
namedLayers.set("night", new Layer("night", "pixifier/pixies/backgrounds/starrynightbkg.png"));
namedLayers.set("gray", new Layer("gray twilight", "pixifier/pixies/backgrounds/graybackground.png"));
namedLayers.set("pink", new Layer("dusk", "pixifier/pixies/backgrounds/pinkbackground.png"));
namedLayers.set("day", new Layer("day", "pixifier/pixies/backgrounds/sunnybackground.png"));
namedLayers.set("noPixie", new Layer("no pixel doll", "pixifier/pixies/weather/blank.png"));
namedLayers.set("clear", new Layer("clear", "pixifier/pixies/skycond/blank.png"));
namedLayers.set("cloudy", new Layer("cloudy", "pixifier/pixies/skycond/clouds.png"));
namedLayers.set("overcast", new Layer("overcast", "pixifier/pixies/skycond/overcast.png"));

namedLayers.set('mostly clear', namedLayers.get('cloudy'));
namedLayers.set('partly cloudy', namedLayers.get('cloudy'));
namedLayers.set('mostly cloudy', namedLayers.get('cloudy'));
namedLayers.set('obscured', namedLayers.get('overcast'));

namedLayers.set("warning", new Layer('a red high wind warning pennant', "pixifier/pixies/highwind/daywarn.png"));;
namedLayers.set("gale", new Layer('two red gale warning pennants', "pixifier/pixies/highwind/daygale.png"));
namedLayers.set("storm", new Layer('a red and black storm warning flag', "pixifier/pixies/highwind/daystorm.png"));
namedLayers.set("hurricane", new Layer('two red and black hurricane warning flags', "pixifier/pixies/highwind/dayhurricane.png"));

// Now for the weather. We coalesce the weather lookup by name based on
// weather condition names from parsed METAR descriptions, so multiple
// conditions produce the same image layer, and thundershowers / lightning
// has its own logic for picking layers.

// Each of the keys is a namedLayer entry. The computeSceneText logic in the
// composer only cares about the description of the visible layers on top
// of the pixel doll, so we can re-use a Layer.
//
// images to carry the layer description along.
namedLayers.set('light drizzle', new Layer('light rain', 'pixifier/pixies/weather/ltrain.png'));
namedLayers.set('drizzle', new Layer('drizzle', 'pixifier/pixies/weather/drizzle.png'));
namedLayers.set('heavy drizzle', namedLayers.get('drizzle'));
namedLayers.set('light rain', namedLayers.get('light drizzle'));
namedLayers.set('light rain showers', namedLayers.get('light drizzle'));
namedLayers.set('light rain with thunder', namedLayers.get('light rain'));
namedLayers.set('rain', new Layer('rain', 'pixifier/pixies/weather/rain.png'));
namedLayers.set('rain showers', namedLayers.get('rain'));
namedLayers.set('rain with thunder', namedLayers.get('rain'));
namedLayers.set('heavy rain', namedLayers.get('rain'));
namedLayers.set('heavy rain with thunder', namedLayers.get('rain'));
namedLayers.set('mist', new Layer('mist', 'pixifier/pixies/weather/mist.png'));
namedLayers.set('fog', new Layer('fog', 'pixifier/pixies/weather/fog.png'));
namedLayers.set('patches of fog', namedLayers.get('fog'));
namedLayers.set('light snow', new Layer('light snow', 'pixifier/pixies/weather/ltsnow.png'));
namedLayers.set('snow', new Layer('snow', 'pixifier/pixies/weather/snow.png'));
namedLayers.set('heavy snow', namedLayers.get('snow'));
namedLayers.set('blowing snow', namedLayers.get('light snow')); 
namedLayers.set('lightning', new Layer('lightning', 'pixifier/pixies/weather/lightning.png'));

let promises = [];
namedLayers.forEach(layer => { promises.push(layer.toJimp())});
// Resolution gets printed after the "Server listening" message.
Promise.allSettled(promises).then((results) => {console.log(`Loaded named image layers, n= ${results.length}`)}).catch(console.error);

const metarToLocationMap = new Map();
Object.entries(icaoToLocationMap).map(each => {metarToLocationMap.set(each[0], each[1]);});

exports.stations = metarToLocationMap;
exports.stationsByLat = stationsByLat;
exports.stationsByLong = stationsByLong;
exports.activeMetarStations = activeMetarStations;
exports.resources = resources;
exports.Jimp = Jimp;
exports.Layer = Layer;

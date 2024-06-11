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

const pixiesets = new Map();
pixiesets.set('moomin', './pixifier/pixies/pixiemoomin/');
pixiesets.set('pixie0', './pixifier/pixies/pixie0/');
pixiesets.set('selfie', './pixifier/pixies/pixieselfie/');
pixiesets.set('bunny', './pixifier/pixies/pixiebunny/');
pixiesets.set('xmas', './pixifier/pixies/pixiexmas/');
const pixieFiles = ['pixie-icy.png', 'pixie-cold.png', 'pixie-cool.png', 'pixie-warm.png', 'pixie-hot.png'];
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

const namedLayers = new Map();
resources.namedLayers = namedLayers;
namedLayers.set("none", new Layer("none", "pixifier/pixies/weather/blank.png"));
namedLayers.set("frame", new Layer("black frame", "pixifier/pixies/backgrounds/blackframe.png"));

// let's make some pixie layers!
// name = pixiesets key / icyPixie ... hotPixie, path (pixiesets) X (pixieFiles)
const icyBunny = new Layer(dd.get('bunny')[0], ''+pixiesets.get('bunny')+pixieFiles[0]);
const coldBunny = new Layer(dd.get('bunny')[1], ''+pixiesets.get('bunny')+pixieFiles[1]);
const coolBunny = new Layer(dd.get('bunny')[2], ''+pixiesets.get('bunny')+pixieFiles[2]);
const warmBunny = new Layer(dd.get('bunny')[3], ''+pixiesets.get('bunny')+pixieFiles[3]);
const hotBunny = new Layer(dd.get('bunny')[4], ''+pixiesets.get('bunny')+pixieFiles[4]);
namedLayers.set('icyPixie', icyBunny);
namedLayers.set('coldPixie', coldBunny);
namedLayers.set('coolPixie', coolBunny);
namedLayers.set('warmPixie', warmBunny);
namedLayers.set('hotPixie', hotBunny);

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
namedLayers.set('light rain with thunder', namedLayers.get('light rain'));
namedLayers.set('rain', new Layer('rain', 'pixifier/pixies/weather/rain.png'));
namedLayers.set('rain with thunder', namedLayers.get('rain'));
namedLayers.set('heavy rain', namedLayers.get('rain'));
namedLayers.set('heavy rain with thunder', namedLayers.get('rain'));
namedLayers.set('mist', new Layer('mist', 'pixifier/pixies/weather/mist.png'));
namedLayers.set('fog', new Layer('fog', 'pixifier/pixies/weather/fog.png'));
namedLayers.set('patches of fog', namedLayers.get('fog'));
namedLayers.set('light snow', new Layer('light snow', 'pixifier/pixies/weather/ltsnow.png'));
namedLayers.set('snow', new Layer('snow', 'pixifier/pixies/weather/snow.png'));
namedLayers.set('heavy snow', namedLayers.get('snow'));
namedLayers.set('lightning', new Layer('lightning', 'pixifier/pixies/weather/lightning.png'));

let promises = [];
namedLayers.forEach(layer => { promises.push(layer.toJimp())});
// Resolution gets printed after the "Server listening" message.
Promise.allSettled(promises).then((results) => {console.log(results.length)}).catch(console.error);

for (const entry of namedLayers.entries()) {console.log(JSON.stringify(entry)); console.log('');}

const metarToLocationMap = new Map();
Object.entries(icaoToLocationMap).map(each => {metarToLocationMap.set(each[0], each[1]);});

exports.stations = metarToLocationMap;
exports.resources = resources;
exports.Jimp = Jimp;
exports.Layer = Layer;

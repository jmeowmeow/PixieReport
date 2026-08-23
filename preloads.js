// Preloads of pixie resources
// Troublesome issue in interaction of promises and current
// working directory. ES6 modules might allow us to do
// synchronous / settled file operations with await()
// but we can't do that with CommonJS modules and
// image loading unless we embed the images as String
// resources and decode them.

// The preloads file exports these resources:
// * Weather station database, both "active stations" and geodata/names.
// These are variously in
//   (geodata): exports.stations .stationsByLat .stationsByLong
//   (actives): exports.activeMetarStations
// * Pixel doll layer files (name, file path, Jimp image) + Layer and Jimp
// * Weather and background layer files.
// * dollsets in resources.dollSets[0...]
// These two are in resources.namedLayers in distributed form.
// For a picker (/make) or survey (/sets), we provide resources.dollSets
//
// For a picker or survey, maybe we should provide resources.backgroundSets
// (e.g. the night-comet) or art grouped by style?
// For example, a glitch art style could provide glitched backgrounds.
// This approach suggests a more complex query approach than using namedLayers.

// Load the resource descriptions expediently, grafting the old script's mechanism.
// dollset names here are a superset of the ones exposed in the app (e.g. "xmas")
// TODO: Resource loading is pretty direct, but could be cleaner and easier to extend
// TODO: than pixifier/pixies/pixieNAME/ and dolldesc.js, pixie-icy through pixie-hot:
const dollSetNames = ['bunny', 'selfie', 'pixie0', 'moomin', 'hedge', 'witch', 'prep', 'unique', 'xmas'];
const dd = new Map();
const pixiepaths = new Map();
dollSetNames.map( (name) => {
  let ppath = (name == 'pixie0') ? name : `pixie${name}`;
  const pixiepath = `./pixifier/pixies/${ppath}/`;
  pixiepaths.set(name, pixiepath);
  const dollsetDesc = require(`${pixiepath}/dolldesc.js`);
  dd.set(name, dollsetDesc.dollsByWeather);
});

// Temperature levels factored here for use in doll image setup,
// dollset picker presentation, and composition logic.
const tempLevelNames    = ['icy', 'cold', 'cool', 'warm', 'hot'];
const tempLevelsC  = [-273,  -9,  5, 19, 30, 9999];
const tempLevelsF  = [-459, -16, 41, 66, 86, 9999];
const tempLevels = new Map();
for (let z=0; z<tempLevelNames.length; z++) {
   const tempName = tempLevelNames[z];
   const tempLevel = { level: tempName, lowerC: tempLevelsC[z], upperC: tempLevelsC[z+1],
                       lowerF: tempLevelsF[z], upperF: tempLevelsF[z+1] };
   tempLevels.set(tempName, tempLevel);
   tempLevels[z] = tempLevel;
}
const tempLevelForDegreesC = function(degreesC) {
  for (let z=0; z<tempLevelNames.length; z++) {
    const tempLevel = tempLevels[z];
    if (degreesC < tempLevel.upperC) {
      return tempLevel;
    }
  }
  return undefined;
}

const pixieFiles = tempLevelNames.map( (e) => ( `pixie-${e}.png` ) );
const { icaoToLocationMap, activeMetarStations, stationsByLat, stationsByLong } = require('./pixifier/icao.js');
const Jimp = require("jimp"); // used here and in composer.
const resources = {};

class Layer {
  constructor(desc, path) {
    this.desc = desc;
    this.path = path;
    this.img = undefined;
    this.height = 175;
    this.width = 125;
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
      jp.then( (result) => {
        this.img = result;
        this.height=result.bitmap.height;
        this.width=result.bitmap.width;
      } );
      return jp;
    }
  }
}


// namedLayers(key, value): main lookup repository for pixel doll composer
//  key   = the lookup handle; some keys share the same Layer object.
//  value = an Layer object intended for compositing into a pixel doll weather report.
const namedLayers = new Map();
resources.namedLayers = namedLayers;
namedLayers.set("none", new Layer("none", "pixifier/pixies/weather/blank.png"));
namedLayers.set("frame", new Layer("black frame", "pixifier/pixies/backgrounds/blackframe.png"));
namedLayers.set("whichpixie", new Layer("question mark", "pixifier/pixies/whichpixie.png"));

// Register a doll set across temperature levels for lookup in namedLayers by a composite key.
// This is the "distributed" expression of the doll sets.
const savePixieLayers = function(whichPixie, dollDescs, dollPaths, dollFiles, compositionLayers) {
  const tempLevel = tempLevelNames;
  let thisDollLayers = [];
  for (const i in [0,1,2,3,4]) {
    const dollLayer = new Layer(dollDescs.get(whichPixie)[i], ''+dollPaths.get(whichPixie)+dollFiles[i]);
    thisDollLayers.push(dollLayer);
    const pixieNameBySetAndTemp = ''+whichPixie+'/'+tempLevel[i]+'Pixie'; // 'bunny/icyPixie'
    compositionLayers.set(pixieNameBySetAndTemp, dollLayer);
  }
  return thisDollLayers;
}

// Adopted set for general use (excludes 'xmas' alternative to pixie0 "pixel girl" set)
// TODO: repetition of set names from the doll set names in the doll description data loads?
const setNames = ['bunny', 'selfie', 'pixie0', 'moomin', 'hedge', 'witch', 'prep', 'unique' ];
//const xmasSetNames = ['bunny', 'selfie', 'xmas', 'moomin', 'hedge', 'witch', 'prep', 'unique' ];
//const setNames     = xmasSetNames; // 2024-12-23; or we could refresh and check the date
resources.setNames    = setNames;
resources.howManySets = setNames.length; // used by '/make' '/sets' and randomDollSetNum()
resources.randomDollSetNum = function() { return Math.trunc(Math.random()*resources.howManySets) };

// saving named layer doll set groups for the chosenDollSet application
// TODO: do we even use chosenDollSet anymore?
const bunnyLayers  = savePixieLayers(setNames[0], dd, pixiepaths, pixieFiles, namedLayers);
const selfieLayers = savePixieLayers(setNames[1], dd, pixiepaths, pixieFiles, namedLayers);
const pixie0Layers = savePixieLayers(setNames[2], dd, pixiepaths, pixieFiles, namedLayers);
const moominLayers = savePixieLayers(setNames[3], dd, pixiepaths, pixieFiles, namedLayers);
const hedgeLayers  = savePixieLayers(setNames[4], dd, pixiepaths, pixieFiles, namedLayers);
const witchLayers  = savePixieLayers(setNames[5], dd, pixiepaths, pixieFiles, namedLayers);
const prepLayers   = savePixieLayers(setNames[6], dd, pixiepaths, pixieFiles, namedLayers);
const uniqueLayers = savePixieLayers(setNames[7], dd, pixiepaths, pixieFiles, namedLayers);
resources.dollSets = [bunnyLayers, selfieLayers, pixie0Layers, moominLayers, hedgeLayers, witchLayers, prepLayers, uniqueLayers];

// We should probably pick the doll set in the server or composer, but for now, here.
// Vestigial code to select a doll set for a single script run.
// Does the server ever compose without choosing a dollset?
const dollLayerSets = [bunnyLayers, selfieLayers, pixie0Layers, moominLayers, hedgeLayers, witchLayers, prepLayers, uniqueLayers];
const chosenDollSet = dollLayerSets[resources.randomDollSetNum()];
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

// day/night background and special "no report" layer.
namedLayers.set("noreport", new Layer("video static", "pixifier/pixies/backgrounds/nosignal-bkg.png"));
namedLayers.set("night", new Layer("night", "pixifier/pixies/backgrounds/starrynightbkg.png"));
// save for Moomin doll set or meteor showers or comets! (Oct 2024 comet special)
// namedLayers.set("night", new Layer("night", "pixifier/pixies/backgrounds/nightcometbkg.png"));
// namedLayers.set("night", new Layer("night", "pixifier/pixies/backgrounds/newyears-nightbackground.png"));
namedLayers.set("gray", new Layer("gray twilight", "pixifier/pixies/backgrounds/graybackground.png"));
namedLayers.set("pink", new Layer("dusk", "pixifier/pixies/backgrounds/pinkbackground.png"));
namedLayers.set("day", new Layer("day", "pixifier/pixies/backgrounds/sunnybackground.png"));

// cloud cover image layers
namedLayers.set("clear", new Layer("clear", "pixifier/pixies/skycond/blank.png"));
namedLayers.set("cloudy", new Layer("cloudy", "pixifier/pixies/skycond/clouds.png"));
namedLayers.set("overcast", new Layer("overcast", "pixifier/pixies/skycond/overcast.png"));

namedLayers.set('mostly clear', namedLayers.get('cloudy'));
namedLayers.set('partly cloudy', namedLayers.get('cloudy'));
namedLayers.set('mostly cloudy', namedLayers.get('cloudy'));
namedLayers.set('obscured', namedLayers.get('overcast'));

// special no-pixie, like clear sky, is another alias for transparent blank
namedLayers.set("noPixie", new Layer("no pixel doll", "pixifier/pixies/weather/blank.png"));

// high wind flags
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
// See express-progress/tasks.md for ideas on how to reorganize code to make
// make the mapping clearer. Maybe we need to explicitly extract it away from
// the data setup; the namedLayers setup mingles these concerns. (thanks AS)
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
namedLayers.set('smoke', new Layer('smoke', 'pixifier/pixies/weather/smoke.png'));

let promises = [];
namedLayers.forEach(layer => { promises.push(layer.toJimp())});

// a bootleg application of Layer/Promise to load the world map.
// not part of namedLayers, way way big! Will it stomp on the app memory as a Jimp image?
resources.worldMap =
	new Layer("worldmap",
		'webapp/resources/world-equirect-cc-by-strebe-wikimedia.jpg');
const worldMapPromise = resources.worldMap.toJimp(); // hold that thought...
promises.push(worldMapPromise);

// Absorb typeface loading from compose-async.js

let locationFontPath = "pixifier/bmfont/iosevska-ss04-bold-10green.fnt";
promises.push( Jimp.loadFont(locationFontPath).then((locationfont) => {
  resources.locationFont = locationfont;
}));

let weatherFontPath = "pixifier/bmfont/iosevska-ss04-bold-13white.fnt";
promises.push( Jimp.loadFont(weatherFontPath).then((weatherfont) => {
    resources.weatherFont = weatherfont;
}));

const metarToLocationMap = new Map();
Object.entries(icaoToLocationMap).map(each => {metarToLocationMap.set(each[0], each[1]);});

resources.tempLevelsC = tempLevelsC;
resources.tempLevels = tempLevels; // a Map and also tempLevels[0] to [4]
exports.stations = metarToLocationMap;
exports.stationsByLat = stationsByLat;
exports.stationsByLong = stationsByLong;
exports.activeMetarStations = activeMetarStations;
exports.resources = resources;
exports.Jimp = Jimp;
exports.Layer = Layer;

// Resolution gets printed after the "Server listening" message.
Promise.allSettled(promises).then((results) => {console.log(`Loaded named image layers, n= ${results.length}`)}).catch(console.error);

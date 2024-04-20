const Jimp = require("jimp");
const {computeImageTextValues} = require('./pixifier/compute-image-text');

class Layer {
  constructor(desc, path) {
    this.desc = desc;
    this.path = path;
  }
}

const layerDescMap = {
  "none": "",
  "night": "night",
  "gray": "gray twilight",
  "pink": "dusk",
  "day": "day",
  "noPixie": "no pixel doll",
  "icyPixie": "a pixel doll dressed for icy weather",
  "coldPixie": "a pixel doll dressed for cold weather",
  "coolPixie": "a pixel doll dressed for cool weather",
  "warmPixie": "a pixel doll dressed for warm weather",
  "hotPixie": "a pixel doll dressed for hot weather",
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
    "icyPixie": "pixifier/pixies/pixieselfie/pixie-icy.png",
    "coldPixie": "pixifier/pixies/pixieselfie/pixie-cold.png",
    "coolPixie": "pixifier/pixies/pixieselfie/pixie-cool.png",
    "warmPixie": "pixifier/pixies/pixieselfie/pixie-warm.png",
    "hotPixie": "pixifier/pixies/pixieselfie/pixie-hot.png",
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


const layerByName = function(name) {
  let desc = layerDescMap[name];
  let path = layerMap[name];
  if (path === undefined) {
    path = weatherhash[name];
  }
  return new Layer(desc, path);
}

function backgroundLayer(params) {
  if (params.sunPos && params.sunPos.zenithAngle) {
    const z = params.sunPos.zenithAngle;
    if (z < 89) {
      return layerByName("day");
    } else if (z < 96) {
      return layerByName("pink");
    } else if (z < 102) {
      return layerByName("gray");
    } else {
      return layerByName("night");
    }
  } else {
    return layerByName("gray");
  }
}

function addBackgroundLayer(layerFiles, params) {
  layerFiles.push(backgroundLayer(params));
}

// coalesced from pixie-composer.js (skyhash, parsed sky condition to which cloud image)
const skyhash = {
      'clear':         layerMap.clear,
      'mostly clear':  layerMap.cloudy,
      'partly cloudy': layerMap.cloudy,
      'mostly cloudy': layerMap.cloudy,
      'overcast':      layerMap.overcast,
      'obscured':      layerMap.overcast
      };

// see skyCover parsing clouds in decoded-metar-parser.js ; cloudLayer uses the parsed value
function addCloudLayer(layerFiles, params) {
  let skyCover = params.skyCover;
  if (skyCover) {
    layerFiles.push(new Layer(skyCover, skyhash[skyCover]));
  }
  // default: add no layer.
};

function addLightningLayer(layerFiles, params) {
  if (params.weather && params.weather.includes('Lightning observed')) {
    layerFiles.push(new Layer('lightning', layerMap.lightning));
  }
  // default: add no lightning.
};

// adapted/extracted from addDollLayerReturnDescText
// because a pixel doll layer contains a description and a transparent image
// We'll want to re-compose the image descriptions; the Express server
// endpoint only renders the overlaid images for this first pass.
function addDollLayer(layerFiles, params) {
  const tempC = params.degreesC;
  if (typeof tempC === 'number' && isFinite(tempC)) {
    if (tempC < -9) {
      layerFiles.push(layerByName('icyPixie'));
    } else if (tempC < 5) {
      layerFiles.push(layerByName('coldPixie'));
    } else if (tempC < 19) {
      layerFiles.push(layerByName('coolPixie'));
    } else if (tempC < 28) {
      layerFiles.push(layerByName('warmPixie'));
    } else {
      layerFiles.push(layerByName('hotPixie'));
    }
  } else {
    layerFiles.push(new Layer(layerDescMap.noPixie, layerMap.none));
  }
}

// We need the MPHNUM value and cannot use windSpeedMph because a gusty wind
// may be reported as windSpeedMph:"17-32".
function addWindFlagLayer(layerFiles, params) {
  if (params.windSpeed) {
    const mphString = params.windSpeed.MPHNUM;
    const mph = parseFloat(mphString);
    if (typeof mph === 'number' && isFinite(mph)) {
      if (mph > 73) {
        layerFiles.push(layerByName('hurricane'));
      } else if (mph > 54) {
        layerFiles.push(layerByName('storm'));
      } else if (mph > 38) {
        layerFiles.push(layerByName('gale'));
      } else if (mph > 24) {
        layerFiles.push(layerByName('warning'));
      }
    }
  }
}

function addWeatherLayers(layerFiles, params) {
  if (params.weather) {
    for (const cond of params.weather) {
       const weatherfile = weatherhash[cond];
       if (weatherfile) {
         layerFiles.push(new Layer(cond, weatherfile));
       }
    }
  }
}

function addFrame(layerFiles, params) {
  layerFiles.push(layerByName('frame'));
}

const asOxfordCommaList = function(terms) {
  if (!terms || !terms.length) {
     return '';
  }

  if (terms.length < 2) {
     return terms[0];
  }

  const lastTerm = terms.pop();
  const commaList = terms.join(', ');
  return commaList + ' and ' + lastTerm;
}

// a clear/a cloudy/an overcast daytime/night/twilight scene with rain, snow, and haze
// showing (a pixel doll dressed for the weather | no pixel doll)
const computeSceneText = function(imageLayers) {
  // imageLayers stack of layers: [day/night, skycover, lightning?, pixie, wind?, weather?, frame]
  // OK pixie is always [2] or if lightning is present, [3]; frame is always last
  // a(n) $1 $0 scene [with wind flags, lightning, rain, and fog], showing [pixie]
  const layerNames = imageLayers.map(layer => layer.desc);
  const skycover = layerNames[1];
  const daynight = layerNames[0];

  var scenetext = '';
  if (skycover == 'overcast') {
    scenetext = 'an '; // overcast starts with a vowel
  } else {
    scenetext = 'a '; // cloudy, clear
  }
  scenetext = scenetext + skycover;
  scenetext = scenetext + ' ' + daynight + ' scene';
  // OK now we have maybe-lightning; pixel doll; maybe-wind, maybe-weather; frame

  // this logic might be worth its own unit test
  layerNames.shift(); // base layer
  layerNames.shift(); // sky cover
  layerNames.pop();   // the top layer frame

  let pixieDesc = 'a pixel doll dressed for the weather';

  if (layerNames[0].match(/lightning/)) {
    var ltng = layerNames.shift();
    pixieDesc = layerNames.shift(); // did we drop it if there's lightning?
    layerNames.unshift(ltng);
  } else {
    // it's a doll description
    pixieDesc = layerNames.shift();
  }
  // OK now we have maybe-lightning, maybe-wind, maybe-weather
  // whatever is left can be accumulated as weather
  // [0]  ...scene'
  // [1]  ...scene, with weather1'
  // [2]  ...scene, with weather1 and weather2'
  // [3]  ...scene, with weather1, weather2, and weather3'
  // [4]  ...scene, with weather1, weather2, weather3, and weather4'
  if (layerNames.length > 0) {
    scenetext = scenetext + ', with ' + asOxfordCommaList(layerNames);
  }
  // ..., showing (pixieDesc)
  scenetext = scenetext + ', showing ' + pixieDesc;
  return scenetext;
};

function printLocationText(pixie, locationFont, locationLabel) {
  pixie.rotate(-90.0);
  // we might want to measure the text and put a transparent pink underlay
  // like the original Canvas style; or we could do it in the font bitmap?
  pixie.print(locationFont, 27, 3, locationLabel); // 175x125 image when rotated
  pixie.rotate(90.0);
}

async function compose(params) {

  const layers = [];
  addBackgroundLayer(layers, params);
  addCloudLayer(layers, params);
  addLightningLayer(layers, params);
  addDollLayer(layers, params);
  addWindFlagLayer(layers, params);
  addWeatherLayers(layers, params);
  addFrame(layers, params);

  const sceneText = computeSceneText(layers);
  const layerFiles = layers.map( (each) => (each.path));
  console.log(`sceneText\n${sceneText}`);
  const jimpLayers = [];
  const promises = layerFiles.map(async (layer) => { return await Jimp.read(layer);});
  await Promise.allSettled(promises).then((results) => {results.forEach((result) => jimpLayers.push(result.value)) }).catch(console.error);

  let pixie = jimpLayers.reduce((acc, layer) => acc.composite(layer, 0, 0)); // layer 0 is initial accumulator

  // write station and weather info (compute-image-text.js) - console.log for now
  const imageTextValues = computeImageTextValues(params);
  const imageTextDump = JSON.stringify(imageTextValues);
  console.log(`imageText: ${imageTextDump}`);
//  let locationFontPath = Jimp.FONT_SANS_8_WHITE;
  let locationFontPath = "pixifier/fonts/open-sans-8-green/open-sans-8-green.fnt"
  await Jimp.loadFont(locationFontPath).then((font) => {
    printLocationText(pixie, font, imageTextValues.locationLabel);
  });

  // 8 or 16 sans white bitmap fonts available in Jimp starter package
  await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then((font) => {
    pixie.print(font, 2, 153, params.text); // 125x175 image; Jimp.measureText(font, text) for x
  });

  return [ pixie, sceneText ];

}

exports.compose = compose;
exports.Jimp = Jimp;

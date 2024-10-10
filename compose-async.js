const {stations, resources, Jimp, Layer} = require('./preloads');
const {computeImageTextValues} = require('./pixifier/compute-image-text');

const LIGHTNING_PARSED = 'Lightning observed';

// weather we show: drizzle, rain, mist, fog, snow
// weather we don't: haze, smoke, dust, volcanic ash, ice crystals

const layerByName = function(name) {
  // preloaded images from resources
  // resources.namedLayers first.
  let layer = resources.namedLayers.get(name);
  if (layer) { return layer; } else {console.log(`didn't find ${name} in namedLayers`); }
  return null; // cannot return blank because of image weather text description
  }

function backgroundLayer(params) {
  if (params.metar == "") {
    return layerByName("noreport");
  }
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

// see skyCover parsing clouds in decoded-metar-parser.js ; cloudLayer uses the parsed value
function addCloudLayer(layerFiles, params) {
  let skyCover = params.skyCover;
  if (skyCover) {
    layerFiles.push(layerByName(skyCover));
  }
  // default: add no layer.
};

function addLightningLayer(layerFiles, params) {
  if (params.weather && params.weather.includes(LIGHTNING_PARSED)) {
    layerFiles.push(layerByName('lightning'));
  }
  // default: add no lightning.
};

// bind the doll set here so that we can later use params to choose
const setNames = resources.setNames;

// adapted/extracted from addDollLayerReturnDescText
// because a pixel doll layer contains a description and a transparent image
// We'll want to re-compose the image descriptions; the Express server
// endpoint only renders the overlaid images for this first pass.
function addDollLayer(layerFiles, params) {
  let dollset = params.dollset;
  let dollname;
  if (dollset) {
    if (setNames.includes(dollset)) {
      dollname = dollset;
    } else {
      if (setNames[dollset]) {
        dollname = setNames[dollset];
      }
    }
  }
  // messy write-to-request-params for late-bound dollset for "/random"
  // TODO pull this up so we don't have to write to the params
  let randomIdx = resources.randomDollSetNum();
  if (!params.dollset) {
    params.dollset = randomIdx;
  }
  const doll = (dollname) ? dollname : setNames[randomIdx];

  const tempLevelsC = resources.tempLevelsC;
  const tempC = params.degreesC;
  if (typeof tempC === 'number' && isFinite(tempC)) {
    if (tempC < tempLevelsC[1]) {
      layerFiles.push(layerByName(`${doll}/icyPixie`));
    } else if (tempC < tempLevelsC[2]) {
      layerFiles.push(layerByName(`${doll}/coldPixie`));
    } else if (tempC < tempLevelsC[3]) {
      layerFiles.push(layerByName(`${doll}/coolPixie`));
    } else if (tempC < tempLevelsC[4]) {
      layerFiles.push(layerByName(`${doll}/warmPixie`));
    } else {
      layerFiles.push(layerByName(`${doll}/hotPixie`));
    }
  } else {
    layerFiles.push(layerByName('noPixie'));
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
      if (cond == LIGHTNING_PARSED) {
        // known case handled elsewhere, skip
      } else {
        const layer = layerByName(cond);
        if (layer) {
          // known weather types and aliases; this is us
          // translating Weather Service text into images;
          // the mappings are in namedLayers in preloads.js
          // e.g. TSRA- = "light rain with thunder" = ltrain.png
          layerFiles.push(layer);
        } else {
          // ice crystals, smoke, frogs, unknown weather types
          console.log("no weather layer defined for " + cond);
        }
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

  // all right where is this null coming from? it's the pixel doll!

  const layerNames = imageLayers.map(layer => { if (layer) { return layer.desc; } else { return "NULL LAYER"; }});
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

  // implicitly assert layer name is string-like, not null or undefined
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
  const textHeight = 15;
  let textLength = Jimp.measureText(locationFont, locationLabel+' ');
  let undergray = new Jimp(textLength, textHeight, "#80808080");
  pixie.composite(undergray, 25, 0); // nudge text bkgd toward frame
  pixie.print(locationFont, 27, 0, locationLabel); // 175x125 image when rotated
  pixie.rotate(90.0);
}

function printTimeText(pixie, font, timeText) {
    const pixieWidth = 125; // this is effectively global; naming it here.
    const timeTextLength = Jimp.measureText(font, timeText);
    const startX = pixieWidth - timeTextLength; // right-justify text
    pixie.print(font, startX, 150, timeText); // below image, in text frame
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
  let blankCanvas = new Jimp(125, 175, "#000000");
  const jimpLayers = [];
  jimpLayers.push(blankCanvas);
  const promises = layers.map(async (layer) => { return layer.toJimp();});
  await Promise.allSettled(promises).then((results) => {results.forEach((result) => jimpLayers.push(result.value)) }).catch(console.error);

  let pixie = jimpLayers.reduce((acc, layer) => acc.composite(layer, 0, 0)); // accumulate on fresh blank layer 0

  // write station and weather info (compute-image-text.js)
  // Note that location information is not available for all stations.
  const imageTextValues = computeImageTextValues(params);
  // add the fonts to preloads?
  let locationFontPath = "pixifier/bmfont/iosevska-ss04-bold-10green.fnt";
  await Jimp.loadFont(locationFontPath).then((font) => {
    printLocationText(pixie, font, imageTextValues.locationLabel);
    printTimeText(pixie, font, imageTextValues.zuluTime);
  });

  let weatherFontPath = "pixifier/bmfont/iosevska-ss04-bold-13white.fnt";
  await Jimp.loadFont(weatherFontPath).then((font) => {
    pixie.print(font, 2, 148, imageTextValues.temphum);
    pixie.print(font, 2, 160, imageTextValues.windbar);
  });

  return [ pixie, sceneText ];

}

exports.compose = compose;

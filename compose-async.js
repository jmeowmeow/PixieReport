const Jimp = require("jimp");

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
    "hot": "pixifier/pixies/pixieselfie/pixie-hot.png",
    "clear": "pixifier/pixies/skycond/blank.png",
    "cloudy": "pixifier/pixies/skycond/clouds.png",
    "overcast": "pixifier/pixies/skycond/overcast.png",
    "warning": "pixifier/pixies/highwind/daywarn.png",
    "gale": "pixifier/pixies/highwind/daygale.png",
    "storm": "pixifier/pixies/highwind/daystorm.png",
    "hurricane": "pixifier/pixies/highwind/dayhurricane.png",
};

function backgroundLayer(params) {
  if (params.sunPos && params.sunPos.zenithAngle) {
    const z = params.sunPos.zenithAngle;
    if (z < 89) {
      return layerMap.day;
    } else if (z < 96) {
      return layerMap.pink;
    } else if (z < 102) {
      return layerMap.gray;
    } else {
      return layerMap.night;
    }
  } else {
    return layerMap.gray;
  }
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
function cloudLayer(params) {
  let skyCover = params.skyCover;
  if (skyCover) {
    return skyhash[skyCover];
  } else {
    return layerMap.clear;
  }
};

// factored out from addDollLayerReturnDescText
// because a pixel doll layer contains a description and a transparent image
// We'll want to re-compose the image descriptions; the Express server
// endpoint only renders the overlaid images for his first pass.
function dollLayer(params) {
  const tempC = params.degreesC;
  if (typeof tempC === 'number' && isFinite(tempC)) {
    if (tempC < -9) {
      return layerMap.icyPixie;
    } else if (tempC < 5) {
      return layerMap.coldPixie;
    } else if (tempC < 19) {
      return layerMap.coolPixie
    } else if (tempC < 28) {
      return layerMap.warmPixie;
    } else {
      return layerMap.hotPixie;
    }
  } else {
    return layerMap.none;
  }
}

// Note that the original either adds or does not add a layer based on wind speed.
// We need the MPHNUM value and cannot use windSpeedMph because a gusty wind
// may be reported as windSpeedMph:"17-32".
function windLayer(params) {
  const mphString = params.windSpeed.MPHNUM;
  const mph = parseFloat(mphString);
  if (typeof mph === 'number' && isFinite(mph)) {
    if (mph > 73) {
      return layerMap.hurricane;
    } else if (mph > 54) {
      return layerMap.storm;
    } else if (mph > 38) {
      return layerMap.gale;
    } else if (mph > 24) {
      return layerMap.warning;
    }
  }
  return layerMap.none;
}

function addBackgroundLayer(layerFiles, params) {
  layerFiles.push(backgroundLayer(params));
}

function addCloudLayer(layerFiles, params) {
  layerFiles.push(cloudLayer(params));
}

function addDollLayer(layerFiles, params) {
  layerFiles.push(dollLayer(params));
}

function addWindFlagLayer(layerFiles, params) {
  layerFiles.push(windLayer(params));
}


async function compose(params) {

  const layerFiles = [];
  addBackgroundLayer(layerFiles, params);
  addCloudLayer(layerFiles, params);
  addDollLayer(layerFiles, params);
  addWindFlagLayer(layerFiles, params);

  console.log("layerFiles", layerFiles);
  const jimpLayers = [];
  const promises = layerFiles.map(async (layer) => { return await Jimp.read(layer);});
  await Promise.allSettled(promises).then((results) => {results.forEach((result) => jimpLayers.push(result.value)) }).catch(console.error);

  let pixie = jimpLayers.reduce((acc, layer) => acc.composite(layer, 0, 0)); // layer 0 is initial accumulator

  // 8 or 16
  await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then((font) => {
    pixie.print(font, 2, 153, params.text); // 125x175 image; don't know text length
  });
  return pixie;

}

exports.compose = compose;
exports.Jimp = Jimp;

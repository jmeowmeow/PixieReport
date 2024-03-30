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

async function compose(params) {

  const background = await Jimp.read(backgroundLayer(params));
  const cloudlayer = await Jimp.read(cloudLayer(params));
  const pixielayer = await Jimp.read(dollLayer(params));

  let pixie = background.composite(cloudlayer, 0, 0, { }).composite(pixielayer, 0, 0, { });

  // 8 or 16
  await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then((font) => {
    pixie.print(font, 2, 153, params.text); // 125x175 image; don't know text length
  });
  return pixie;

}

exports.compose = compose;
exports.Jimp = Jimp;
